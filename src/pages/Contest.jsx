import React from "react";
//import { Swiper, SwiperSlide } from "swiper/react";
import { doc, getDoc, orderBy, query, limit, where } from "firebase/firestore";
import { useState } from "react";
import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";
import { Dna } from "react-loader-spinner";
import { getDocs, collection } from "firebase/firestore";
import { Slide } from "react-toastify";
import ListingItem from "../components/ListingItem";
import { da } from "date-fns/locale";


export default function Contest() {
  const [Listings, setListings] = useState(null);
  const [OtherListings , setOtherListings] = useState(null);
  useEffect(() => {
    async function fetchListings() {
      try {
        const listingRef = collection(db, "listings");
        const q = query(listingRef, orderBy("timestamp", "desc"));
        const querySnap = await getDocs(q);
        const listings = [];
        querySnap.forEach((doc) => {
          return listings.push({
            id: doc.id,
            data: doc.data(),
          });
        });
        setListings(listings);
        //console.log(listings);
      } catch (error) {
        console.log(error);
      }
    }

    async function getOtherContest() {
      const apiUrl = 'https://kontests.net/api/v1/all';
      try {
        const response = await fetch(apiUrl);
        if (response.status === 200) {
          const data = await response.json();
          console.log(data);
          const OtherListings = [];
          for(let item of data){
            if(item.site == "AtCoder" || item.site == "LeetCode" || item.site == "CodeChef" || item.site == "CodeForces" ){
              let unix_timestamp = item.duration;
              var modifiedDuration = unix_timestamp/60;
              
              //console.log(modifiedDuration); 
              const currentDate = new Date();
              var inputDateStr = item.start_time;
              if(item.site == "CodeChef"){
                const tempDate = inputDateStr;
                const modifiedTemp = tempDate.replace(" UTC", "Z");
                inputDateStr = modifiedTemp;
              }
              const inputDate = new Date(inputDateStr);
              var modifiedStartTime = inputDate.toDateString();
              console.log(inputDate);
              console.log(currentDate);
              if(inputDate >= currentDate){
                let contestItem = {
                  imageName : item.site,
                  link : item.url,
                  name : item.name,
                  startingTime : modifiedStartTime,
                  duration : modifiedDuration
                }
                OtherListings.push(contestItem);
              }
            }
          }
          console.log(OtherListings);
          setOtherListings(OtherListings);
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
    <div>
      <div className="max-w-6xl mx-auto pt-4 space-y-6">
        {Listings && Listings.length > 0 && (
          <div className="m-2 mb-6">
            <h2 className="px-3 text-2xl mt-6 font-semibold">CCPD Contests</h2>
            <ul>
              {Listings.map((listing) => (
                <ListingItem
                  key={listing.id}
                  listing={listing.data}
                  id={listing.id}
                />
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto pt-4 space-y-6">
        {OtherListings && OtherListings.length > 0 && (
          <div className="m-2 mb-6">
            <h2 className="px-3 text-2xl mt-6 font-semibold">Other Contests</h2>
            <ul>
              {OtherListings.map((contestItem) => (
                <ListingItem
                  listing={contestItem}
                />
              ))}
            </ul>
          </div>
          )}
      </div>
        
    </div>
  );
}
