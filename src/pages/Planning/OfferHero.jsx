import { Button } from "../../components/ui";

// What a signed-out visitor sees first on the landing page: what the site is,
// what's in it, and the two ways in (the tour, or signing in).

const OFFERS = [
  "350+ most-asked DSA problems",
  "Java & Spring Boot, made simple",
  "Your notes on every topic",
  "Track every job application",
  "Contest alerts in your inbox",
  "Plan your day, focus with Pomodoro",
];

export default function OfferHero({ onTour, onSignIn }) {
  return (
    <section className="rounded-lg border border-line bg-canvas px-5 sm:px-8 py-7 sm:py-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="min-w-0">
          <p className="font-mono text-[12px] font-medium text-fg-subtle">Interview prep, planned</p>
          <h2 className="mt-2 text-[26px] leading-8 sm:text-[32px] sm:leading-10 font-semibold tracking-[-0.02em] text-fg">
            Plan it. Learn it. Get the offer.
          </h2>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <Button variant="primary" onClick={onTour}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M5 3l9 5-9 5z" />
            </svg>
            Take a quick tour
          </Button>
          <Button onClick={onSignIn}>Sign in to plan your own</Button>
        </div>
      </div>

      <ul className="mt-6 pt-5 border-t border-line grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2.5">
        {OFFERS.map((o) => (
          <li key={o} className="flex items-center gap-2.5 text-[14px] text-fg-muted">
            <svg className="w-4 h-4 shrink-0 text-success" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {o}
          </li>
        ))}
      </ul>
    </section>
  );
}
