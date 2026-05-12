/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripCard, TripDetails, h1, p, small, button, APP_URL, SUPPORT_EMAIL } from './_layout.tsx'

interface Props {
  sellerName?: string
  buyerName?: string
  trip?: TripDetails
  nameChangeFee?: string
  purchaseId?: string
  orderNumber?: string
}

const Email = ({ sellerName, buyerName, trip, nameChangeFee, purchaseId, orderNumber }: Props) => {
  const order = orderNumber || (purchaseId ? `SW-${purchaseId.slice(0, 8).toUpperCase()}` : undefined)
  const tripWithExtras: TripDetails | undefined = trip
    ? { ...trip, orderNumber: order, escrowAmount: nameChangeFee || trip.escrowAmount, escrowAmountLabel: 'Name-change fee you paid the airline' }
    : undefined
  return (
    <EmailLayout preview="The buyer did not confirm in time — important update on your sale" accent="danger" transactional>
      <Text style={p}>{sellerName ? `Hi ${sellerName},` : 'Hi there,'}</Text>
      <Text style={p}>
        Unfortunately {buyerName || 'the buyer'} did not confirm receipt of the ticket within the
        <strong> 48 hour verification window</strong>. As required by our buyer-protection policy, the
        sale has been cancelled and the buyer has been refunded in full.
      </Text>
      <TripCard trip={tripWithExtras} title="Your sale details" />
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>About the name-change fee you paid</Heading>
      <Text style={p}>
        When you listed this ticket you acknowledged that the fee paid to the airline to change the
        name on the booking is <strong>not refundable by swappup</strong> in the event the buyer fails
        to confirm. Airlines do not offer a free reversal window — the booking is now under the
        buyer's name on the airline side.
      </Text>
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>What you can try</Heading>
      <Text style={p} as="div">
        <ol style={{ paddingLeft: '20px', margin: 0, fontSize: '14px', lineHeight: '22px' }}>
          <li style={{ marginBottom: '8px' }}>
            <strong>Contact the airline</strong> and ask for a goodwill name reversal back to your name.
            Outcomes vary by carrier and fare type, but it is sometimes granted.
          </li>
          <li style={{ marginBottom: '8px' }}>
            <strong>Reach out to the buyer</strong> through the swappup app — they may agree to release
            the booking back to you, especially if the cancellation was a simple oversight.
          </li>
          <li>
            If neither works, the seat remains under the buyer's name on the airline booking and is
            outside swappup's ability to recover.
          </li>
        </ol>
      </Text>
      <Section style={{ margin: '20px 0 8px' }}>
        <Link href={`${APP_URL}/account?tab=sales`} style={button()}>View sale in app</Link>
      </Section>
      <Text style={small}>
        We know this is frustrating. If you believe the buyer acted in bad faith, reply to this email
        or write to <Link href={`mailto:${SUPPORT_EMAIL}`} style={{ color: 'inherit' }}>{SUPPORT_EMAIL}</Link>{' '}
        and we will review the case. Buyers who repeatedly fail to confirm are reviewed and may be
        suspended from swappup.
      </Text>
      <Text style={{ ...p, marginTop: '18px', marginBottom: 0 }}>
        Thank you for your patience,<br />The swappup team
      </Text>
    </EmailLayout>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => {
    const order = data?.orderNumber || (data?.purchaseId ? `SW-${String(data.purchaseId).slice(0, 8).toUpperCase()}` : undefined)
    return order ? `Your sale was cancelled — buyer didn't confirm (Order ${order})` : "Your sale was cancelled — buyer didn't confirm"
  },
  displayName: 'Seller — buyer did not confirm in 48h',
  previewData: {
    sellerName: 'Maria',
    buyerName: 'Alex',
    nameChangeFee: '€45.00',
    purchaseId: 'abc-123',
    trip: {
      origin: 'London (LGW)', destination: 'Rome (FCO)',
      departureDate: '12 Jun 2026', departureTime: '07:45',
      returnDate: '19 Jun 2026', returnTime: '21:10',
      airline: 'Ryanair', flightNumber: 'FR2345', passengers: 1,
    },
  },
} satisfies TemplateEntry
