import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { HiOutlineMail } from "react-icons/hi";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import PulseLoader from "react-spinners/PulseLoader";
import AuthShell from "../../components/AuthShell";

export default function PasswordReset() {
  const [email, setEmail] = useState("");
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
    <AuthShell title="Reset password" taglines="We'll email you a secure reset link">
      <form onSubmit={handleResetPassword} className="space-y-4">
        <div className="flex items-center gap-3 h-12 px-4 rounded-xl bg-white/5 border border-white/10 focus-within:border-indigo-400/70 focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:bg-white/[0.07] transition-all">
          <HiOutlineMail className="text-lg text-slate-400 shrink-0" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="flex-1 bg-transparent text-[15px] text-slate-100 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isLoading}
          className="w-full h-12 text-[15px] font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 bg-[length:200%_100%] bg-left hover:bg-right shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-[background-position,box-shadow] duration-500 disabled:opacity-60"
        >
          {isLoading ? <PulseLoader color="#fff" size={9} /> : "Send reset email"}
        </motion.button>
      </form>

      <div className="text-center mt-5">
        <a href="/sign-in" className="text-[13px] text-indigo-300 hover:text-indigo-200 hover:underline font-medium">
          Back to sign in
        </a>
      </div>
    </AuthShell>
  );
}
