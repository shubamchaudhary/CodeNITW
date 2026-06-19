import React, { useState } from "react";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser } from "react-icons/hi";
import { motion } from "framer-motion";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import PulseLoader from "react-spinners/PulseLoader";
import AuthShell from "../../components/AuthShell";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setIsLoading(true);
    try {
      const auth = getAuth();
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) {
        await updateProfile(user, { displayName: name.trim() });
      }
      toast.success("Account created!");
      navigate("/interview-prep");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        toast.error("An account with this email already exists.");
      } else if (error.code === "auth/invalid-email") {
        toast.error("Please enter a valid email address.");
      } else {
        toast.error("Could not create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const inputWrap =
    "flex items-center gap-2 h-11 px-3 rounded-xl bg-white/5 border border-white/10 focus-within:border-indigo-400/70 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all";
  const inputBase =
    "flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none";

  return (
    <AuthShell
      title="Create account"
      taglines={["Start learning.", "Your private workspace.", "Track every win."]}
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div className={inputWrap}>
          <HiOutlineUser className="text-lg text-slate-400 shrink-0" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            className={inputBase}
          />
        </div>

        <div className={inputWrap}>
          <HiOutlineMail className="text-lg text-slate-400 shrink-0" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className={inputBase}
          />
        </div>

        <div className={inputWrap}>
          <HiOutlineLockClosed className="text-lg text-slate-400 shrink-0" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 6 chars)"
            required
            className={inputBase}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-slate-400 hover:text-slate-200 transition-colors shrink-0"
          >
            {showPassword ? <AiFillEye className="text-lg" /> : <AiFillEyeInvisible className="text-lg" />}
          </button>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isLoading}
          className="w-full h-11 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow disabled:opacity-60"
        >
          {isLoading ? <PulseLoader color="#fff" size={9} /> : "Create account"}
        </motion.button>
      </form>

      <p className="text-center text-xs text-slate-400 mt-4">
        Already have an account?{" "}
        <a href="/sign-in" className="text-indigo-300 hover:text-indigo-200 hover:underline font-medium">
          Sign in
        </a>
      </p>
    </AuthShell>
  );
}
