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
<li className="relative bg-blue-300 bg-opacity-50 w-[90%] my-10 items-center shadow-lg hover:shadow-xl rounded-md overflow-hidden transition-shadow duration-300 m-10 p-4">
  <div className="grid grid-cols-1 sm:grid-cols-4 space-x-4 items-center sm:w-[90%]">
    <div className="col-span-1 sm:col-span-1">
      <img
        className="max-w-[170px] p-2 rounded-md sm:block hidden"
        src={ContestImg}
        alt="contest image"
      />
    </div>

    <div className="col-span-1 sm:col-span-3">
      <h1 className="text-3xl font-bold text-blue-700">
        {listing.name}
      </h1>

      <div className="flex flex-col sm:flex-row items-start sm:items-center space-x-0 sm:space-x-4 mt-2">
        <div className="mb-2 sm:mb-0">
          <span className="font-bold text-blue-700">Starts on:</span>
          <span className="text-gray-600">{listing.startingTime}</span>
        </div>
        <div className="mb-2 sm:mb-0">
          <span className="font-bold text-blue-700">Duration:</span>
          <span className="text-gray-600">{listing.duration} Minutes</span>
        </div>
      </div>

      <div className="mt-4">
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
  </div>
</li>

  );  
}
