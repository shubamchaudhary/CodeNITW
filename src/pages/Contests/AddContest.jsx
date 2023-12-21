import { useState ,useRef } from "react";
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
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { Timestamp } from "firebase/firestore";


export default function AddContest() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "Starter 1",
    startingTime: "",
    duration: 90,
    link: "",

  });

  

  
  const { name, startingTime, duration, link } = formData;

  let UpdatedStartingTime = "";
  const inputDate = new Date(startingTime);
    const options = {
      year: "numeric",
      month: "long",
      day: "2-digit",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
    };
  const formattedDate = inputDate.toLocaleString(undefined, options);
  const startingTimeTimestamp = Timestamp.fromDate(inputDate);
  UpdatedStartingTime = formattedDate;
  const updatedFormData = { ...formData, startingTime: UpdatedStartingTime };
  
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
      ...updatedFormData,
      timestamp: serverTimestamp(),
      startingTimeAsDate: startingTimeTimestamp,
      userRef: auth.currentUser.uid,
    };
    console.log(formDataCopy);
    const docRef = await addDoc(collection(db, "listings"), formDataCopy);
    setLoading(false);
    toast.success("Contest Added");
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
    <div className=" bg-blue-100 dark:bg-[#1C1C1EFF]">
      <main className="max-w-[60%] px-4 mx-auto bg-blue-100 text-gray-800 rounded-lg p-6">
    <h1 className="text-4xl text-center font-cursive text-blue-700">Add New Contest</h1>
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div className="flex flex-col space-y-1">
        <label htmlFor="name" className="text-lg font-semibold text-blue-600">Contest Name</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={onChange}
          placeholder="Enter Contest Name"
          required
          className="w-full px-4 py-2 text-xl text-blue-800 bg-white rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
        />
      </div>
  
      <div className="flex flex-col space-y-1">
        <label htmlFor="startingTime" className="text-lg font-semibold text-blue-600">Starting Time</label>
        <input
          type="datetime-local"
          id="startingTime"
          value={startingTime}
          onChange={onChange}
          required
          className="w-full px-4 py-2 text-xl text-blue-800 bg-white rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
        />
      </div>
  
      <div className="flex flex-col space-y-1">
        <label htmlFor="duration" className="text-lg font-semibold text-blue-600">Duration (in minutes)</label>
        <input
          type="number"
          id="duration"
          value={duration}
          onChange={onChange}
          required
          className="w-full px-4 py-2 text-xl text-blue-800 bg-white rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
        />
      </div>
  
      <div className="flex flex-col space-y-1">
        <label htmlFor="link" className="text-lg font-semibold text-blue-600">Contest Link</label>
        <input
          type="text"
          id="link"
          value={link}
          onChange={onChange}
          placeholder="Enter Contest Link"
          required
          className="w-full px-4 py-2 text-xl text-blue-800 bg-white rounded-lg focus:outline-none focus:ring focus:ring-blue-500"
        />
      </div>
  
      <button
        type="submit"
        className="w-full px-7 py-3 text-white bg-blue-500 rounded-lg text-xl font-medium hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-600"
      >
        Add Contest
      </button>
    </form>
  </main>
  
    </div>
    

  );
}