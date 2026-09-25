import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[400px] rounded-2xl bg-white dark:bg-[#121a30] border border-gray-200 dark:border-white/[0.08] shadow-2xl p-6 sm:p-7"
      >
        <button
          onClick={() => setOpen(false)}
          title="Close"
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
        >
          ✕
        </button>

        {mode !== "reset" && (
          <p className="mb-3 pr-8 text-[13.5px] leading-relaxed text-gray-500 dark:text-gray-400">
            {reason || "Browsing is open to everyone. Sign in to keep your progress, notes and highlights — they're saved to your account and follow you across devices."}
          </p>
        )}

        <AuthForm
          mode={mode}
          onModeChange={setMode}
          onDone={(how) => {
            setOpen(false);
            toast.success(how === "signup" ? "Account created — you're all set." : "Signed in. Go ahead.");
          }}
        />
      </div>
    </div>
  );
}
