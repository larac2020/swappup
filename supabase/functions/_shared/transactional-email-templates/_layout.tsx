/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import { Locale, normalizeLocale, t } from './i18n.ts'

export const SITE_NAME = 'swappup'
export const SUPPORT_EMAIL = 'support@swappup.com'
export const APP_URL = 'https://swappup.com'
export const HELP_URL = 'https://swappup.com/help'
export const TERMS_URL = 'https://swappup.com/terms'
export const PREFERENCES_URL = 'https://swappup.com/account?tab=notifications'

// Brand tokens — Swappup dark + gold
export const brand = {
  gold: '#F4A929',
  goldDeep: '#D98A0F',
  goldTint: '#FEF3DC',
  charcoal: '#0F1116',
  ink: '#1A1D24',
  body: '#3a3f4b',
  muted: '#6b7280',
  border: '#e5e7eb',
  bg: '#ffffff',
  surface: '#F8F8F6',
  danger: '#b1311f',
  success: '#0f7a3e',
}

const layoutDict = {
  en: {
    needHelp: 'Need help?',
    emailUs: 'Email',
    helpCentre: 'Help centre',
    replyWindow: 'We reply within 24h on business days.',
    managePrefs: 'Manage email preferences',
    unsubscribe: 'Unsubscribe',
    disclaimer: 'This email confirms activity on your swappup account. It is not a boarding pass and does not grant boarding rights — your seat is added to the airline booking by the seller through a name change. See our',
    terms: 'terms',
  },
  it: {
    needHelp: 'Hai bisogno di aiuto?',
    emailUs: 'Scrivici a',
    helpCentre: 'Centro assistenza',
    replyWindow: 'Rispondiamo entro 24h nei giorni lavorativi.',
    managePrefs: 'Gestisci preferenze email',
    unsubscribe: 'Disiscriviti',
    disclaimer: "Questa email conferma un'attività sul tuo account swappup. Non è una carta d'imbarco e non dà diritto all'imbarco — il tuo posto viene aggiunto alla prenotazione della compagnia aerea dal venditore tramite il cambio nome. Consulta i nostri",
    terms: 'termini',
  },
} as const

interface LayoutProps {
  preview: string
  children: React.ReactNode
  accent?: 'gold' | 'danger' | 'success'
  transactional?: boolean
  locale?: Locale
}

export const EmailLayout = ({ preview, children, transactional = false, locale }: LayoutProps) => {
  const loc = normalizeLocale(locale)
  return (
    <Html lang={loc} dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: brand.bg, fontFamily: "'Helvetica Neue', Arial, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 0 32px' }}>
          <Section style={{ padding: '32px 28px 8px' }}>
            <Text style={{ margin: 0, color: brand.gold, fontSize: '28px', fontWeight: 700, letterSpacing: '-0.6px', lineHeight: '32px' }}>
              swappup
            </Text>
          </Section>
          <Section style={{ padding: '28px' }}>{children}</Section>

          <Section style={{ margin: '0 28px', padding: '14px 16px', backgroundColor: brand.surface, border: `1px solid ${brand.border}`, borderRadius: '10px' }}>
            <Text style={{ margin: 0, color: brand.goldDeep, fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', borderBottom: `1px solid ${brand.gold}`, paddingBottom: '4px', display: 'inline-block' }}>
              {t(loc, layoutDict, 'needHelp')}
            </Text>
            <Text style={{ margin: '10px 0 0', color: brand.ink, fontSize: '13px', lineHeight: '20px' }}>
              {t(loc, layoutDict, 'emailUs')} <Link href={`mailto:${SUPPORT_EMAIL}`} style={{ color: brand.goldDeep, textDecoration: 'none', fontWeight: 600 }}>{SUPPORT_EMAIL}</Link>
              {' '}· <Link href={HELP_URL} style={{ color: brand.goldDeep, textDecoration: 'none', fontWeight: 600 }}>{t(loc, layoutDict, 'helpCentre')}</Link>
            </Text>
            <Text style={{ margin: '4px 0 0', color: brand.muted, fontSize: '11px', lineHeight: '16px' }}>
              {t(loc, layoutDict, 'replyWindow')}
            </Text>
          </Section>

          <Section style={{ padding: '18px 28px 0' }}>
            <Hr style={{ borderColor: brand.border, borderWidth: '0.5px', margin: '0 0 12px' }} />
            {!transactional && (
              <Text style={{ margin: '0 0 8px', color: brand.muted, fontSize: '12px', lineHeight: '18px' }}>
                <Link href={PREFERENCES_URL} style={{ color: brand.goldDeep, textDecoration: 'none', fontWeight: 600 }}>{t(loc, layoutDict, 'managePrefs')}</Link>
                {' · '}
                <Link href={`${APP_URL}/unsubscribe`} style={{ color: brand.muted, textDecoration: 'underline' }}>{t(loc, layoutDict, 'unsubscribe')}</Link>
              </Text>
            )}
            <Text style={{ margin: 0, color: brand.muted, fontSize: '11px', lineHeight: '16px' }}>
              {t(loc, layoutDict, 'disclaimer')}{' '}
              <Link href={TERMS_URL} style={{ color: brand.muted, textDecoration: 'underline' }}>{t(loc, layoutDict, 'terms')}</Link>.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const button = (color = brand.gold, fg = brand.charcoal) => ({
  display: 'inline-block',
  backgroundColor: color,
  color: fg,
  padding: '12px 22px',
  borderRadius: '10px',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: '14px',
})

export const h1 = { fontSize: '22px', fontWeight: 700, color: brand.charcoal, margin: '0 0 14px' }
export const p = { fontSize: '14px', color: brand.body, lineHeight: '22px', margin: '0 0 14px' }
export const small = { fontSize: '12px', color: brand.muted, lineHeight: '18px', margin: '8px 0 0' }
export const card = {
  backgroundColor: brand.surface,
  border: `1px solid ${brand.border}`,
  borderRadius: '12px',
  padding: '14px 16px',
  margin: '12px 0 18px',
}
export const row = { fontSize: '13px', color: brand.body, margin: '4px 0' }
export const label = { color: brand.muted, fontWeight: 500 as const }

export interface TripDetails {
  origin?: string
  destination?: string
  departureDate?: string
  departureTime?: string
  returnDate?: string
  returnTime?: string
  returnFlightNumber?: string
  airline?: string
  flightNumber?: string
  bookingRef?: string
  bookingName?: string
  escrowAmount?: string
  passengers?: number
  orderNumber?: string
  escrowAmountLabel?: string
}

const tripDict = {
  en: {
    defaultTitle: 'Your purchase details',
    orderNumber: 'Order number',
    route: 'Route',
    outbound: 'Outbound',
    departure: 'Departure',
    return: 'Return',
    airline: 'Airline',
    passengers: 'Passengers',
    bookingRef: 'Booking reference',
    bookingName: 'New name on the booking',
    amountPaid: 'Amount paid (held safely until your booking is updated)',
    at: 'at',
  },
  it: {
    defaultTitle: 'Dettagli del tuo acquisto',
    orderNumber: 'Numero ordine',
    route: 'Tratta',
    outbound: 'Andata',
    departure: 'Partenza',
    return: 'Ritorno',
    airline: 'Compagnia',
    passengers: 'Passeggeri',
    bookingRef: 'Codice prenotazione',
    bookingName: 'Nuovo nome sulla prenotazione',
    amountPaid: 'Importo pagato (custodito al sicuro fino al cambio nome)',
    at: 'alle',
  },
} as const

export const TripCard = ({
  trip,
  title,
  locale,
}: {
  trip?: TripDetails
  title?: string
  locale?: Locale
}) => {
  if (!trip) return null
  const loc = normalizeLocale(locale)
  const fmtLeg = (date?: string, time?: string) => {
    if (!date && !time) return ''
    if (date && time) return `${date} ${t(loc, tripDict, 'at')} ${time}`
    return date || time || ''
  }
  const isRoundTrip = !!(trip.returnDate || trip.returnTime)
  const resolvedTitle = title || t(loc, tripDict, 'defaultTitle')
  return (
    <Section style={card}>
      <Text style={{ margin: '0 0 10px', color: brand.goldDeep, fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
        {resolvedTitle}
      </Text>
      {trip.orderNumber && (
        <Text style={row}><span style={label}>{t(loc, tripDict, 'orderNumber')}: </span>{trip.orderNumber}</Text>
      )}
      {trip.origin && trip.destination && (
        <Text style={row}><span style={label}>{t(loc, tripDict, 'route')}: </span>{trip.origin} {isRoundTrip ? '⇄' : '→'} {trip.destination}</Text>
      )}
      {(trip.departureDate || trip.departureTime) && (
        <Text style={row}><span style={label}>{isRoundTrip ? `${t(loc, tripDict, 'outbound')}: ` : `${t(loc, tripDict, 'departure')}: `}</span>{fmtLeg(trip.departureDate, trip.departureTime)}</Text>
      )}
      {isRoundTrip && (
        <Text style={row}><span style={label}>{t(loc, tripDict, 'return')}: </span>{fmtLeg(trip.returnDate, trip.returnTime)}{trip.returnFlightNumber ? ` · ${trip.returnFlightNumber}` : ''}</Text>
      )}
      {trip.airline && <Text style={row}><span style={label}>{t(loc, tripDict, 'airline')}: </span>{trip.airline}{trip.flightNumber ? ` · ${trip.flightNumber}` : ''}</Text>}
      {trip.passengers && trip.passengers > 1 && (
        <Text style={row}><span style={label}>{t(loc, tripDict, 'passengers')}: </span>{trip.passengers}</Text>
      )}
      {trip.bookingRef && <Text style={row}><span style={label}>{t(loc, tripDict, 'bookingRef')}: </span>{trip.bookingRef}</Text>}
      {trip.bookingName && (
        <Text style={row}><span style={label}>{t(loc, tripDict, 'bookingName')}: </span>{trip.bookingName}</Text>
      )}
      {trip.escrowAmount && <Text style={{ ...row, marginTop: '10px', paddingTop: '10px', borderTop: `1px dashed ${brand.border}`, fontWeight: 600, color: brand.charcoal }}><span style={label}>{trip.escrowAmountLabel || t(loc, tripDict, 'amountPaid')}: </span>{trip.escrowAmount}</Text>}
    </Section>
  )
}
