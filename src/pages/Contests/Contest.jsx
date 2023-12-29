import React from "react";
//import { Swiper, SwiperSlide } from "swiper/react";
import { doc, getDoc, orderBy, query, limit, where } from "firebase/firestore";
import { useState } from "react";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { db } from "../../firebase";
import { getAuth } from "firebase/auth";
import { Dna } from "react-loader-spinner";
import { getDocs, collection } from "firebase/firestore";
import { Slide } from "react-toastify";
import ContestCard from "./ContestCard";
import { da } from "date-fns/locale";
import AtcoderImage from "../../images/AtCoder.png";
import CodechefImage from "../../images/CodeChef.png";
import CodeforcesImage from "../../images/CodeForces.png";
import GFGImage from "../../images/gfg.png";
import LeetcodeImage from "../../images/LeetCode.png";
import DefaultImage from "../../images/codenitwcontest.png";



export default function Contest() {
  const [Listings, setListings] = useState({ active: [], upcoming: [], past: [] });
  const [activeContests, setActiveContests] = useState([]);
  const [upcomingContests, setUpcomingContests] = useState([]);
  useEffect(() => {
    async function fetchListings() {
      try {
        const listingRef = collection(db, "listings");
        const q = query(listingRef, orderBy("timestamp", "desc"));
        const querySnap = await getDocs(q);
        const activeListings = [];
        const upcomingListings = [];
        const pastListings = [];
        const currentTime = new Date().getTime();
        querySnap.forEach((doc) => {
          const listing = {
            id: doc.id,
            data: doc.data(),
          };
          
          const temp = listing.data.startingTimeAsDate;
          const listingStartTimeDate = temp.toDate();
          // Get the time in milliseconds
          const listingStartTime = listingStartTimeDate.getTime();
          const listingEndTime = listingStartTime + listing.data.duration * 60 * 1000;
          if (listingStartTime <= currentTime && currentTime <= listingEndTime) {
            activeListings.push(listing);
          } else if (listingStartTime > currentTime) {
            upcomingListings.push(listing);
          } else {
            pastListings.push(listing);
          }
        });
        setListings({ active: activeListings, upcoming: upcomingListings, past: pastListings });
      } catch (error) {
        console.log(error);
      }
    }

    async function getOtherContest() {
      //const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const apiUrl = 'https://contest-api-eight.vercel.app/contest';
     // const apiUrl = proxyUrl + targetUrl;
      try {
        const response = await fetch(apiUrl);
        if (response.status === 200) {
          const data = await response.json();
          console.log(data);
          console.log("Entered data")
          const activeContests = [];
          const upcomingContests = [];
          for(let item of data.objects){
            if(item.host == "atcoder.jp" || item.host == "leetcode.com" || item.host == "codechef.com" || item.host == "codeforces.com" ||   item.host == "geeksforgeeks.org" ){
              let unix_timestamp = item.duration;
              var modifiedDuration = unix_timestamp/60;
              
              //console.log(modifiedDuration); 
              const currentDate = new Date();
              var inputDateStr = item.start;
              // if(item.site == "CodeChef"){
              //   const tempDate = inputDateStr;
              //   const modifiedTemp = tempDate.replace(" UTC", "Z");
              //   inputDateStr = modifiedTemp;
              // }
              const inputDate = new Date(inputDateStr);
              
              const options = {
                year: "numeric",
                month: "long",
                day: "2-digit",
                weekday: "long",
                hour: "2-digit",
                minute: "2-digit",
              };
              const formattedDate = inputDate.toLocaleString(undefined, options)
              var modifiedStartTime = formattedDate;
              let imageSrc;
              switch(item.host) {
                case "atcoder.jp":
                  imageSrc = AtcoderImage;
                  break;
                case "leetcode.com":
                  imageSrc = LeetcodeImage
                  break;
                case "codechef.com":
                  imageSrc = CodechefImage
                  break;
                case "codeforces.com":  
                  imageSrc = CodeforcesImage
                  break;
                case "geeksforgeeks.org":
                  imageSrc = GFGImage;
                  break;
                default:
                  imageSrc = DefaultImage; // Default image or null
              }
              
              let contestItem = {
                imageName : item.host,
                link : item.href,
                name : item.event,
                startingTime : modifiedStartTime,
                duration : modifiedDuration,
                imageSrc: imageSrc
              }
              console.log(contestItem);
              const contestEndTime = inputDate.getTime() + modifiedDuration * 60 * 1000;
              if(currentDate.getTime() < contestEndTime) {
                if(currentDate.getTime() >= inputDate.getTime()) {
                  activeContests.push(contestItem);
                } else {
                  upcomingContests.push(contestItem);
                }
              }
              
            }
          }
          setActiveContests(activeContests);
          setUpcomingContests(upcomingContests);
        } else {
          console.error('Failed to fetch data from the API');
        }
      } catch (error) {
        console.error('An error occurred:', error);
      }
    }
    
    fetchListings();
    getOtherContest();
  }, []);

  

  return (
  <div className="bg-blue-100 dark:bg-[#050b15] min-h-screen mb-[-30px] font-serif">
  <div className="max-w-6xl mx-auto py-10 space-y-6">
  <div className="m-2 mb-6 bg-blue-50 dark:bg-[#121620] shadow-lg p-4 rounded-lg">
  <h1 className="text-2xl font-semibold text-blue-600 dark:text-blue-500 mb-4">CCPD Contests</h1>

  {Listings && Listings.active.length > 0 && (
    <div>
      <h2 className="text-xl font-semibold text-green-600 mb-4">Active Contests</h2>
      <ul>
        {Listings.active.map((listing) => (
         <li key={listing.id} className="transform transition duration-500 ease-in-out hover:scale-10">
         <ContestCard contest={listing.data} id={listing.id} status="Active" />
       </li>
        ))}
      </ul>
    </div>
  )}

  {Listings && Listings.upcoming.length > 0 && (
    <div>
      <h2 className="text-xl  font-semibold text-blue-600 dark:text-gray-400   cursor-pointer mb-4">Upcoming Contests</h2>
      <ul>
        {Listings.upcoming.map((listing) => (
          <li key={listing.id} className="transform transition duration-500 ease-in-out hover:scale-101">
          <ContestCard contest={listing.data} id={listing.id} status="Upcoming" />
        </li>
        ))}
      </ul>
    </div>
  )}

  {Listings && Listings.past.length > 0 && (
    <div>
      <h2 className="text-xl font-semibold dark:text-gray-400  text-gray-600 mb-4">Past Contests</h2>
      <ul>
        {Listings.past.map((listing) => (
          <li key={listing.id} className="transform transition duration-500 ease-in-out hover:scale-101">
          <ContestCard contest={listing.data} id={listing.id}  status="Past"  />
        </li>
        ))}
      </ul>
    </div>
  )}
</div>
</div>
 <div className="max-w-6xl mx-auto pt-4 space-y-6">
<div className="m-2 mb-6 bg-white dark:bg-[#121620] shadow-lg p-4 rounded-lg">
  <h1 className="text-2xl font-semibold text-blue-600 dark:text-blue-500 mb-4">Other Contests</h1>


  {activeContests.length > 0 && (
    <div>
      <h2 className="text-xl  font-semibold text-blue-600 dark:text-gray-400   cursor-pointer mb-4">Active Contests</h2>
      <ul>
      {activeContests.map((contestItem, index) => (
        <li key={index} className="transform transition duration-500 ease-in-out hover:scale-101">
          <ContestCard contest={contestItem} imageSrc={contestItem.imageSrc} status="Active" />
        </li>
      ))}
      </ul>
    </div>
  )}

  {upcomingContests.length > 0 && (
    <div>
      <h2 className="text-xl  font-semibold text-blue-600 dark:text-gray-400   cursor-pointer mb-4">Upcoming Contests</h2>
      <ul>
      {upcomingContests.map((contestItem, index) => (
        <li key={index} className="transform transition duration-500 ease-in-out hover:scale-101">
          <ContestCard contest={contestItem} imageSrc={contestItem.imageSrc} status="Upcoming" />
        </li>
      ))}
      </ul>
    </div>
  )}
</div>
</div> 
</div>

  );
}