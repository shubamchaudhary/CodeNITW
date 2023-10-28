import { getAuth, updateProfile } from "firebase/auth";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
import PerformanceChart from "./PerformanceChart";

export default function Dashboard() {
  const timeData = ["Jan", "Feb", "Mar", "Apr", "May"];
  const rankData = [1, 2, 4, 3, 5];
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: user.displayName,
    email: user.email,
  });

  const { name, email } = formData;

  const [changeDetail, setChangeDetail] = useState(false);

  function onLogout() {
    auth.signOut();
    navigate("/");
  }

  async function onSubmit() {
    try {
      if (auth.currentUser.displayName !== name) {
        //update display name in firebase auth
        await updateProfile(auth.currentUser, {
          displayName: name,
        });

        // update name in the firestore

        const docRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(docRef, {
          name,
        });
      }
      toast.success("Profile details updated");
    } catch (error) {
      toast.error("Could not update the profile details");
    }
  }

  function onChange(e) {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  }

  return (
    <>
      <section className="max-w-2xl mx-auto flex justify-center items-center flex-col">
        <h1 className="text-4xl text-center  cursive">
          <span className="text-red-800 font-semibold">{name}'s</span> Dashboard
        </h1>
        <div className="m-[100px] w-[145%]">
          <PerformanceChart
            name={name}
            timeData={timeData}
            rankData={rankData}
          />
        </div>
      </section>
    </>
  );
}
