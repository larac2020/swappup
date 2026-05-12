/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripCard, TripDetails, h1, p, button, brand, APP_URL } from './_layout.tsx'

interface Props {
  sellerName?: string
  buyerName?: string
  trip?: TripDetails
  deadline?: string
  purchaseId?: string
  orderNumber?: string
}

const Email = ({ sellerName, buyerName, trip, deadline, purchaseId, orderNumber }: Props) => {
  const buyer = buyerName || 'the buyer'
  const order = orderNumber || (purchaseId ? `SW-${purchaseId.slice(0, 8).toUpperCase()}` : undefined)
  const tripWithExtras: TripDetails | undefined = trip ? { ...trip, orderNumber: order } : undefined
  return (
    <EmailLayout preview="Only 4 hours left to complete your sale" accent="danger" transactional>
      <Text style={p}>{sellerName ? `Hi ${sellerName},` : 'Hi there,'}</Text>
      <Text style={p}>
        Just a heads-up — your 24-hour window to update the booking with {buyer}'s name is almost over.
        After {deadline || 'the deadline'}, the purchase is <strong>automatically refunded</strong> and the sale is cancelled.
      </Text>
      <TripCard trip={tripWithExtras} title="Your sale details" />
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>What to do right now</Heading>
      <Text style={p} as="div">
        <ol style={{ paddingLeft: '20px', margin: 0, color: brand.body, fontSize: '14px', lineHeight: '22px' }}>
          <li style={{ marginBottom: '6px' }}>
            Go to the airline website and <strong>update the booking</strong> with the buyer's name.
          </li>
          <li style={{ marginBottom: '6px' }}>
            Upload the new booking confirmation in the swappup app to release the sale.
          </li>
        </ol>
      </Text>
      <Section style={{ margin: '20px 0 8px' }}>
        <Link href={`${APP_URL}/account?tab=sales`} style={button('#b1311f', '#ffffff')}>Complete now</Link>
      </Section>
      <Heading style={{ ...h1, fontSize: '16px', margin: '24px 0 8px' }}>Already done it?</Heading>
      <Text style={p}>
        Great — just upload the new booking confirmation in the app and the sale will be released straight away.
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
    return order ? `Final reminder: 4 hours left (Order ${order})` : 'Final reminder: 4 hours left to complete your sale'
  },
  displayName: 'Seller deadline warning (4h)',
  previewData: {
    sellerName: 'Maria',
    buyerName: 'Alex',
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
