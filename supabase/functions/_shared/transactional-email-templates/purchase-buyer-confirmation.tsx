/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripCard, TripDetails, h1, p, brand, PREFERENCES_URL } from './_layout.tsx'
import { Locale, normalizeLocale, t } from './i18n.ts'

interface Props {
  buyerName?: string
  sellerName?: string
  totalPrice?: string
  trip?: TripDetails
  purchaseId?: string
  orderNumber?: string
  bookingRef?: string
  bookingName?: string
  locale?: Locale
}

const dict = {
  en: {
    preview: 'Your swappup purchase is confirmed',
    hi: 'Hi {name},',
    hiThere: 'Hi there,',
    thanks: 'Thank you so much for your purchase with swappup.',
    safe: 'Your money is safe with us and will only be sent to {seller} once your name is on the booking.',
    tripTitle: 'Your purchase',
    whatNext: 'What happens next',
    step1: '{seller} has 24 hours to update the booking with your name.',
    step2: 'As soon as {seller} confirms the change in the app, we will let you know by email.',
    pushTip: '💡 Turn on push notifications so you do not miss the moment.',
    updatePrefs: 'Update notification preferences',
    step3: 'On the airline website, check that the change was made correctly using the booking reference and the name you provided to {seller}. Then, within 48 hours, head back to the swappup app and confirm everything looks good. Only at that point we will send the money to {seller} and your purchase is finalised.',
    issueTitle: 'Found an issue with the booking?',
    issueBody: 'If something does not look right, or if {seller} does not update the booking with your name within 24 hours, your purchase is automatically refunded in full. No forms, no waiting.',
    sign: 'Have a great day,',
    team: 'The swappup team',
    seller: 'your seller',
    subjectWithOrder: 'Your swappup purchase is confirmed (Order {order})',
    subject: 'Your swappup purchase is confirmed',
  },
  it: {
    preview: 'Il tuo acquisto swappup è confermato',
    hi: 'Ciao {name},',
    hiThere: 'Ciao,',
    thanks: 'Grazie mille per il tuo acquisto su swappup.',
    safe: 'I tuoi soldi sono al sicuro con noi e verranno inviati a {seller} solo quando il tuo nome sarà sulla prenotazione.',
    tripTitle: 'Il tuo acquisto',
    whatNext: 'Cosa succede ora',
    step1: '{seller} ha 24 ore per aggiornare la prenotazione con il tuo nome.',
    step2: 'Non appena {seller} conferma il cambio in app, ti avviseremo via email.',
    pushTip: '💡 Attiva le notifiche push per non perdere il momento.',
    updatePrefs: 'Aggiorna le preferenze di notifica',
    step3: 'Sul sito della compagnia aerea, verifica che il cambio sia stato fatto correttamente usando il codice prenotazione e il nome che hai fornito a {seller}. Poi, entro 48 ore, torna sull\'app swappup e conferma che tutto sia in ordine. Solo a quel punto invieremo i soldi a {seller} e il tuo acquisto sarà finalizzato.',
    issueTitle: 'Hai riscontrato un problema con la prenotazione?',
    issueBody: 'Se qualcosa non torna, o se {seller} non aggiorna la prenotazione con il tuo nome entro 24 ore, il tuo acquisto viene rimborsato automaticamente per intero. Nessun modulo, nessuna attesa.',
    sign: 'Buona giornata,',
    team: 'Il team swappup',
    seller: 'il venditore',
    subjectWithOrder: 'Il tuo acquisto swappup è confermato (Ordine {order})',
    subject: 'Il tuo acquisto swappup è confermato',
  },
} as const

const Email = ({ buyerName, sellerName, totalPrice, trip, purchaseId, orderNumber, bookingRef, bookingName, locale }: Props) => {
  const loc = normalizeLocale(locale)
  const seller = sellerName || t(loc, dict, 'seller')
  const order = orderNumber || (purchaseId ? `SW-${purchaseId.slice(0, 8).toUpperCase()}` : undefined)
  const tripWithExtras: TripDetails | undefined = trip
    ? { ...trip, bookingRef: bookingRef || trip.bookingRef, bookingName: bookingName || trip.bookingName, escrowAmount: totalPrice, orderNumber: order }
    : undefined
  return (
    <EmailLayout preview={t(loc, dict, 'preview')} transactional locale={loc}>
      <Text style={p}>{buyerName ? t(loc, dict, 'hi', { name: buyerName }) : t(loc, dict, 'hiThere')}</Text>
      <Text style={p}>{t(loc, dict, 'thanks')}</Text>
      <Text style={p}>{t(loc, dict, 'safe', { seller })}</Text>
      <TripCard trip={tripWithExtras} title={t(loc, dict, 'tripTitle')} locale={loc} />
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>{t(loc, dict, 'whatNext')}</Heading>
      <Text style={p} as="div">
        <ol style={{ paddingLeft: '20px', margin: 0, color: brand.body, fontSize: '14px', lineHeight: '22px' }}>
          <li style={{ marginBottom: '6px' }} dangerouslySetInnerHTML={{ __html: t(loc, dict, 'step1', { seller }).replace(seller, `<strong>${seller}</strong>`) }} />
          <li style={{ marginBottom: '10px' }}>
            {t(loc, dict, 'step2', { seller })}
            <Section style={{ marginTop: '8px', padding: '10px 12px', backgroundColor: brand.goldTint, border: `1px solid ${brand.gold}`, borderRadius: '8px' }}>
              <Text style={{ margin: 0, color: brand.ink, fontSize: '13px', lineHeight: '20px' }}>
                {t(loc, dict, 'pushTip')}{' '}
                <Link href={PREFERENCES_URL} style={{ color: brand.goldDeep, textDecoration: 'underline', fontWeight: 600 }}>{t(loc, dict, 'updatePrefs')}</Link>.
              </Text>
            </Section>
          </li>
          <li style={{ marginBottom: '6px' }}>{t(loc, dict, 'step3', { seller })}</li>
        </ol>
      </Text>
      <Heading style={{ ...h1, fontSize: '16px', margin: '24px 0 8px' }}>{t(loc, dict, 'issueTitle')}</Heading>
      <Text style={p}>{t(loc, dict, 'issueBody', { seller })}</Text>
      <Text style={{ ...p, marginTop: '18px', marginBottom: 0 }}>
        {t(loc, dict, 'sign')}<br />{t(loc, dict, 'team')}
      </Text>
    </EmailLayout>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => {
    const loc = normalizeLocale(data?.locale)
    const order = data?.orderNumber || (data?.purchaseId ? `SW-${String(data.purchaseId).slice(0, 8).toUpperCase()}` : undefined)
    return order ? t(loc, dict, 'subjectWithOrder', { order }) : t(loc, dict, 'subject')
  },
  displayName: 'Buyer purchase confirmation',
  previewData: {
    locale: 'en',
    buyerName: 'Alex',
    sellerName: 'Maria',
    totalPrice: '€124.50',
    trip: {
      origin: 'London (LGW)', destination: 'Rome (FCO)',
      departureDate: '12 Jun 2026', departureTime: '07:45',
      returnDate: '19 Jun 2026', returnTime: '21:10',
      airline: 'Ryanair', flightNumber: 'FR2345', passengers: 2,
    },
    bookingRef: 'XYZ123',
    bookingName: 'Alex Johnson',
    purchaseId: 'abc-123',
  },
} satisfies TemplateEntry
