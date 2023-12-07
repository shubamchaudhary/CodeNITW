
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import Codeit from "../images/codenitw.png";
import { CiLight } from "react-icons/ci";
import { SiDarkreader } from "react-icons/si";
import { BsBrightnessHigh } from "react-icons/bs";
import { CiBrightnessUp } from "react-icons/ci";
import  Tilt from "react-parallax-tilt";

export default function Header() {
  const [pageState, setPageState] = useState("sign-in");
  const [displayPageName, setDisplayPageName] = useState("Sign in");
  const [user, setUser] = useState(null); // Add user state to keep track of authentication state
  const [menuOpen, setMenuOpen] = useState(false);

  const [darkMode, setDarkMode] = useState( JSON.parse(localStorage.getItem("darkMode")) || false);
    useEffect(() => {
        localStorage.setItem("darkMode", JSON.stringify(darkMode));
    
        if(darkMode){
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
      }, [darkMode]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  const auth = getAuth();
  const userEmail = user && user.email;
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setPageState("Dashboard");
        setDisplayPageName("Dashboard");
      } else {
        setPageState("sign-in");
        setDisplayPageName("Sign in");
      }
      setUser(user);
    });
  }, [auth]);

  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path) => location.pathname === path;
  function isPath(route) {
    return route === location.pathname;
  }

  // Function to handle logout
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigate("/sign-in");
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  };

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (location.pathname === "/") {
        if (user) {
          navigate("/resources");
        } else {
          navigate("/sign-in");
        }
      }
      setUser(user);
    });
  }, [auth, navigate, location.pathname]);

  const handlePageSelect = (path) => {
    navigate(path);
    toggleMenu();
  };

  return (
    <div>
      <header>
        <nav className="bg-blue-200 dark:bg-[#2C2C2EFF] shadow-lg dark:text-white  border-gray-200 px-4 lg:px-6 py-4">
          <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
            <a href="" className="flex items-center">
            <Tilt
    className="parallax-effect-img"
    tiltMaxAngleX={40}
    tiltMaxAngleY={0}
    perspective={2000}
    transitionSpeed={1500}
    scale={1.1}
    gyroscope={true}
  >
   <img
                src={Codeit}
                className="mr-3 h-8 sm:h-12 lg:h-14"
                alt="Flowbite Logo"
              />
  </Tilt>
             
            </a>
            <div className="flex items-center lg:order-2">
              <button 
                className="text-darkbg text-2xl dark:text-white" 
                onClick={() => setDarkMode(!darkMode)} 
              >
                {darkMode ? <BsBrightnessHigh/> : <SiDarkreader />}
              </button>
              <button
                data-collapse-toggle="mobile-menu-2"
                type="button"
                className="inline-flex items-center p-2 ml-1 text-sm text-black-500 rounded-lg lg:hidden hover:bg-black-100 focus:outline-none focus:ring-2 focus:ring-black-200 dark:text-black-200 dark:hover:bg-black-200 dark:focus:bg-black-200"
                onClick={toggleMenu}
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    className={`${menuOpen ? 'hidden' : 'block'}`}
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"
                  ></path>
                  <path
                    className={`${menuOpen ? 'block' : 'hidden'}`}
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6 4h12v2H6zm0 5h12v2H6zm0 5h12v2H6z"
                  ></path>
                </svg>
              </button>
            </div>
            <div
  className={`${
    menuOpen ? 'block' : 'hidden'
  }
  ${
    menuOpen && 'dark:bg-[#2C2C2EFF]'
  }
   justify-between items-center w-2/5 lg:w-auto absolute z-10 rounded-[20px] lg:relative lg:flex lg:order-1 top-[60px] right-0 bg-blue-200 bg-opacity  transition ease-in duration-5000 lg:bg-transparent dark:lg:bg-transparent lg:top-auto lg:right-auto`}
  id="mobile-menu-2"
>
              <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">
              <li
                   onClick={() => handlePageSelect("/discussion")}
                   className={`block py-2 pr-4 pl-3  hover:text-gray-600 hover:cursor-pointer border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0   ${
                  isActive("/discussion")
                      ? "text-gray-600 font-extrabold text-lg mt-1 dark:text-gray-400"
                     : "text-gray-500 dark:text-gray-400"
                       }`}
                      >
                   DISCUSS
                      </li>
              <li
                   onClick={() => handlePageSelect("/resources")}
                   className={`block py-2 pr-4 pl-3  hover:text-gray-600 hover:cursor-pointer border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0   ${
                  isActive("/resources")
                      ? "text-gray-600 font-extrabold text-lg mt-1 dark:text-gray-400"
                     : "text-gray-500 dark:text-gray-400"
                       }`}
                      >
                   PROBLEMS
                      </li>
                 {(userEmail === 'sc922055@student.nitw.ac.in' || userEmail === 'rk972006@student.nitw.ac.in') && (
                  <li
                    onClick={() => handlePageSelect("/add-contest")}
                    className={`block py-2 pr-4 pl-3 hover:text-gray-600    border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0   ${
                    isActive("/add-contest")
                    ? "text-gray-600 font-extrabold text-lg mt-1 dark:text-gray-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  ADD CONTEST
                </li>
                )}
                <li
                  onClick={() => handlePageSelect("/contest")}
                  className={`block py-2 pr-4 pl-3  hover:text-gray-600 hover:cursor-pointer   border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0   ${
                    isActive("/contest")
                    ? "text-gray-600 font-extrabold text-lg mt-1 dark:text-gray-400"
                    : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  CONTESTS
                </li>
                <li
                  onClick={() => handlePageSelect("/leaderboard")}
                  className={`block py-2 pr-4 pl-3 hover:text-gray-600  hover:cursor-pointer  border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0   ${
                    isActive("/leaderboard")
                      ? "text-gray-600 font-extrabold text-lg mt-1 dark:text-gray-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  LEADERBOARD
                </li>
                <li
                  onClick={() => handlePageSelect(pageState)}
                  className={`block py-2 pr-4 pl-3  hover:text-gray-600 hover:cursor-pointer   border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0   ${
                    isPath("/Dashboard")
                    ? "text-gray-600 font-extrabold text-lg mt-1 dark:text-gray-400"
                    : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  DASHBOARD
                </li>
                {/* {user && user.email ? ( */}
                  <li
                    onClick={handleLogout}
                    className={`block py-2 pr-4 pl-3 text-gray-500 hover:cursor-pointer  hover:text-gray-600  h  border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent dark:text-gray-400 lg:border-0 lg:hover:text-primary-700 lg:p-0 `} >
                    {isPath('/sign-in') ? "SIGN IN" : isPath('/sign-up') ? "SIGN IN" : isPath('/forgot-password') ? "SIGN IN" : "LOG OUT"}
                  </li>
                  
               
              </ul>
                
            </div>
          </div>
          
        </nav>
        
      </header>
      
    </div>
  );
}