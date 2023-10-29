import { useState } from "react";
import { Dna } from "react-loader-spinner";
import { toast } from "react-toastify";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { getAuth } from "firebase/auth";
import { v4 as uuidv4 } from "uuid";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import ContestImage from "../images/contest.png";

export default function AddContest() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "Starter 1",
    startingTime: "23rd January 2024, Wednesday, 5pm",
    duration: 90,
    link: "",
  });
  const { name, startingTime, duration, link } = formData;

  function onChange(e) {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const formDataCopy = {
      ...formData,
      timestamp: serverTimestamp(),
      //this is uid of the user
      userRef: auth.currentUser.uid,
    };
    console.log(formDataCopy);
    const docRef = await addDoc(collection(db, "listings"), formDataCopy);
    setLoading(false);
    toast.success("contest added");
    navigate(`/`);
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Dna
          visible={true}
          height="500"
          width="500"
          ariaLabel="dna-loading"
          wrapperStyle={{}}
          wrapperClass="dna-wrapper"
        />
      </div>
    );
  }

  return (
    <main className="max-w-[800px] px-4 mx-auto mt-[50px]">
      <h1 className="text-3xl text-center mt-6 cursive">Add New Contest</h1>
      <form onSubmit={onSubmit}>
        <p className="text-lg mt-6 font-semibold">Contest Name</p>
        <input
          type="text"
          id="name"
          value={name}
          onChange={onChange}
          placeholder="Contest Name"
          required
          className="w-full px-4 py-2 text-xl text-gray-700 border-gray-300 rounded  text-center"
        />

        <p className="text-lg font-semibold">Starting time</p>
        <input
          type="text"
          id="startingTime"
          value={startingTime}
          onChange={onChange}
          placeholder="23rd January 2024, Wednesday, 5pm"
          required
          className="w-full px-4 py-2 text-xl text-gray-700 border-gray-300 rounded  text-center"
        />
        <p className="text-lg font-semibold">Duration in minutes</p>
        <input
          type="number"
          id="duration"
          value={duration}
          onChange={onChange}
          required
          className="w-full px-4 py-2 text-xl text-gray-700 border-gray-300  text-center"
        />
        <p className="text-lg font-semibold">Contest Link</p>
        <input
          type="text"
          id="link"
          value={link}
          onChange={onChange}
          placeholder="Contest Link"
          required
          className="w-full px-4 py-2 text-xl text-gray-700 border-gray-300 rounded  mb-6 text-center"
        />
        <button
          type="submit"
          className="mb-6 w-full px-7 py-3 bg-blue-600 text-white font-medium text-sm  rounded shadow-md "
        >
          Add Contest
        </button>
      </form>
    </main>
  );
}