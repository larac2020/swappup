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
          content="Swappup is where travellers resell flights they can't use and find seats from people whose plans changed — safely and ID-checked."
        />
        <link rel="canonical" href="https://swappup.com/" />
        <meta property="og:title" content="Swappup — Buy & resell unused flight tickets" />
        <meta
          property="og:description"
          content="Get money back for flights you can't take, or grab a seat someone else can't use. Payments held safely until the ticket is in your name."
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
              Plans changed? List your ticket for free and get your money back. Need a seat?
              Grab one from someone who can&apos;t fly anymore — usually for less than the airline charges.
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
                Most airlines won&apos;t refund your ticket if your plans change. Swappup helps
                you get that money back — someone else takes your seat, and you walk away with
                cash in your pocket.
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                  <span>You pick the price. You&apos;re in charge.</span>
                </li>
                <li className="flex gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                  <span>Only sell to people who&apos;ve shown us a real ID — no anonymous buyers.</span>
                </li>
                <li className="flex gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                  <span>We hold the buyer&apos;s money safely until they confirm the ticket is in their name.</span>
                </li>
              </ul>
            </div>
            <div className="space-y-5">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Find seats other travellers can&apos;t use
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Browse flights from travellers whose plans fell through. Often cheaper than
                booking direct — same seat, same flight, same airline.
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                  <span>Search by route, date or destination — or just tell us where you fancy going.</span>
                </li>
                <li className="flex gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                  <span>We check the ticket can actually be transferred before you pay.</span>
                </li>
                <li className="flex gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary shrink-0" />
                  <span>If the ticket isn&apos;t in your name within 24 hours, you get your money back.</span>
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
                body: "Snap a photo of your ticket — we fill in the flight details for you.",
              },
              {
                icon: ShieldCheck,
                title: "Protected payments",
                body: "We hold the buyer's money and only pass it on once the ticket is properly in their name.",
              },
              {
                icon: BadgeCheck,
                title: "ID-verified users",
                body: "Everyone on Swappup checks in with a real ID before buying or selling.",
              },
              {
                icon: Wallet,
                title: "Real value recovered",
                body: "Get back the money the airline would otherwise pocket.",
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
            Free to join. Takes a minute to list a ticket or find one.
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