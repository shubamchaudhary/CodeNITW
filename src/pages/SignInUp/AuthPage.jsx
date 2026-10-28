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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-surface-subtle">
      <button onClick={() => navigate("/core-stack")} className="mb-6" aria-label={`${SITE_NAME} home`}>
        <Brand size="lg" />
      </button>
      <div className="w-full max-w-[400px] rounded-lg bg-canvas border border-line p-6 sm:p-7">
        <AuthForm
          mode={mode}
          onModeChange={setMode}
        />
      </div>
      <button
        onClick={() => navigate("/core-stack")}
        className="mt-6 text-[14px] font-medium text-fg-subtle hover:text-fg"
      >
        ← Browse without signing in
      </button>
    </div>
  );
}
