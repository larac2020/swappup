/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripDetails, h1, p, button, brand, card, row, label, APP_URL, PREFERENCES_URL } from './_layout.tsx'

interface Props {
  sellerName?: string
  buyerName?: string
  buyerFullName?: string
  buyerEmail?: string
  trip?: TripDetails
  bookingRef?: string
  deadline?: string
  purchaseId?: string
  orderNumber?: string
  totalPrice?: string
}

const Email = ({ sellerName, buyerName, buyerFullName, trip, bookingRef, deadline, purchaseId, orderNumber, totalPrice }: Props) => {
  const buyer = buyerName || buyerFullName || 'your buyer'
  const order = orderNumber || (purchaseId ? `SW-${purchaseId.slice(0, 8).toUpperCase()}` : undefined)
  const isRoundTrip = !!(trip?.returnDate || trip?.returnTime)
  const fmtLeg = (date?: string, time?: string) => {
    if (!date && !time) return ''
    if (date && time) return `${date} at ${time}`
    return date || time || ''
  }
  const amount = totalPrice || trip?.escrowAmount
  return (
    <EmailLayout preview="You've made a sale, please update the booking" transactional>
      <Text style={p}>{sellerName ? `Hi ${sellerName},` : 'Hi there,'}</Text>
      <Text style={p}>
        Great news! Your ticket has just been sold to {buyer}. To complete the sale and receive your money,
        you have <strong>24 hours</strong> to update the airline booking with the buyer's name.
      </Text>
      {trip && (
        <Section style={card}>
          <Text style={{ margin: '0 0 10px', color: brand.goldDeep, fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
            Your sales details
          </Text>
          {order && (
            <Text style={row}><span style={label}>Order number: </span>{order}</Text>
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
          {trip.airline && (
            <Text style={row}><span style={label}>Airline: </span>{trip.airline}{trip.flightNumber ? ` · ${trip.flightNumber}` : ''}</Text>
          )}
          {trip.passengers && trip.passengers > 1 && (
            <Text style={row}><span style={label}>Passengers: </span>{trip.passengers}</Text>
          )}
          {amount && (
            <Text style={{ ...row, marginTop: '10px', paddingTop: '10px', borderTop: `1px dashed ${brand.border}`, fontWeight: 600, color: brand.charcoal }}>
              <span style={label}>Amount paid: </span>{amount}
            </Text>
          )}

          <Text style={{ margin: '16px 0 10px', paddingTop: '12px', borderTop: `1px solid ${brand.border}`, color: brand.goldDeep, fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
            Buyer details to use with the airline
          </Text>
          {buyerFullName && (
            <Text style={row}><span style={label}>Full name: </span>{buyerFullName}</Text>
          )}
          {bookingRef && (
            <Text style={row}><span style={label}>Original booking reference: </span>{bookingRef}</Text>
          )}
        </Section>
      )}
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>Unlock your payment</Heading>
      <Text style={p} as="div">
        <ol style={{ paddingLeft: '20px', margin: 0, color: brand.body, fontSize: '14px', lineHeight: '22px' }}>
          <li style={{ marginBottom: '6px' }}>
            Go to the airline website and <strong>update the booking</strong> with the buyer's name.
          </li>
          <li style={{ marginBottom: '10px' }}>
            Upload the new booking confirmation in the swappup app to mark the change as done.
          </li>
          <li style={{ marginBottom: '10px' }}>
            Once the buyer verifies everything looks good, your money is released. It usually arrives in your account within 2 to 5 business days.
            <Section style={{ marginTop: '8px', padding: '10px 12px', backgroundColor: brand.goldTint, border: `1px solid ${brand.gold}`, borderRadius: '8px' }}>
              <Text style={{ margin: 0, color: brand.ink, fontSize: '13px', lineHeight: '20px' }}>
                💡 Turn on push notifications to know the moment the buyer confirms and your payment is on the way.{' '}
                <Link href={PREFERENCES_URL} style={{ color: brand.goldDeep, textDecoration: 'underline', fontWeight: 600 }}>Update notification preferences</Link>.
              </Text>
            </Section>
          </li>
        </ol>
      </Text>
      <Heading style={{ ...h1, fontSize: '16px', margin: '24px 0 8px' }}>Can't make the deadline?</Heading>
      <Text style={p}>
        If you do not update the booking by {deadline || 'the 24 hour deadline'}, the purchase is automatically
        refunded to the buyer and the sale is cancelled. If something is blocking you, please get in touch with us as soon as possible.
      </Text>
      <Section style={{ margin: '20px 0 8px' }}>
        <Link href={`${APP_URL}/account?tab=sales`} style={button()}>Confirm the name change in the app</Link>
      </Section>
      <Text style={{ fontSize: '12px', color: '#6b7280', lineHeight: '18px', margin: '6px 0 0', fontStyle: 'italic' }}>
        Reminder: as you acknowledged when listing, the fee paid to the airline for the name change is not refundable by swappup if the buyer fails to confirm within 48 hours.
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
    return order ? `You've made a sale! Please update the booking (Order ${order})` : `You've made a sale! Please update the booking`
  },
  displayName: 'Seller action required',
  previewData: {
    sellerName: 'Maria',
    buyerName: 'Alex',
    buyerFullName: 'Alex Johnson',
    buyerEmail: 'alex@example.com',
    nameChangeFee: '€45.00',
    totalPrice: '€124.50',
    bookingRef: 'XYZ123',
    deadline: '13 May 2026 14:30',
    purchaseId: 'abc-123',
    trip: {
      origin: 'London (LGW)', destination: 'Rome (FCO)',
      departureDate: '12 Jun 2026', departureTime: '07:45',
      returnDate: '19 Jun 2026', returnTime: '21:10',
      airline: 'Ryanair', flightNumber: 'FR2345', passengers: 1,
    },
  },
} satisfies TemplateEntry
