/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripCard, TripDetails, h1, p, small, button, APP_URL } from './_layout.tsx'

interface Props {
  sellerName?: string
  buyerName?: string
  payoutAmount?: string
  trip?: TripDetails
  purchaseId?: string
  orderNumber?: string
}

const Email = ({ sellerName, buyerName, payoutAmount, trip, purchaseId, orderNumber }: Props) => {
  const buyer = buyerName || 'your buyer'
  const order = orderNumber || (purchaseId ? `SW-${purchaseId.slice(0, 8).toUpperCase()}` : undefined)
  const tripWithExtras: TripDetails | undefined = trip
    ? { ...trip, escrowAmount: payoutAmount || trip.escrowAmount, escrowAmountLabel: "Amount you'll receive", orderNumber: order }
    : undefined
  return (
    <EmailLayout preview="Your sale is complete and your money is on its way" accent="success" transactional>
      <Text style={p}>{sellerName ? `Hi ${sellerName},` : 'Hi there,'}</Text>
      <Text style={p}>
        Brilliant news! {buyer} has confirmed the ticket change and the sale is complete. Your money
        {payoutAmount ? <> ({payoutAmount})</> : null} is now on its way to your account.
      </Text>
      <TripCard trip={tripWithExtras} title="Your booking" />
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>What happens next</Heading>
      <Text style={p}>
        Your money usually lands in your bank account within <strong>2 to 5 business days</strong>,
        depending on your bank. You can check on it any time from your sales in the app.
      </Text>
      <Section style={{ margin: '20px 0 8px' }}>
        <Link href={`${APP_URL}/account?tab=sales`} style={button()}>View sale in app</Link>
      </Section>
      <Text style={small}>
        This is a payment notification, not a tax invoice. For accounting purposes, you can download the
        official receipt from the same screen.
      </Text>
      <Text style={{ ...p, marginTop: '18px', marginBottom: 0 }}>
        Thanks for selling on swappup. Have a great day,<br />The swappup team
      </Text>
    </EmailLayout>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => {
    const order = data?.orderNumber || (data?.purchaseId ? `SW-${String(data.purchaseId).slice(0, 8).toUpperCase()}` : undefined)
    return order ? `Your sale is complete, your money is on its way (Order ${order})` : 'Your sale is complete, your money is on its way'
  },
  displayName: 'Seller payout released',
  previewData: {
    sellerName: 'Maria',
    buyerName: 'Alex',
    payoutAmount: '€118.20',
    purchaseId: 'abc-123',
    trip: {
      origin: 'London (LGW)', destination: 'Rome (FCO)',
      departureDate: '12 Jun 2026', departureTime: '07:45',
      returnDate: '19 Jun 2026', returnTime: '21:10',
      airline: 'Ryanair', flightNumber: 'FR2345', passengers: 1,
    },
  },
} satisfies TemplateEntry
