/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripDetails, h1, p, button, brand, APP_URL, card, row, label } from './_layout.tsx'

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
  const seller = sellerName || 'your seller'
  const order = orderNumber || (purchaseId ? `SW-${purchaseId.slice(0, 8).toUpperCase()}` : undefined)
  const fmtLeg = (date?: string, time?: string) => {
    if (!date && !time) return ''
    if (date && time) return `${date} at ${time}`
    return date || time || ''
  }
  const isRoundTrip = !!(trip?.returnDate || trip?.returnTime)
  const bookingRef = newBookingRef || trip?.bookingRef
  const bookingName = surname || trip?.bookingName
  const amount = totalPrice || trip?.escrowAmount
  return (
    <EmailLayout preview="Your ticket is ready, please verify and confirm" transactional>
      <Text style={p}>{buyerName ? `Hi ${buyerName},` : 'Hi there,'}</Text>
      <Text style={p}>
        Good news! {seller} has updated the airline booking with your name. The last step is yours:
        please check that everything looks right on the airline website and confirm in the app{' '}
        <strong>within 48 hours</strong> to release the payment. Your money stays safely with us
        until you confirm.
      </Text>
      <Section style={card}>
        <Text style={{ margin: '0 0 10px', color: brand.goldDeep, fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
          Use these on the airline website
        </Text>
        {trip?.airline && <Text style={row}><span style={label}>Airline: </span>{trip.airline}{trip.flightNumber ? ` · ${trip.flightNumber}` : ''}</Text>}
        {bookingRef && <Text style={row}><span style={label}>Booking reference: </span><strong>{bookingRef}</strong></Text>}
        {bookingName && <Text style={row}><span style={label}>New name on the booking: </span><strong>{bookingName}</strong></Text>}

        <Text style={{ margin: '14px 0 10px', paddingTop: '12px', borderTop: `1px dashed ${brand.border}`, color: brand.goldDeep, fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
          Purchase details
        </Text>
        {order && <Text style={row}><span style={label}>Order number: </span>{order}</Text>}
        {trip?.origin && trip?.destination && (
          <Text style={row}><span style={label}>Route: </span>{trip.origin} {isRoundTrip ? '⇄' : '→'} {trip.destination}</Text>
        )}
        {(trip?.departureDate || trip?.departureTime) && (
          <Text style={row}><span style={label}>{isRoundTrip ? 'Outbound: ' : 'Departure: '}</span>{fmtLeg(trip?.departureDate, trip?.departureTime)}</Text>
        )}
        {isRoundTrip && (
          <Text style={row}><span style={label}>Return: </span>{fmtLeg(trip?.returnDate, trip?.returnTime)}</Text>
        )}
        {trip?.passengers && trip.passengers > 1 && (
          <Text style={row}><span style={label}>Passengers: </span>{trip.passengers}</Text>
        )}
        {amount && <Text style={{ ...row, fontWeight: 600, color: brand.charcoal }}><span style={label}>Amount paid (held safely until you confirm): </span>{amount}</Text>}
      </Section>
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>Next steps</Heading>
      <Text style={p} as="div">
        <ol style={{ paddingLeft: '20px', margin: 0, color: brand.body, fontSize: '14px', lineHeight: '22px' }}>
          <li style={{ marginBottom: '10px' }}>
            <strong>If everything looks right:</strong> head back to the swappup app within{' '}
            <strong>48 hours</strong> and confirm your booking. Only at that point we will release
            the payment to {seller} and your purchase is finalised.
          </li>
          <li style={{ marginBottom: '6px' }}>
            <strong>If something is wrong</strong> (wrong name, wrong flight, missing booking, etc.):
            flag the issue from the same screen in the app. Your money stays safely with us until the
            problem is resolved — no payment is released until you confirm.
          </li>
        </ol>
      </Text>
      <Section style={{ margin: '20px 0 8px' }}>
        <Link href={`${APP_URL}/account?tab=purchases`} style={button()}>View purchase in app</Link>
      </Section>
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
    return order ? `Your ticket is ready, please verify (Order ${order})` : 'Your ticket is ready, please verify'
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
