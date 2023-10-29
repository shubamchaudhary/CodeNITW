import React from "react";
// import Moment from "react-moment";
import { Link } from "react-router-dom";
import { MdLocationOn, MdDelete, MdModeEditOutline } from "react-icons/md";
import contest from "../images/contest.png";
// import LeetCode from "../images/LeetCode.png";
// import CodeForces from "../images/CodeForces.png";
// import AtCoder from "../images/AtCoder.png";
// import CodeChef from "../images/CodeChef.png";

export default function ListingItem({ listing, id, onDelete, onEdit }) {
  return (
    <li className=" relative bg-gray-50 w-[90%] my-10 items-center shadow-lg hover:shadow-xl rounded-md overflow-hidden transition-shadow duration-150 m-[10px]">
      <div className="mx-4 grid grid-cols-4 space-x-4 ">
        <div>
          <img
            className="max-w-[170px] p-2 absolute left-0 top-0"
            // src={`../images/${listing.name}.png`}
            src={contest}
            alt={"contest image"}
          ></img>
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
