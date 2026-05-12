/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripCard, TripDetails, h1, p, small, button, APP_URL } from './_layout.tsx'

interface Props {
  buyerName?: string
  trip?: TripDetails
  refundAmount?: string
}

const Email = ({ buyerName, trip, refundAmount }: Props) => (
  <EmailLayout preview="We're sorry — your purchase has been refunded" accent="danger">
    <Heading style={h1}>{buyerName ? `${buyerName}, we're sorry` : 'We\'re sorry'}</Heading>
    <Text style={p}>
      Unfortunately, the seller didn't complete the name change within the 24-hour window. To protect you,
      Swappup escrow has automatically <strong>refunded your purchase in full</strong>{refundAmount ? ` (${refundAmount})` : ''}.
      The refund typically appears in your account within 5–10 business days.
    </Text>
    <TripCard trip={trip} />
    <Text style={p}>
      Don't give up on the trip — there may be other sellers offering similar tickets. Tap below to browse
      alternatives on the same route.
    </Text>
    <Section style={{ margin: '20px 0' }}>
      <Link href={`${APP_URL}/browse`} style={button()}>Find another ticket</Link>
    </Section>
    <Text style={small}>Sellers who repeatedly miss deadlines are reviewed and may be removed from the platform.</Text>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: 'Sorry — your purchase has been refunded',
  displayName: 'Buyer apology (transfer missed)',
  previewData: {
    buyerName: 'Alex',
    refundAmount: '€124.50',
    trip: { origin: 'London (LGW)', destination: 'Rome (FCO)', departureDate: '12 Jun 2026', airline: 'Ryanair' },
  },
} satisfies TemplateEntry