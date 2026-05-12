/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripDetails, h1, p, button, brand, card, row, label, APP_URL, PREFERENCES_URL } from './_layout.tsx'
import { Locale, normalizeLocale, t } from './i18n.ts'

interface Props {
  sellerName?: string
  buyerName?: string
  buyerFullName?: string
  buyerEmail?: string
  trip?: TripDetails
  bookingRef?: string
  deadline?: string
  purchaseId?: string
  orderNumber?: string
  totalPrice?: string
  locale?: Locale
}

const dict = {
  en: {
    preview: "You've made a sale, please update the booking",
    hi: 'Hi {name},',
    hiThere: 'Hi there,',
    intro1: 'Great news! Your ticket has just been sold to {buyer}. To complete the sale and receive your money, you have ',
    intro2: ' to update the airline booking with the buyer\'s name.',
    intro2bold: '24 hours',
    salesDetails: 'Your sales details',
    orderNumber: 'Order number',
    route: 'Route',
    outbound: 'Outbound',
    departure: 'Departure',
    return: 'Return',
    airline: 'Airline',
    passengers: 'Passengers',
    amountPaid: 'Amount paid',
    buyerDetails: 'Buyer details to use with the airline',
    fullName: 'Full name',
    originalRef: 'Original booking reference',
    unlock: 'Unlock your payment',
    s1Before: 'Go to the airline website and ',
    s1Bold: 'update the booking',
    s1After: ' with the buyer\'s name.',
    s2: 'Upload the new booking confirmation in the swappup app to mark the change as done.',
    s3: 'Once the buyer verifies everything looks good, your money is released. It usually arrives in your account within 2 to 5 business days.',
    pushTip: '💡 Turn on push notifications to know the moment the buyer confirms and your payment is on the way.',
    updatePrefs: 'Update notification preferences',
    deadlineTitle: "Can't make the deadline?",
    deadlineBody: 'If you do not update the booking by {deadline}, the purchase is automatically refunded to the buyer and the sale is cancelled. If something is blocking you, please get in touch with us as soon as possible.',
    fallbackDeadline: 'the 24 hour deadline',
    cta: 'Confirm the name change in the app',
    feeReminder: 'Reminder: as you acknowledged when listing, the fee paid to the airline for the name change is not refundable by swappup if the buyer fails to confirm within 48 hours.',
    sign: 'Have a great day,',
    team: 'The swappup team',
    buyer: 'your buyer',
    at: 'at',
    subjectWithOrder: "You've made a sale! Please update the booking (Order {order})",
    subject: "You've made a sale! Please update the booking",
  },
  it: {
    preview: 'Hai fatto una vendita, aggiorna la prenotazione',
    hi: 'Ciao {name},',
    hiThere: 'Ciao,',
    intro1: 'Ottime notizie! Il tuo biglietto è appena stato venduto a {buyer}. Per completare la vendita e ricevere i soldi, hai ',
    intro2: ' per aggiornare la prenotazione con il nome dell\'acquirente.',
    intro2bold: '24 ore',
    salesDetails: 'Dettagli della vendita',
    orderNumber: 'Numero ordine',
    route: 'Tratta',
    outbound: 'Andata',
    departure: 'Partenza',
    return: 'Ritorno',
    airline: 'Compagnia',
    passengers: 'Passeggeri',
    amountPaid: 'Importo pagato',
    buyerDetails: 'Dati dell\'acquirente da usare con la compagnia',
    fullName: 'Nome completo',
    originalRef: 'Codice prenotazione originale',
    unlock: 'Sblocca il tuo pagamento',
    s1Before: 'Vai sul sito della compagnia aerea e ',
    s1Bold: 'aggiorna la prenotazione',
    s1After: ' con il nome dell\'acquirente.',
    s2: 'Carica la nuova conferma di prenotazione nell\'app swappup per segnalare il cambio come fatto.',
    s3: 'Una volta che l\'acquirente verifica che sia tutto in ordine, i tuoi soldi vengono sbloccati. Di solito arrivano sul tuo conto entro 2-5 giorni lavorativi.',
    pushTip: '💡 Attiva le notifiche push per sapere subito quando l\'acquirente conferma e il pagamento è in arrivo.',
    updatePrefs: 'Aggiorna le preferenze di notifica',
    deadlineTitle: 'Non riesci a rispettare la scadenza?',
    deadlineBody: 'Se non aggiorni la prenotazione entro {deadline}, l\'acquisto viene rimborsato automaticamente all\'acquirente e la vendita viene cancellata. Se qualcosa ti blocca, contattaci il prima possibile.',
    fallbackDeadline: 'le 24 ore',
    cta: 'Conferma il cambio nome in app',
    feeReminder: 'Promemoria: come hai accettato in fase di pubblicazione, la commissione pagata alla compagnia aerea per il cambio nome non è rimborsabile da swappup se l\'acquirente non conferma entro 48 ore.',
    sign: 'Buona giornata,',
    team: 'Il team swappup',
    buyer: 'il tuo acquirente',
    at: 'alle',
    subjectWithOrder: 'Hai fatto una vendita! Aggiorna la prenotazione (Ordine {order})',
    subject: 'Hai fatto una vendita! Aggiorna la prenotazione',
  },
} as const

const Email = ({ sellerName, buyerName, buyerFullName, trip, bookingRef, deadline, purchaseId, orderNumber, totalPrice, locale }: Props) => {
  const loc = normalizeLocale(locale)
  const buyer = buyerName || buyerFullName || t(loc, dict, 'buyer')
  const order = orderNumber || (purchaseId ? `SW-${purchaseId.slice(0, 8).toUpperCase()}` : undefined)
  const isRoundTrip = !!(trip?.returnDate || trip?.returnTime)
  const fmtLeg = (date?: string, time?: string) => {
    if (!date && !time) return ''
    if (date && time) return `${date} ${t(loc, dict, 'at')} ${time}`
    return date || time || ''
  }
  const amount = totalPrice || trip?.escrowAmount
  return (
    <EmailLayout preview={t(loc, dict, 'preview')} transactional locale={loc}>
      <Text style={p}>{sellerName ? t(loc, dict, 'hi', { name: sellerName }) : t(loc, dict, 'hiThere')}</Text>
      <Text style={p}>
        {t(loc, dict, 'intro1', { buyer })}<strong>{t(loc, dict, 'intro2bold')}</strong>{t(loc, dict, 'intro2')}
      </Text>
      {trip && (
        <Section style={card}>
          <Text style={{ margin: '0 0 10px', color: brand.goldDeep, fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
            {t(loc, dict, 'salesDetails')}
          </Text>
          {order && <Text style={row}><span style={label}>{t(loc, dict, 'orderNumber')}: </span>{order}</Text>}
          {trip.origin && trip.destination && (
            <Text style={row}><span style={label}>{t(loc, dict, 'route')}: </span>{trip.origin} {isRoundTrip ? '⇄' : '→'} {trip.destination}</Text>
          )}
          {(trip.departureDate || trip.departureTime) && (
            <Text style={row}><span style={label}>{isRoundTrip ? `${t(loc, dict, 'outbound')}: ` : `${t(loc, dict, 'departure')}: `}</span>{fmtLeg(trip.departureDate, trip.departureTime)}</Text>
          )}
          {isRoundTrip && (
            <Text style={row}><span style={label}>{t(loc, dict, 'return')}: </span>{fmtLeg(trip.returnDate, trip.returnTime)}</Text>
          )}
          {trip.airline && (
            <Text style={row}><span style={label}>{t(loc, dict, 'airline')}: </span>{trip.airline}{trip.flightNumber ? ` · ${trip.flightNumber}` : ''}</Text>
          )}
          {trip.passengers && trip.passengers > 1 && (
            <Text style={row}><span style={label}>{t(loc, dict, 'passengers')}: </span>{trip.passengers}</Text>
          )}
          {amount && (
            <Text style={{ ...row, marginTop: '10px', paddingTop: '10px', borderTop: `1px dashed ${brand.border}`, fontWeight: 600, color: brand.charcoal }}>
              <span style={label}>{t(loc, dict, 'amountPaid')}: </span>{amount}
            </Text>
          )}

          <Text style={{ margin: '16px 0 10px', paddingTop: '12px', borderTop: `1px solid ${brand.border}`, color: brand.goldDeep, fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
            {t(loc, dict, 'buyerDetails')}
          </Text>
          {buyerFullName && (
            <Text style={row}><span style={label}>{t(loc, dict, 'fullName')}: </span>{buyerFullName}</Text>
          )}
          {bookingRef && (
            <Text style={row}><span style={label}>{t(loc, dict, 'originalRef')}: </span>{bookingRef}</Text>
          )}
        </Section>
      )}
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>{t(loc, dict, 'unlock')}</Heading>
      <Text style={p} as="div">
        <ol style={{ paddingLeft: '20px', margin: 0, color: brand.body, fontSize: '14px', lineHeight: '22px' }}>
          <li style={{ marginBottom: '6px' }}>
            {t(loc, dict, 's1Before')}<strong>{t(loc, dict, 's1Bold')}</strong>{t(loc, dict, 's1After')}
          </li>
          <li style={{ marginBottom: '10px' }}>{t(loc, dict, 's2')}</li>
          <li style={{ marginBottom: '10px' }}>
            {t(loc, dict, 's3')}
            <Section style={{ marginTop: '8px', padding: '10px 12px', backgroundColor: brand.goldTint, border: `1px solid ${brand.gold}`, borderRadius: '8px' }}>
              <Text style={{ margin: 0, color: brand.ink, fontSize: '13px', lineHeight: '20px' }}>
                {t(loc, dict, 'pushTip')}{' '}
                <Link href={PREFERENCES_URL} style={{ color: brand.goldDeep, textDecoration: 'underline', fontWeight: 600 }}>{t(loc, dict, 'updatePrefs')}</Link>.
              </Text>
            </Section>
          </li>
        </ol>
      </Text>
      <Heading style={{ ...h1, fontSize: '16px', margin: '24px 0 8px' }}>{t(loc, dict, 'deadlineTitle')}</Heading>
      <Text style={p}>{t(loc, dict, 'deadlineBody', { deadline: deadline || t(loc, dict, 'fallbackDeadline') })}</Text>
      <Section style={{ margin: '20px 0 8px' }}>
        <Link href={`${APP_URL}/account?tab=sales`} style={button()}>{t(loc, dict, 'cta')}</Link>
      </Section>
      <Text style={{ fontSize: '12px', color: '#6b7280', lineHeight: '18px', margin: '6px 0 0', fontStyle: 'italic' }}>
        {t(loc, dict, 'feeReminder')}
      </Text>
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
  displayName: 'Seller action required',
  previewData: {
    locale: 'en',
    sellerName: 'Maria',
    buyerName: 'Alex',
    buyerFullName: 'Alex Johnson',
    buyerEmail: 'alex@example.com',
    nameChangeFee: '€45.00',
    totalPrice: '€124.50',
    bookingRef: 'XYZ123',
    deadline: '13 May 2026 14:30',
    purchaseId: 'abc-123',
    trip: {
      origin: 'London (LGW)', destination: 'Rome (FCO)',
      departureDate: '12 Jun 2026', departureTime: '07:45',
      returnDate: '19 Jun 2026', returnTime: '21:10',
      airline: 'Ryanair', flightNumber: 'FR2345', passengers: 1,
    },
  },
} satisfies TemplateEntry
