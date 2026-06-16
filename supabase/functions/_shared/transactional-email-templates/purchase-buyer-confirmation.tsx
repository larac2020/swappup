/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripCard, TripDetails, h1, p, brand, PREFERENCES_URL, APP_URL } from './_layout.tsx'
import { Locale, normalizeLocale, t } from './i18n.ts'

interface Props {
  buyerName?: string
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
    safe: 'Your money is safely held by swappup and will only be released once your name is on the booking.',
    tripTitle: 'Your purchase',
    whatNext: 'What happens next',
    step1: 'The booking will be updated with your name within 24 hours.',
    step2: 'As soon as the change is confirmed, we will let you know by email.',
    pushTip: '💡 Turn on push notifications so you do not miss the moment.',
    updatePrefs: 'Update notification preferences',
    step3: 'On the airline website, check that the change was made correctly using the booking reference and the name you provided. Head back to the swappup app and confirm everything looks good — confirming early releases the payment sooner. Otherwise, the payment is released automatically 24 hours after your flight departs.',
    issueTitle: 'Found an issue with the booking?',
    issueBody: 'If something does not look right, or if the booking is not updated with your name within 24 hours, your purchase is automatically refunded in full. No forms, no waiting.',
    receiptTitle: 'Your receipt',
    receiptBody: 'You can download your payment receipt anytime from your purchases.',
    receiptCta: 'View receipt',
    sign: 'Have a great day,',
    team: 'The swappup team',
    subjectWithOrder: 'Your swappup purchase is confirmed (Order {order})',
    subject: 'Your swappup purchase is confirmed',
  },
  it: {
    preview: 'Il tuo acquisto swappup è confermato',
    hi: 'Ciao {name},',
    hiThere: 'Ciao,',
    thanks: 'Grazie mille per il tuo acquisto su swappup.',
    safe: 'Il pagamento è custodito in sicurezza da swappup e verrà rilasciato solo quando il tuo nome sarà sulla prenotazione.',
    tripTitle: 'Il tuo acquisto',
    whatNext: 'Cosa succede ora',
    step1: 'La prenotazione verrà aggiornata con il tuo nome entro 24 ore.',
    step2: 'Non appena il cambio sarà confermato, ti avviseremo via email.',
    pushTip: '💡 Attiva le notifiche push per non perdere il momento.',
    updatePrefs: 'Aggiorna le preferenze di notifica',
    step3: 'Sul sito della compagnia aerea, verifica che il cambio sia stato fatto correttamente usando il codice prenotazione e il nome che hai fornito. Torna sull\'app swappup e conferma che è tutto in ordine — confermare in anticipo rilascia il pagamento più rapidamente. In caso contrario, il pagamento viene rilasciato automaticamente 24 ore dopo la partenza del volo.',
    issueTitle: 'Hai riscontrato un problema con la prenotazione?',
    issueBody: 'Se qualcosa non torna, o se la prenotazione non viene aggiornata con il tuo nome entro 24 ore, il tuo acquisto viene rimborsato automaticamente per intero. Nessun modulo, nessuna attesa.',
    receiptTitle: 'La tua ricevuta',
    receiptBody: 'Puoi scaricare la ricevuta di pagamento quando vuoi dai tuoi acquisti.',
    receiptCta: 'Vai alla ricevuta',
    sign: 'Buona giornata,',
    team: 'Il team swappup',
    subjectWithOrder: 'Il tuo acquisto swappup è confermato (Ordine {order})',
    subject: 'Il tuo acquisto swappup è confermato',
  },
} as const

const Email = ({ buyerName, totalPrice, trip, purchaseId, orderNumber, bookingRef, bookingName, locale }: Props) => {
  const loc = normalizeLocale(locale)
  const order = orderNumber || (purchaseId ? `SW-${purchaseId.slice(0, 8).toUpperCase()}` : undefined)
  const tripWithExtras: TripDetails | undefined = trip
    ? { ...trip, bookingRef: bookingRef || trip.bookingRef, bookingName: bookingName || trip.bookingName, escrowAmount: totalPrice, orderNumber: order }
    : undefined
  return (
    <EmailLayout preview={t(loc, dict, 'preview')} transactional locale={loc}>
      <Text style={p}>{buyerName ? t(loc, dict, 'hi', { name: buyerName }) : t(loc, dict, 'hiThere')}</Text>
      <Text style={p}>{t(loc, dict, 'thanks')}</Text>
      <Text style={p}>{t(loc, dict, 'safe')}</Text>
      <TripCard trip={tripWithExtras} title={t(loc, dict, 'tripTitle')} locale={loc} />
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>{t(loc, dict, 'whatNext')}</Heading>
      <Text style={p} as="div">
        <ol style={{ paddingLeft: '20px', margin: 0, color: brand.body, fontSize: '14px', lineHeight: '22px' }}>
          <li style={{ marginBottom: '6px' }}>
            {t(loc, dict, 'step1')}
          </li>
          <li style={{ marginBottom: '10px' }}>
            {t(loc, dict, 'step2')}
            <Section style={{ marginTop: '8px', padding: '10px 12px', backgroundColor: brand.goldTint, border: `1px solid ${brand.gold}`, borderRadius: '8px' }}>
              <Text style={{ margin: 0, color: brand.ink, fontSize: '13px', lineHeight: '20px' }}>
                {t(loc, dict, 'pushTip')}{' '}
                <Link href={PREFERENCES_URL} style={{ color: brand.goldDeep, textDecoration: 'underline', fontWeight: 600 }}>{t(loc, dict, 'updatePrefs')}</Link>.
              </Text>
            </Section>
          </li>
          <li style={{ marginBottom: '6px' }}>{t(loc, dict, 'step3')}</li>
        </ol>
      </Text>
      <Heading style={{ ...h1, fontSize: '16px', margin: '24px 0 8px' }}>{t(loc, dict, 'issueTitle')}</Heading>
      <Text style={p}>{t(loc, dict, 'issueBody')}</Text>
      <Heading style={{ ...h1, fontSize: '16px', margin: '24px 0 8px' }}>{t(loc, dict, 'receiptTitle')}</Heading>
      <Text style={p}>
        {t(loc, dict, 'receiptBody')}{' '}
        <Link href={`${APP_URL}/account/purchases`} style={{ color: brand.goldDeep, textDecoration: 'underline', fontWeight: 600 }}>{t(loc, dict, 'receiptCta')}</Link>.
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
  displayName: 'Buyer purchase confirmation',
  previewData: {
    locale: 'en',
    buyerName: 'Alex',
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
