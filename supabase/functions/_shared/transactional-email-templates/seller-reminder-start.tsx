/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripCard, TripDetails, h1, p, small, button, APP_URL } from './_layout.tsx'

interface Props {
  sellerName?: string
  trip?: TripDetails
  hoursLeft?: number
}

const Email = ({ sellerName, trip, hoursLeft }: Props) => (
  <EmailLayout preview="Friendly nudge — please start the name change">
    <Heading style={h1}>{sellerName ? `Hi ${sellerName},` : 'Hi there,'}</Heading>
    <Text style={p}>
      Just a quick reminder — your sale is waiting on you to start the name change with the airline.
      You have around <strong>{hoursLeft ?? 23} hours left</strong> before the buyer is automatically refunded.
    </Text>
    <TripCard trip={trip} />
    <Section style={{ margin: '20px 0' }}>
      <Link href={`${APP_URL}/account?tab=sales`} style={button()}>Complete the name change</Link>
    </Section>
    <Text style={small}>The sooner you complete the transfer, the sooner your payout is released.</Text>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: 'Reminder: start your name change',
  displayName: 'Seller reminder (start)',
  previewData: {
    sellerName: 'Maria',
    hoursLeft: 23,
    trip: { origin: 'London (LGW)', destination: 'Rome (FCO)', departureDate: '12 Jun 2026', airline: 'Ryanair' },
  },
} satisfies TemplateEntry