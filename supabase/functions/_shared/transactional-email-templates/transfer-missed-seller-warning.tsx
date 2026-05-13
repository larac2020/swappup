/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripCard, TripDetails, h1, p, small, button, APP_URL } from './_layout.tsx'
import { Locale, normalizeLocale, t } from './i18n.ts'

interface Props {
  sellerName?: string
  trip?: TripDetails
  purchaseId?: string
  orderNumber?: string
  locale?: Locale
}

const dict = {
  en: {
    preview: 'Your sale was cancelled, here is what happened',
    hi: 'Hi {name},', hiThere: 'Hi there,',
    intro1: 'We are sorry to share that your recent sale was cancelled because the booking was not updated with the buyer\'s name within the ',
    intro1Bold: '24 hour window',
    intro2: '. The buyer has been refunded in full and your listing has been put back online where possible.',
    tripTitle: 'Cancelled booking',
    nextTime: 'For next time',
    nextTimeBody: 'As soon as a sale comes in, you have 24 hours to update the booking with the airline and upload the new confirmation. The earlier you start, the smoother the sale, and the faster you receive your money.',
    cta: 'View sale in app',
    note: 'Repeated missed deadlines may impact your seller reputation and your ability to list. If something prevented you from completing in time, please get in touch with us so we can help.',
    sign: 'Have a great day,', team: 'The swappup team',
    subjectWithOrder: 'Your sale was cancelled, deadline missed (Order {order})',
    subject: 'Your sale was cancelled, deadline missed',
  },
  it: {
    preview: 'La tua vendita è stata annullata, ecco cos\'è successo',
    hi: 'Ciao {name},', hiThere: 'Ciao,',
    intro1: 'Ci dispiace comunicarti che la tua vendita è stata annullata perché la prenotazione non è stata aggiornata con il nome dell\'acquirente entro le ',
    intro1Bold: '24 ore previste',
    intro2: '. L\'acquirente è stato rimborsato per intero e il tuo annuncio è stato ripubblicato quando possibile.',
    tripTitle: 'Prenotazione annullata',
    nextTime: 'Per la prossima volta',
    nextTimeBody: 'Appena ricevi una vendita, hai 24 ore per aggiornare la prenotazione con la compagnia aerea e caricare la nuova conferma. Prima inizi, più la vendita fila liscia e più velocemente ricevi i tuoi soldi.',
    cta: 'Vedi vendita in app',
    note: 'Scadenze mancate ripetutamente possono influire sulla tua reputazione e sulla possibilità di pubblicare annunci. Se qualcosa ti ha impedito di completare in tempo, scrivici e cercheremo di aiutarti.',
    sign: 'Buona giornata,', team: 'Il team swappup',
    subjectWithOrder: 'Vendita annullata, scadenza non rispettata (Ordine {order})',
    subject: 'Vendita annullata, scadenza non rispettata',
  },
} as const

const Email = ({ sellerName, trip, purchaseId, orderNumber, locale }: Props) => {
  const loc = normalizeLocale(locale)
  const order = orderNumber || (purchaseId ? `SW-${purchaseId.slice(0, 8).toUpperCase()}` : undefined)
  const tripWithExtras: TripDetails | undefined = trip ? { ...trip, orderNumber: order } : undefined
  return (
    <EmailLayout preview={t(loc, dict, 'preview')} accent="danger" transactional locale={loc}>
      <Text style={p}>{sellerName ? t(loc, dict, 'hi', { name: sellerName }) : t(loc, dict, 'hiThere')}</Text>
      <Text style={p}>
        {t(loc, dict, 'intro1')}<strong>{t(loc, dict, 'intro1Bold')}</strong>{t(loc, dict, 'intro2')}
      </Text>
      <TripCard trip={tripWithExtras} title={t(loc, dict, 'tripTitle')} locale={loc} />
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>{t(loc, dict, 'nextTime')}</Heading>
      <Text style={p}>{t(loc, dict, 'nextTimeBody')}</Text>
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
  displayName: 'Seller warning (transfer missed)',
  previewData: {
    locale: 'en',
    sellerName: 'Maria',
    purchaseId: 'abc-123',
    trip: {
      origin: 'London (LGW)', destination: 'Rome (FCO)',
      departureDate: '12 Jun 2026', departureTime: '07:45',
      returnDate: '19 Jun 2026', returnTime: '21:10',
      airline: 'Ryanair', flightNumber: 'FR2345', passengers: 1,
    },
  },
} satisfies TemplateEntry
