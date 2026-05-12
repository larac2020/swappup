/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripCard, TripDetails, h1, p, small, button, APP_URL } from './_layout.tsx'

interface Props {
  sellerName?: string
  trip?: TripDetails
  purchaseId?: string
  orderNumber?: string
}

const Email = ({ sellerName, trip, purchaseId, orderNumber }: Props) => {
  const order = orderNumber || (purchaseId ? `SW-${purchaseId.slice(0, 8).toUpperCase()}` : undefined)
  const tripWithExtras: TripDetails | undefined = trip ? { ...trip, orderNumber: order } : undefined
  return (
    <EmailLayout preview="Your sale was cancelled, here is what happened" accent="danger" transactional>
      <Text style={p}>{sellerName ? `Hi ${sellerName},` : 'Hi there,'}</Text>
      <Text style={p}>
        We are sorry to share that your recent sale was cancelled because the booking was not updated with the
        buyer's name within the <strong>24 hour window</strong>. The buyer has been refunded in full and your
        listing has been put back online where possible.
      </Text>
      <TripCard trip={tripWithExtras} title="Cancelled booking" />
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>For next time</Heading>
      <Text style={p}>
        As soon as a sale comes in, you have 24 hours to update the booking with the airline and upload the
        new confirmation. The earlier you start, the smoother the sale, and the faster you receive your money.
      </Text>
      <Section style={{ margin: '20px 0 8px' }}>
        <Link href={`${APP_URL}/account?tab=sales`} style={button()}>View sale in app</Link>
      </Section>
      <Text style={small}>
        Repeated missed deadlines may impact your seller reputation and your ability to list. If something prevented
        you from completing in time, please get in touch with us so we can help.
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
    return order ? `Your sale was cancelled, deadline missed (Order ${order})` : 'Your sale was cancelled, deadline missed'
  },
  displayName: 'Seller warning (transfer missed)',
  previewData: {
    sellerName: 'Maria',
    purchaseId: 'abc-123',
    trip: {
      origin: 'London (LGW)', destination: 'Rome (FCO)',
      departureDate: '12 Jun 2026', departureTime: '07:45',
      returnDate: '19 Jun 2026', returnTime: '21:10',
      airline: 'Ryanair', flightNumber: 'FR2345', passengers: 1,
    },
  },
} satisfies TemplateEntry
