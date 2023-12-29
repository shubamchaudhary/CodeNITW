import React from "react";
import ContestImg from "../../images/codenitwcontest.png";
import { useNavigate } from "react-router-dom";

export default function ContestCard({ contest, status }) {
  let navigate = useNavigate();
  return (
    <li className="relative bg-white dark:bg-[#1c2432] w-[95%]  items-center shadow-lg hover:shadow-md rounded-md overflow-hidden transition-shadow duration-300 m-2 p-[2px]">
      <div className="grid grid-cols-1 md:grid-cols-4 space-x-4 items-center sm:w-[90%]">
        <div className="hidden md:block md:col-span-1">
          <img
            className="max-w-[170px] px-2 rounded-md"
            src={contest.imageSrc || ContestImg}
            alt="contest image"
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <h1 className=" text-md md:text-xl font-bold dark:text-blue-500 text-blue-700">
            {contest.name}
          </h1>

          <div className="flex flex-col sm:flex-row items-start sm:items-center space-x-0 sm:space-x-4 mt-2">
            <div className="mb-1 md:mb-2 text-[11px] md:text-sm sm:mb-0">
              {/* <span className="font-bold text-blue-700">Starts on:</span> */}
              <span className="text-gray-600 dark:text-gray-400 font-bold">{contest.startingTime}</span>
            </div>
            <div className="mb-1 md:mb-2 text-sm sm:mb-0">
              {/* <span className="font-bold text-blue-700">Duration:</span> */}
              <span className="text-gray-600 dark:text-gray-400">{contest.duration} Minutes</span>
            </div>
          </div>
        </div>

        <div className="col-span-1 mt-[-18px] md:mt-0 md:col-span-1 flex justify-end">
        {status==="Past" && <a
            href={contest.editorialLink}
            target="_blank"
            rel="noreferrer"
            className="bg-blue-700 text-sm mx-2 dark:text-gray-400 dark:bg-blue-900 hover:dark:bg-gray-900 cursor-pointer text-white rounded-2xl md:rounded-full hover:bg-blue-900 p-[4px] md:py-2 md:px-4 transition duration-300 inline-block font-medium"
          >
           Editorial
          </a>}
          <a
            href={contest.link}
            target="_blank"
            rel="noreferrer"
            className="bg-blue-700 text-sm dark:text-gray-400 mx-2 dark:bg-blue-900 hover:dark:bg-gray-900 cursor-pointer text-white rounded-2xl md:rounded-full hover:bg-blue-900 p-[4px] md:py-2 md:px-4 transition duration-300 inline-block font-medium"
          >
            {status === "Active" ? "Go to Contest" : status === "Upcoming" ? "Register" : "Results"}
            {/* {console.log(status)} */}
          </a>
        </div>
      </div>
    </li>
  );  
}