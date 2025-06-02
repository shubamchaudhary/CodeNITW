import React, { useState } from "react";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import PulseLoader from "react-spinners/PulseLoader";
import OAuth from "../../components/OAuth";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { Link } from "react-router-dom";
import { db } from "../../firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import computer from "../../images/computer.png";
import Tilt from "react-parallax-tilt";
import SpringComputer from "./Computer";

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cfhandle: "",
    lchandle: "",
    rollno: "",
    course: "btech",
    year: "first",
    password: "",
  });
  const { name, email, cfhandle, lchandle, rollno, course, year, password } =
    formData;

  function onChange(e) {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.id]: e.target.value,
    }));
  }

  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Validation function
  function validateForm() {
    if (!name.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!password.trim()) {
      toast.error("Password is required");
      return false;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return false;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    return true;
  }

  async function onSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      // Send verification email
      await sendEmailVerification(user);
      await signOut(auth);

      toast.success("Verification email sent. Please check your inbox.");

      // Prepare data for Firestore (exclude password)
      const formDataCopy = { ...formData };
      delete formDataCopy.password;
      formDataCopy.timestamp = serverTimestamp();

      // Save user data to Firestore
      await setDoc(doc(db, "users", user.uid), formDataCopy);

      toast.success("Account created successfully!");
      navigate("/sign-in");
    } catch (error) {
      console.error("Sign up error:", error);

      // Handle specific Firebase errors
      switch (error.code) {
        case "auth/email-already-in-use":
          toast.error(
            "This email is already registered. Please use a different email or sign in."
          );
          break;
        case "auth/weak-password":
          toast.error("Password is too weak. Please use a stronger password.");
          break;
        case "auth/invalid-email":
          toast.error("Invalid email address format.");
          break;
        case "auth/operation-not-allowed":
          toast.error(
            "Email/password accounts are not enabled. Please contact support."
          );
          break;
        default:
          toast.error("Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function signUpWithGoogle() {
    setIsGoogleLoading(true);

    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      if (result.user) {
        // Check if user already exists in Firestore
        const userDocRef = doc(db, "users", result.user.uid);

        // Prepare user data for new Google users
        const googleUserData = {
          name: result.user.displayName || "",
          email: result.user.email || "",
          cfhandle: "",
          lchandle: "",
          rollno: "",
          course: "btech",
          year: "first",
          timestamp: serverTimestamp(),
          signInMethod: "google",
        };

        // Save user data to Firestore
        await setDoc(userDocRef, googleUserData, { merge: true });

        toast.success("Successfully signed up with Google!");
        navigate("/Dashboard");
      }
    } catch (error) {
      console.error("Google sign-up error:", error);

      switch (error.code) {
        case "auth/popup-closed-by-user":
          toast.warning("Sign-up cancelled by user.");
          break;
        case "auth/popup-blocked":
          toast.error("Popup blocked. Please allow popups and try again.");
          break;
        case "auth/account-exists-with-different-credential":
          toast.error(
            "An account already exists with this email using a different sign-in method."
          );
          break;
        default:
          toast.error("Failed to sign up with Google. Please try again.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <section>
      <div className="flex flex-wrap justify-center items-center px-4 md:px-40 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 max-w-8xl mx-auto">
        <SpringComputer computer={computer} />

        <div className="w-full lg:w-[40%] md:w-[67%] lg:ml-20">
          <form onSubmit={onSubmit}>
            <div className="mb-6">
              {/* Required Fields */}
              <input
                onChange={onChange}
                id="name"
                placeholder="Full Name *"
                className="w-full bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600 h-10 md:h-[50px] p-2 md:p-4 mb-4 text-lg md:text-2xl rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                type="text"
                value={name}
                required
              />

              <input
                onChange={onChange}
                id="email"
                placeholder="Email *"
                className="w-full bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600 h-10 md:h-[50px] p-2 md:p-4 mb-4 text-lg md:text-2xl rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                type="email"
                value={email}
                required
              />

              {/* Optional Fields */}
              <input
                onChange={onChange}
                id="cfhandle"
                placeholder="Codeforces Handle (Optional)"
                className="w-full bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600 h-10 md:h-[50px] p-2 md:p-4 mb-4 text-lg md:text-2xl rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                type="text"
                value={cfhandle}
              />

              <input
                onChange={onChange}
                id="lchandle"
                placeholder="Leetcode Handle (Optional)"
                className="w-full bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600 h-10 md:h-[50px] p-2 md:p-4 mb-4 text-lg md:text-2xl rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                type="text"
                value={lchandle}
              />

              <div className="flex flex-col md:flex-row justify-center mb-4 gap-2">
                <input
                  onChange={onChange}
                  id="rollno"
                  placeholder="Roll Number (Optional)"
                  className="w-full bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600 h-10 md:h-[50px] p-2 md:p-4 text-lg md:text-2xl rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  type="text"
                  value={rollno}
                />

                <select
                  id="course"
                  onChange={onChange}
                  value={course}
                  className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 h-10 md:h-[50px] text-gray-700 dark:text-gray-300 p-2 text-lg md:text-lg rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="btech">BTech</option>
                  <option value="mtech">MTech</option>
                  <option value="msc">MSC</option>
                  <option value="mca">MCA</option>
                </select>

                <select
                  id="year"
                  onChange={onChange}
                  value={year}
                  className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 h-10 md:h-[50px] text-gray-700 dark:text-gray-300 p-2 text-lg md:text-lg rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="first">1st Year</option>
                  <option value="second">2nd Year</option>
                  <option value="third">3rd Year</option>
                  <option value="fourth">4th Year</option>
                </select>
              </div>

              {/* Password Field with Toggle */}
              <div className="relative">
                <input
                  onChange={onChange}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password *"
                  className="w-full bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600 h-10 md:h-[50px] p-2 md:p-4 pr-12 md:pr-14 text-lg md:text-2xl rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  id="password"
                  value={password}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <AiFillEye className="text-xl md:text-2xl" />
                  ) : (
                    <AiFillEyeInvisible className="text-xl md:text-2xl" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between text-sm md:text-lg mt-2 mb-8">
              <p className="text-gray-600 dark:text-gray-400">
                Have an Account?{" "}
                <a
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium transition-colors"
                  href="/sign-in"
                >
                  Sign in
                </a>
              </p>
              <a
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline font-medium transition-colors"
                href="/forgot-password"
              >
                Forgot Password?
              </a>
            </div>

            <button
              className="mb-4 mt-4 w-full text-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white h-10 md:h-14 rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? <PulseLoader color="#fff" size={16} /> : "Sign Up"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-300 dark:border-slate-600"></div>
            <span className="px-4 text-gray-500 dark:text-gray-400 text-sm">
              OR
            </span>
            <div className="flex-grow border-t border-gray-300 dark:border-slate-600"></div>
          </div>

          {/* Google Sign Up Button */}
          <button
            onClick={signUpWithGoogle}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 h-10 md:h-14 text-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 shadow-lg transition-colors disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <PulseLoader color="#4285f4" size={16} />
            ) : (
              <>
                <FcGoogle className="text-2xl" />
                Sign up with Google
              </>
            )}
          </button>

          {/* Required fields note */}
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
            * Required fields
          </p>
        </div>
      </div>
    </section>
  );
}
