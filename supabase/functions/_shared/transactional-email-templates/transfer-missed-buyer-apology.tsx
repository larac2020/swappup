/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripCard, TripDetails, h1, p, small, button, APP_URL } from './_layout.tsx'

interface Props {
  buyerName?: string
  trip?: TripDetails
  refundAmount?: string
  purchaseId?: string
  orderNumber?: string
}

const Email = ({ buyerName, trip, refundAmount, purchaseId, orderNumber }: Props) => {
  const order = orderNumber || (purchaseId ? `SW-${purchaseId.slice(0, 8).toUpperCase()}` : undefined)
  const tripWithExtras: TripDetails | undefined = trip
    ? { ...trip, escrowAmount: refundAmount || trip.escrowAmount, orderNumber: order }
    : undefined
  return (
    <EmailLayout preview="We are sorry, your purchase has been refunded" accent="danger" transactional>
      <Text style={p}>{buyerName ? `Hi ${buyerName},` : 'Hi there,'}</Text>
      <Text style={p}>
        We are really sorry. The seller did not update the booking with your name within the 24 hour window.
        To protect you, we have automatically <strong>refunded your purchase in full</strong>
        {refundAmount ? <> ({refundAmount})</> : null}. The refund usually appears in your account within
        <strong> 5 to 10 business days</strong>, depending on your bank.
      </Text>
      <TripCard trip={tripWithExtras} title="Your purchase" />
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>Don't give up on the trip</Heading>
      <Text style={p}>
        There may be other sellers offering similar tickets on the same route. Tap below to browse alternatives.
        We will do our best to help you find another option.
      </Text>
      <Section style={{ margin: '20px 0 8px' }}>
        <Link href={`${APP_URL}/browse`} style={button()}>Find another ticket</Link>
      </Section>
      <Text style={small}>
        Sellers who repeatedly miss the deadline are reviewed and may be removed from swappup.
      </Text>
      <Text style={{ ...p, marginTop: '18px', marginBottom: 0 }}>
        Thank you for your patience. Have a great day,<br />The swappup team
      </Text>
    </EmailLayout>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => {
    const order = data?.orderNumber || (data?.purchaseId ? `SW-${String(data.purchaseId).slice(0, 8).toUpperCase()}` : undefined)
    return order ? `Your purchase has been refunded (Order ${order})` : 'Your purchase has been refunded'
  },
  displayName: 'Buyer apology (transfer missed)',
  previewData: {
    buyerName: 'Alex',
    refundAmount: '€124.50',
    purchaseId: 'abc-123',
    trip: {
      origin: 'London (LGW)', destination: 'Rome (FCO)',
      departureDate: '12 Jun 2026', departureTime: '07:45',
      returnDate: '19 Jun 2026', returnTime: '21:10',
      airline: 'Ryanair', flightNumber: 'FR2345', passengers: 1,
    },
  },
} satisfies TemplateEntry
