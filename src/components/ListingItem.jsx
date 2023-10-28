import React from "react";
// import Moment from "react-moment";
import { Link } from "react-router-dom";
import { MdLocationOn, MdDelete, MdModeEditOutline } from "react-icons/md";
import ContestImg from "../images/contest.png";

export default function ListingItem({ listing, id, onDelete, onEdit }) {
  return (
<<<<<<< HEAD
    <li className=" relative bg-white   items-center shadow-md hover:shadow-xl rounded-md overflow-hidden transition-shadow duration-150 m-[10px]">
      <Link className="contents" to={`/category/${listing.type}/${id}`}>
        <div className="w-full p-[10px]">
          <div className="flex items-center space-x-1">
            <p className="font-semibold text-sm mb-[2px] text-gray-600 truncate">
              {listing.name}
            </p>
          </div>
=======
    <li className=" relative bg-white w-[90%] my-10 items-center shadow-lg hover:shadow-xl rounded-md overflow-hidden transition-shadow duration-150 m-[10px]">
      <div className="mx-4 grid grid-cols-4 space-x-4 ">
        <div>
          <img
            className="max-w-[170px] p-2 absolute left-0 top-0"
            src={ContestImg}
            alt="contest image"
          ></img>
>>>>>>> 15c376a01359c3319218791940c532db5da0fc86
        </div>

        <h1 className="text-3xl ml-[20%] font-bold text-red-900 ">
          {listing.name}
        </h1>

        <div className="justify-center ml-[-100px] min-w-[800px]">
          <h1>
            <span className="font-bold">Starts on:</span>
            <span className="font-bold text-gray-600">
              {" "}
              {listing.startingTime}
            </span>
          </h1>
          <h1 className="text-md  ">Duration: {listing.duration} minutes</h1>
        </div>
        {/* <button className="bg-blue-700 absolute rounded-[10px] text-white hover:bg-blue-900 p-2 right-2">
          Go to Contest
        </button> */}
        <a
          href={listing.link}
          target="_blank"
          rel="noreferrer"
          className="bg-blue-700 absolute rounded-[10px] text-white hover:bg-blue-900 p-2 right-2"
        >
          Go to Contest
        </a>
      </div>
    </li>
  );
}
