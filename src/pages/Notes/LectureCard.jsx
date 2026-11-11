import React, { Suspense, lazy, useState } from "react";
import { Button, Icon } from "../../components/ui";

const LecturePlayer = lazy(() => import("./LecturePlayer"));

// The lecture as a closed card: nothing of it (player, script, narration) is
// loaded until "Watch" is clicked, so the page opens as fast as one without it.
// Used by topic pages (TopicLead) and the Python/FastAPI question banks.
export function LectureCard({ id, minutes }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mt-6 rounded-lg border border-line bg-canvas overflow-hidden">
      <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 bg-surface-subtle ${open ? "border-b border-line" : ""}`}>
        <span className="text-fg-subtle">
          <Icon.play />
        </span>
        <p className="text-[15px] leading-[22px] font-semibold text-fg">Watch the lecture</p>
        {minutes && <p className="font-mono text-[12px] tabular-nums text-fg-subtle">{minutes} min · narrated · captions</p>}
        <Button variant={open ? "secondary" : "primary"} size="sm" className="ml-auto" onClick={() => setOpen((o) => !o)}>
          {open ? "Close" : "Watch"}
        </Button>
      </div>
      {open && (
        <Suspense fallback={<div className="aspect-video w-full bg-[#0c1018] animate-pulse" />}>
          <LecturePlayer id={id} autoPlay />
        </Suspense>
      )}
    </section>
  );
}
