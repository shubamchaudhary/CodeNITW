import React, { useEffect, useState } from "react";
import AuthForm from "./AuthForm";
import { onSignInRequest, onAuthStateChange } from "../Data/authGate";

// The one sign-in prompt. It opens when a guest tries to change something
// (see authGate.requireAuth / the store's guest guard) or presses "Sign in" in
// the header, and closes itself once they're signed in.
export default function AuthPrompt() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState("signin");

  useEffect(
    () =>
      onSignInRequest((why) => {
        setReason(why || "");
        setMode("signin");
        setOpen(true);
      }),
    []
  );

  useEffect(() => onAuthStateChange((state) => state === "user" && setOpen(false)), []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary"
      onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[400px] rounded-lg bg-canvas border border-line shadow-overlay p-6 sm:p-7"
      >
        <button
          onClick={() => setOpen(false)}
          title="Close"
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg flex items-center justify-center text-fg-subtle hover:text-fg hover:bg-surface-hover"
        >
          ✕
        </button>

        {reason && mode !== "reset" && (
          <p className="mb-3 pr-8 text-[13.5px] leading-relaxed text-fg-subtle">{reason}</p>
        )}

        <AuthForm
          mode={mode}
          onModeChange={setMode}
          onDone={() => setOpen(false)}
        />
      </div>
    </div>
  );
}
