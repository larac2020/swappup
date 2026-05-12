/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripCard, TripDetails, h1, p, small, button, brand, APP_URL } from './_layout.tsx'

interface Props {
  buyerName?: string
  sellerName?: string
  totalPrice?: string
  trip?: TripDetails
  purchaseId?: string
}

const Email = ({ buyerName, sellerName, totalPrice, trip, purchaseId }: Props) => (
  <EmailLayout preview="Your purchase is confirmed — what happens next">
    <Heading style={h1}>{buyerName ? `Hi ${buyerName},` : 'Hi there,'}</Heading>
    <Text style={p}>
      Thanks for buying with Swappup. Your payment has been authorised and is held safely in escrow
      until {sellerName || 'the seller'} completes the name change with the airline.
    </Text>
    <TripCard trip={trip} />
    {totalPrice && (
      <Text style={p}><strong>Amount held in escrow:</strong> {totalPrice}</Text>
    )}
    <Heading style={{ ...h1, fontSize: '16px', marginTop: '8px' }}>What happens next</Heading>
    <Text style={p}>
      1. The seller has <strong>24 hours</strong> to complete the name change and upload proof.<br/>
      2. You'll receive an email with the new booking reference to verify.<br/>
      3. Once you confirm, the payment is released to the seller.
    </Text>
    <Section style={{ margin: '20px 0' }}>
      <Link href={`${APP_URL}/account?tab=purchases`} style={button()}>View purchase</Link>
    </Section>
    <Text style={small}>
      Reference: {purchaseId || '—'}. If something goes wrong, you're protected by Swappup escrow — no name change, automatic refund.
    </Text>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: 'Your Swappup purchase is confirmed',
  displayName: 'Buyer purchase confirmation',
  previewData: {
    buyerName: 'Alex',
    sellerName: 'Maria',
    totalPrice: '€124.50',
    trip: { origin: 'London (LGW)', destination: 'Rome (FCO)', departureDate: '12 Jun 2026', airline: 'Ryanair', flightNumber: 'FR2345' },
    purchaseId: 'abc-123',
  },
} satisfies TemplateEntry