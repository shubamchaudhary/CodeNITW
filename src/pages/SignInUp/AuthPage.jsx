import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AuthForm from "../../components/AuthForm";
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gray-50 dark:bg-[#0b1020]">
      <button
        onClick={() => navigate("/core-stack")}
        className="mb-6 text-[20px] font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400"
      >
        Learning Resources
      </button>
      <div className="w-full max-w-[400px] rounded-2xl bg-white dark:bg-[#121a30] border border-gray-200 dark:border-white/[0.08] shadow-sm p-6 sm:p-7">
        <AuthForm
          mode={mode}
          onModeChange={setMode}
          onDone={(how) => toast.success(how === "signup" ? "Account created — you're all set." : "Welcome back!")}
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
