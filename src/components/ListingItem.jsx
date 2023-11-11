import React from "react";
import ContestImg from "../images/contest.png";
import { useNavigate } from "react-router-dom";

export default function ListingItem({ listing, id, onDelete, onEdit , status }) {
  let navigate = useNavigate();
  const handleClick = (e) => {
    if (status === "Past") {
      e.preventDefault();
      navigate("/leaderboard");
    }
  };
  return (
    <li className="relative bg-blue-100 w-[95%]  items-center shadow-lg hover:shadow-md rounded-md overflow-hidden transition-shadow duration-300 m-4 p-2">
      <div className="grid grid-cols-1 md:grid-cols-4 space-x-4 items-center sm:w-[90%]">
        <div className="hidden md:block md:col-span-1">
          <img
            className="max-w-[170px] p-2 rounded-md"
            src={ContestImg}
            alt="contest image"
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <h1 className="text-3xl font-bold text-blue-700">
            {listing.name}
          </h1>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-x-0 sm:space-x-4 mt-2">
            <div className="mb-2 text-sm sm:mb-0">
              {/* <span className="font-bold text-blue-700">Starts on:</span> */}
              <span className="text-gray-600 font-bold">{listing.startingTime}</span>
            </div>
            <div className="mb-2 text-sm sm:mb-0">
              {/* <span className="font-bold text-blue-700">Duration:</span> */}
              <span className="text-gray-600">{listing.duration} Minutes</span>
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-1 flex justify-end">
          <a
            href={listing.link}
            target="_blank"
            rel="noreferrer"
            className="bg-blue-700 text-white rounded-full hover:bg-blue-900 py-2 px-4 transition duration-300 inline-block font-medium"
            onClick={handleClick}
          >
            {status === "Active" ? "Go to Contest" : status === "Upcoming" ? "Register" : "Leaderboard"}
          </a>
        </div>
      </div>
    </li>
  );  
}