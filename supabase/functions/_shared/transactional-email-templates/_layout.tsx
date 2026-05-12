/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr, Link,
} from 'npm:@react-email/components@0.0.22'

export const SITE_NAME = 'swappup'
export const SUPPORT_EMAIL = 'support@swappup.com'
export const APP_URL = 'https://swappup.com'
export const HELP_URL = 'https://swappup.com/help'
export const TERMS_URL = 'https://swappup.com/terms'
export const PREFERENCES_URL = 'https://swappup.com/account?tab=notifications'

// Brand tokens — Flyswap/Swappup dark + gold
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

interface LayoutProps {
  preview: string
  children: React.ReactNode
  accent?: 'gold' | 'danger' | 'success'
  transactional?: boolean
}

export const EmailLayout = ({ preview, children, accent = 'gold', transactional = false }: LayoutProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: brand.bg, fontFamily: "'Helvetica Neue', Arial, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 0 32px' }}>
          {/* Wordmark — clean, no rules or stripes */}
          <Section style={{ padding: '32px 28px 8px' }}>
            <Text style={{ margin: 0, color: brand.gold, fontSize: '28px', fontWeight: 700, letterSpacing: '-0.6px', lineHeight: '32px' }}>
              swappup
            </Text>
          </Section>
          <Section style={{ padding: '28px' }}>{children}</Section>

          {/* Support card — mirrors the PDF "Need help?" panel */}
          <Section style={{ margin: '0 28px', padding: '14px 16px', backgroundColor: brand.surface, border: `1px solid ${brand.border}`, borderRadius: '10px' }}>
            <Text style={{ margin: 0, color: brand.goldDeep, fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', borderBottom: `1px solid ${brand.gold}`, paddingBottom: '4px', display: 'inline-block' }}>
              Need help?
            </Text>
            <Text style={{ margin: '10px 0 0', color: brand.ink, fontSize: '13px', lineHeight: '20px' }}>
              Email <Link href={`mailto:${SUPPORT_EMAIL}`} style={{ color: brand.goldDeep, textDecoration: 'none', fontWeight: 600 }}>{SUPPORT_EMAIL}</Link>
              {' '}· <Link href={HELP_URL} style={{ color: brand.goldDeep, textDecoration: 'none', fontWeight: 600 }}>Help centre</Link>
            </Text>
            <Text style={{ margin: '4px 0 0', color: brand.muted, fontSize: '11px', lineHeight: '16px' }}>
              We reply within 24h on business days.
            </Text>
          </Section>

          {/* Preferences + disclaimer */}
          <Section style={{ padding: '18px 28px 0' }}>
            <Hr style={{ borderColor: brand.border, borderWidth: '0.5px', margin: '0 0 12px' }} />
            {!transactional && (
              <Text style={{ margin: '0 0 8px', color: brand.muted, fontSize: '12px', lineHeight: '18px' }}>
                <Link href={PREFERENCES_URL} style={{ color: brand.goldDeep, textDecoration: 'none', fontWeight: 600 }}>Manage email preferences</Link>
                {' · '}
                <Link href={`${APP_URL}/unsubscribe`} style={{ color: brand.muted, textDecoration: 'underline' }}>Unsubscribe</Link>
              </Text>
            )}
            <Text style={{ margin: 0, color: brand.muted, fontSize: '11px', lineHeight: '16px' }}>
              This email confirms activity on your swappup account. It is not a boarding pass and does not grant boarding rights — your seat is added to the airline booking by the seller through a name change. See our{' '}
              <Link href={TERMS_URL} style={{ color: brand.muted, textDecoration: 'underline' }}>terms</Link>.
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
}

export const TripCard = ({ trip, title = 'Your purchase details' }: { trip?: TripDetails; title?: string }) => {
  if (!trip) return null
  const fmtLeg = (date?: string, time?: string) => {
    if (!date && !time) return ''
    if (date && time) return `${date} at ${time}`
    return date || time || ''
  }
  const isRoundTrip = !!(trip.returnDate || trip.returnTime)
  return (
    <Section style={card}>
      <Text style={{ margin: '0 0 10px', color: brand.goldDeep, fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
        {title}
      </Text>
      {trip.orderNumber && (
        <Text style={row}><span style={label}>Order number: </span>{trip.orderNumber}</Text>
      )}
      {trip.origin && trip.destination && (
        <Text style={row}><span style={label}>Route: </span>{trip.origin} {isRoundTrip ? '⇄' : '→'} {trip.destination}</Text>
      )}
      {(trip.departureDate || trip.departureTime) && (
        <Text style={row}><span style={label}>{isRoundTrip ? 'Outbound: ' : 'Departure: '}</span>{fmtLeg(trip.departureDate, trip.departureTime)}</Text>
      )}
      {isRoundTrip && (
        <Text style={row}><span style={label}>Return: </span>{fmtLeg(trip.returnDate, trip.returnTime)}</Text>
      )}
      {trip.airline && <Text style={row}><span style={label}>Airline: </span>{trip.airline}{trip.flightNumber ? ` · ${trip.flightNumber}` : ''}</Text>}
      {trip.passengers && trip.passengers > 1 && (
        <Text style={row}><span style={label}>Passengers: </span>{trip.passengers}</Text>
      )}
      {trip.bookingRef && <Text style={row}><span style={label}>Booking reference: </span>{trip.bookingRef}</Text>}
      {trip.bookingName && (
        <Text style={row}>
          <span style={label}>{trip.passengers && trip.passengers > 1 ? 'New name(s) on the booking: ' : 'New name on the booking: '}</span>{trip.bookingName}
        </Text>
      )}
      {trip.escrowAmount && <Text style={{ ...row, marginTop: '10px', paddingTop: '10px', borderTop: `1px dashed ${brand.border}`, fontWeight: 600, color: brand.charcoal }}><span style={label}>Amount paid (held safely until transfer): </span>{trip.escrowAmount}</Text>}
    </Section>
  )
}