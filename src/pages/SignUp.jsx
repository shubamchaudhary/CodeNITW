import React, { useState } from "react";
import { AiFillEyeInvisible, AiFillEye } from "react-icons/ai";
import OAuth from "../components/OAuth";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  signOut
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
    year: "first",
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
      // Check if email ends with @student.nitw.ac.in
      if (!email.endsWith("@student.nitw.ac.in")) {
        toast.error("Email must end with @student.nitw.ac.in");
        return;
      }
      const auth = getAuth();
      //console.log(formData);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      await updateProfile(user, { displayName: name }); 
      await signOut(auth);
      // Send verification email
      await sendEmailVerification(user);
      toast.success("Verification email sent. Please check your inbox.");
      const formDataCopy = { ...formData };
      delete formDataCopy.password;
      formDataCopy.timestamp = serverTimestamp();
      console.log(formDataCopy);
      //pushing data to database(db)
      await setDoc(doc(db, "users", user.uid), formDataCopy);
      toast.success("Your id is created!!");
      navigate("/sign-in");
    } catch (error) {
      console.log(formData);
      console.log(error);
      toast.error("Password too short or not filled all options");
    }
  }

  return (
    <section>
      <div className="flex flex-wrap justify-center items-center px-4 md:px-40 bg-blue-100 min-h-screen  max-w-8xl mx-auto">
        <div className="w-full md:w-[67%] lg:w-[50%] mb-12 md:mb-6">
          <img className="rounded-xl w-full md:max-w-[700px]" src={computer} alt="" />
        </div>
        <div className="w-full lg:w-[40%] md:w-[67%] lg:ml-20">
          <form onSubmit={onSubmit}>
            <div className="relative mb-6">
              <input
                onChange={onChange}
                id="name"
                placeholder="Full Name"
                className="w-full h-10 md:h-[50px] p-2 md:p-4 mb-4 text-lg md:text-2xl text-gray-700 bg-gray-100 rounded-lg"
                type="text"
              ></input>
              <input
                onChange={onChange}
                id="email"
                placeholder="Student Email"
                className="w-full h-10 md:h-[50px] p-2 md:p-4 text-lg md:text-2xl text-gray-700 bg-gray-100 rounded-lg"
                type="email"
              ></input>
              <input
                onChange={onChange}
                id="cfhandle"
                placeholder="Codeforces Handle"
                className="w-full h-10 md:h-[50px] p-2 md:p-4 mt-4 mb-4 text-lg md:text-2xl text-gray-700 bg-gray-100 rounded-lg"
                type="text"
              ></input>
              <div className="flex flex-col md:flex-row justify-center ">
                <input
                  onChange={onChange}
                  id="rollno"
                  placeholder="Roll Number"
                  className="w-full h-10 md:h-[50px] p-2 md:p-4 mt-4 mb-4 mr-2 text-lg md:text-2xl text-gray-700 bg-gray-100 rounded-lg"
                  type="text"
                ></input>
                <select
                  id="course"
                  onChange={onChange}
                  className="w-full h-10 md:h-[50px] p-2 md:p-4 mt-4 mb-4 mx-2 text-lg md:text-2xl text-gray-700 bg-gray-100 rounded-lg"
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
                    <option id="mac" value="mac">
                      MCA
                    </option>
                  </select>
                  <select
                    id="year"
                    className="w-full h-10 md:h-[50px] p-2 md:p-4 mt-4 ml-2 mb-4 text-lg md:text-2xl text-gray-700 bg-gray-100 rounded-lg"
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
                className="w-full h-10 md:h-[50px] p-2 md:p-4 mt-4 text-lg md:text-2xl text-gray-700 bg-gray-100 rounded-lg "
                id="password"
              ></input>
              {/* {showPassword ? (
                <AiFillEye
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                  className="absolute text-2xl md:text-3xl right-[5px] md:right-[10px] top-[308px] md:top-[308px]"
                />
              ) : (
                <AiFillEyeInvisible
                  onClick={() => {
                    setShowPassword(!showPassword);
                  }}
                  className="absolute text-2xl md:text-3xl right-[5px] md:right-[10px] top-[308px] md:top-[308px]"
                />
              )} */}
            </div>
            <div className="flex justify-between text-sm md:text-lg mt-2 mb-8">
              <p>
                Have an Account?{" "}
                <a className="text-red-600" href="/sign-in">
                  Sign in
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
              Sign Up
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}