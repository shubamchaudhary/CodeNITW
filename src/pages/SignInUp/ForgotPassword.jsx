import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import PulseLoader from "react-spinners/PulseLoader";
import { ALLOWED_EMAIL } from "../../Data/planStore";

export default function PasswordReset() {
  const [email, setEmail] = useState(ALLOWED_EMAIL);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error("Please enter a valid email address");
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(getAuth(), value);
      toast.success("Password reset email sent! Check your inbox.");
      setTimeout(() => navigate("/sign-in"), 1500);
    } catch (error) {
      if (error.code === "auth/too-many-requests") {
        toast.error("Too many attempts. Please try again later.");
      } else {
        toast.error("Failed to send reset email. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 dark:from-indigo-400 dark:via-violet-400 dark:to-indigo-300">
            Reset password
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">We'll email you a reset link</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xl p-6">
          <form onSubmit={handleResetPassword} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full h-11 px-4 text-sm bg-gray-50 dark:bg-slate-900/60 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              {isLoading ? <PulseLoader color="#fff" size={10} /> : "Send reset email"}
            </button>
          </form>

          <div className="text-center mt-4">
            <a href="/sign-in" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
              Back to sign in
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
