import { createClient } from 'npm:@supabase/supabase-js@2'
import { requireServiceRole } from "../_shared/require-service-role.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function fmtPrice(amount: number | null | undefined, currency: string | null | undefined) {
  if (amount == null) return ''
  const sym = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : '€'
  return `${sym}${Number(amount).toFixed(2)}`
}

function fmtDate(d?: string | null) {
  if (!d) return ''
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) } catch { return d }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  const unauthorized = await requireServiceRole(req);
  if (unauthorized) return unauthorized;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, serviceKey)

  const stats = { users: 0, sent: 0, drops: 0, removed: 0, skipped: 0, errors: 0 }

  try {
    // Pull all watchlist rows joined to listings + profile + prefs
    const { data: rows, error } = await supabase
      .from('watchlist')
      .select(`
        id, user_id, last_notified_price, notified_unavailable_at,
        listings:listing_id (
          id, title, price, currency, is_active, origin_city, destination_city,
          origin_country, destination_country, departure_date, airline, seller_id
        ),
        profile:profiles!user_id (
          id, email, full_name, preferred_language
        )
      `)

    if (error) throw error

    // Group by user
    const byUser = new Map<string, any[]>()
    for (const r of rows ?? []) {
      const profile: any = (r as any).profile
      if (!profile?.email) continue
      const key = profile.id as string
      if (!byUser.has(key)) byUser.set(key, [])
      byUser.get(key)!.push(r)
    }

    for (const [profileId, items] of byUser) {
      stats.users++
      const profile: any = (items[0] as any).profile

      // Pref + suppression check
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('watchlist_emails')
        .eq('user_id', profile.user_id ?? profile.id)
        .maybeSingle()
      // Default true if no row yet
      if (prefs && prefs.watchlist_emails === false) { stats.skipped++; continue }

      const { data: suppressed } = await supabase
        .from('suppressed_emails')
        .select('email')
        .eq('email', profile.email.toLowerCase())
        .maybeSingle()
      if (suppressed) { stats.skipped++; continue }

      const priceDrops: any[] = []
      const removed: any[] = []
      const updatesDrops: { id: string; price: number }[] = []
      const updatesRemoved: string[] = []

      for (const r of items) {
        const l: any = (r as any).listings
        if (!l) continue

        const isAvailable = !!l.is_active
        if (!isAvailable && !(r as any).notified_unavailable_at) {
          // Find similar active listings: same origin+destination city, ±7 days
          let suggestions: any[] = []
          if (l.origin_city && l.destination_city && l.departure_date) {
            const dep = new Date(l.departure_date)
            const minD = new Date(dep); minD.setDate(minD.getDate() - 7)
            const maxD = new Date(dep); maxD.setDate(maxD.getDate() + 7)
            const { data: sims } = await supabase
              .from('listings')
              .select('id, title, price, currency, departure_date, airline, seller_id')
              .eq('is_active', true)
              .eq('origin_city', l.origin_city)
              .eq('destination_city', l.destination_city)
              .gte('departure_date', minD.toISOString().slice(0, 10))
              .lte('departure_date', maxD.toISOString().slice(0, 10))
              .neq('id', l.id)
              .order('price', { ascending: true })
              .limit(3)
            suggestions = (sims ?? []).map((s: any) => ({
              listingId: s.id,
              title: s.title,
              departureDate: fmtDate(s.departure_date),
              price: fmtPrice(s.price, s.currency),
              airline: s.airline ?? undefined,
            }))
          }
          removed.push({
            listingId: l.id,
            title: l.title,
            origin: l.origin_city,
            destination: l.destination_city,
            departureDate: fmtDate(l.departure_date),
            suggestions,
          })
          updatesRemoved.push((r as any).id)
          stats.removed++
          continue
        }

        if (isAvailable) {
          const last = (r as any).last_notified_price as number | null
          const cur = Number(l.price)
          if (last == null) {
            // Seed baseline silently — no email today for this row
            updatesDrops.push({ id: (r as any).id, price: cur })
            continue
          }
          if (cur < Number(last)) {
            priceDrops.push({
              listingId: l.id,
              title: l.title,
              origin: l.origin_city,
              destination: l.destination_city,
              departureDate: fmtDate(l.departure_date),
              airline: l.airline ?? undefined,
              oldPrice: fmtPrice(last, l.currency),
              newPrice: fmtPrice(cur, l.currency),
            })
            updatesDrops.push({ id: (r as any).id, price: cur })
            stats.drops++
          }
        }
      }

      // Apply baseline updates regardless
      for (const u of updatesDrops) {
        await supabase.from('watchlist').update({ last_notified_price: u.price }).eq('id', u.id)
      }

      if (priceDrops.length === 0 && removed.length === 0) { stats.skipped++; continue }

      // Send digest
      const idem = `watchlist-digest-${profileId}-${todayKey()}`
      const { error: sendErr } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'watchlist-digest',
          recipientEmail: profile.email,
          idempotencyKey: idem,
          templateData: {
            recipientName: profile.full_name?.split(' ')[0] ?? undefined,
            priceDrops,
            removed,
            locale: profile.preferred_language ?? 'en',
          },
        },
      })

      if (sendErr) {
        stats.errors++
        console.error('send error', profile.email, sendErr)
        continue
      }

      // Mark removed rows as notified so we don't re-notify
      if (updatesRemoved.length > 0) {
        await supabase
          .from('watchlist')
          .update({ notified_unavailable_at: new Date().toISOString() })
          .in('id', updatesRemoved)
      }
      stats.sent++
    }

    return new Response(JSON.stringify({ ok: true, stats }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('watchlist-digest error', e)
    return new Response(JSON.stringify({ ok: false, error: String(e), stats }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
