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
import ContestImg from "../images/contest.png";

export default function Resources() {
  const [Listings, setListings] = useState(null);
  useEffect(() => {
    async function fetchListings() {
      try {
        const listingRef = collection(db, "resources");
        const q = query(listingRef, orderBy("topic", "desc"));
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
    fetchListings();
    console.log(Listings);
  }, []);

  return (
    <div>
      <div className="max-w-6xl mx-auto pt-4 space-y-6 ">
        {Listings && Listings.length > 0 && (
          <div className="m-2 mb-6 ">
            <h2 className="px-3 text-4xl mb-6 font-bold justify-center flex">
              Resources
            </h2>
            <ul className="overflow-y-auto  no-scrollbar   sm:h-[300px] md:h-[500px]">
              {Listings.map((listing) => (
                <div>
                  <h1>{listing.data.topic}</h1>
                  <form onSubmit={onSubmit}>
                    <input></input>
                  </form>
                </div>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
