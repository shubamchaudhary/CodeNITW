import React, { useState } from "react";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import OAuth from "../../components/OAuth";
import {
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  getAuth,
} from "firebase/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import computer from "../../images/computer.png";
import Tilt from "react-parallax-tilt";
import PulseLoader from "react-spinners/PulseLoader";
import SpringComputer from "./Computer";

export default function SignIn() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const { email, password } = formData;

  function onChange(e) {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.id]: e.target.value,
    }));
  }

  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;
      if (!user.emailVerified) {
        toast.error("Please verify your email before signing in.");
        await signOut(auth);
        return;
      }
      if (userCredential.user) {
        toast.info("Welcome Again!!!");
        navigate("/Dashboard");
      }
    } catch (error) {
      toast.error("Email and Password didn't match");
    } finally {
      setIsLoading(false);
    }
  }

  async function signInWithGoogle() {
    setIsGoogleLoading(true);

    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      if (result.user) {
        toast.success("Successfully signed in with Google!");
        navigate("/Dashboard");
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Failed to sign in with Google. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="bg-blue-100 dark:bg-[#050b15] min-h-screen flex flex-col justify-center items-center">
      <section className="w-full max-w-8xl mx-auto flex flex-col md:flex-row justify-center items-center px-4 md:px-40">
        {/* <div className="md:w-1/2 lg:w-1/2 mb-12 md:mb-6">
          <Tilt
            className="parallax-effect-img"
            tiltMaxAngleX={30}
            tiltMaxAngleY={30}
            perspective={1000}
            transitionSpeed={500}
            scale={1}
            gyroscope={true}
          >
            <img
              className="rounded-xl w-full md:max-w-[700px]"
              src={computer}
              alt=""
            />
          </Tilt>
        </div> */}
        <SpringComputer computer={computer} />

        <div className="w-full md:w-1/2 lg:w-1/2 lg:ml-20">
          <form onSubmit={onSubmit} className="text-xl">
            <div className="mb-6">
              <input
                onChange={onChange}
                id="email"
                placeholder="Email address"
                className="w-full h-10 md:h-[50px] p-2 md:p-4 text-lg md:text-2xl dark:bg-[#121620] dark:text-gray-400 text-gray-700 bg-gray-100 rounded-lg mb-6"
                type="email"
                value={email}
                required
              />

              {/* Password input container with proper positioning */}
              <div className="relative">
                <input
                  onChange={onChange}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full h-10 md:h-[50px] p-2 md:p-4 pr-12 md:pr-14 dark:text-gray-400 dark:bg-[#121620] text-lg md:text-2xl text-gray-700 bg-gray-100 rounded-lg"
                  id="password"
                  value={password}
                  required
                />
                {/* Fixed positioning for password visibility toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 md:right-4 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
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
              <p className="dark:text-gray-500">
                Do Not have a Account?{" "}
                <a
                  className="text-red-600 dark:text-red-900 hover:underline"
                  href="/sign-up"
                >
                  Register
                </a>
              </p>
              <a
                className="text-red-600 dark:text-red-900 hover:underline"
                href="/forgot-password"
              >
                Forgot Password?
              </a>
            </div>

            <button
              className="mb-4 mt-4 w-full text-lg dark:bg-[#141a25] hover:dark:bg-[#0d1520] bg-blue-900 text-white h-10 md:h-14 rounded-md hover:bg-red-900 shadow-lg active:bg-red-950 transition-colors"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? <PulseLoader color="#fff" size={16} /> : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            <span className="px-4 text-gray-500 dark:text-gray-400 text-sm">
              OR
            </span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={signInWithGoogle}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 h-10 md:h-14 text-lg bg-white dark:bg-[#121620] text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-[#1a2332] shadow-lg transition-colors disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <PulseLoader color="#4285f4" size={16} />
            ) : (
              <>
                <FcGoogle className="text-2xl" />
                Sign in with Google
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}
