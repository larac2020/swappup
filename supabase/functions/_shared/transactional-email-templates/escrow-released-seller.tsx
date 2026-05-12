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
}

const Email = ({ sellerName, buyerName, payoutAmount, trip }: Props) => (
  <EmailLayout preview="Payment released — your payout is on its way" accent="success">
    <Heading style={h1}>{sellerName ? `Nice one, ${sellerName}!` : 'Sale completed'}</Heading>
    <Text style={p}>
      {buyerName || 'The buyer'} has confirmed the ticket transfer. The escrow has been released
      and your payout is now on its way.
    </Text>
    <TripCard trip={trip} />
    {payoutAmount && (
      <Text style={p}><strong>Payout amount:</strong> {payoutAmount}</Text>
    )}
    <Text style={p}>
      Funds typically arrive in your connected payout account within <strong>2–5 business days</strong>,
      depending on your bank.
    </Text>
    <Section style={{ margin: '20px 0' }}>
      <Link href={`${APP_URL}/account?tab=transactions`} style={button()}>View payout</Link>
    </Section>
    <Text style={small}>Thanks for selling on Swappup — list another ticket any time.</Text>
  </EmailLayout>
)

export const template = {
  component: Email,
  subject: 'Sale complete — your payout is on its way',
  displayName: 'Seller payout released',
  previewData: {
    sellerName: 'Maria',
    buyerName: 'Alex',
    payoutAmount: '€118.20',
    trip: { origin: 'London (LGW)', destination: 'Rome (FCO)', departureDate: '12 Jun 2026', airline: 'Ryanair' },
  },
} satisfies TemplateEntry