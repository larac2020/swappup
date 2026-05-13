/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripCard, TripDetails, h1, p, small, button, APP_URL, SUPPORT_EMAIL } from './_layout.tsx'
import { Locale, normalizeLocale, t } from './i18n.ts'

interface Props {
  sellerName?: string
  buyerName?: string
  trip?: TripDetails
  nameChangeFee?: string
  purchaseId?: string
  orderNumber?: string
  locale?: Locale
}

const dict = {
  en: {
    preview: 'The buyer did not confirm in time — important update on your sale',
    hi: 'Hi {name},', hiThere: 'Hi there,',
    intro1: 'Unfortunately {buyer} did not confirm receipt of the ticket within the ',
    intro1Bold: '48 hour verification window',
    intro2: '. As required by our buyer-protection policy, the sale has been cancelled and the buyer has been refunded in full.',
    tripTitle: 'Your sale details',
    feeLabel: 'Name-change fee you paid the airline',
    aboutFee: 'About the name-change fee you paid',
    aboutFeeBody1: 'When you listed this ticket you acknowledged that the fee paid to the airline to change the name on the booking is ',
    aboutFeeBold: 'not refundable by swappup',
    aboutFeeBody2: ' in the event the buyer fails to confirm. Airlines do not offer a free reversal window — the booking is now under the buyer\'s name on the airline side.',
    canTry: 'What you can try',
    s1Bold: 'Contact the airline', s1: ' and ask for a goodwill name reversal back to your name. Outcomes vary by carrier and fare type, but it is sometimes granted.',
    s2Bold: 'Reach out to the buyer', s2: ' through the swappup app — they may agree to release the booking back to you, especially if the cancellation was a simple oversight.',
    s3: 'If neither works, the seat remains under the buyer\'s name on the airline booking and is outside swappup\'s ability to recover.',
    cta: 'View sale in app',
    note1: 'We know this is frustrating. If you believe the buyer acted in bad faith, reply to this email or write to ',
    note2: ' and we will review the case. Buyers who repeatedly fail to confirm are reviewed and may be suspended from swappup.',
    sign: 'Thank you for your patience,', team: 'The swappup team',
    buyer: 'the buyer',
    subjectWithOrder: "Your sale was cancelled — buyer didn't confirm (Order {order})",
    subject: "Your sale was cancelled — buyer didn't confirm",
  },
  it: {
    preview: 'L\'acquirente non ha confermato in tempo — aggiornamento importante sulla vendita',
    hi: 'Ciao {name},', hiThere: 'Ciao,',
    intro1: 'Purtroppo {buyer} non ha confermato la ricezione del biglietto entro le ',
    intro1Bold: '48 ore previste per la verifica',
    intro2: '. Come previsto dalla nostra politica di tutela dell\'acquirente, la vendita è stata annullata e l\'acquirente è stato rimborsato per intero.',
    tripTitle: 'Dettagli della vendita',
    feeLabel: 'Commissione cambio nome pagata alla compagnia',
    aboutFee: 'Sulla commissione di cambio nome che hai pagato',
    aboutFeeBody1: 'Quando hai pubblicato questo biglietto hai accettato che la commissione pagata alla compagnia aerea per il cambio nome ',
    aboutFeeBold: 'non è rimborsabile da swappup',
    aboutFeeBody2: ' nel caso in cui l\'acquirente non confermi. Le compagnie aeree non prevedono una finestra di annullamento gratuita — la prenotazione è ora intestata all\'acquirente lato compagnia.',
    canTry: 'Cosa puoi provare a fare',
    s1Bold: 'Contatta la compagnia aerea', s1: ' e chiedi una riassegnazione gratuita del nome. I risultati variano in base al vettore e alla tariffa, ma a volte viene concessa.',
    s2Bold: 'Contatta l\'acquirente', s2: ' tramite l\'app swappup — potrebbe accettare di rilasciarti la prenotazione, specie se la mancata conferma è stata una semplice dimenticanza.',
    s3: 'Se nessuna delle due funziona, il posto rimane intestato all\'acquirente sulla prenotazione della compagnia ed è fuori dalla portata di swappup.',
    cta: 'Vedi vendita in app',
    note1: 'Sappiamo che è frustrante. Se ritieni che l\'acquirente abbia agito in malafede, rispondi a questa email o scrivi a ',
    note2: ' e valuteremo il caso. Gli acquirenti che non confermano ripetutamente vengono revisionati e possono essere sospesi da swappup.',
    sign: 'Grazie per la pazienza,', team: 'Il team swappup',
    buyer: 'l\'acquirente',
    subjectWithOrder: 'Vendita annullata — l\'acquirente non ha confermato (Ordine {order})',
    subject: 'Vendita annullata — l\'acquirente non ha confermato',
  },
} as const

const Email = ({ sellerName, buyerName, trip, nameChangeFee, purchaseId, orderNumber, locale }: Props) => {
  const loc = normalizeLocale(locale)
  const buyer = buyerName || t(loc, dict, 'buyer')
  const order = orderNumber || (purchaseId ? `SW-${purchaseId.slice(0, 8).toUpperCase()}` : undefined)
  const tripWithExtras: TripDetails | undefined = trip
    ? { ...trip, orderNumber: order, escrowAmount: nameChangeFee || trip.escrowAmount, escrowAmountLabel: t(loc, dict, 'feeLabel') }
    : undefined
  return (
    <EmailLayout preview={t(loc, dict, 'preview')} accent="danger" transactional locale={loc}>
      <Text style={p}>{sellerName ? t(loc, dict, 'hi', { name: sellerName }) : t(loc, dict, 'hiThere')}</Text>
      <Text style={p}>
        {t(loc, dict, 'intro1', { buyer })}<strong>{t(loc, dict, 'intro1Bold')}</strong>{t(loc, dict, 'intro2')}
      </Text>
      <TripCard trip={tripWithExtras} title={t(loc, dict, 'tripTitle')} locale={loc} />
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>{t(loc, dict, 'aboutFee')}</Heading>
      <Text style={p}>
        {t(loc, dict, 'aboutFeeBody1')}<strong>{t(loc, dict, 'aboutFeeBold')}</strong>{t(loc, dict, 'aboutFeeBody2')}
      </Text>
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>{t(loc, dict, 'canTry')}</Heading>
      <Text style={p} as="div">
        <ol style={{ paddingLeft: '20px', margin: 0, fontSize: '14px', lineHeight: '22px' }}>
          <li style={{ marginBottom: '8px' }}>
            <strong>{t(loc, dict, 's1Bold')}</strong>{t(loc, dict, 's1')}
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>{t(loc, dict, 's2Bold')}</strong>{t(loc, dict, 's2')}
          </li>
          <li>
            {t(loc, dict, 's3')}
          </li>
        </ol>
      </Text>
      <Section style={{ margin: '20px 0 8px' }}>
        <Link href={`${APP_URL}/account?tab=sales`} style={button()}>{t(loc, dict, 'cta')}</Link>
      </Section>
      <Text style={small}>
        {t(loc, dict, 'note1')}<Link href={`mailto:${SUPPORT_EMAIL}`} style={{ color: 'inherit' }}>{SUPPORT_EMAIL}</Link>{t(loc, dict, 'note2')}
      </Text>
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
  displayName: 'Seller — buyer did not confirm in 48h',
  previewData: {
    locale: 'en',
    sellerName: 'Maria',
    buyerName: 'Alex',
    nameChangeFee: '€45.00',
    purchaseId: 'abc-123',
    trip: {
      origin: 'London (LGW)', destination: 'Rome (FCO)',
      departureDate: '12 Jun 2026', departureTime: '07:45',
      returnDate: '19 Jun 2026', returnTime: '21:10',
      airline: 'Ryanair', flightNumber: 'FR2345', passengers: 1,
    },
  },
} satisfies TemplateEntry
