/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripCard, TripDetails, h1, p, button, brand, APP_URL, PREFERENCES_URL } from './_layout.tsx'

interface Props {
  buyerName?: string
  sellerName?: string
  newBookingRef?: string
  surname?: string
  trip?: TripDetails
  purchaseId?: string
  orderNumber?: string
  totalPrice?: string
}

const Email = ({ buyerName, sellerName, newBookingRef, surname, trip, purchaseId, orderNumber, totalPrice }: Props) => {
  const seller = sellerName || 'the seller'
  const order = orderNumber || (purchaseId ? `SW-${purchaseId.slice(0, 8).toUpperCase()}` : undefined)
  const tripWithExtras: TripDetails | undefined = trip
    ? { ...trip, bookingRef: newBookingRef || trip.bookingRef, bookingName: surname || trip.bookingName, escrowAmount: totalPrice || trip.escrowAmount, orderNumber: order }
    : undefined
  return (
    <EmailLayout preview="Your ticket is ready — please verify and release payment" transactional>
      <Text style={p}>{buyerName ? `Hi ${buyerName},` : 'Hi there,'}</Text>
      <Text style={p}>
        Good news — {seller} has updated the airline booking with your name. The last step is yours:
        please verify everything looks right and confirm in the app to release the payment.
      </Text>
      <TripCard trip={tripWithExtras} title="Your booking details" />
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>What happens next</Heading>
      <Text style={p} as="div">
        <ol style={{ paddingLeft: '20px', margin: 0, color: brand.body, fontSize: '14px', lineHeight: '22px' }}>
          <li style={{ marginBottom: '6px' }}>
            Go to the airline website and check the booking is correctly under your name, using the
            booking reference{newBookingRef ? <> <strong>{newBookingRef}</strong></> : null}.
          </li>
          <li style={{ marginBottom: '10px' }}>
            <strong>Within 48 hours</strong>, head back to the swappup app and confirm everything is in order.
            Only at that point we'll release the payment to {seller} and the purchase is finalised.
            <Section style={{ marginTop: '8px', padding: '10px 12px', backgroundColor: brand.goldTint, border: `1px solid ${brand.gold}`, borderRadius: '8px' }}>
              <Text style={{ margin: 0, color: brand.ink, fontSize: '13px', lineHeight: '20px' }}>
                💡 Turn on push notifications so you don't forget the 48-hour window.{' '}
                <Link href={PREFERENCES_URL} style={{ color: brand.goldDeep, textDecoration: 'underline', fontWeight: 600 }}>Update notification preferences</Link>.
              </Text>
            </Section>
          </li>
        </ol>
      </Text>
      <Section style={{ margin: '20px 0 8px' }}>
        <Link href={`${APP_URL}/account?tab=purchases`} style={button()}>Verify & release payment</Link>
      </Section>
      <Heading style={{ ...h1, fontSize: '16px', margin: '24px 0 8px' }}>Found an issue with the booking?</Heading>
      <Text style={p}>
        If something doesn't look right, you can dispute the transfer from the same screen — your money stays
        safely in escrow until you're happy.
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
    return order ? `Your ticket is ready — please verify (Order ${order})` : 'Your ticket is ready — please verify'
  },
  displayName: 'Buyer verification needed',
  previewData: {
    buyerName: 'Alex',
    sellerName: 'Maria',
    newBookingRef: 'NEW456',
    surname: 'Johnson',
    totalPrice: '€124.50',
    purchaseId: 'abc-123',
    trip: {
      origin: 'London (LGW)', destination: 'Rome (FCO)',
      departureDate: '12 Jun 2026', departureTime: '07:45',
      returnDate: '19 Jun 2026', returnTime: '21:10',
      airline: 'Ryanair', flightNumber: 'FR2345', passengers: 1,
    },
  },
} satisfies TemplateEntry
