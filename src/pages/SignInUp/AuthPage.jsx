import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../../components/AuthForm";
import Brand, { SITE_NAME } from "../../components/Brand";
import { getAuthState, onAuthStateChange } from "../../Data/authGate";

// The standalone /sign-in, /sign-up and /forgot-password pages: the same form
// as the prompt, on a plain page. Nobody has to come here to use the site —
// it's for bookmarks and old links.
export default function AuthPage({ initialMode = "signin" }) {
  const [mode, setMode] = useState(initialMode);
  const navigate = useNavigate();

  useEffect(() => setMode(initialMode), [initialMode]);

  // Already signed in (or just finished signing in) → straight to the app.
  useEffect(() => {
    if (getAuthState() === "user") navigate("/core-stack", { replace: true });
    return onAuthStateChange((s) => s === "user" && navigate("/core-stack", { replace: true }));
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gray-50 dark:bg-[#0b1020] light:bg-[#f7f7f9] light:bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(124,58,237,0.08),transparent_70%)]">
      <button onClick={() => navigate("/core-stack")} className="mb-6" aria-label={`${SITE_NAME} home`}>
        <Brand size="lg" />
      </button>
      <div className="w-full max-w-[400px] rounded-2xl bg-white dark:bg-[#121a30] border border-gray-200 dark:border-white/[0.08] shadow-sm light:border-slate-900/[0.08] light:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-16px_rgba(15,23,42,0.16)] p-6 sm:p-7">
        <AuthForm
          mode={mode}
          onModeChange={setMode}
        />
      </div>
      <button
        onClick={() => navigate("/core-stack")}
        className="mt-6 text-[14px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
      >
        ← Browse without signing in
      </button>
    </div>
  );
}
