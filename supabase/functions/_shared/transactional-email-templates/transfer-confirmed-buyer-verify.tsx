/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripDetails, h1, p, button, brand, APP_URL, card, row, label } from './_layout.tsx'
import { Locale, normalizeLocale, t } from './i18n.ts'

interface Props {
  buyerName?: string
  newBookingRef?: string
  surname?: string
  trip?: TripDetails
  purchaseId?: string
  orderNumber?: string
  totalPrice?: string
  locale?: Locale
}

const dict = {
  en: {
    preview: 'Your ticket is ready, please verify and confirm',
    hi: 'Hi {name},', hiThere: 'Hi there,',
    intro: 'Good news! {seller} has updated the airline booking with your name. The last step is yours: please check that everything looks right on the airline website and confirm in the app ',
    intro48: 'before 24 hours after your flight departs',
    introAfter: ' to release the payment early. Otherwise, your payment is released automatically 24 hours after departure. Your money stays safely with us until then.',
    useOnAirline: 'Use these on the airline website',
    airline: 'Airline', bookingRef: 'Booking reference', newName: 'New name on the booking',
    purchaseDetails: 'Purchase details', orderNumber: 'Order number', route: 'Route',
    outbound: 'Outbound', departure: 'Departure', return: 'Return', passengers: 'Passengers',
    amountPaid: 'Amount paid (held safely until released)',
    nextSteps: 'Next steps',
    s1Bold: 'If everything looks right:', s1: ' head back to the swappup app and confirm your booking. If you don\'t act, the payment is released automatically ', s1B: '24 hours after your flight departs', s1After: '. Confirming early sends the payment to {seller} sooner.',
    s2Bold: 'If something is wrong', s2: ' (wrong name, wrong flight, missing booking, etc.): flag the issue from the same screen in the app. Your money stays safely with us until the problem is resolved — no payment is released until you confirm.',
    cta: 'View purchase in app',
    sign: 'Have a great day,', team: 'The swappup team',
    seller: 'your seller', at: 'at',
    subjectWithOrder: 'Your ticket is ready, please verify (Order {order})',
    subject: 'Your ticket is ready, please verify',
  },
  it: {
    preview: 'Il tuo biglietto è pronto, verifica e conferma',
    hi: 'Ciao {name},', hiThere: 'Ciao,',
    intro: 'Buone notizie! {seller} ha aggiornato la prenotazione con il tuo nome. Manca solo l\'ultimo passo: controlla che sia tutto in ordine sul sito della compagnia aerea e conferma in app ',
    intro48: 'prima di 24 ore dopo la partenza del volo',
    introAfter: ' per sbloccare il pagamento in anticipo. In caso contrario, il pagamento viene rilasciato automaticamente 24 ore dopo la partenza. L\'importo resta al sicuro con noi fino a quel momento.',
    useOnAirline: 'Usa questi dati sul sito della compagnia',
    airline: 'Compagnia', bookingRef: 'Codice prenotazione', newName: 'Nuovo nome sulla prenotazione',
    purchaseDetails: 'Dettagli acquisto', orderNumber: 'Numero ordine', route: 'Tratta',
    outbound: 'Andata', departure: 'Partenza', return: 'Ritorno', passengers: 'Passeggeri',
    amountPaid: 'Importo pagato (custodito al sicuro fino al rilascio)',
    nextSteps: 'Prossimi passi',
    s1Bold: 'Se è tutto a posto:', s1: ' torna sull\'app swappup e conferma la prenotazione. Se non agisci, il pagamento viene rilasciato automaticamente ', s1B: '24 ore dopo la partenza del volo', s1After: '. Confermare prima invia il pagamento a {seller} più rapidamente.',
    s2Bold: 'Se qualcosa non va', s2: ' (nome errato, volo sbagliato, prenotazione mancante, ecc.): segnala il problema dalla stessa schermata in app. La somma resta al sicuro con noi finché il problema non è risolto — nessun pagamento viene inviato finché non confermi.',
    cta: 'Vedi acquisto in app',
    sign: 'Buona giornata,', team: 'Il team swappup',
    seller: 'il venditore', at: 'alle',
    subjectWithOrder: 'Il tuo biglietto è pronto, verifica (Ordine {order})',
    subject: 'Il tuo biglietto è pronto, verifica',
  },
} as const

const Email = ({ buyerName, newBookingRef, surname, trip, purchaseId, orderNumber, totalPrice, locale }: Props) => {
  const loc = normalizeLocale(locale)
  // Seller PII is intentionally hidden from the buyer.
  const seller = t(loc, dict, 'seller')
  const order = orderNumber || (purchaseId ? `SW-${purchaseId.slice(0, 8).toUpperCase()}` : undefined)
  const fmtLeg = (date?: string, time?: string) => {
    if (!date && !time) return ''
    if (date && time) return `${date} ${t(loc, dict, 'at')} ${time}`
    return date || time || ''
  }
  const isRoundTrip = !!(trip?.returnDate || trip?.returnTime)
  const bookingRef = newBookingRef || trip?.bookingRef
  const bookingName = surname || trip?.bookingName
  const amount = totalPrice || trip?.escrowAmount
  return (
    <EmailLayout preview={t(loc, dict, 'preview')} transactional locale={loc}>
      <Text style={p}>{buyerName ? t(loc, dict, 'hi', { name: buyerName }) : t(loc, dict, 'hiThere')}</Text>
      <Text style={p}>
        {t(loc, dict, 'intro', { seller })}<strong>{t(loc, dict, 'intro48')}</strong>{t(loc, dict, 'introAfter')}
      </Text>
      <Section style={card}>
        <Text style={{ margin: '0 0 10px', color: brand.goldDeep, fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
          {t(loc, dict, 'useOnAirline')}
        </Text>
        {trip?.airline && <Text style={row}><span style={label}>{t(loc, dict, 'airline')}: </span>{trip.airline}{trip.flightNumber ? ` · ${trip.flightNumber}` : ''}</Text>}
        {bookingRef && <Text style={row}><span style={label}>{t(loc, dict, 'bookingRef')}: </span><strong>{bookingRef}</strong></Text>}
        {bookingName && <Text style={row}><span style={label}>{t(loc, dict, 'newName')}: </span><strong>{bookingName}</strong></Text>}

        <Text style={{ margin: '14px 0 10px', paddingTop: '12px', borderTop: `1px dashed ${brand.border}`, color: brand.goldDeep, fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
          {t(loc, dict, 'purchaseDetails')}
        </Text>
        {order && <Text style={row}><span style={label}>{t(loc, dict, 'orderNumber')}: </span>{order}</Text>}
        {trip?.origin && trip?.destination && (
          <Text style={row}><span style={label}>{t(loc, dict, 'route')}: </span>{trip.origin} {isRoundTrip ? '⇄' : '→'} {trip.destination}</Text>
        )}
        {(trip?.departureDate || trip?.departureTime) && (
          <Text style={row}><span style={label}>{isRoundTrip ? `${t(loc, dict, 'outbound')}: ` : `${t(loc, dict, 'departure')}: `}</span>{fmtLeg(trip?.departureDate, trip?.departureTime)}</Text>
        )}
        {isRoundTrip && (
          <Text style={row}><span style={label}>{t(loc, dict, 'return')}: </span>{fmtLeg(trip?.returnDate, trip?.returnTime)}</Text>
        )}
        {trip?.passengers && trip.passengers > 1 && (
          <Text style={row}><span style={label}>{t(loc, dict, 'passengers')}: </span>{trip.passengers}</Text>
        )}
        {amount && <Text style={{ ...row, fontWeight: 600, color: brand.charcoal }}><span style={label}>{t(loc, dict, 'amountPaid')}: </span>{amount}</Text>}
      </Section>
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>{t(loc, dict, 'nextSteps')}</Heading>
      <Text style={p} as="div">
        <ol style={{ paddingLeft: '20px', margin: 0, color: brand.body, fontSize: '14px', lineHeight: '22px' }}>
          <li style={{ marginBottom: '10px' }}>
            <strong>{t(loc, dict, 's1Bold')}</strong>{t(loc, dict, 's1')}<strong>{t(loc, dict, 's1B')}</strong>{t(loc, dict, 's1After', { seller })}
          </li>
          <li style={{ marginBottom: '6px' }}>
            <strong>{t(loc, dict, 's2Bold')}</strong>{t(loc, dict, 's2')}
          </li>
        </ol>
      </Text>
      <Section style={{ margin: '20px 0 8px' }}>
        <Link href={`${APP_URL}/account?tab=purchases`} style={button()}>{t(loc, dict, 'cta')}</Link>
      </Section>
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
  displayName: 'Buyer verification needed',
  previewData: {
    locale: 'en',
    buyerName: 'Alex',
    newBookingRef: 'NEW456',
    surname: 'Johnson',
    totalPrice: '€124.50',
    purchaseId: 'abc-123',
    trip: {
      origin: 'London (LGW)', destination: 'Rome (FCO)',
      departureDate: '12 Jun 2026', departureTime: '07:45',
      returnDate: '19 Jun 2026', returnTime: '21:10',
      airline: 'Ryanair', flightNumber: 'FR2345', passengers: 1,
    },
  },
} satisfies TemplateEntry
