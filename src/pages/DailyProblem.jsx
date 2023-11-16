import { getAuth, updateProfile } from "firebase/auth";
import React, { useState, useEffect } from "react";
//import Problem from '../components/Problem';
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

export default function Resources() {
  const [topics, setTopics] = useState([]);
  const [formData, setFormData] = useState("");  
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [problemOfTheDay, setProblemOfTheDay] = useState(null);
  const [problemIndex, setProblemIndex] = useState(-1);
  const [solvedToday, setSolvedToday] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();




  async function fetchformdata(){
    const userCollectionRef = collection(db, "users");
    const userDocRef = doc(userCollectionRef, auth.currentUser.uid);
    const userDocSnapshot = await getDoc(userDocRef);
    const userDocData = userDocSnapshot.data();
    const formData = {
      name: userDocData.name || "",
      email: userDocData.email || "",
      rollno: userDocData.rollno || "",
      course: userDocData.course || "",
      year: userDocData.year || "",
      cfhandle: userDocData.cfhandle || "",
      lchandle: userDocData.lchandle || "",
    };
    setFormData(formData);
  }
  
  fetchformdata();
  
let hasFetchedLeetCodeData = false;

useEffect(() => {
  if (!hasFetchedLeetCodeData) {
    fetchLeetCodeData();
    hasFetchedLeetCodeData = true;
  }
}, []); 
  

async function fetchLeetCodeData(lchandle) {
  const targetUrl = `https://leetcode-api-sooty.vercel.app/${lchandle}`;
  console.log(targetUrl);
  try {
    const response = await fetch(targetUrl);
    const data = await response.json();
    //console.log(data);
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
}
  //function to check if user is already enrolled



  // fucntion for handling enrollment
  const handleEnrollClick = async () => {
    // Perform data fetching from Firebase
    try {
      const lcChallengeCollectionRef = collection(db, "lcchallenge");
    const enrolledQuery = query(
      lcChallengeCollectionRef,
      where("userId", "==", user.uid)
    );
    const querySnapshot = await getDocs(enrolledQuery);
    if (querySnapshot.empty) {
      await addDoc(lcChallengeCollectionRef, {
        userId: user.uid,
        leetcodeHandle: formData.lchandle,
        score: 0,
        hasEnrolled: true,
        SolvedProblems: Array(75).fill(false),
      });
      setIsEnrolled(true);
    } else {
      console.log("User is already enrolled.");
    }
  } catch (error) {
    console.error("Error fetching data from Firebase:", error);
  }
    };

    useEffect(() => {
      async function fetchProblemOfTheDay() {
        try {
          const problemsCollectionRef = collection(db, "problems");
          const querySnapshot = await getDocs(problemsCollectionRef);
          const problems = [];
          querySnapshot.forEach((doc) => {
            problems.push(doc.data());
          });
          //console.log(problems);
          const today = new Date();
            today.setHours(0, 0, 0, 0);
            const index = problems.findIndex((problem) => {
              const problemDate = new Date(problem.postDate.seconds * 1000); // Convert seconds to milliseconds
              problemDate.setHours(0, 0, 0, 0);
              return problemDate.getTime() === today.getTime();
            });
           //console.log(index);
           setProblemIndex(index);
          const problem = problems[index];
          setProblemOfTheDay(problem);
        } catch (error) {
          console.error("Error fetching problem of the day:", error);
        }
      }
      fetchProblemOfTheDay();
    }, []);

    useEffect(() => {
      async function checkEnrollmentStatus() {
        try {
          const lcChallengeCollectionRef = collection(db, "lcchallenge");
          const enrolledQuery = query(
            lcChallengeCollectionRef,
            where("userId", "==", user.uid)
          );
          const querySnapshot = await getDocs(enrolledQuery);
          setIsEnrolled(!querySnapshot.empty);
        } catch (error) {
          console.error("Error checking enrollment status:", error);
        }
      }
    
      checkEnrollmentStatus();
    }, [user]);

    const handleVerifySolution = async (problemLink , postDate) => {
      try {
        console.log(formData.lchandle);
        const leetcodeData = await fetchLeetCodeData(formData.lchandle);
        const recentSubmission = leetcodeData.recentSubmissions;

        const problem_slug = problemLink.split("/").filter(Boolean).pop();
        let isSolved = false;
        for(let item of recentSubmission){
          if(item.titleSlug === problem_slug){
            console.log(item.timestamp);
            console.log(postDate.seconds);
            if(item.statusDisplay === "Accepted" && item.timestamp - postDate.seconds < 24*1000*60*60 && item.timestamp - postDate.seconds > 0 ){
              isSolved = true;
              break;
            }
          }
        }
        if(isSolved){
          toast.success("Solution verified!");
        }else{
          toast.error("Please Submit solution first!");
          return;
        }

        //update score
        const lcChallengeCollectionRef = collection(db, "lcchallenge");
        console.log(user.uid);
        const lcitemQuery = query(
          lcChallengeCollectionRef,
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(lcitemQuery);
        if (!querySnapshot.empty) {
          const lcChallengeDocRef = querySnapshot.docs[0].ref;
          const lcChallengeDoc = await getDoc(lcChallengeDocRef);
          const lcChallenge = lcChallengeDoc.data();
          const solvedProblems = lcChallenge.SolvedProblems.map((value, index) =>
            index === problemIndex  ? true : value
          );
          const score = lcChallenge.score + (solvedProblems[problemIndex - 1] ? 10 : 5);
          
          await updateDoc(lcChallengeDocRef, {
            score: score,
            SolvedProblems: solvedProblems,
          });

          // hide verify solution button
          setSolvedToday(true);


        } else {
          console.log("No document found for the given query");
        }
      } catch (error) {
        console.error("Error verifying solution:", error);
      }
    };
    


    useEffect(() => {
      async function checkIfSolvedToday() {
        try {
          const lcChallengeCollectionRef = collection(db, "lcchallenge");
          const enrolledQuery = query(
            lcChallengeCollectionRef,
            where("userId", "==", user.uid)
          );
          const querySnapshot = await getDocs(enrolledQuery);
          if (!querySnapshot.empty) {
            const lcChallengeDocRef = querySnapshot.docs[0].ref;
            const lcChallengeDoc = await getDoc(lcChallengeDocRef);
            const lcChallenge = lcChallengeDoc.data();
            const solvedProblems = lcChallenge.SolvedProblems;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const index = solvedProblems.findIndex((value, index) => index === problemIndex);
            const problemDate = new Date(problemOfTheDay.postDate.seconds * 1000); // Convert seconds to milliseconds
            problemDate.setHours(0, 0, 0, 0);
            if (solvedProblems[index] && problemDate.getTime() === today.getTime()) {
              setSolvedToday(true);
            }
          } else {
            console.log("No document found for the given query");
          }
        } catch (error) {
          console.error("Error checking if solved today:", error);
        }
      }
      
      checkIfSolvedToday();
    }, [problemIndex, problemOfTheDay, user]);

function calculateTimeLeft(postDate) {
  const currentDate = new Date();
  const postDateTime = new Date(postDate.seconds * 1000); // Convert seconds to milliseconds
  const endTime = postDateTime.getTime() + 24 * 60 * 60 * 1000; // Calculate end time in milliseconds

  const timeDifference = endTime - currentDate.getTime(); // Calculate initial time difference in milliseconds

  // Convert time difference to hours, minutes, and seconds
  const hours = Math.floor(timeDifference / (1000 * 60 * 60));
  const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

// Update the time left every second
function updateTimer(postDate) {
  const timeLeftDiv = document.getElementById("timeLeft");
  if (!timeLeftDiv) return;
  const { hours, minutes, seconds } = calculateTimeLeft(postDate);

  timeLeftDiv.textContent = `${hours}h ${minutes}m ${seconds}s`;

  if (hours === 0 && minutes === 0 && seconds === 0) {
    // Time is up, perform any necessary actions
    return;
  }

  setTimeout(() => {
    updateTimer(postDate);
  }, 1000);
}


  

  return (
    <div className=" w-[70%] container mx-auto p-4 font-serif">
      <section className="bg-blue-50 rounded-md border-1 border-gray-400 shadow-md hover:shadow-lg">
    {!isEnrolled && (
      <section className="max-w-2xl mx-auto flex justify-center items-center flex-col m-[20px]">
        <h2 className="text-2xl text-center cursive">Enroll in Leetcode 75 Hard Challenge</h2>
        <div className="m-[20px] w-[100%]">
          <p className="text-lg font-semibold text-blue-600">
            Are you interested in enrolling in the Leetcode 75 Hard Challenge?
          </p>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
            onClick={handleEnrollClick}
          >
            Enroll
          </button>
        </div>
      </section>
    )}
          {isEnrolled  && !solvedToday && problemOfTheDay && (
      <div>
        <section className="max-w-2xl mx-auto flex justify-center items-center flex-col m-4">
          <h2 className="text-2xl mt-4 font-semibold text-center font-cursive">Problem of the Day</h2>
          <div className="m-4 w-full">
            <h3 className="text-xl font-semibold">{problemOfTheDay.title}</h3>
            <a href={problemOfTheDay.link} target="_blank" rel="noreferrer" className="text-blue-600">{problemOfTheDay.link}</a>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
              onClick={() => handleVerifySolution(problemOfTheDay.link, problemOfTheDay.postDate)}
              style={{ margin: "10px" }} // Add margin to the button
            >
              Verify Solution
            </button>
            <div className="mt-4 flex justify-center">
              <p className="text-lg font-semibold mr-1">Time Left to Verify : </p>
              <p id = "timeLeft" className="text-lg">{updateTimer(problemOfTheDay.postDate)}</p>
            </div>
          </div>
        </section>
      </div>
    )}
    

      {isEnrolled && solvedToday && (
        <div className="max-w-2xl mx-auto flex justify-center items-center flex-col m-4">
          <h2 className="text-2xl text-center font-cursive">Very good!, You have solved Today's Problem</h2>
          <p className="text-lg text-center">See you tomorrow!</p>
        </div>
      )}
    </section> 
      
    </div>
  );
}