import React from "react";
import { FcGoogle } from "react-icons/fc";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

export default function OAuth() {
  const navigate = useNavigate();
  async function onGoogleClick() {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      //check for the user

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          name: user.displayName,
          email: user.email,
          timestamp: serverTimestamp(),
        });
        toast.success("id created!!");
        navigate("/");
      } else {
        toast.success("welcome again!!");
        navigate("/");
      }

      console.log(user);
    } catch (error) {
      console.log(error);
    }
  }
  return (
    <button
      type="button"
      onClick={onGoogleClick}
      className=" flex items-center justify-center w-full text-lg bg-red-500 text-white h-14 rounded-md  hover:bg-red-600 shadow-lg active:bg-red-700"
    >
      {" "}
      <FcGoogle className="m-2 " />
      Continue With Google
    </button>
  );
}
