import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroIllustration } from "@/components/hero-illustration";
import { ProductCard } from "@/components/product-card";
import { getProducts } from "@/lib/products";

const steps = [
  {
    number: "1",
    title: "Pick a day",
    description: "Founders choose when their product goes live.",
  },
  {
    number: "2",
    title: "Launch",
    description: "It's on the front page for that day, and only that day.",
  },
  {
    number: "3",
    title: "Vote",
    description: "The community decides what rises to the top.",
  },
];

const roles = [
  {
    name: "Visitors",
    description: "Browse every launch. No account, no cost.",
  },
  {
    name: "Members",
    description: "Vote, comment, and follow the founders you like.",
  },
  {
    name: "Founders",
    description: "Pick a day, submit your product, and launch.",
  },
];

export default function Home() {
  const todaysLaunches = getProducts().slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-6 py-24">
          <div className="grid gap-16 lg:grid-cols-[1fr_260px] lg:items-center">
            <div className="max-w-2xl">
              <h1 className="enter font-display text-5xl leading-[1.08] tracking-tight sm:text-6xl">
                The front page starts over every morning.
              </h1>
              <p
                className="enter mt-6 max-w-lg text-lg text-muted"
                style={{ animationDelay: "0.08s" }}
              >
                Founders launch one product on a day they choose. The
                community votes, and the best rise before the day is over.
                Tomorrow, everyone starts again from zero.
              </p>
              <div
                className="enter mt-10 flex items-center gap-6"
                style={{ animationDelay: "0.16s" }}
              >
                <Link
                  href="/signup"
                  className="rounded-full bg-gold-fill px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90"
                >
                  Sign up
                </Link>
                <Link
                  href="/products"
                  className="text-sm text-muted transition-colors hover:text-foreground"
                >
                  See today&apos;s launches
                </Link>
              </div>
            </div>

            <HeroIllustration className="enter hidden h-auto w-full text-foreground lg:block" />
          </div>
        </div>

        <section className="border-t border-hairline">
          <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-16 sm:grid-cols-[12rem_1fr]">
            <div>
              <h2 className="font-display text-2xl">Today&apos;s launches</h2>
              <p className="mt-2 text-sm text-muted">
                Ranked by votes, weighted toward what&apos;s fresh.
              </p>
            </div>
            <div>
              <div className="divide-y divide-hairline">
                {todaysLaunches.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    rank={index + 1}
                  />
                ))}
              </div>
              <Link
                href="/products"
                className="mt-6 inline-block text-sm text-muted transition-colors hover:text-foreground"
              >
                See all products
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t border-hairline">
          <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-16 sm:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="sm:border-l sm:border-hairline sm:pl-8 sm:first:border-l-0 sm:first:pl-0"
              >
                <div className="font-display text-3xl text-gold">
                  {step.number}
                </div>
                <h2 className="mt-3 text-base font-medium">{step.title}</h2>
                <p className="mt-2 text-sm text-muted">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-hairline">
          <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-16 sm:grid-cols-[12rem_1fr]">
            <h2 className="font-display text-2xl">Who it&apos;s for</h2>
            <div className="divide-y divide-hairline">
              {roles.map((role) => (
                <div key={role.name} className="py-6 first:pt-0 last:pb-0">
                  <h3 className="text-base font-medium">{role.name}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {role.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-hairline">
          <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-16 sm:grid-cols-[12rem_1fr]">
            <h2 className="font-display text-2xl">Why it&apos;s fair</h2>
            <p className="max-w-xl text-base text-muted">
              Every submission is checked by a person before it appears
              anywhere on the site. And rank isn&apos;t just a vote count. A
              product that earns twenty votes in its first hour outranks one
              that earns thirty across the whole day. Early momentum counts.
            </p>
          </div>
        </section>

        <section className="border-t border-hairline">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-16 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-2xl">Have something to launch?</p>
            <Link
              href="/signup"
              className="w-fit rounded-full bg-gold-fill px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-gold-fill/90"
            >
              Sign up
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
