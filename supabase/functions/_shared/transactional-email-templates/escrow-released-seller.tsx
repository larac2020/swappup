/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripCard, TripDetails, h1, p, small, button, APP_URL } from './_layout.tsx'
import { Locale, normalizeLocale, t } from './i18n.ts'

interface Props {
  sellerName?: string
  buyerName?: string
  payoutAmount?: string
  trip?: TripDetails
  purchaseId?: string
  orderNumber?: string
  locale?: Locale
}

const dict = {
  en: {
    preview: 'Your sale is complete and your money is on its way',
    hi: 'Hi {name},', hiThere: 'Hi there,',
    intro: 'Brilliant news! {buyer} has confirmed the ticket change and the sale is complete. Your money',
    intro2: ' is now on its way to your account.',
    tripTitle: 'Your booking',
    payoutLabel: "Amount you'll receive",
    whatNext: 'What happens next',
    whatNextBody1: 'Your money usually lands in your bank account within ',
    whatNextBold: '2 to 5 business days',
    whatNextBody2: ', depending on your bank. You can check on it any time from your sales in the app.',
    cta: 'View sale in app',
    note: 'This is a payment notification, not a tax invoice. For accounting purposes, you can download the official receipt from the same screen.',
    sign: 'Thanks for selling on swappup. Have a great day,', team: 'The swappup team',
    buyer: 'your buyer',
    subjectWithOrder: 'Your sale is complete, your money is on its way (Order {order})',
    subject: 'Your sale is complete, your money is on its way',
  },
  it: {
    preview: 'La tua vendita è completata e i soldi sono in arrivo',
    hi: 'Ciao {name},', hiThere: 'Ciao,',
    intro: 'Ottime notizie! {buyer} ha confermato il cambio del biglietto e la vendita è completata. I tuoi soldi',
    intro2: ' sono ora in arrivo sul tuo conto.',
    tripTitle: 'La tua prenotazione',
    payoutLabel: 'Importo che riceverai',
    whatNext: 'Cosa succede ora',
    whatNextBody1: 'I tuoi soldi di solito arrivano sul conto entro ',
    whatNextBold: '2-5 giorni lavorativi',
    whatNextBody2: ', a seconda della tua banca. Puoi controllare lo stato in qualsiasi momento dalla sezione vendite in app.',
    cta: 'Vedi vendita in app',
    note: 'Questa è una notifica di pagamento, non una fattura. A fini contabili puoi scaricare la ricevuta ufficiale dalla stessa schermata.',
    sign: 'Grazie per aver venduto su swappup. Buona giornata,', team: 'Il team swappup',
    buyer: 'il tuo acquirente',
    subjectWithOrder: 'Vendita completata, i soldi sono in arrivo (Ordine {order})',
    subject: 'Vendita completata, i soldi sono in arrivo',
  },
} as const

const Email = ({ sellerName, buyerName, payoutAmount, trip, purchaseId, orderNumber, locale }: Props) => {
  const loc = normalizeLocale(locale)
  const buyer = buyerName || t(loc, dict, 'buyer')
  const order = orderNumber || (purchaseId ? `SW-${purchaseId.slice(0, 8).toUpperCase()}` : undefined)
  const tripWithExtras: TripDetails | undefined = trip
    ? { ...trip, escrowAmount: payoutAmount || trip.escrowAmount, escrowAmountLabel: t(loc, dict, 'payoutLabel'), orderNumber: order }
    : undefined
  return (
    <EmailLayout preview={t(loc, dict, 'preview')} accent="success" transactional locale={loc}>
      <Text style={p}>{sellerName ? t(loc, dict, 'hi', { name: sellerName }) : t(loc, dict, 'hiThere')}</Text>
      <Text style={p}>
        {t(loc, dict, 'intro', { buyer })}
        {payoutAmount ? <> ({payoutAmount})</> : null}{t(loc, dict, 'intro2')}
      </Text>
      <TripCard trip={tripWithExtras} title={t(loc, dict, 'tripTitle')} locale={loc} />
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>{t(loc, dict, 'whatNext')}</Heading>
      <Text style={p}>{t(loc, dict, 'whatNextBody1')}<strong>{t(loc, dict, 'whatNextBold')}</strong>{t(loc, dict, 'whatNextBody2')}</Text>
      <Section style={{ margin: '20px 0 8px' }}>
        <Link href={`${APP_URL}/account?tab=sales`} style={button()}>{t(loc, dict, 'cta')}</Link>
      </Section>
      <Text style={small}>{t(loc, dict, 'note')}</Text>
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
  displayName: 'Seller payout released',
  previewData: {
    locale: 'en',
    sellerName: 'Maria',
    buyerName: 'Alex',
    payoutAmount: '€118.20',
    purchaseId: 'abc-123',
    trip: {
      origin: 'London (LGW)', destination: 'Rome (FCO)',
      departureDate: '12 Jun 2026', departureTime: '07:45',
      returnDate: '19 Jun 2026', returnTime: '21:10',
      airline: 'Ryanair', flightNumber: 'FR2345', passengers: 1,
    },
  },
} satisfies TemplateEntry
