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
}

export const EmailLayout = ({ preview, children, accent = 'gold' }: LayoutProps) => {
  const accentColor =
    accent === 'danger' ? brand.danger : accent === 'success' ? brand.success : brand.gold
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: brand.bg, fontFamily: "'Helvetica Neue', Arial, sans-serif", margin: 0, padding: 0 }}>
        {/* Top gold accent stripe — mirrors the PDF header */}
        <div style={{ height: '4px', backgroundColor: accentColor, width: '100%' }} />
        <Container style={{ maxWidth: '560px', margin: '0 auto', padding: '0 0 32px' }}>
          {/* Hero: charcoal block with left gold ribbon and lowercase wordmark */}
          <Section style={{ backgroundColor: brand.charcoal, padding: '22px 28px 22px 24px', borderLeft: `4px solid ${accentColor}` }}>
            <Text style={{ margin: 0, color: brand.bg, fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px', lineHeight: '28px' }}>
              swappup
            </Text>
            <Text style={{ margin: '4px 0 0', color: brand.gold, fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Peer-to-peer flight marketplace
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

          {/* Disclaimer — mirrors PDF footer wording */}
          <Section style={{ padding: '18px 28px 0' }}>
            <Hr style={{ borderColor: brand.gold, borderWidth: '0.5px', margin: '0 0 10px' }} />
            <Text style={{ margin: 0, color: brand.muted, fontSize: '11px', lineHeight: '16px' }}>
              swappup is a peer-to-peer marketplace. This email confirms activity on your swappup account; it is not a boarding pass and does not grant boarding rights. Your airline ticket is provided by the seller via a name change on the original booking. For terms and consumer rights, visit{' '}
              <Link href={TERMS_URL} style={{ color: brand.muted, textDecoration: 'underline' }}>swappup.com/terms</Link>.
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