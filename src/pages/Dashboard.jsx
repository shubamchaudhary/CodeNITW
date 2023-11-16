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
//import axios from 'axios';


export default function Dashboard() {
  const [xData, setXData] = useState([]);
  const [yData, setYData] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();
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


  const [formData, setFormData] = useState({
    name: user ? user.displayName : "",
    email: user ? user.email : "",
  });

  const { name, email } = formData;
  //console.log(name);
  

  return (
    <>
    <div className=" font-serif bg-blue-100 min-h-screen ">
    {/* <h1 className="text-4xl text-center  cursive font-semibold">
          <span className="text-red-800 font-semibold">{name}'s</span> Dashboard
    </h1>
      <section className="max-w-2xl mx-auto flex justify-center items-center flex-col m-[20px]">
        <h2 className="text-2xl text-center cursive">Personal Details</h2>
        <div className="m-[20px] w-[100%]">
          
        </div>
      </section> */}
      <div className="justify-center bg-blue-50 flex">
      <div className="max-w-md  p-8 sm:flex sm:space-x-6  flex justify-center">
	<div className="flex flex-col space-y-4 justify-center">
		<div>
			<h2 className="text-2xl font-semibold"><strong>Name:</strong> {name}</h2>
		</div>
    <div>
			<h2 className="text-lg font-semibold"><strong>Email:</strong> {email}</h2>
		</div>
    <div className="flex justify-center text-gray-700">
			<h1 className="mx-2 font-semibold text-lg"> {formData.course}</h1>
      <h1  className="mx-2 font-semibold text-lg"> {formData.year} year</h1>
      <h1  className="mx-2 font-semibold text-lg">Roll no.: {formData.rollno}</h1>
		</div>
		<div className="space-y-1">
			
         
         
          <p className="text-lg font-semibold text-blue-600" ><strong>Leetcode Handle:</strong> {formData.lchandle}</p>
          <p className="text-lg font-semibold text-blue-600" ><strong>Codeforces Handle:</strong> {formData.cfhandle}</p>
			
			<span className="flex items-center space-x-2">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-label="Phonenumber" className="w-4 h-4">
					<path fill="currentColor" d="M449.366,89.648l-.685-.428L362.088,46.559,268.625,171.176l43,57.337a88.529,88.529,0,0,1-83.115,83.114l-57.336-43L46.558,362.088l42.306,85.869.356.725.429.684a25.085,25.085,0,0,0,21.393,11.857h22.344A327.836,327.836,0,0,0,461.222,133.386V111.041A25.084,25.084,0,0,0,449.366,89.648Zm-20.144,43.738c0,163.125-132.712,295.837-295.836,295.837h-18.08L87,371.76l84.18-63.135,46.867,35.149h5.333a120.535,120.535,0,0,0,120.4-120.4v-5.333l-35.149-46.866L371.759,87l57.463,28.311Z"></path>
				</svg>
				<span className="dark:text-gray-400">+25 381 77 983</span>
			</span>
		</div>
	</div>
</div>
</div>
      <section className="max-w-2xl mx-auto flex justify-center items-center flex-col m-[20px]">
      <h2 className="text-2xl text-center cursive">{name}'s Performance Chart</h2>
        <div className="m-[20px] w-[100%]">
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