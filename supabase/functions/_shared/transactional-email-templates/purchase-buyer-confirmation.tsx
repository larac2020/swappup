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
  bookingName?: string
}

const Email = ({ buyerName, sellerName, totalPrice, trip, purchaseId, bookingRef, bookingName }: Props) => {
  const seller = sellerName || 'the seller'
  const tripWithExtras: TripDetails | undefined = trip
    ? { ...trip, bookingRef: bookingRef || trip.bookingRef, bookingName: bookingName || trip.bookingName, escrowAmount: totalPrice }
    : undefined
  return (
    <EmailLayout preview="You're booked! Here's everything about your trip">
      <Text style={p}>{buyerName ? `Hi ${buyerName},` : 'Hi there,'}</Text>
      <Text style={p}>
        Thank you so much for buying with swappup — we couldn't be happier to have you on board.
        Your seat is officially on its way ✈️
      </Text>
      <Text style={p}>
        Your payment is safe with us and will only be sent to {seller} once your name is on the
        booking. You're in great hands — we'll be with you every step of the way.
      </Text>
      <TripCard trip={tripWithExtras} title="Your purchase details" />
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>What happens next</Heading>
      <Text style={p} as="div">
        <ol style={{ paddingLeft: '20px', margin: 0, color: brand.body, fontSize: '14px', lineHeight: '22px' }}>
          <li style={{ marginBottom: '6px' }}>
            <strong>{seller} has 24 hours</strong> to add your name to the airline booking.
          </li>
          <li style={{ marginBottom: '6px' }}>
            We'll email you to double-check the updated booking matches your details.
          </li>
          <li style={{ marginBottom: '6px' }}>
            Once you confirm, we release the payment to {seller} — and the seat is all yours.
          </li>
          <li>
            If {seller} doesn't update the booking in time, you get a <strong>full automatic
            refund</strong> — no forms, no waiting.
          </li>
        </ol>
      </Text>
      <Section style={{ margin: '22px 0 6px' }}>
        <Link href={`${APP_URL}/account?tab=purchases`} style={button()}>View my purchase</Link>
      </Section>
      <Text style={small}>
        Opens swappup.com — works on mobile and desktop.
      </Text>
      <Text style={small}>
        Reference: {purchaseId || '—'}
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
    bookingName: 'Alex Johnson',
    purchaseId: 'abc-123',
  },
} satisfies TemplateEntry