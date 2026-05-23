import React, { useState } from "react";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
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

export default function SignIn() {
  const [email, setEmail] = useState(ALLOWED_EMAIL);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();

  // Allow exactly one account; sign out anyone else immediately.
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 dark:from-indigo-400 dark:via-violet-400 dark:to-indigo-300">
            InterviewPrep
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to continue</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-xl p-6">
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full h-11 px-4 text-sm bg-gray-50 dark:bg-slate-900/60 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            />

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full h-11 px-4 pr-11 text-sm bg-gray-50 dark:bg-slate-900/60 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? <AiFillEye className="text-lg" /> : <AiFillEyeInvisible className="text-lg" />}
              </button>
            </div>

            <div className="flex justify-end">
              <a href="/forgot-password" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              {isLoading ? <PulseLoader color="#fff" size={10} /> : "Sign In"}
            </button>
          </form>

          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-200 dark:border-slate-600" />
            <span className="px-3 text-xs text-gray-400">OR</span>
            <div className="flex-grow border-t border-gray-200 dark:border-slate-600" />
          </div>

          <button
            onClick={signInWithGoogle}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-2 h-11 text-sm font-medium bg-white dark:bg-slate-900/60 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {isGoogleLoading ? <PulseLoader color="#6366f1" size={10} /> : (<><FcGoogle className="text-xl" /> Sign in with Google</>)}
          </button>
        </div>
      </div>
    </div>
  );
}
