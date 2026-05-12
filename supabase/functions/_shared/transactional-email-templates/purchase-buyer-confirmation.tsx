/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripCard, TripDetails, h1, p, small, button, brand, APP_URL, PREFERENCES_URL } from './_layout.tsx'

interface Props {
  buyerName?: string
  sellerName?: string
  totalPrice?: string
  trip?: TripDetails
  purchaseId?: string
  orderNumber?: string
  bookingRef?: string
  bookingName?: string
}

const Email = ({ buyerName, sellerName, totalPrice, trip, purchaseId, orderNumber, bookingRef, bookingName }: Props) => {
  const seller = sellerName || 'the seller'
  const order = orderNumber || (purchaseId ? `SW-${purchaseId.slice(0, 8).toUpperCase()}` : undefined)
  const tripWithExtras: TripDetails | undefined = trip
    ? { ...trip, bookingRef: bookingRef || trip.bookingRef, bookingName: bookingName || trip.bookingName, escrowAmount: totalPrice, orderNumber: order }
    : undefined
  return (
    <EmailLayout preview="Your swappup purchase is confirmed" transactional>
      <Text style={p}>{buyerName ? `Hi ${buyerName},` : 'Hi there,'}</Text>
      <Text style={p}>
        Thank you so much for your purchase with swappup.
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
            <strong>{seller} has 24 hours</strong> to update the booking with your name.
          </li>
          <li style={{ marginBottom: '10px' }}>
            As soon as {seller} confirms the change in the app, we'll let you know by email.
            <Section style={{ marginTop: '8px', padding: '10px 12px', backgroundColor: brand.goldTint, border: `1px solid ${brand.gold}`, borderRadius: '8px' }}>
              <Text style={{ margin: 0, color: brand.ink, fontSize: '13px', lineHeight: '20px' }}>
                💡 Turn on push notifications so you don't miss the moment.{' '}
                <Link href={PREFERENCES_URL} style={{ color: brand.goldDeep, textDecoration: 'underline', fontWeight: 600 }}>Update notification preferences</Link>.
              </Text>
            </Section>
          </li>
          <li style={{ marginBottom: '6px' }}>
            On the airline website, check that the change was made correctly, using the booking
            reference and the name you provided to the seller. Then, <strong>within 48 hours</strong>,
            head back to the swappup app and confirm everything looks good. Only at that point we'll
            release the payment to {seller} and the purchase is finalised.
          </li>
        </ol>
      </Text>
      <Section style={{ margin: '22px 0 6px' }}>
        <Link href={`${APP_URL}/account?tab=purchases`} style={button()}>View my purchase</Link>
      </Section>
      <Text style={small}>
        Opens swappup.com — works on mobile and desktop.
      </Text>
      <Heading style={{ ...h1, fontSize: '16px', margin: '24px 0 8px' }}>Found an issue with the booking?</Heading>
      <Text style={p}>
        If something doesn't look right, or if {seller} doesn't update the booking with your name
        within 24 hours, your payment is automatically refunded in full — no forms, no waiting.
      </Text>
      <Text style={{ ...p, marginTop: '18px', marginBottom: 0 }}>
        Have a great day,<br />The swappup team
      </Text>
    </EmailLayout>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => {
    const order = data?.orderNumber || (data?.purchaseId ? `SW-${String(data.purchaseId).slice(0, 8).toUpperCase()}` : undefined)
    return order ? `Your Swappup purchase is confirmed — Order ${order}` : 'Your Swappup purchase is confirmed'
  },
  displayName: 'Buyer purchase confirmation',
  previewData: {
    buyerName: 'Alex',
    sellerName: 'Maria',
    totalPrice: '€124.50',
    trip: {
      origin: 'London (LGW)',
      destination: 'Rome (FCO)',
      departureDate: '12 Jun 2026',
      departureTime: '07:45',
      returnDate: '19 Jun 2026',
      returnTime: '21:10',
      airline: 'Ryanair',
      flightNumber: 'FR2345',
      passengers: 2,
    },
    bookingRef: 'XYZ123',
    bookingName: 'Alex Johnson, Sam Johnson',
    purchaseId: 'abc-123',
  },
} satisfies TemplateEntry