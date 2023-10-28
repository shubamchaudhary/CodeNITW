import { getAuth, onAuthStateChanged } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import Codeit from "../images/codeIt3.png";

export default function Header() {
  const [pageState, setPageState] = useState("sign-in");
  const [displayPageName, setDisplayPageName] = useState("Sign in");

  const auth = getAuth();

  useEffect(() =>
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setPageState("Dashboard");
        setDisplayPageName("Dashboard");
      } else {
        setPageState("sign-in");
        setDisplayPageName("Sign in");
      }
    })
  );

  const location = useLocation();

  const navigate = useNavigate();

  function isPath(route) {
    if (route === location.pathname) {
      return true;
    }
  }
  return (
    <div>
      <header className="flex justify-between items-center px-8 max-w-8xl  top-0 z-50">
        <div>
          <h1
            onClick={() => navigate("/")}
            className=" font-bold h-[80px] cursor-pointer cursive "
            alt=""
          >
            <img
              className="max-h-[80px] mt-[30px] ml-[10%]"
              src={Codeit}
              alt="uu"
            ></img>
          </h1>
        </div>
        <div>
          <ul className="flex space-x-20 ">
            <li
              onClick={() => navigate("/add-contest")}
              className={`cursor-pointer py-4 text-md font-semibold border-b-[3px] ${
                isPath("/add-contest")
                  ? "text-black border-b-red-500"
                  : " text-gray-400 border-b-transparent"
              }`}
            >
              AddContest
            </li>
            <li
              onClick={() => navigate("/")}
              className={`cursor-pointer py-4 text-md font-semibold border-b-[3px] ${
                isPath("/")
                  ? "text-black border-b-red-500"
                  : " text-gray-400 border-b-transparent"
              }`}
            >
              Contests
            </li>

            <li
              onClick={() => navigate("/leaderboard")}
              className={`cursor-pointer py-4 text-md font-semibold border-b-[3px] ${
                isPath("/leaderboard")
                  ? "text-black border-b-red-500"
                  : " text-gray-400 border-b-transparent"
              }`}
            >
              Leaderboard
            </li>

            <li
              onClick={() => navigate(pageState)}
              className={`cursor-pointer py-4 text-md font-semibold border-b-[3px]  ${
                isPath("/sign-in") || isPath("/Dashboard")
                  ? "text-black border-b-red-500"
                  : " text-gray-400 border-b-transparent"
              }`}
            >
              {displayPageName}
            </li>
          </ul>
        </div>
      </header>
    </div>
  );
}
