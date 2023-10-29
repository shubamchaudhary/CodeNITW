import React, { useState } from "react";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
import OAuth from "../components/OAuth";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { sendPasswordResetEmail, getAuth } from "firebase/auth";

export default function ForgotPassword() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const email = formData.email;
  function onChange(e) {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.id]: e.target.value,
    }));
    // console.log(formData.email);
    // console.log(formData.password);
  }

  const [showPassword, setShowPassword] = useState(false);
  function password() {
    setShowPassword(!showPassword);
  }

  const navigate = useNavigate();
  async function onSubmit(e) {
    e.preventDefault();
    try {
      const auth = getAuth();
      const userCredential = await sendPasswordResetEmail(auth, email);
      toast.success("email was sent");
    } catch (error) {
      toast.error("can not send reset email at moment");
    }
  }

  return (
    <section>
      <h1 className="text-3xl text-center mt-6  cursive">Forgot Password</h1>
      <div className="flex flex-wrap justify-center items-center px-6 py-[130px] max-w-10xl mx-auto">
        <div className="md:w-[67%] lg:w-[50%] mb-12 md:mb-6">
          <img
            className="rounded-2xl w-full"
            src="http://www.technocrazed.com/wp-content/uploads/2015/12/Home-Wallpaper-32.jpg"
            alt=""
          />
        </div>
        <div className="w-[100%] lg:w-[40%] md:w-[67%] lg:ml-20">
          <form onSubmit={onSubmit}>
            <div className="relative mb-6">
              <input
                onChange={onChange}
                id="email"
                placeholder="Email address"
                className="w-full text-xl text-gray-700 bg-gray-100 rounded-lg mb-6"
                type="email"
              ></input>

              {/* <button className='absolute text-xl right-[10px] top-[58px]' onClick={()=>{setShowPassword(!showPassword)}}>{showPassword ? <AiFillEye /> : <AiFillEyeInvisible /> }</button> */}
            </div>
            <div className="flex justify-between text-lg mt-2 mb-8">
              <p>
                Do Not have an Account?{" "}
                <a className="text-red-600" href="/sign-up">
                  Register
                </a>
              </p>
              <a className="text-red-600" href="/sign-in">
                Sign in instead
              </a>
            </div>
            <button
              className="mb-4 mt-4 w-full text-lg bg-blue-600 text-white h-14 rounded-md  hover:bg-blue-700 shadow-lg active:bg-blue-800"
              type="submit"
            >
              Send Reset Mail
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
