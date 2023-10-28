import React, { useState } from "react";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
import OAuth from "../components/OAuth";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import computer from "../images/computer.png";

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cfhandle: "",
    rollno: "",
    course: "btech",
    year: 1,
    password: "",
  });
  const { name, email, cfhandle, rollno, course, year, password } = formData;
  function onChange(e) {
    setFormData((prevData) => ({
      ...prevData,
      [e.target.id]: e.target.value,
    }));
    // console.log(formData);
    // console.log(formData.password);
  }

  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const auth = getAuth();
      //console.log(formData);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log(formData);
      updateProfile(auth.currentUser, {
        displayName: name,
      });
      const user = userCredential.user;
      console.log(user);
      const formDataCopy = { ...formData };
      console.log(formDataCopy);
      delete formDataCopy.password;
      formDataCopy.timestamp = serverTimestamp();
      //pushing data to database(db)
      await setDoc(doc(db, "users", user.uid), formDataCopy);
      toast.success("Your id is created!!");
      navigate("/");
    } catch (error) {
      console.log(formData);
      toast.error("Password too short or not filled all options");
    }
  }

  return (
    <section>
      {/* <h1 className="text-3xl text-center mt-6  cursive">Sign Up</h1> */}
      <div className="flex flex-wrap justify-center items-center px-40  max-w-8xl mx-auto">
        <div className="md:w-[67%] lg:w-[50%] mb-12 md:mb-6">
          <img className="rounded-xl max-w-[700px]" src={computer} alt="" />
        </div>
        <div className="w-[100%] lg:w-[40%] md:w-[67%] lg:ml-20">
          <form onSubmit={onSubmit}>
            <div className="relative mb-6">
              <input
                onChange={onChange}
                id="name"
                placeholder="Full Name"
                className="w-full h-[50px] p-4 mb-4 text-2xl text-gray-700 bg-gray-100 rounded-lg"
                type="text"
              ></input>
              <input
                onChange={onChange}
                id="email"
                placeholder="Email address"
                className="w-full h-[50px] p-4 text-2xl text-gray-700 bg-gray-100 rounded-lg"
                type="email"
              ></input>
              <input
                onChange={onChange}
                id="cfhandle"
                placeholder="Codeforces Handle"
                className="w-full h-[50px] p-4 mt-4 mb-4 text-2xl text-gray-700 bg-gray-100 rounded-lg"
                type="text"
              ></input>
              <div className="flex justify-center ">
                <input
                  onChange={onChange}
                  id="rollno"
                  placeholder="Roll Number"
                  className="w-full h-[50px] p-4 mt-4 mb-4 mr-2 text-2xl text-gray-700 bg-gray-100 rounded-lg"
                  type="text"
                ></input>
                <select
                  onChange={onChange}
                  className="w-full h-[50px] p-4 mt-4 mb-4 mx-2 text-gray-700 bg-gray-100 rounded-lg"
                >
                  <option id="btech" value="btech">
                    BTech
                  </option>
                  <option id="mtech" value="mtech">
                    MTech
                  </option>
                  <option id="msc" value="msc">
                    MSC
                  </option>
                </select>
                <select
                  className="w-full h-[50px] p-4 mt-4 ml-2 mb-4 text-gray-700 bg-gray-100 rounded-lg"
                  onChange={onChange}
                >
                  <option id="first" value="first">
                    1st Year
                  </option>
                  <option id="second" value="second">
                    2nd Year
                  </option>
                  <option id="third" value="third">
                    3rd Year
                  </option>
                  <option id="fourth" value="fourth">
                    4th Year
                  </option>
                </select>
              </div>
              <input
                onChange={onChange}
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full h-[50px] p-4 mt-4 text-2xl text-gray-700 bg-gray-100 rounded-lg "
                id="password"
              ></input>
              {/* <button className='absolute text-xl right-[10px] top-[58px]' onClick={()=>{setShowPassword(!showPassword)}}>{showPassword ? <AiFillEye /> : <AiFillEyeInvisible /> }</button> */}
              {showPassword ? (
                <AiFillEye
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                  className="absolute text-3xl right-[10px] top-[308px]"
                />
              ) : (
                <AiFillEyeInvisible
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                  className="absolute text-3xl right-[10px] top-[308px]"
                />
              )}
            </div>
            <div className="flex justify-between text-lg mt-2 mb-8">
              <p>
                Have an Account?{" "}
                <a className="text-red-600" href="/sign-in">
                  Sign in
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
              Sign Up
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
