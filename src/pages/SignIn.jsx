import React, { useState } from "react";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
import OAuth from "../components/OAuth";
import { signOut , signInWithEmailAndPassword, getAuth } from "firebase/auth";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import computer from "../images/computer.png";
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
  async function onSubmit(e) {
    e.preventDefault();

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
        toast.success("welcome again!!!");
        navigate("/Dashboard");
      }
    } catch (error) {
      toast.error("Email and Password didn't match");
    }
  }

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="bg-blue-100 min-h-screen flex flex-col justify-center items-center">
      <section className="w-full max-w-8xl mx-auto flex flex-col md:flex-row justify-center items-center px-4 md:px-40">
        <div className="md:w-1/2 lg:w-1/2 mb-12 md:mb-6">
          <img className="rounded-xl w-full md:max-w-[700px]" src={computer} alt="" />
        </div>
  
        <div className="w-full md:w-1/2 lg:w-1/2 lg:ml-20">
          <form onSubmit={onSubmit} className="text-xl">
            <div className="relative mb-6">
              <input
                onChange={onChange}
                id="email"
                placeholder="Email address"
                className="w-full h-10 md:h-[50px] p-2 md:p-4 text-lg md:text-2xl text-gray-700 bg-gray-100 rounded-lg mb-6"
                type="email"
              ></input>
              <input
                onChange={onChange}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full h-10 md:h-[50px] p-2 md:p-4 text-lg md:text-2xl text-gray-700 bg-gray-100 rounded-lg"
                id="password"
              ></input>
             {/* {showPassword ? (
                <AiFillEye
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                  className="absolute text-2xl md:text-3xl right-[5px] md:right-[10px] top-[45px] md:top-[85px]"
                />
              ) : (
                <AiFillEyeInvisible
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                  className="absolute text-2xl md:text-3xl right-[5px] md:right-[10px] top-[45px] md:top-[85px]"
                />
              )} */}
            </div>
            <div className="flex justify-between text-sm md:text-lg mt-2 mb-8">
              <p>
                Do Not have a Account?{" "}
                <a className="text-red-600" href="/sign-up">
                  {" "}
                  Register
                </a>
              </p>
              <a className="text-red-600" href="/forgot-password">
                Forgot Password?
              </a>
            </div>
            <button
              className="mb-4 mt-4 w-full text-lg bg-blue-900 text-white h-10 md:h-14 rounded-md  hover:bg-red-900 shadow-lg active:bg-red-950"
              type="submit"
            >
              Sign In
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}