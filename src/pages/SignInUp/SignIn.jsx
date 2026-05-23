import React, { useState } from "react";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import { HiOutlineMail, HiOutlineLockClosed } from "react-icons/hi";
import { motion } from "framer-motion";
import {
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  getAuth,
} from "firebase/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import PulseLoader from "react-spinners/PulseLoader";
import { ALLOWED_EMAIL } from "../../Data/planStore";
import AuthShell from "../../components/AuthShell";

export default function SignIn() {
  const [email, setEmail] = useState(ALLOWED_EMAIL);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();

  async function enforceOwner(auth, user) {
    if (user.email !== ALLOWED_EMAIL) {
      await signOut(auth);
      toast.error("This is a private app.");
      return false;
    }
    return true;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const auth = getAuth();
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      if (await enforceOwner(auth, user)) {
        toast.success("Welcome back!");
        navigate("/interview-prep");
      }
    } catch (error) {
      toast.error("Email and password didn't match");
    } finally {
      setIsLoading(false);
    }
  }

  async function signInWithGoogle() {
    setIsGoogleLoading(true);
    try {
      const auth = getAuth();
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      if (await enforceOwner(auth, result.user)) {
        toast.success("Welcome back!");
        navigate("/interview-prep");
      }
    } catch (error) {
      toast.error("Failed to sign in with Google. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  }

  const inputWrap =
    "flex items-center gap-2 h-11 px-3 rounded-xl bg-white/5 border border-white/10 focus-within:border-indigo-400/70 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all";
  const inputBase =
    "flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none";

  return (
    <AuthShell
      title="InterviewPrep"
      taglines={["Crack the interview.", "Master the patterns.", "Stay consistent.", "Track every win."]}
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div className={inputWrap}>
          <HiOutlineMail className="text-lg text-slate-400 shrink-0" />
          <input
            id="email"
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
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
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

        <div className="flex justify-end">
          <a href="/forgot-password" className="text-xs text-indigo-300 hover:text-indigo-200 hover:underline font-medium">
            Forgot password?
          </a>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isLoading}
          className="w-full h-11 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-shadow disabled:opacity-60"
        >
          {isLoading ? <PulseLoader color="#fff" size={9} /> : "Sign In"}
        </motion.button>
      </form>

      <div className="flex items-center my-4">
        <div className="flex-grow border-t border-white/10" />
        <span className="px-3 text-xs text-slate-500">OR</span>
        <div className="flex-grow border-t border-white/10" />
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={signInWithGoogle}
        disabled={isGoogleLoading}
        className="w-full flex items-center justify-center gap-2 h-11 text-sm font-medium text-slate-200 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-60"
      >
        {isGoogleLoading ? <PulseLoader color="#a5b4fc" size={9} /> : (<><FcGoogle className="text-xl" /> Sign in with Google</>)}
      </motion.button>

      <p className="text-center text-[11px] text-slate-500 mt-4">Private workspace · single account</p>
    </AuthShell>
  );
}
