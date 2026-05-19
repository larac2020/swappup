import { Helmet } from "react-helmet-async";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export default function About() {
  return (
    <MarketingLayout>
      <Helmet>
        <title>About Swappup</title>
        <meta
          name="description"
          content="Swappup is on a mission to make air travel less wasteful. Learn who we are, what we do and why we built a peer-to-peer ticket marketplace."
        />
        <link rel="canonical" href="https://swappup.com/about" />
        <meta property="og:title" content="About Swappup" />
        <meta property="og:description" content="Our mission: make air travel less wasteful." />
        <meta property="og:url" content="https://swappup.com/about" />
        <meta property="og:type" content="website" />
      </Helmet>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">About Swappup</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          A peer-to-peer marketplace for flight tickets that would otherwise go to waste.
        </p>

        <div className="prose prose-invert mt-10 max-w-none prose-headings:font-semibold prose-h2:text-xl prose-h2:mt-10 prose-p:text-foreground/90 prose-p:leading-relaxed">
          <h2>What we do</h2>
          <p>
            Swappup lets travellers buy and resell unused flight tickets. When your
            plans change, instead of losing the value of your ticket, you can pass it
            on — securely — to someone who needs it. And when you&apos;re looking for
            a flight, you can find seats from real travellers, often cheaper than the
            airline&apos;s current price.
          </p>

          <h2>Who it&apos;s for</h2>
          <p>
            For anyone whose travel plans don&apos;t always go to plan. For frequent
            flyers, last-minute changers, students, families, freelancers. For people
            who hate seeing money — and seats — go to waste.
          </p>

          <h2>Our mission</h2>
          <p>
            Make air travel less wasteful. Every year, millions of flight tickets go
            unused. The seats fly anyway. Swappup connects those tickets to people
            who want them, so value flows back to travellers instead of disappearing.
          </p>

          <h2>Our vision</h2>
          <p>
            A world where buying and reselling a flight ticket is as natural as
            reselling a concert ticket — fast, fair, verified, and trusted. We want
            Swappup to be the default place travellers go when their plans shift.
          </p>

          <h2>How we keep it safe</h2>
          <p>
            Every user is ID-verified. Every payment is held safely by Swappup
            until the buyer confirms the ticket is in their name.
            Sellers have a strict 24-hour deadline
            to complete the transfer, and buyers are refunded automatically if they
            don&apos;t. Our anti-fraud system blocks self-dealing and unrealistic
            prices before they ever reach the marketplace.
          </p>
        </div>
      </section>
    </MarketingLayout>
  );
}