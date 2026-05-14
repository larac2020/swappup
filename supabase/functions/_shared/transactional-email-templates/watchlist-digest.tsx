/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, h1, p, button, brand, card, row, label, APP_URL } from './_layout.tsx'
import { Locale, normalizeLocale, t } from './i18n.ts'

interface PriceDrop {
  listingId: string
  title: string
  origin?: string
  destination?: string
  departureDate?: string
  airline?: string
  oldPrice: string
  newPrice: string
}

interface Suggestion {
  listingId: string
  title: string
  departureDate?: string
  price: string
  airline?: string
}

interface Removed {
  listingId: string
  title: string
  origin?: string
  destination?: string
  departureDate?: string
  reason?: string
  suggestions: Suggestion[]
}

interface Props {
  recipientName?: string
  priceDrops?: PriceDrop[]
  removed?: Removed[]
  locale?: Locale
}

const dict = {
  en: {
    preview: 'Updates on the listings you\'re tracking',
    hi: 'Hi {name},', hiThere: 'Hi,',
    intro: 'Here\'s today\'s update on listings you have on your swappup watchlist.',
    priceDropsTitle: 'Price drops',
    removedTitle: 'No longer available',
    similarLabel: 'Similar listings still available:',
    noSimilar: 'No close matches right now — check back soon.',
    viewListing: 'View listing',
    cta: 'Open my watchlist',
    was: 'was',
    now: 'now',
    routeSep: '→',
    sign: 'See you in the cabin,', team: 'The swappup team',
    subject: 'Watchlist update: price drops & removals',
  },
  it: {
    preview: 'Aggiornamenti sugli annunci che stai monitorando',
    hi: 'Ciao {name},', hiThere: 'Ciao,',
    intro: 'Ecco l\'aggiornamento di oggi sugli annunci nella tua watchlist swappup.',
    priceDropsTitle: 'Cali di prezzo',
    removedTitle: 'Non più disponibili',
    similarLabel: 'Annunci simili ancora disponibili:',
    noSimilar: 'Nessun risultato simile al momento — riprova presto.',
    viewListing: 'Vedi annuncio',
    cta: 'Apri la mia watchlist',
    was: 'era',
    now: 'ora',
    routeSep: '→',
    sign: 'A presto a bordo,', team: 'Il team swappup',
    subject: 'Aggiornamenti watchlist: prezzi e rimozioni',
  },
} as const

const Email = ({ recipientName, priceDrops = [], removed = [], locale }: Props) => {
  const loc = normalizeLocale(locale)
  return (
    <EmailLayout preview={t(loc, dict, 'preview')} transactional locale={loc}>
      <Text style={p}>{recipientName ? t(loc, dict, 'hi', { name: recipientName }) : t(loc, dict, 'hiThere')}</Text>
      <Text style={p}>{t(loc, dict, 'intro')}</Text>

      {priceDrops.length > 0 && (
        <>
          <Heading style={{ ...h1, fontSize: '16px', margin: '24px 0 8px' }}>{t(loc, dict, 'priceDropsTitle')}</Heading>
          {priceDrops.map((d) => (
            <Section key={d.listingId} style={card}>
              <Text style={{ margin: '0 0 6px', fontWeight: 600, color: brand.charcoal, fontSize: '14px' }}>{d.title}</Text>
              {d.origin && d.destination && (
                <Text style={row}><span style={label}>{d.origin} {t(loc, dict, 'routeSep')} {d.destination}</span>{d.departureDate ? ` · ${d.departureDate}` : ''}{d.airline ? ` · ${d.airline}` : ''}</Text>
              )}
              <Text style={{ margin: '8px 0 12px', color: brand.charcoal, fontSize: '14px' }}>
                <span style={{ color: brand.muted, textDecoration: 'line-through', marginRight: '8px' }}>{d.oldPrice}</span>
                <strong style={{ color: brand.success, fontSize: '16px' }}>{d.newPrice}</strong>
              </Text>
              <Link href={`${APP_URL}/listing/${d.listingId}`} style={{ ...button(), padding: '10px 16px', fontSize: '13px' }}>{t(loc, dict, 'viewListing')}</Link>
            </Section>
          ))}
        </>
      )}

      {removed.length > 0 && (
        <>
          <Heading style={{ ...h1, fontSize: '16px', margin: '24px 0 8px' }}>{t(loc, dict, 'removedTitle')}</Heading>
          {removed.map((r) => (
            <Section key={r.listingId} style={card}>
              <Text style={{ margin: '0 0 6px', fontWeight: 600, color: brand.charcoal, fontSize: '14px' }}>{r.title}</Text>
              {r.origin && r.destination && (
                <Text style={row}><span style={label}>{r.origin} {t(loc, dict, 'routeSep')} {r.destination}</span>{r.departureDate ? ` · ${r.departureDate}` : ''}</Text>
              )}
              <Hr style={{ borderColor: brand.border, margin: '12px 0' }} />
              <Text style={{ margin: '0 0 8px', color: brand.goldDeep, fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>{t(loc, dict, 'similarLabel')}</Text>
              {r.suggestions.length === 0 ? (
                <Text style={{ ...row, fontStyle: 'italic', color: brand.muted }}>{t(loc, dict, 'noSimilar')}</Text>
              ) : (
                r.suggestions.map((s) => (
                  <Text key={s.listingId} style={row}>
                    <Link href={`${APP_URL}/listing/${s.listingId}`} style={{ color: brand.goldDeep, textDecoration: 'underline', fontWeight: 600 }}>{s.title}</Link>
                    {s.departureDate ? ` · ${s.departureDate}` : ''}{s.airline ? ` · ${s.airline}` : ''} — <strong style={{ color: brand.charcoal }}>{s.price}</strong>
                  </Text>
                ))
              )}
            </Section>
          ))}
        </>
      )}

      <Section style={{ margin: '24px 0 8px' }}>
        <Link href={`${APP_URL}/account/watchlist`} style={button()}>{t(loc, dict, 'cta')}</Link>
      </Section>
      <Text style={{ ...p, marginTop: '18px', marginBottom: 0 }}>{t(loc, dict, 'sign')}<br />{t(loc, dict, 'team')}</Text>
    </EmailLayout>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => {
    const loc = normalizeLocale(data?.locale)
    return t(loc, dict, 'subject')
  },
  displayName: 'Watchlist daily digest',
  previewData: {
    locale: 'en',
    recipientName: 'Alex',
    priceDrops: [
      { listingId: 'p1', title: 'London → Rome', origin: 'London (LGW)', destination: 'Rome (FCO)', departureDate: '12 Jun 2026', airline: 'Ryanair', oldPrice: '£120', newPrice: '£89' },
    ],
    removed: [
      {
        listingId: 'r1', title: 'Milan → Barcelona', origin: 'Milan (MXP)', destination: 'Barcelona (BCN)', departureDate: '20 Jul 2026',
        suggestions: [
          { listingId: 's1', title: 'Milan → Barcelona', departureDate: '18 Jul 2026', price: '€95', airline: 'Vueling' },
          { listingId: 's2', title: 'Milan → Barcelona', departureDate: '22 Jul 2026', price: '€110', airline: 'Ryanair' },
        ],
      },
    ],
  },
} satisfies TemplateEntry
