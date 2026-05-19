import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, ShieldCheck, Wallet, Sparkles, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export default function Landing() {
  return (
    <MarketingLayout>
      <Helmet>
        <title>Swappup — Buy & resell unused flight tickets</title>
        <meta
          name="description"
          content="Swappup is the peer-to-peer marketplace where travellers recover the value of unused flight tickets and buy seats from real people, securely."
        />
        <link rel="canonical" href="https://swappup.com/" />
        <meta property="og:title" content="Swappup — Buy & resell unused flight tickets" />
        <meta
          property="og:description"
          content="Recover value from unused flights and buy seats from real travellers. Secure escrow, ID-verified users."
        />
        <meta property="og:url" content="https://swappup.com/" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Don&apos;t cancel your flight. <span className="text-primary">Swap it.</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Plans changed? List your ticket for free and recover its value. Need a seat?
              Buy one from a real traveller, often well below the airline&apos;s price.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
              <Button asChild variant="gold" size="lg" className="min-w-44">
                <Link to="/sign-up">
                  Get started
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-w-44">
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>
          </div>

          {/* Product screens placeholder */}
          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass aspect-[9/16] rounded-2xl border border-border/50 bg-secondary/30 flex items-center justify-center text-xs text-muted-foreground"
              >
                Product screen {i}
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {/* TODO: replace with real product screenshots */}
            Drop real screenshots into these slots.
          </p>
        </div>
      </section>

      {/* Value */}
      <section className="border-t border-border/50 bg-secondary/20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="space-y-5">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Turn unused tickets into cash
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Airlines rarely refund non-flexible fares. Swappup gives that money a
                second life — your ticket becomes someone else&apos;s trip, and you
                walk away with the value back in your wallet.
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                  <span>Set your price. We never take more than you decide is fair.</span>
                </li>
                <li className="flex gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                  <span>Sell to ID-verified travellers — no anonymous resellers.</span>
                </li>
                <li className="flex gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                  <span>Funds held in escrow until the airline name change is done.</span>
                </li>
              </ul>
            </div>
            <div className="space-y-5">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Find seats real people aren&apos;t using
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Browse last-minute flights from travellers whose plans fell through.
                Often cheaper than the airline&apos;s live price, always with the same
                seat, the same flight, the same airline.
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                  <span>Search by route, date or destination — even in natural language.</span>
                </li>
                <li className="flex gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                  <span>Transferability checked automatically before you buy.</span>
                </li>
                <li className="flex gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                  <span>Money back if the transfer doesn&apos;t complete in 24 hours.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* USPs */}
      <section className="border-t border-border/50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-2xl text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why Swappup</h2>
            <p className="text-muted-foreground">
              Built around the things that actually matter when money and travel meet.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Sparkles,
                title: "Effortless listing",
                body: "Snap your e-ticket. Our AI fills in the flight details for you.",
              },
              {
                icon: ShieldCheck,
                title: "Secure escrow",
                body: "Buyer funds are held until the ticket is officially in your name.",
              },
              {
                icon: BadgeCheck,
                title: "ID-verified users",
                body: "Every seller and buyer is verified against an official ID document.",
              },
              {
                icon: Wallet,
                title: "Real value recovered",
                body: "Travellers recover money that airlines would otherwise keep.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="glass rounded-2xl border border-border/50 p-6 space-y-3"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border/50 bg-gradient-to-b from-secondary/10 to-background">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to swap your next flight?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Free to join. List or browse in minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="gold" size="lg" className="min-w-48">
              <Link to="/sign-up">
                Create your account
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link to="/login">Login</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}