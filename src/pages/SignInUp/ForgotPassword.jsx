import React, { useState } from "react";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import computer from "../../images/computer.png";
import Tilt from "react-parallax-tilt";
import PulseLoader from "react-spinners/PulseLoader";
import SpringComputer from "./Computer";

export default function PasswordReset() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Email validation function
  function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    const auth = getAuth();

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(
        "Password reset email sent successfully! Check your inbox."
      );

      // Optional: Clear the email field after successful send
      setEmail("");

      // Navigate to sign-in page after a short delay
      setTimeout(() => {
        navigate("/sign-in");
      }, 2000);
    } catch (error) {
      console.error("Password reset error:", error);

      // Handle specific Firebase errors
      switch (error.code) {
        case "auth/user-not-found":
          toast.error("No account found with this email address.");
          break;
        case "auth/invalid-email":
          toast.error("Invalid email address format.");
          break;
        case "auth/too-many-requests":
          toast.error("Too many reset attempts. Please try again later.");
          break;
        default:
          toast.error("Failed to send password reset email. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col justify-center items-center">
      <section className="w-full max-w-8xl mx-auto flex flex-col md:flex-row justify-center items-center px-4 md:px-40">
        {/* Left side - Image */}
        <SpringComputer computer={computer} />

        {/* Right side - Reset Form */}
        <div className="w-full md:w-1/2 lg:w-1/2 lg:ml-20">
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Forgot Password?
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">
              No worries! Enter your email address and we'll send you a link to
              reset your password.
            </p>
          </div>

          <form onSubmit={handleResetPassword} className="text-xl">
            <div className="mb-6">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 md:h-[50px] p-2 md:p-4 text-lg md:text-2xl bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mb-6 w-full text-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white h-10 md:h-14 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <PulseLoader color="#fff" size={16} />
              ) : (
                "Send Reset Email"
              )}
            </button>

            {/* Navigation Links */}
            <div className="flex flex-col sm:flex-row justify-between items-center text-sm md:text-lg gap-4">
              <p className="text-gray-600 dark:text-gray-400 text-center sm:text-left">
                Remember your password?{" "}
                <a
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium transition-colors"
                  href="/sign-in"
                >
                  Sign in
                </a>
              </p>

              <p className="text-gray-600 dark:text-gray-400 text-center sm:text-right">
                Don't have an account?{" "}
                <a
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium transition-colors"
                  href="/sign-up"
                >
                  Sign up
                </a>
              </p>
            </div>
          </form>

          {/* Additional Help Text */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-slate-600">
            <p className="text-sm md:text-base text-blue-800 dark:text-blue-300">
              <strong>💡 Tip:</strong> Check your spam folder if you don't
              receive the email within a few minutes.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
