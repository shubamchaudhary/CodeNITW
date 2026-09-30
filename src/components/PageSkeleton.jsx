import PageShell from "./PageShell";

// What a page shows while its code or data is still on the way: the page's
// own background with a few pulsing placeholder cards, instead of a blank
// screen.
const bar = "rounded-md bg-gray-200/80 dark:bg-white/[0.06] light:bg-gray-200";
const card = "rounded-2xl border border-gray-200/70 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] light:bg-white";

export default function PageSkeleton() {
  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 animate-pulse" aria-busy="true" aria-label="Loading">
        <div className={`${card} p-6 flex items-center justify-between`}>
          <div className="space-y-3">
            <div className={`${bar} h-7 w-48`} />
            <div className={`${bar} h-3 w-72 max-w-[60vw]`} />
          </div>
          <div className="h-14 w-14 rounded-full border-4 border-gray-200/80 dark:border-white/[0.06]" />
        </div>
        <div className="mt-5 flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`${bar} h-8 w-16`} />
          ))}
        </div>
        <div className="mt-5 space-y-3">
          {[72, 56, 64, 48, 60, 52].map((w, i) => (
            <div key={i} className={`${card} px-5 py-4 flex items-center gap-4`}>
              <div className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-white/10" />
              <div className={`${bar} h-4`} style={{ width: `${w * 0.6}%` }} />
              <div className={`${bar} h-2 w-24 ml-auto hidden sm:block`} />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
