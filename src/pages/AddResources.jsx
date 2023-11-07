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

export default function AddResources() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    tag: "",
    link: "",
  });
  const { name, tag, link } = formData;

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
    const docRef = await addDoc(collection(db, "resources"), formDataCopy);
    setLoading(false);
    toast.success("Question added");
    navigate(`/resources`);
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
      <h1 className="text-3xl text-center mt-6 cursive">Add Question</h1>
      <form onSubmit={onSubmit}>
        <input
          type="text"
          id="name"
          value={name}
          onChange={onChange}
          placeholder="Problem Name"
          required
          className="w-full px-4 py-2 text-xl text-gray-700 border-gray-300 rounded  mb-6"
        />
        <input
          type="text"
          id="tag"
          value={tag}
          onChange={onChange}
          placeholder="Problem Tag"
          required
          className="w-full px-4 py-2 text-xl text-gray-700 border-gray-300 rounded  mb-6"
        />
        <input
          type="text"
          id="link"
          value={link}
          onChange={onChange}
          placeholder="Problem Link"
          required
          className="w-full px-4 py-2 text-xl text-gray-700 border-gray-300 rounded  mb-6"
        />
        {/* <input
          type="text"
          id="link"
          value={link}
          onChange={onChange}
          placeholder="Problem Link"
          required
          className="w-full px-4 py-2 text-xl text-gray-700 border-gray-300 rounded  mb-6"
        /> */}

        <button
          type="submit"
          className="mb-6 w-full px-7 py-3 bg-blue-600 text-white font-medium text-sm  rounded shadow-md "
        >
          Add Question
        </button>
      </form>
    </main>
  );
}
