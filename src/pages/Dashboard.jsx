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
  const timeData = [
    "St1",
    "st2",
    "st3",
    "st4",
    "st5",
    "st6",
    "st7",
    "st8",
    "st9",
    "st10",
  ];
  const rankData = [0, 11, 20, 89, 40, 21, 60, 25, 80, 16, 10];
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
        <div className="justify-center flex">
          <h1 className="text-4xl text-center  cursive">
            <span className="text-red-800 font-semibold">{name}'s</span>{" "}
            Dashboard
          </h1>
          <div>
            <button
              className="absolute right-[-40px] hover:right-[-26px] bg-red-800 text-white px-4 py-2 hover:bg-blue-800 rounded-md"
              onClick={onLogout}
            >
              <h1 className="mr-[60px]">Sign Out</h1>
            </button>
          </div>
        </div>

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
