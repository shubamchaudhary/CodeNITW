import React, { useState } from "react";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
import OAuth from "../components/OAuth";
import { signInWithEmailAndPassword, getAuth } from "firebase/auth";
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
    // console.log(formData.email);
    // console.log(formData.password);
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
    <section>
      <div className="flex flex-wrap justify-center items-center px-40  max-w-8xl mx-auto">
        <div className="md:w-[67%] lg:w-[50%] mb-12 md:mb-6">
          <img className="rounded-xl max-w-[700px]" src={computer} alt="" />
        </div>

        <div className="w-[100%] lg:w-[40%] md:w-[67%] lg:ml-20">
          {/* <h1 className="flex justify-center text-8xl p-10">Sign In</h1> */}
          <form onSubmit={onSubmit} className="text-xl">
            <div className="relative mb-6">
              <input
                onChange={onChange}
                id="email"
                placeholder="Email address"
                className="w-full h-[50px] p-4 text-2xl text-gray-700 bg-gray-100 rounded-lg mb-6"
                type="email"
              ></input>
              <input
                onChange={onChange}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full h-[50px] p-4 text-2xl text-gray-700 bg-gray-100 rounded-lg"
                id="password"
              ></input>
              {/* <button className='absolute text-xl right-[10px] top-[58px]' onClick={()=>{setShowPassword(!showPassword)}}>{showPassword ? <AiFillEye /> : <AiFillEyeInvisible /> }</button> */}
              {showPassword ? (
                <AiFillEye
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                  className="absolute text-3xl right-[10px] top-[85px]"
                />
              ) : (
                <AiFillEyeInvisible
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                  className="absolute text-3xl right-[10px] top-[85px]"
                />
              )}
            </div>
            <div className="flex justify-between text-lg mt-2 mb-8">
              <p>
                Do Not have a Account?{" "}
                <a className="text-red-600" href="/sign-up">
                  {" "}
                  Register
                </a>
              </p>
              <a className="text-red-600" href="/forgot-password">
                forgot password?
              </a>
            </div>
            <button
              className="mb-4 mt-4 w-full text-lg bg-blue-900 text-white h-14 rounded-md  hover:bg-red-900 shadow-lg active:bg-red-950"
              type="submit"
            >
              Sign In
            </button>
            {/* <div className="mt-2 mb-2 ">
              <p className="text-center">OR</p>
            </div>
            <OAuth></OAuth> */}
          </form>
        </div>
      </div>
    </section>
  );
}
