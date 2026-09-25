import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

// One plain form for signing in, creating an account and resetting a password.
// Used by the sign-in prompt (a guest trying to change something) and by the
// /sign-in, /sign-up and /forgot-password pages. Errors show inline, next to
// the thing that went wrong, rather than in a toast that vanishes.

const COPY = {
  signin: { title: "Sign in", submit: "Sign in", google: "Continue with Google" },
  signup: { title: "Create your account", submit: "Create account", google: "Sign up with Google" },
  reset: { title: "Reset your password", submit: "Send reset link" },
};

function friendlyError(code) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      return "That email and password don't match.";
    case "auth/email-already-in-use":
      return "There's already an account with this email — sign in instead.";
    case "auth/invalid-email":
      return "That doesn't look like an email address.";
    case "auth/weak-password":
      return "Use at least 6 characters for the password.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a minute and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "";
    case "auth/network-request-failed":
      return "No connection. Check your network and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export default function AuthForm({ mode, onModeChange, onDone, autoFocus = true }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(null); // "form" | "google" | null
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const switchTo = (next) => {
    setError("");
    setSent(false);
    onModeChange(next);
  };

  async function submit(e) {
    e.preventDefault();
    setError("");
    const auth = getAuth();
    const address = email.trim();
    setBusy("form");
    try {
      if (mode === "reset") {
        await sendPasswordResetEmail(auth, address);
        setSent(true);
      } else if (mode === "signup") {
        if (password.length < 6) {
          setError(friendlyError("auth/weak-password"));
          return;
        }
        await createUserWithEmailAndPassword(auth, address, password);
        onDone?.("signup");
      } else {
        await signInWithEmailAndPassword(auth, address, password);
        onDone?.("signin");
      }
    } catch (err) {
      setError(friendlyError(err?.code));
    } finally {
      setBusy(null);
    }
  }

  async function google() {
    setError("");
    setBusy("google");
    try {
      await signInWithPopup(getAuth(), new GoogleAuthProvider());
      onDone?.("google");
    } catch (err) {
      setError(friendlyError(err?.code));
    } finally {
      setBusy(null);
    }
  }

  const input =
    "w-full h-11 px-3.5 rounded-xl text-[15px] bg-white dark:bg-white/[0.04] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border border-gray-300 dark:border-white/[0.12] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition";
  const link = "font-semibold text-indigo-600 dark:text-indigo-400 hover:underline";

  return (
    <div>
      <h2 className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-gray-50">{COPY[mode].title}</h2>

      {mode === "reset" && (
        <p className="mt-1.5 text-[14px] text-gray-500 dark:text-gray-400">
          Enter your email and we'll send you a link to choose a new password.
        </p>
      )}

      {mode !== "reset" && (
        <>
          <button
            type="button"
            onClick={google}
            disabled={!!busy}
            className="mt-5 w-full h-11 rounded-xl flex items-center justify-center gap-2.5 text-[15px] font-semibold text-gray-800 dark:text-gray-100 bg-white dark:bg-white/[0.05] border border-gray-300 dark:border-white/[0.12] hover:bg-gray-50 dark:hover:bg-white/[0.09] disabled:opacity-60 transition-colors"
          >
            <FcGoogle className="text-xl" />
            {busy === "google" ? "Opening Google…" : COPY[mode].google}
          </button>
          <div className="my-5 flex items-center gap-3 text-[12px] text-gray-400 dark:text-gray-500">
            <span className="h-px flex-1 bg-gray-200 dark:bg-white/[0.1]" />
            or with email
            <span className="h-px flex-1 bg-gray-200 dark:bg-white/[0.1]" />
          </div>
        </>
      )}

      {sent ? (
        <p className="mt-5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 px-4 py-3 text-[14px] text-emerald-800 dark:text-emerald-300">
          Check your inbox — a reset link is on its way to <b>{email.trim()}</b>.
        </p>
      ) : (
        <form onSubmit={submit} className={`space-y-3 ${mode === "reset" ? "mt-5" : ""}`}>
          <input
            type="email"
            autoComplete="email"
            autoFocus={autoFocus}
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={input}
          />
          {mode !== "reset" && (
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                placeholder={mode === "signup" ? "Password (6+ characters)" : "Password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${input} pr-16`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          )}

          {mode === "signin" && (
            <div className="flex justify-end">
              <button type="button" onClick={() => switchTo("reset")} className={`text-[13px] ${link}`}>
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <p role="alert" className="text-[13.5px] text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!!busy}
            className="w-full h-11 rounded-xl text-[15px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 shadow-sm transition-colors"
          >
            {busy === "form" ? "Please wait…" : COPY[mode].submit}
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-[14px] text-gray-500 dark:text-gray-400">
        {mode === "signin" && (
          <>
            New here?{" "}
            <button type="button" onClick={() => switchTo("signup")} className={link}>
              Create an account
            </button>
          </>
        )}
        {mode === "signup" && (
          <>
            Already have an account?{" "}
            <button type="button" onClick={() => switchTo("signin")} className={link}>
              Sign in
            </button>
          </>
        )}
        {mode === "reset" && (
          <button type="button" onClick={() => switchTo("signin")} className={link}>
            Back to sign in
          </button>
        )}
      </p>
    </div>
  );
}
