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
  bookingRef?: string
  airlineLogin?: string
}

const Email = ({ buyerName, sellerName, totalPrice, trip, purchaseId, bookingRef, airlineLogin }: Props) => {
  const seller = sellerName || 'the seller'
  const tripWithExtras: TripDetails | undefined = trip
    ? { ...trip, bookingRef: bookingRef || trip.bookingRef, airlineLogin: airlineLogin || trip.airlineLogin, escrowAmount: totalPrice }
    : undefined
  return (
    <EmailLayout preview="Your purchase is confirmed — here's what happens next">
      <Text style={p}>{buyerName ? `Hi ${buyerName},` : 'Hi there,'}</Text>
      <Text style={p}>
        Thanks so much for buying with swappup — your seat is on its way. Your payment is safely
        tucked into escrow while {seller} updates the booking with your name. We'll be right beside
        you the whole way.
      </Text>
      <TripCard trip={tripWithExtras} />
      <Text style={p}>
        Here's how the next bit unfolds: {seller} has <strong>24 hours</strong> to update the
        booking with your name and share the new reference. As soon as that's done, we'll email
        you to take a quick look and confirm everything matches. Once you give the green light,
        we release {seller}'s payment — and your seat is officially yours.
      </Text>
      <Text style={p}>
        And if anything goes sideways, you're fully covered: no name change means an automatic
        refund, no questions asked.
      </Text>
      <Section style={{ margin: '20px 0 6px' }}>
        <Link href={`${APP_URL}/account?tab=purchases`} style={button()}>View purchase</Link>
      </Section>
      <Text style={small}>
        Opens swappup.com — works on mobile and desktop, in your browser or installed app.
      </Text>
      <Text style={small}>
        Reference: {purchaseId || '—'}.
      </Text>
    </EmailLayout>
  )
}

export const template = {
  component: Email,
  subject: 'Your Swappup purchase is confirmed',
  displayName: 'Buyer purchase confirmation',
  previewData: {
    buyerName: 'Alex',
    sellerName: 'Maria',
    totalPrice: '€124.50',
    trip: { origin: 'London (LGW)', destination: 'Rome (FCO)', departureDate: '12 Jun 2026', airline: 'Ryanair', flightNumber: 'FR2345' },
    bookingRef: 'XYZ123',
    airlineLogin: 'maria.r@example.com',
    purchaseId: 'abc-123',
  },
} satisfies TemplateEntry