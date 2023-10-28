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
      <section className="max-w-6xl mx-auto flex justify-center items-center flex-col mt-[100px]">
        <h1 className="text-3xl text-center  cursive">My Dashboard</h1>
        <div className="w-full md:w-[50%]  px-3 mt-[60px]">
          <form>
            <input
              type="text"
              id="name"
              value={name}
              disabled={!changeDetail}
              onChange={onChange}
              className={`mb-6 w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition ease-in-out ${
                changeDetail && "bg-red-200 focus:bg-red-200"
              }`}
            ></input>
            <input
              type="email"
              id="email"
              value={email}
              disabled={changeDetail}
              className="mb-6 w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition ease-in-out"
            />
            <div className="flex justify-between whitespace-nowrap text-sm sm:text-lg mb-6">
              <p className="flex items-center ">
                Do you want to change your name?
                <span
                  onClick={() => {
                    //change detail agar true hai, to submit the information.
                    changeDetail && onSubmit();
                    setChangeDetail(!changeDetail);
                  }}
                  className="text-red-600 hover:text-red-700 transition ease-in-out duration-200 ml-1 cursor-pointer"
                >
                  {changeDetail ? "Apply Changes" : "Edit"}
                </span>
              </p>
              <p
                onClick={onLogout}
                className="text-blue-600 hover:text-blue-800 transition duration-200 ease-in-out cursor-pointer"
              >
                Sign out
              </p>
            </div>
          </form>
        </div>

        <div className="App">
          <h1>Student Performance Chart</h1>
          <PerformanceChart timeData={timeData} rankData={rankData} />
        </div>
      </section>
    </>
  );
}
