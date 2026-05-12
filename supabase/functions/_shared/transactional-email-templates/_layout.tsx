/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr, Link,
} from 'npm:@react-email/components@0.0.22'

export const SITE_NAME = 'Swappup'
export const SUPPORT_EMAIL = 'support@swappup.com'
export const APP_URL = 'https://swappup.com'

// Brand tokens — Flyswap/Swappup dark + gold
export const brand = {
  gold: '#F4A929',
  charcoal: '#0F1116',
  ink: '#1A1D24',
  body: '#3a3f4b',
  muted: '#6b7280',
  border: '#e5e7eb',
  bg: '#ffffff',
  surface: '#fafafa',
  danger: '#b1311f',
  success: '#0f7a3e',
}

interface LayoutProps {
  preview: string
  children: React.ReactNode
  accent?: 'gold' | 'danger' | 'success'
}

export const EmailLayout = ({ preview, children, accent = 'gold' }: LayoutProps) => {
  const accentColor =
    accent === 'danger' ? brand.danger : accent === 'success' ? brand.success : brand.gold
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: brand.bg, fontFamily: "'Helvetica Neue', Arial, sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 0 32px' }}>
          <Section style={{ backgroundColor: brand.charcoal, padding: '24px 28px', borderTop: `4px solid ${accentColor}` }}>
            <Text style={{ margin: 0, color: brand.gold, fontSize: '20px', fontWeight: 700, letterSpacing: '0.5px' }}>
              {SITE_NAME}
            </Text>
          </Section>
          <Section style={{ padding: '28px' }}>{children}</Section>
          <Hr style={{ borderColor: brand.border, margin: '0 28px' }} />
          <Section style={{ padding: '20px 28px 0' }}>
            <Text style={{ margin: 0, color: brand.muted, fontSize: '12px', lineHeight: '18px' }}>
              Need help? Contact <Link href={`mailto:${SUPPORT_EMAIL}`} style={{ color: brand.charcoal }}>{SUPPORT_EMAIL}</Link>
              {' '}— we usually reply within one business day.
            </Text>
            <Text style={{ margin: '8px 0 0', color: brand.muted, fontSize: '11px', lineHeight: '16px' }}>
              {SITE_NAME} is a peer-to-peer marketplace. We facilitate transactions between users but do not issue or operate flights.
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
  fontWeight: 600,
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
  airline?: string
  flightNumber?: string
}

export const TripCard = ({ trip }: { trip?: TripDetails }) => {
  if (!trip) return null
  return (
    <Section style={card}>
      {trip.origin && trip.destination && (
        <Text style={{ ...row, fontWeight: 600, fontSize: '15px', color: brand.charcoal }}>
          {trip.origin} → {trip.destination}
        </Text>
      )}
      {trip.departureDate && <Text style={row}><span style={label}>Departure: </span>{trip.departureDate}</Text>}
      {trip.airline && <Text style={row}><span style={label}>Airline: </span>{trip.airline}{trip.flightNumber ? ` · ${trip.flightNumber}` : ''}</Text>}
    </Section>
  )
}