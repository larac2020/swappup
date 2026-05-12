/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripCard, TripDetails, h1, p, small, button, APP_URL } from './_layout.tsx'

interface Props {
  sellerName?: string
  trip?: TripDetails
}

const Email = ({ sellerName, trip }: Props) => (
  <EmailLayout preview="Your sale was cancelled — here's what happened" accent="danger">
    <Heading style={h1}>{sellerName ? `Hi ${sellerName},` : 'Hi there,'}</Heading>
    <Text style={p}>
      Your recent sale was cancelled because the name change wasn't completed within the
      <strong> 24-hour window</strong>. The buyer has been refunded in full and your listing was reactivated where possible.
    </Text>
    <TripCard trip={trip} />
    <Text style={p}>
      <strong>For next time:</strong> as soon as a sale comes in, you have 24 hours to perform the name change
      with the airline and upload proof of payment. The earlier you start, the smoother the sale.
    </Text>
    <Section style={{ margin: '20px 0' }}>
      <Link href={`${APP_URL}/account?tab=sales`} style={button()}>Review your sales</Link>
    </Section>
    <Text style={small}>
      Repeated missed deadlines may impact your seller reputation and ability to list. If something prevented
      you from completing in time, contact support so we can help.
    </Text>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: 'Your sale was cancelled — 24-hour deadline missed',
  displayName: 'Seller warning (transfer missed)',
  previewData: {
    sellerName: 'Maria',
    trip: { origin: 'London (LGW)', destination: 'Rome (FCO)', departureDate: '12 Jun 2026', airline: 'Ryanair' },
  },
} satisfies TemplateEntry