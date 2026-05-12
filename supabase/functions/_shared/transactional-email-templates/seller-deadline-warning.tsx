/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripCard, TripDetails, h1, p, small, button, APP_URL } from './_layout.tsx'

interface Props {
  sellerName?: string
  trip?: TripDetails
  deadline?: string
}

const Email = ({ sellerName, trip, deadline }: Props) => (
  <EmailLayout preview="Only 4 hours left to complete your sale" accent="danger">
    <Heading style={h1}>{sellerName ? `${sellerName}, only 4 hours left` : 'Only 4 hours left'}</Heading>
    <Text style={p}>
      Your 24-hour window to complete the name change is almost over. After {deadline || 'the deadline'},
      the purchase is <strong>automatically refunded</strong> to the buyer and the sale is cancelled.
    </Text>
    <TripCard trip={trip} />
    <Section style={{ margin: '20px 0' }}>
      <Link href={`${APP_URL}/account?tab=sales`} style={button('#b1311f', '#ffffff')}>Complete now</Link>
    </Section>
    <Text style={small}>Already done it? Just upload the booking confirmation in the app to release the sale.</Text>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: 'Final reminder: 4 hours left to complete your sale',
  displayName: 'Seller deadline warning (4h)',
  previewData: {
    sellerName: 'Maria',
    deadline: '13 May 2026 14:30',
    trip: { origin: 'London (LGW)', destination: 'Rome (FCO)', departureDate: '12 Jun 2026', airline: 'Ryanair' },
  },
} satisfies TemplateEntry