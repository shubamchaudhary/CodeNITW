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
import { db } from "../../firebase";
import Tilt from "react-parallax-tilt";
import PerformanceChart from "./PerformanceChart";

export default function Profile() {
  const location = useLocation();
  const ciphertext = location.pathname.split("/Profile/")[1];
  const secretKey = "gNyWB0zvLYtmhf0vNhY33nZ5m1epu7J1";
  const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
  const email = bytes.toString(CryptoJS.enc.Utf8);

  const [userData, setUserData] = useState(null);
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchContestRanks() {
      try {
        const userCollectionRef = collection(db, "users");
        const q = query(userCollectionRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        const userDocData = querySnapshot.docs[0].data();
        const contestRanksCollectionRef = collection(db, "contestRanks");
        const orderedQuery = query(
          contestRanksCollectionRef,
          orderBy("contestDate")
        );

        try {
          const querySnapshot = await getDocs(orderedQuery);
          const data = Array.from({ length: querySnapshot.size }, () => ({
            x: null,
            y: null,
          }));
          let index = 0;
          querySnapshot.forEach((doc) => {
            const contestRanks = doc.data();
            const ranks = contestRanks.ranks;
            const date = new Date(contestRanks.contestDate * 1000);
            data[index].x = date;
            for (let rankItem of ranks) {
              if (rankItem.userId === userDocData.cfhandle) {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <Tilt
            className="parallax-effect-img"
            tiltMaxAngleX={0}
            tiltMaxAngleY={10}
            perspective={1000}
            transitionSpeed={500}
            scale={1}
            gyroscope={true}
          >
            <section className="max-w-4xl mx-auto border-2 border-slate-200 dark:border-slate-600 pt-8 text-black-400 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl">
              <div className="bg-slate-50 dark:bg-slate-700 shadow-lg rounded-xl p-6 transition-colors duration-200">
                <div className="text-center mb-6">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">
                      {userData.name?.charAt(0)}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {userData.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {userData.course} • {userData.year} Year
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Personal Information
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Roll Number
                          </span>
                          <p className="text-blue-600 dark:text-blue-400 font-semibold">
                            {userData.rollno}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Course
                          </span>
                          <p className="text-blue-600 dark:text-blue-400 font-semibold">
                            {userData.course}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Coding Profiles
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Codeforces
                          </span>
                          <p className="text-blue-600 dark:text-blue-400 font-semibold">
                            {userData.cfhandle || "Not available"}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Leetcode
                          </span>
                          <p className="text-blue-600 dark:text-blue-400 font-semibold">
                            {userData.lchandle || "Not available"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </Tilt>

          <section className="max-w-6xl mx-auto flex justify-center items-center flex-col mt-12">
            <h2 className="text-2xl md:text-3xl text-gray-700 dark:text-gray-300 text-center mb-8 font-bold">
              {userData ? userData.name : ""}'s Performance Chart
            </h2>
            <div className="w-full bg-white dark:bg-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl border border-gray-200 dark:border-slate-600">
              <div className="h-[400px] md:h-[500px]">
                <PerformanceChart
                  name={userData ? userData.name : ""}
                  data={data}
                  handle={userData ? userData.cfhandle : ""}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  );
}
