import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import CryptoJS from "crypto-js";
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
  import Tilt from 'react-parallax-tilt';
  import PerformanceChart from "./PerformanceChart";

export default function Profile() {
    const location = useLocation();
    const ciphertext = location.pathname.split("/Profile/")[1];
    const secretKey = "gNyWB0zvLYtmhf0vNhY33nZ5m1epu7J1";
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    const email = bytes.toString(CryptoJS.enc.Utf8);

    const [userData, setUserData] = useState(null);
   const [data , setData] = useState([]);

    useEffect(() => {
        async function fetchContestRanks() {
            try {
              const userCollectionRef = collection(db, "users");
              const q = query(userCollectionRef, where("email", "==", email));
              const querySnapshot = await getDocs(q);
              const userDocData = querySnapshot.docs[0].data();
              const contestRanksCollectionRef = collection(db, "contestRanks");
              const orderedQuery = query(contestRanksCollectionRef, orderBy("contestDate"));
              
              try {
                const querySnapshot = await getDocs(orderedQuery);
                const data = Array.from({length: querySnapshot.size}, () => ({x: null, y: null}));
                let index = 0;
                querySnapshot.forEach((doc) => {
                  const contestRanks = doc.data();
                  const ranks = contestRanks.ranks;
                  const date = new Date(contestRanks.contestDate * 1000);
                  data[index].x = date;
                  for(let rankItem of ranks){
                    if(rankItem.userId === userDocData.cfhandle){
                      data[index].y = rankItem.rank;
                    }
                  }
              index++;
            });
            setData(data);
              } catch (error) {
                console.error("Error fetching contest ranks:", error);
              }
            } catch (error) {
                console.error("Error fetching contest ranks:", error);
              }
            }

        fetchContestRanks();

        async function fetchUserData() {
            const userCollectionRef = collection(db, "users");
            const q = query(userCollectionRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                setUserData(doc.data());
            });
        }
        fetchUserData();
    }, [email]);

    return (
        userData && (
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
            <h2 className="text-2xl font-cursive hover:text-blue-500 transition-colors duration-200 dark:text-white">Name: <span className="text-blue-400">{userData.name}</span> </h2>
            <h2 className="text-2xl font-cursive hover:text-blue-500 transition-colors duration-200  dark:text-white">Roll No: <span className="text-blue-400">{userData.rollno}</span></h2>
            <h2 className="text-2xl font-cursive hover:text-blue-500 transition-colors duration-200  dark:text-white">Course:<span className="text-blue-400">{userData.course}</span> </h2>
          </div>
          <div>
            <h2 className="text-2xl font-cursive hover:text-blue-500 transition-colors duration-200  dark:text-white">Codeforces Handle: <span className="text-blue-400">{userData.cfhandle}</span></h2>
            <h2 className="text-2xl font-cursive hover:text-blue-500 transition-colors duration-200  dark:text-white">Leetcode Handle: <span className="text-blue-400">{userData.lchandle}</span></h2>
          </div>
        </div>
      </div>
    </section>
  </Tilt>
  <section className="max-w-2xl mx-auto flex justify-center items-center flex-col ">
  <h2 className="text-3xl dark:text-gray-400 text-center mt-[50px] cursive">{userData ? userData.name : ''}'s Performance Chart</h2>
  <div className="m-[150px] w-[100%] mt-[10px]">
    <PerformanceChart
      name={userData ? userData.name : ''}
        data = {data}
    />
  </div>
</section>
</div>
)

    );
}