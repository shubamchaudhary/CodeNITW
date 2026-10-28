import PageShell from "./PageShell";

// What a page shows while its code or data is still on the way: the page's
// own background with a few pulsing placeholder rows, instead of a blank
// screen.
const bar = "rounded bg-surface-hover";
const card = "rounded-lg border border-line bg-canvas";

export default function PageSkeleton() {
  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 animate-pulse" aria-busy="true" aria-label="Loading">
        <div className="space-y-3">
          <div className={`${bar} h-8 w-56`} />
          <div className={`${bar} h-3 w-80 max-w-[60vw]`} />
        </div>
        <div className="mt-6 flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`${bar} h-7 w-16`} />
          ))}
        </div>
        <div className={`${card} mt-6 divide-y divide-line`}>
          {[72, 56, 64, 48, 60, 52].map((w, i) => (
            <div key={i} className="px-4 py-3.5 flex items-center gap-4">
              <div className="h-4 w-4 rounded-full border-[1.5px] border-line-strong" />
              <div className={`${bar} h-3.5`} style={{ width: `${w * 0.6}%` }} />
              <div className={`${bar} h-3 w-20 ml-auto hidden sm:block`} />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
