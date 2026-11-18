import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button, Icon } from "../../components/ui";
import { buildInterviewPrompt } from "../../Data/aiStackInterview";

// A mock interview for an AI Stack design page. The prompt carries the
// problem's hidden facts and the page as the answer key, so it is copied and
// never shown: reading it would spoil the interview. It is built as the card
// mounts, so the click copies at once (Safari refuses a clipboard write that
// comes after waiting on a load).
export default function InterviewPromptCard({ id, owner }) {
  const [prompt, setPrompt] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    setPrompt(null);
    setCopied(false);
    buildInterviewPrompt(id, owner).then((p) => live && setPrompt(p));
    return () => {
      live = false;
    };
  }, [id, owner]);

  const tokens = prompt ? Math.round(prompt.length / 4 / 1000) : null;

  const copy = () => {
    if (!prompt) return;
    copyText(prompt).then((ok) => {
      if (!ok) {
        toast.error("Couldn't copy. Allow clipboard access for this site and try again.");
        return;
      }
      setCopied(true);
      toast.success("Interview prompt copied.");
    });
  };

  return (
    <section className="mt-6 rounded-lg border border-line bg-canvas overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 bg-surface-subtle">
        <div className="min-w-0 flex-1 flex gap-3">
          <span className="pt-[3px] text-fg-subtle">
            <Icon.mic />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] leading-[22px] font-semibold text-fg">Mock interview on this problem</p>
            <p className="mt-0.5 text-[13px] leading-snug text-fg-muted">Paste it into Claude and use voice mode.</p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-3 pl-7 sm:pl-0">
          {tokens != null && <p className="font-mono text-[12px] tabular-nums text-fg-subtle">≈ {tokens}k tokens</p>}
          <Button variant={copied ? "secondary" : "primary"} size="sm" onClick={copy} disabled={!prompt}>
            {copied ? <Icon.check /> : <Icon.copy />}
            {copied ? "Copied" : "Copy AI interview prompt"}
          </Button>
        </div>
      </div>
    </section>
  );
}

// The async clipboard first; the old selection copy where it is missing or
// refused (an http page, an embedded browser).
function copyText(text) {
  const fallback = () => {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (_) {}
    area.remove();
    return ok;
  };
  if (!navigator.clipboard?.writeText) return Promise.resolve(fallback());
  return navigator.clipboard.writeText(text).then(
    () => true,
    () => fallback()
  );
}
