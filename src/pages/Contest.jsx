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
//import Slider from "../components/Slider";
export default function Contest() {
  //for offers
  const [Listings, setListings] = useState(null);
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
    fetchListings();
  }, []);

  //for sale
  // const [saleListings, setSaleListings] = useState(null);
  // useEffect(() => {
  //   async function fetchSaleListings() {
  //     try {
  //       const listingRef = collection(db, "listings");
  //       const q = query(
  //         listingRef,
  //         where("type", "==", "sale"),
  //         orderBy("timestamp", "desc"),
  //         limit(4)
  //       );
  //       const querySnap = await getDocs(q);
  //       const listings = [];
  //       querySnap.forEach((doc) => {
  //         return listings.push({
  //           id: doc.id,
  //           data: doc.data(),
  //         });
  //       });
  //       setSaleListings(listings);
  //       //console.log(listings);
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   }
  //   fetchSaleListings();
  // }, []);
  return (
    <div>
      {/* <Slider /> */}
      <div className="max-w-6xl mx-auto pt-4 space-y-6">
        {Listings && Listings.length > 0 && (
          <div className="m-2 mb-6">
            <h2 className="px-3 text-2xl mt-6 font-semibold">Contests</h2>
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

      {/* <div className="max-w-6xl mx-auto pt-4 space-y-6">
        {rentListings && rentListings.length > 0 && (
          <div className="m-2 mb-6">
            <h2 className="px-3 text-2xl mt-6 font-semibold">
              Places for Rent
            </h2>
            <Link to="/category/rent">
              <p className="px-3 text-sm text-blue-600 hover:text-blue-800 font-bold">
                Show More Places
              </p>
            </Link>
            <ul className="sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {rentListings.map((listing) => (
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
        {saleListings && saleListings.length > 0 && (
          <div className="m-2 mb-6">
            <h2 className="px-3 text-2xl mt-6 font-semibold">
              Places for Sale
            </h2>
            <Link to="/category/sale">
              <p className="px-3 text-sm text-blue-600 hover:text-blue-800 font-bold">
                Show More Places
              </p>
            </Link>
            <ul className="sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {saleListings.map((listing) => (
                <ListingItem
                  key={listing.id}
                  listing={listing.data}
                  id={listing.id}
                />
              ))}
            </ul>
          </div>
        )}
      </div> */}
    </div>
  );
}
