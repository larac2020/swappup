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
  bookingRef?: string
  totalPrice?: string
  trip?: TripDetails
  deadline?: string
  purchaseId?: string
  orderNumber?: string
  locale?: Locale
}

const dict = {
  en: {
    preview: 'Only 4 hours left to complete your sale',
    hi: 'Hi {name},', hiThere: 'Hi there,',
    intro1: 'Just a heads up. Your 24 hour window to update the booking with {buyer}\'s name is almost over. After {deadline}, the purchase is ',
    intro2: ' and the sale is cancelled.',
    intro2bold: 'automatically refunded',
    fallbackDeadline: 'the deadline',
    salesDetails: 'Your sales details',
    orderNumber: 'Order number', route: 'Route', outbound: 'Outbound', departure: 'Departure', return: 'Return',
    airline: 'Airline', passengers: 'Passengers', amountPaid: 'Amount paid',
    buyerDetails: 'Buyer details to use with the airline', fullName: 'Full name', originalRef: 'Original booking reference',
    unlock: 'Unlock your payment',
    s1Before: 'Go to the airline website and ', s1Bold: 'update the booking', s1After: ' with the buyer\'s name.',
    s2: 'Upload the new booking confirmation in the swappup app to mark the change as done.',
    s3: 'Once the buyer verifies everything looks good, your money is released. It usually arrives in your account within 2 to 5 business days.',
    pushTip: '💡 Turn on push notifications to know the moment the buyer confirms and your payment is on the way.',
    updatePrefs: 'Update notification preferences',
    cta: 'Confirm the name change in the app',
    feeReminder: 'Reminder: as you acknowledged when listing, the fee paid to the airline for the name change is not refundable by swappup if the buyer fails to confirm within 48 hours.',
    doneTitle: 'Already done it?',
    doneBody: 'Great. Just upload the new booking confirmation in the app and the sale will go through straight away.',
    sign: 'Have a great day,', team: 'The swappup team',
    buyer: 'your buyer', at: 'at',
    subjectWithOrder: 'Final reminder: 4 hours left (Order {order})',
    subject: 'Final reminder: 4 hours left to complete your sale',
  },
  it: {
    preview: 'Solo 4 ore per completare la vendita',
    hi: 'Ciao {name},', hiThere: 'Ciao,',
    intro1: 'Un avviso. La tua finestra di 24 ore per aggiornare la prenotazione con il nome di {buyer} è quasi terminata. Dopo {deadline}, l\'acquisto viene ',
    intro2: ' e la vendita viene cancellata.',
    intro2bold: 'rimborsato automaticamente',
    fallbackDeadline: 'la scadenza',
    salesDetails: 'Dettagli della vendita',
    orderNumber: 'Numero ordine', route: 'Tratta', outbound: 'Andata', departure: 'Partenza', return: 'Ritorno',
    airline: 'Compagnia', passengers: 'Passeggeri', amountPaid: 'Importo pagato',
    buyerDetails: 'Dati dell\'acquirente da usare con la compagnia', fullName: 'Nome completo', originalRef: 'Codice prenotazione originale',
    unlock: 'Sblocca il tuo pagamento',
    s1Before: 'Vai sul sito della compagnia aerea e ', s1Bold: 'aggiorna la prenotazione', s1After: ' con il nome dell\'acquirente.',
    s2: 'Carica la nuova conferma di prenotazione nell\'app swappup per segnalare il cambio come fatto.',
    s3: 'Una volta che l\'acquirente verifica che sia tutto in ordine, i tuoi soldi vengono sbloccati. Di solito arrivano sul tuo conto entro 2-5 giorni lavorativi.',
    pushTip: '💡 Attiva le notifiche push per sapere subito quando l\'acquirente conferma e il pagamento è in arrivo.',
    updatePrefs: 'Aggiorna le preferenze di notifica',
    cta: 'Conferma il cambio nome in app',
    feeReminder: 'Promemoria: come hai accettato in fase di pubblicazione, la commissione pagata alla compagnia aerea per il cambio nome non è rimborsabile da swappup se l\'acquirente non conferma entro 48 ore.',
    doneTitle: 'L\'hai già fatto?',
    doneBody: 'Ottimo. Carica la nuova conferma di prenotazione in app e la vendita andrà subito a buon fine.',
    sign: 'Buona giornata,', team: 'Il team swappup',
    buyer: 'il tuo acquirente', at: 'alle',
    subjectWithOrder: 'Ultimo promemoria: 4 ore rimaste (Ordine {order})',
    subject: 'Ultimo promemoria: 4 ore per completare la vendita',
  },
} as const

const Email = ({ sellerName, buyerName, buyerFullName, bookingRef, totalPrice, trip, deadline, purchaseId, orderNumber, locale }: Props) => {
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
        {t(loc, dict, 'intro1', { buyer, deadline: deadline || t(loc, dict, 'fallbackDeadline') })}<strong>{t(loc, dict, 'intro2bold')}</strong>{t(loc, dict, 'intro2')}
      </Text>
      {trip && (
        <Section style={card}>
          <Text style={{ margin: '0 0 10px', color: brand.goldDeep, fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>{t(loc, dict, 'salesDetails')}</Text>
          {order && <Text style={row}><span style={label}>{t(loc, dict, 'orderNumber')}: </span>{order}</Text>}
          {trip.origin && trip.destination && <Text style={row}><span style={label}>{t(loc, dict, 'route')}: </span>{trip.origin} {isRoundTrip ? '⇄' : '→'} {trip.destination}</Text>}
          {(trip.departureDate || trip.departureTime) && <Text style={row}><span style={label}>{isRoundTrip ? `${t(loc, dict, 'outbound')}: ` : `${t(loc, dict, 'departure')}: `}</span>{fmtLeg(trip.departureDate, trip.departureTime)}</Text>}
          {isRoundTrip && <Text style={row}><span style={label}>{t(loc, dict, 'return')}: </span>{fmtLeg(trip.returnDate, trip.returnTime)}</Text>}
          {trip.airline && <Text style={row}><span style={label}>{t(loc, dict, 'airline')}: </span>{trip.airline}{trip.flightNumber ? ` · ${trip.flightNumber}` : ''}</Text>}
          {trip.passengers && trip.passengers > 1 && <Text style={row}><span style={label}>{t(loc, dict, 'passengers')}: </span>{trip.passengers}</Text>}
          {amount && <Text style={{ ...row, marginTop: '10px', paddingTop: '10px', borderTop: `1px dashed ${brand.border}`, fontWeight: 600, color: brand.charcoal }}><span style={label}>{t(loc, dict, 'amountPaid')}: </span>{amount}</Text>}
          <Text style={{ margin: '16px 0 10px', paddingTop: '12px', borderTop: `1px solid ${brand.border}`, color: brand.goldDeep, fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>{t(loc, dict, 'buyerDetails')}</Text>
          {buyerFullName && <Text style={row}><span style={label}>{t(loc, dict, 'fullName')}: </span>{buyerFullName}</Text>}
          {bookingRef && <Text style={row}><span style={label}>{t(loc, dict, 'originalRef')}: </span>{bookingRef}</Text>}
        </Section>
      )}
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>{t(loc, dict, 'unlock')}</Heading>
      <Text style={p} as="div">
        <ol style={{ paddingLeft: '20px', margin: 0, color: brand.body, fontSize: '14px', lineHeight: '22px' }}>
          <li style={{ marginBottom: '6px' }}>{t(loc, dict, 's1Before')}<strong>{t(loc, dict, 's1Bold')}</strong>{t(loc, dict, 's1After')}</li>
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
      <Section style={{ margin: '20px 0 8px' }}>
        <Link href={`${APP_URL}/account?tab=sales`} style={button()}>{t(loc, dict, 'cta')}</Link>
      </Section>
      <Text style={{ fontSize: '12px', color: '#6b7280', lineHeight: '18px', margin: '6px 0 0', fontStyle: 'italic' }}>{t(loc, dict, 'feeReminder')}</Text>
      <Heading style={{ ...h1, fontSize: '16px', margin: '24px 0 8px' }}>{t(loc, dict, 'doneTitle')}</Heading>
      <Text style={p}>{t(loc, dict, 'doneBody')}</Text>
      <Text style={{ ...p, marginTop: '18px', marginBottom: 0 }}>{t(loc, dict, 'sign')}<br />{t(loc, dict, 'team')}</Text>
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
  displayName: 'Seller deadline warning (4h)',
  previewData: {
    locale: 'en',
    sellerName: 'Maria', buyerName: 'Alex', buyerFullName: 'Alex Johnson',
    bookingRef: 'XYZ123', totalPrice: '€124.50', deadline: '13 May 2026 14:30', purchaseId: 'abc-123',
    trip: {
      origin: 'London (LGW)', destination: 'Rome (FCO)',
      departureDate: '12 Jun 2026', departureTime: '07:45',
      returnDate: '19 Jun 2026', returnTime: '21:10',
      airline: 'Ryanair', flightNumber: 'FR2345', passengers: 1,
    },
  },
} satisfies TemplateEntry
