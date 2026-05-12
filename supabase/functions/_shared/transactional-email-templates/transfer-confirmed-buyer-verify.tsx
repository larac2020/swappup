/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripCard, TripDetails, h1, p, small, button, card, row, label, brand, APP_URL } from './_layout.tsx'

interface Props {
  buyerName?: string
  sellerName?: string
  newBookingRef?: string
  surname?: string
  trip?: TripDetails
}

const Email = ({ buyerName, sellerName, newBookingRef, surname, trip }: Props) => (
  <EmailLayout preview="Your ticket is ready — please verify and release payment">
    <Heading style={h1}>{buyerName ? `Hi ${buyerName},` : 'Hi there,'}</Heading>
    <Text style={p}>
      Good news — {sellerName || 'the seller'} has completed the name change. Please verify the booking is in your
      name on the airline's site, then confirm in the app to release the payment.
    </Text>
    <TripCard trip={trip} />
    <Section style={card}>
      <Text style={{ ...row, fontWeight: 600, color: brand.charcoal }}>Booking details</Text>
      <Text style={row}><span style={label}>New booking reference: </span>{newBookingRef || '—'}</Text>
      <Text style={row}><span style={label}>Surname for ticket lookup: </span>{surname || '—'}</Text>
    </Section>
    <Section style={{ margin: '20px 0' }}>
      <Link href={`${APP_URL}/account?tab=purchases`} style={button()}>Verify & release payment</Link>
    </Section>
    <Text style={small}>
      If anything is wrong, you can dispute the transfer from the same screen — your money stays in escrow until you confirm.
    </Text>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: 'Your ticket is ready — please verify',
  displayName: 'Buyer verification needed',
  previewData: {
    buyerName: 'Alex',
    sellerName: 'Maria',
    newBookingRef: 'NEW456',
    surname: 'Johnson',
    trip: { origin: 'London (LGW)', destination: 'Rome (FCO)', departureDate: '12 Jun 2026', airline: 'Ryanair' },
  },
} satisfies TemplateEntry