/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripCard, TripDetails, h1, p, small, button, APP_URL } from './_layout.tsx'
import { Locale, normalizeLocale, t } from './i18n.ts'

interface Props {
  buyerName?: string
  trip?: TripDetails
  refundAmount?: string
  purchaseId?: string
  orderNumber?: string
  locale?: Locale
}

const dict = {
  en: {
    preview: 'We are sorry, your purchase has been refunded',
    hi: 'Hi {name},', hiThere: 'Hi there,',
    intro1: 'We are really sorry. The seller did not update the booking with your name within the 24 hour window. To protect you, we have automatically ',
    intro1Bold: 'refunded your purchase in full',
    intro2: '. The refund usually appears in your account within ',
    intro2Bold: '5 to 10 business days',
    intro3: ', depending on your bank.',
    tripTitle: 'Your ticket details',
    refundLabel: "Amount we'll refund",
    dontGiveUp: "Don't give up on the trip",
    dontGiveUpBody: 'There may be other sellers offering similar tickets on the same route. Tap below to browse alternatives. We will do our best to help you find another option.',
    cta: 'Find another ticket',
    note: 'Sellers who repeatedly miss the deadline are reviewed and may be removed from swappup.',
    sign: 'Thank you for your patience. Have a great day,', team: 'The swappup team',
    subjectWithOrder: 'Your purchase has been refunded (Order {order})',
    subject: 'Your purchase has been refunded',
  },
  it: {
    preview: 'Ci dispiace, il tuo acquisto è stato rimborsato',
    hi: 'Ciao {name},', hiThere: 'Ciao,',
    intro1: 'Ci dispiace davvero. Il venditore non ha aggiornato la prenotazione con il tuo nome entro le 24 ore. Per tutelarti, abbiamo ',
    intro1Bold: 'rimborsato automaticamente il tuo acquisto per intero',
    intro2: '. Il rimborso di solito compare sul tuo conto entro ',
    intro2Bold: '5-10 giorni lavorativi',
    intro3: ', a seconda della tua banca.',
    tripTitle: 'Dettagli del tuo biglietto',
    refundLabel: 'Importo rimborsato',
    dontGiveUp: 'Non rinunciare al viaggio',
    dontGiveUpBody: 'Potrebbero esserci altri venditori con biglietti simili sulla stessa tratta. Tocca qui sotto per cercare alternative. Faremo del nostro meglio per aiutarti a trovare un\'altra opzione.',
    cta: 'Trova un altro biglietto',
    note: 'I venditori che mancano ripetutamente la scadenza vengono revisionati e possono essere rimossi da swappup.',
    sign: 'Grazie per la pazienza. Buona giornata,', team: 'Il team swappup',
    subjectWithOrder: 'Il tuo acquisto è stato rimborsato (Ordine {order})',
    subject: 'Il tuo acquisto è stato rimborsato',
  },
} as const

const Email = ({ buyerName, trip, refundAmount, purchaseId, orderNumber, locale }: Props) => {
  const loc = normalizeLocale(locale)
  const order = orderNumber || (purchaseId ? `SW-${purchaseId.slice(0, 8).toUpperCase()}` : undefined)
  const tripWithExtras: TripDetails | undefined = trip
    ? { ...trip, escrowAmount: refundAmount || trip.escrowAmount, orderNumber: order, escrowAmountLabel: t(loc, dict, 'refundLabel') }
    : undefined
  return (
    <EmailLayout preview={t(loc, dict, 'preview')} accent="danger" transactional locale={loc}>
      <Text style={p}>{buyerName ? t(loc, dict, 'hi', { name: buyerName }) : t(loc, dict, 'hiThere')}</Text>
      <Text style={p}>
        {t(loc, dict, 'intro1')}<strong>{t(loc, dict, 'intro1Bold')}</strong>
        {refundAmount ? <> ({refundAmount})</> : null}{t(loc, dict, 'intro2')}<strong>{t(loc, dict, 'intro2Bold')}</strong>{t(loc, dict, 'intro3')}
      </Text>
      <TripCard trip={tripWithExtras} title={t(loc, dict, 'tripTitle')} locale={loc} />
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>{t(loc, dict, 'dontGiveUp')}</Heading>
      <Text style={p}>{t(loc, dict, 'dontGiveUpBody')}</Text>
      <Section style={{ margin: '20px 0 8px' }}>
        <Link href={`${APP_URL}/browse`} style={button()}>{t(loc, dict, 'cta')}</Link>
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
  displayName: 'Buyer apology (transfer missed)',
  previewData: {
    locale: 'en',
    buyerName: 'Alex',
    refundAmount: '€124.50',
    purchaseId: 'abc-123',
    trip: {
      origin: 'London (LGW)', destination: 'Rome (FCO)',
      departureDate: '12 Jun 2026', departureTime: '07:45',
      returnDate: '19 Jun 2026', returnTime: '21:10',
      airline: 'Ryanair', flightNumber: 'FR2345', passengers: 1,
    },
  },
} satisfies TemplateEntry
