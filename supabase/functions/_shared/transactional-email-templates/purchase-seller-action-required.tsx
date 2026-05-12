/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripCard, TripDetails, h1, p, small, button, APP_URL } from './_layout.tsx'

interface Props {
  sellerName?: string
  buyerFullName?: string
  buyerEmail?: string
  nameChangeFee?: string
  trip?: TripDetails
  bookingRef?: string
  deadline?: string
}

const Email = ({ sellerName, buyerFullName, buyerEmail, nameChangeFee, trip, bookingRef, deadline }: Props) => (
  <EmailLayout preview="Action required — complete the name change in 24 hours">
    <Heading style={h1}>{sellerName ? `Hi ${sellerName},` : 'Hi there,'}</Heading>
    <Text style={p}>
      Great news — your ticket has been sold! To complete the sale and release your payout, you need to
      perform the name change with the airline within <strong>24 hours</strong>.
    </Text>
    <TripCard trip={trip} />
    <Heading style={{ ...h1, fontSize: '16px' }}>Buyer details to use with the airline</Heading>
    <Text style={p}>
      <strong>Full name:</strong> {buyerFullName || '—'}<br/>
      <strong>Email:</strong> {buyerEmail || '—'}<br/>
      {bookingRef && <><strong>Original booking ref:</strong> {bookingRef}<br/></>}
      {nameChangeFee && <><strong>Name change fee to pay:</strong> {nameChangeFee}</>}
    </Text>
    <Section style={{ margin: '20px 0' }}>
      <Link href={`${APP_URL}/account?tab=sales`} style={button()}>Open your sale</Link>
    </Section>
    <Text style={small}>
      Deadline: {deadline || 'within 24 hours of purchase'}. Missing the deadline triggers an automatic refund to the buyer and the sale is cancelled.
    </Text>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: 'Action required: complete your sale within 24 hours',
  displayName: 'Seller action required',
  previewData: {
    sellerName: 'Maria',
    buyerFullName: 'Alex Johnson',
    buyerEmail: 'alex@example.com',
    nameChangeFee: '€45.00',
    bookingRef: 'XYZ123',
    deadline: '13 May 2026 14:30',
    trip: { origin: 'London (LGW)', destination: 'Rome (FCO)', departureDate: '12 Jun 2026', airline: 'Ryanair', flightNumber: 'FR2345' },
  },
} satisfies TemplateEntry