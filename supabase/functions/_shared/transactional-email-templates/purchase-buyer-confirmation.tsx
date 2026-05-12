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
    <EmailLayout preview="Your swappup purchase is confirmed" transactional>
      <Text style={p}>{buyerName ? `Hi ${buyerName},` : 'Hi there,'}</Text>
      <Text style={p}>
        Thank you so much for your purchase with swappup — we're thrilled you chose us.
      </Text>
      <Text style={p}>
        Your payment is safe with us and will only be sent to your ticket seller, {seller}, once
        your name is on the booking.
      </Text>
      <TripCard trip={tripWithExtras} title="Your purchase details" />
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>What happens next</Heading>
      <Text style={p} as="div">
        <ol style={{ paddingLeft: '20px', margin: 0, color: brand.body, fontSize: '14px', lineHeight: '22px' }}>
          <li style={{ marginBottom: '6px' }}>
            <strong>{seller} has 24 hours</strong> to add your name to the airline booking.
          </li>
          <li style={{ marginBottom: '6px' }}>
            As soon as {seller} confirms the change in the app, you'll get an email <strong>and a
            push notification</strong> from us. Make sure push notifications are turned on so you
            don't miss it.
          </li>
          <li style={{ marginBottom: '6px' }}>
            Within <strong>48 hours</strong>, log in to the airline using the booking reference and
            your name and surname to check everything is correct, then confirm in the app. We'll
            release the payment to {seller} and the seat is all yours.
          </li>
        </ol>
      </Text>
      <Section style={{ margin: '22px 0 6px' }}>
        <Link href={`${APP_URL}/account?tab=purchases`} style={button()}>View my purchase</Link>
      </Section>
      <Text style={small}>
        Opens swappup.com — works on mobile and desktop.
      </Text>
      <Text style={{ ...p, marginTop: '16px' }}>
        If {seller} doesn't add your name to the booking within 24 hours, your payment is
        automatically refunded in full — no forms, no waiting.
      </Text>
      <Text style={{ ...p, marginTop: '18px', marginBottom: 0 }}>
        Warm regards,<br />The swappup team
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