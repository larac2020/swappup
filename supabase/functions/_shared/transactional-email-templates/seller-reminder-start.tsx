/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, TripCard, TripDetails, h1, p, button, brand, APP_URL, PREFERENCES_URL } from './_layout.tsx'

interface Props {
  sellerName?: string
  buyerName?: string
  trip?: TripDetails
  hoursLeft?: number
  purchaseId?: string
  orderNumber?: string
}

const Email = ({ sellerName, buyerName, trip, hoursLeft, purchaseId, orderNumber }: Props) => {
  const buyer = buyerName || 'your buyer'
  const order = orderNumber || (purchaseId ? `SW-${purchaseId.slice(0, 8).toUpperCase()}` : undefined)
  const tripWithExtras: TripDetails | undefined = trip ? { ...trip, orderNumber: order } : undefined
  return (
    <EmailLayout preview="A friendly nudge to update your booking" transactional>
      <Text style={p}>{sellerName ? `Hi ${sellerName},` : 'Hi there,'}</Text>
      <Text style={p}>
        Just a quick reminder. Your sale to {buyer} is waiting on the name change with the airline.
        You have around <strong>{hoursLeft ?? 23} hours left</strong> before the purchase is automatically refunded.
      </Text>
      <TripCard trip={tripWithExtras} title="Your booking" />
      <Heading style={{ ...h1, fontSize: '16px', margin: '22px 0 8px' }}>What to do now</Heading>
      <Text style={p} as="div">
        <ol style={{ paddingLeft: '20px', margin: 0, color: brand.body, fontSize: '14px', lineHeight: '22px' }}>
          <li style={{ marginBottom: '6px' }}>
            Go to the airline website and <strong>update the booking</strong> with the buyer's name.
          </li>
          <li style={{ marginBottom: '10px' }}>
            Upload the new booking confirmation in the swappup app.
            <Section style={{ marginTop: '8px', padding: '10px 12px', backgroundColor: brand.goldTint, border: `1px solid ${brand.gold}`, borderRadius: '8px' }}>
              <Text style={{ margin: 0, color: brand.ink, fontSize: '13px', lineHeight: '20px' }}>
                💡 Turn on push notifications so you never miss a sale update.{' '}
                <Link href={PREFERENCES_URL} style={{ color: brand.goldDeep, textDecoration: 'underline', fontWeight: 600 }}>Update notification preferences</Link>.
              </Text>
            </Section>
          </li>
        </ol>
      </Text>
      <Section style={{ margin: '20px 0 8px' }}>
        <Link href={`${APP_URL}/account?tab=sales`} style={button()}>View sale in app</Link>
      </Section>
      <Text style={p}>The sooner you complete the change, the sooner you receive your money.</Text>
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
    return order ? `Reminder: please update the booking (Order ${order})` : 'Reminder: please update the booking'
  },
  displayName: 'Seller reminder (start)',
  previewData: {
    sellerName: 'Maria',
    buyerName: 'Alex',
    hoursLeft: 23,
    purchaseId: 'abc-123',
    trip: {
      origin: 'London (LGW)', destination: 'Rome (FCO)',
      departureDate: '12 Jun 2026', departureTime: '07:45',
      returnDate: '19 Jun 2026', returnTime: '21:10',
      airline: 'Ryanair', flightNumber: 'FR2345', passengers: 1,
    },
  },
} satisfies TemplateEntry
