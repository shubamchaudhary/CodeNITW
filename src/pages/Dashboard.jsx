import { getAuth, updateProfile } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  deleteDoc,
  addDoc,
  doc,
  getDocs,
  getDoc,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";
import PerformanceChart from "./PerformanceChart";
import Tilt from 'react-parallax-tilt';



export default function Dashboard() {
  const [xData, setXData] = useState([]);
  const [yData, setYData] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: user ? user.displayName : "",
    email: user ? user.email : "",
  });

  const { name, email } = formData;
  useEffect(() => {
    async function fetchContestRanks() {
      const xDataArray = [];
      const yDataArray = [];
      const xDataArrayasTimestamp = [];
      const contestIdArray = [];
      try {
        const userCollectionRef = collection(db, "users");
        const userDocRef = doc(userCollectionRef, auth.currentUser.uid);
        const userDocSnapshot = await getDoc(userDocRef);
        const userDocData = userDocSnapshot.data();
        setFormData({
          name: userDocData.name || "",
          email: userDocData.email || "",
          rollno: userDocData.rollno || "",
          course: userDocData.course || "",
          year: userDocData.year || "",
          cfhandle: userDocData.cfhandle || "",
          lchandle: userDocData.lchandle || "",
        });
        const contestRanksCollectionRef = collection(db, "contestRanks");
        const orderedQuery = query(contestRanksCollectionRef, orderBy("contestDate"));
        
        try {
          const querySnapshot = await getDocs(orderedQuery);
          querySnapshot.forEach((doc) => {
            const contestRanks = doc.data();
            const ranks = contestRanks.ranks;
              contestIdArray.push(contestRanks.contestId);
              xDataArrayasTimestamp.push(contestRanks.contestDate);
              for(let rankItem of ranks){
                if(rankItem.userId === userDocData.cfhandle){
                  yDataArray.push(rankItem.rank);
                }
              }
            
          });
          // converting date into string 
          for(let item of xDataArrayasTimestamp){
            const date = new Date(item * 1000);
            // xDataArray.push(date.toDateString());
            xDataArray.push(date);
          }
                    console.log(contestIdArray);
          console.log(xDataArray);
          console.log(yDataArray);
        } catch (error) {
          console.error("Error fetching contest ranks:", error);
        }
        setXData(xDataArray);
        setYData(yDataArray);
      } catch (error) {
        console.error("Error fetching contest ranks:", error);
      }
    }
    fetchContestRanks();
  }, [auth.currentUser]);


  const [editing, setEditing] = useState(false);

  const handleInputChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    try {
      const userCollectionRef = collection(db, "users");
      const userDocRef = doc(userCollectionRef, auth.currentUser.uid);
      let updateData = {};
      if (formData.cfhandle) {
        updateData.cfhandle = formData.cfhandle;
      }
      if (formData.lchandle) {
        updateData.lchandle = formData.lchandle;
      }
      
      if (Object.keys(updateData).length > 0) {
        await updateDoc(userDocRef, updateData);
        toast.success("Handles updated successfully!");
        setEditing(false);
      }
    } catch (error) {
      console.error("Error updating handles:", error);
      toast.error("Error updating handles.");
    }
  };

  return (
    <>
    <div className=" px-[20px] dark:bg-[#1C1C1EFF] bg-blue-50 min-h-screen font-serif ">
    <Tilt
    className="parallax-effect-img"
    tiltMaxAngleX={0}
    tiltMaxAngleY={10}
    perspective={1000}
    transitionSpeed={500}
    scale={1}
    gyroscope={true}
  >
    <section className="max-w-2xl mx-auto border-2 dark:border-blue-600 border-blue-200  pt-10 text-black-400 bg-blue-50 dark:bg-[#313133] p-6 rounded-lg shadow-lg">
  <div className=" dark:bg-[#3A3A3CFF] shadow-md rounded-lg p-6 bg-blue-100 transition-colors duration-200">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      <div style={{ wordWrap: 'break-word' }}>
        <h2 className="text-2xl font-cursive hover:text-blue-500 transition-colors duration-200 dark:text-white">Name: <span className="text-blue-400">{name}</span> </h2>
        <h2 className="text-2xl font-cursive hover:text-blue-500 transition-colors duration-200  dark:text-white">Roll No: <span className="text-blue-400">{formData.rollno}</span></h2>
        <h2 className="text-2xl font-cursive hover:text-blue-500 transition-colors duration-200  dark:text-white">Course:<span className="text-blue-400">{formData.course}</span> </h2>
      </div>
      <div>
        <h2 className="text-2xl font-cursive hover:text-blue-500 transition-colors duration-200  dark:text-white">Codeforces Handle: <span className="text-blue-400">{formData.cfhandle}</span></h2>
        <h2 className="text-2xl font-cursive hover:text-blue-500 transition-colors duration-200  dark:text-white">Leetcode Handle: <span className="text-blue-400">{formData.lchandle}</span></h2>
        <button 
  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" 
  onClick={() => setEditing(!editing)}
>
  Edit Handles
</button>
{editing && (
  <form onSubmit={handleFormSubmit} className="mt-4">
    <input 
      type="text" 
      name="cfhandle" 
      value={formData.cfhandle} 
      onChange={handleInputChange} 
      placeholder="Codeforces Handle" 
      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
    />
    <input 
      type="text" 
      name="lchandle" 
      value={formData.lchandle} 
      onChange={handleInputChange} 
      placeholder="Leetcode Handle" 
      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mt-4"
    />
    <button 
      type="submit" 
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
    >
      Submit
    </button>
  </form>
)}
      </div>
    </div>
  </div>
</section>
      </Tilt >
    
      <section className="max-w-2xl mx-auto flex justify-center items-center flex-col ">
      <h2 className="text-3xl dark:text-gray-400 text-center mt-[50px] cursive">{name}'s Performance Chart</h2>
        <div className="m-[150px] w-[100%] mt-[10px]">
          <PerformanceChart
            name={name}
            timeData={xData}
            rankData={yData}
          />
        </div>
      </section>
    </div>
    
    </>
  );
}