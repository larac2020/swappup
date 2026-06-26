/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Heading, Text, Section, Link } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { EmailLayout, h1, p, button, brand, card, APP_URL } from './_layout.tsx'
import { Locale, normalizeLocale, t } from './i18n.ts'

interface Props {
  firstName?: string
  locale?: Locale
}

const dict = {
  en: {
    preview: 'Welcome to swappup — finish setting up your account',
    hi: 'Hi {name},',
    hiThere: 'Hi there,',
    welcome: 'Welcome to swappup 👋',
    intro: 'swappup is the marketplace where travellers buy and sell flight tickets they no longer need — safely, with escrow and verified identities.',
    nextTitle: 'One quick step before you can buy or sell',
    nextBody: 'Complete your account setup (it takes about 2 minutes). Once your profile and ID are verified, you can list a ticket or buy one with full buyer protection.',
    cta: 'Complete your account',
    whatYouGetTitle: 'What you get on swappup',
    g1: 'Escrow on every purchase — your money is held until the airline updates the name on the booking.',
    g2: 'Verified sellers and buyers — every account is identity-checked.',
    g3: 'Fair prices — sellers cannot list above the original ticket price.',
    questions: 'Questions? Just reply to this email and the team will get back to you.',
    sign: 'See you on board,',
    team: 'The swappup team',
    subject: 'Welcome to swappup',
  },
  it: {
    preview: 'Benvenuto su swappup — completa la configurazione del tuo account',
    hi: 'Ciao {name},',
    hiThere: 'Ciao,',
    welcome: 'Benvenuto su swappup 👋',
    intro: 'swappup è il marketplace dove i viaggiatori comprano e vendono biglietti aerei che non useranno più — in sicurezza, con escrow e identità verificate.',
    nextTitle: 'Manca un passaggio prima di poter comprare o vendere',
    nextBody: 'Completa la configurazione dell\'account (ci vogliono circa 2 minuti). Una volta verificati profilo e documento, puoi pubblicare un biglietto o comprarne uno con la protezione acquirenti.',
    cta: 'Completa il tuo account',
    whatYouGetTitle: 'Cosa trovi su swappup',
    g1: 'Escrow su ogni acquisto — il denaro è custodito fino al cambio nome con la compagnia aerea.',
    g2: 'Venditori e acquirenti verificati — ogni account passa un controllo identità.',
    g3: 'Prezzi corretti — i venditori non possono pubblicare sopra il prezzo originale del biglietto.',
    questions: 'Domande? Rispondi a questa email e il team ti risponderà al più presto.',
    sign: 'A presto a bordo,',
    team: 'Il team swappup',
    subject: 'Benvenuto su swappup',
  },
} as const

const Email = ({ firstName, locale }: Props) => {
  const loc = normalizeLocale(locale)
  return (
    <EmailLayout preview={t(loc, dict, 'preview')} transactional locale={loc}>
      <Heading style={h1}>{t(loc, dict, 'welcome')}</Heading>
      <Text style={p}>{firstName ? t(loc, dict, 'hi', { name: firstName }) : t(loc, dict, 'hiThere')}</Text>
      <Text style={p}>{t(loc, dict, 'intro')}</Text>

      <Section style={card}>
        <Text style={{ margin: '0 0 8px', color: brand.goldDeep, fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
          {t(loc, dict, 'nextTitle')}
        </Text>
        <Text style={{ ...p, margin: 0 }}>{t(loc, dict, 'nextBody')}</Text>
      </Section>

      <Section style={{ margin: '4px 0 22px' }}>
        <Link href={`${APP_URL}/onboarding`} style={button()}>{t(loc, dict, 'cta')}</Link>
      </Section>

      <Heading style={{ ...h1, fontSize: '16px', margin: '8px 0 8px' }}>{t(loc, dict, 'whatYouGetTitle')}</Heading>
      <Text style={p} as="div">
        <ul style={{ paddingLeft: '20px', margin: 0, color: brand.body, fontSize: '14px', lineHeight: '22px' }}>
          <li style={{ marginBottom: '6px' }}>{t(loc, dict, 'g1')}</li>
          <li style={{ marginBottom: '6px' }}>{t(loc, dict, 'g2')}</li>
          <li style={{ marginBottom: '6px' }}>{t(loc, dict, 'g3')}</li>
        </ul>
      </Text>

      <Text style={{ ...p, marginTop: '18px' }}>{t(loc, dict, 'questions')}</Text>
      <Text style={{ ...p, marginBottom: 0 }}>{t(loc, dict, 'sign')}<br />{t(loc, dict, 'team')}</Text>
    </EmailLayout>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => {
    const loc = normalizeLocale(data?.locale)
    return t(loc, dict, 'subject')
  },
  displayName: 'Welcome',
  previewData: {
    locale: 'en',
    firstName: 'Alex',
  },
} satisfies TemplateEntry