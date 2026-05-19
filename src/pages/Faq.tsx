import { Helmet } from "react-helmet-async";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router-dom";

type QA = { q: string; a: React.ReactNode };
type Section = { title: string; items: QA[] };

const sections: Section[] = [
  {
    title: "Getting started",
    items: [
      {
        q: "What is Swappup?",
        a: "Swappup is a peer-to-peer marketplace for flight tickets. If your plans change, you can list your unused ticket and recover its value. If you're looking for a flight, you can buy a seat from a real traveller — often well below the airline's current price.",
      },
      {
        q: "Who can use Swappup?",
        a: "Anyone aged 18 or over with a valid government-issued ID. Every account is ID-verified before you can buy or sell.",
      },
      {
        q: "How do I sign up?",
        a: (
          <>
            Create an account from the{" "}
            <Link to="/sign-up" className="text-primary underline">
              Sign up
            </Link>{" "}
            page. After signing up you'll go through a quick 6-step setup including ID
            verification. This unlocks buying and selling.
          </>
        ),
      },
      {
        q: "Which countries and airlines are supported?",
        a: "Swappup works globally for any flight on an airline that allows passenger name changes. Whether a specific ticket can be transferred depends on the airline and the fare rules — we check this for you when you list it.",
      },
    ],
  },
  {
    title: "Pricing",
    items: [
      {
        q: "How much does it cost to list a ticket?",
        a: "Listing a ticket on Swappup is completely free. You only pay anything if your ticket actually sells.",
      },
      {
        q: "Are there any fees for buyers or sellers?",
        a: "Swappup charges a small service fee on successful transactions to cover payment processing, secure payment handling, identity verification and platform operations. The exact amount is always shown clearly before you confirm a purchase or accept an offer — there are no surprises at checkout.",
      },
      {
        q: "Who pays the airline name-change fee?",
        a: "The buyer pays the airline's name-change fee on top of the ticket price. We estimate it upfront based on the airline, hold it safely at checkout, and release it to the seller once the transfer is confirmed.",
      },
      {
        q: "How do I set my price?",
        a: "You choose the price when you list. The only rule is that you can't list above the original price you paid the airline — this keeps the marketplace fair and prevents scalping.",
      },
    ],
  },
  {
    title: "Buyer protection & safety",
    items: [
      {
        q: "How do I know the ticket is real?",
        a: "Every listing is checked against the airline's booking reference. Sellers must upload proof of purchase, and our system verifies the flight details (route, date, airline, passenger count) before the listing goes live.",
      },
      {
        q: "What happens to my money before I receive the ticket?",
        a: "Your payment is held safely by Swappup. The seller is only paid once you confirm the ticket has been transferred into your name. If the transfer doesn't happen on time, you are refunded automatically.",
      },
      {
        q: "What if the seller doesn't transfer the ticket?",
        a: "Sellers have a strict 24-hour deadline to complete the transfer after a purchase. If they miss it, the order is cancelled and you get a full refund — no questions asked.",
      },
      {
        q: "Are other users verified?",
        a: "Yes. Every Swappup account passes AI-powered ID verification before they can buy or sell. We also run anti-fraud checks on every listing and block self-dealing and unrealistic prices automatically.",
      },
    ],
  },
  {
    title: "Selling on Swappup",
    items: [
      {
        q: "How do I list a ticket?",
        a: "From your account, tap Sell, upload your booking confirmation, and our system will extract the flight details automatically. Review, set your price, and publish. It takes about a minute.",
      },
      {
        q: "Can I sell any ticket?",
        a: "Only tickets on airlines that allow passenger name changes. We tell you upfront whether your specific airline supports it, what the typical fee is, and any conditions.",
      },
      {
        q: "When do I get paid?",
        a: "After the buyer purchases, you have 24 hours to complete the name change with the airline. Once the buyer confirms receipt, your payout is released to your linked account.",
      },
      {
        q: "Can I cancel a listing?",
        a: "Yes, anytime before a buyer purchases it. Once a purchase has been made, you're committed to completing the transfer within 24 hours.",
      },
    ],
  },
  {
    title: "Buying on Swappup",
    items: [
      {
        q: "How do I find a flight?",
        a: "Use the Browse page or our AI Search to describe where and when you want to travel. Filter by date, airline, price, or destination type.",
      },
      {
        q: "How long does the transfer take?",
        a: "Most airlines process name changes within a few hours. The seller has up to 24 hours after purchase to complete it. You'll receive an email and in-app notification at each step.",
      },
      {
        q: "What if I change my mind after buying?",
        a: "Because tickets are tied to flight dates, all sales are final once you confirm the ticket is in your name. Before that point, your payment is held safely and refundable if the transfer doesn't go through.",
      },
    ],
  },
  {
    title: "Account & support",
    items: [
      {
        q: "How do I contact support?",
        a: "Signed-in users can reach our team from the Support page inside the app. We typically reply within one business day.",
      },
      {
        q: "How is my data handled?",
        a: (
          <>
            We're UK GDPR compliant. You can export or delete your data at any time
            from your account settings. See our{" "}
            <Link to="/privacy-policy" className="text-primary underline">
              Privacy Policy
            </Link>{" "}
            for details.
          </>
        ),
      },
      {
        q: "How do I close my account?",
        a: "From Account → Privacy & Data, you can permanently delete your account and personal data at any time.",
      },
    ],
  },
];

export default function Faq() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: sections.flatMap((s) =>
      s.items.map((it) => ({
        "@type": "Question",
        name: it.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: typeof it.a === "string" ? it.a : it.q,
        },
      })),
    ),
  };

  return (
    <MarketingLayout>
      <Helmet>
        <title>FAQ & Help Centre | Swappup</title>
        <meta
          name="description"
          content="Answers to the most common questions about Swappup: pricing, buyer protection, how selling and buying flight tickets works, and account support."
        />
        <link rel="canonical" href="https://swappup.com/faq" />
        <meta property="og:title" content="FAQ & Help Centre | Swappup" />
        <meta
          property="og:description"
          content="Pricing, buyer protection, selling, buying and account support — all in one place."
        />
        <meta property="og:url" content="https://swappup.com/faq" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Frequently asked questions
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Everything you need to know about pricing, protection and using Swappup —
          for both first-time visitors and existing travellers.
        </p>

        <div className="mt-12 space-y-12">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-semibold text-foreground">
                {section.title}
              </h2>
              <Accordion type="single" collapsible className="mt-4">
                {section.items.map((item, idx) => (
                  <AccordionItem
                    key={item.q}
                    value={`${section.title}-${idx}`}
                    className="border-border/50"
                  >
                    <AccordionTrigger className="text-left text-base font-medium">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-border/50 bg-secondary/30 p-6 text-center">
          <h2 className="text-lg font-semibold">Still need help?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Signed-in users can reach our team from the in-app Support page. New
            here?{" "}
            <Link to="/sign-up" className="text-primary underline">
              Create an account
            </Link>{" "}
            to get started.
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}