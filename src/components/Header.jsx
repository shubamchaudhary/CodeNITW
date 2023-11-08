import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import Codeit from "../images/codeIt3.png";

export default function Header() {
  const [pageState, setPageState] = useState("sign-in");
  const [displayPageName, setDisplayPageName] = useState("Sign in");
  const [user, setUser] = useState(null); // Add user state to keep track of authentication state
  const [menuOpen, setMenuOpen] = useState(false);

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

  return (
    <div>
<header>
    <nav className="bg-blue-300 border-gray-200 px-4 lg:px-6 py-2.5 dark:bg-blue-300">
        <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
            <a href="" class="flex items-center">
                <img src={Codeit} class="mr-3 h-6 sm:h-9" alt="Flowbite Logo" />
            </a>
            <div className="flex items-center lg:order-2">
            <button data-collapse-toggle="mobile-menu-2" type="button" class="inline-flex items-center p-2 ml-1 text-sm text-black-500 rounded-lg lg:hidden hover:bg-black-100  focus:outline-none focus:ring-2 focus:ring-black-200 dark:text-black-200 dark:hover:bg-black-200 dark:focus:ring-black-200" aria-controls="mobile-menu-2" aria-expanded="false" onClick={toggleMenu}>
                    <span className="sr-only">Open main menu</span>
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"></path></svg>
                    <svg className="hidden w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                </button>
            </div>
            <div className={`${menuOpen ? 'block' : 'hidden'} justify-between items-center w-full lg:flex lg:w-auto lg:order-1`} id="mobile-menu-2">
                <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">
                <li  onClick={() => navigate("/resources")}>
                        <a href = "" className="block py-2 pr-4 pl-3 text-black border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0 dark:text-black lg:dark:hover:text-black dark:hover:bg-blue dark:hover:text-black lg:dark:hover:bg-transparent dark:border-gray-700 focus:bg-blue-200" aria-current="page">Resources</a>
                    </li>
                    {userEmail === 'rr7433446@gmail.com' && (    
                    <li  onClick={() => navigate("/add-contest")}>
                        <a href = "" className="block py-2 pr-4 pl-3 text-black border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0 dark:text-black lg:dark:hover:text-black dark:hover:bg-blue dark:hover:text-black lg:dark:hover:bg-transparent dark:border-gray-700 focus:bg-blue-200" aria-current="page">Add Contest</a>
                    </li>
                    )}
                    <li onClick={() => navigate("/")} >
                        <a href="#" className="block py-2 pr-4 pl-3 text-black border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0 dark:text-black lg:dark:hover:text-black dark:hover:bg-blue dark:hover:text-black lg:dark:hover:bg-transparent dark:border-gray-700 focus:bg-blue-200">Contests</a>
                    </li>
                    <li  onClick={() => navigate("/leaderboard")} >
                        <a href="#" className="block py-2 pr-4 pl-3 text-black border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0 dark:text-black lg:dark:hover:text-black dark:hover:bg-blue dark:hover:text-black lg:dark:hover:bg-transparent dark:border-gray-700 focus:bg-blue-200">Leaderboard</a>
                    </li>
                    <li
                      onClick={() => navigate(pageState)}
                      className={`block py-2 pr-4 pl-3 text-black border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0 dark:text-black lg:dark:hover:text-black dark:hover:bg-blue dark:hover:text-black lg:dark:hover:bg-transparent dark:border-gray-700 focus:bg-blue-200 ${
                        isPath("/sign-in") || isPath("/Dashboard")
                          ? "text-black border-b-red-500"
                          : " text-gray-400 border-b-transparent"
                      }`}
                    >
                      {displayPageName}
                    </li>
                   {user && user.email ? (
                    <li
                      onClick={handleLogout}
                      className={`block py-2 pr-4 pl-3 text-black border-b border-gray-100 hover:bg-gray-50 lg:hover:bg-transparent lg:border-0 lg:hover:text-primary-700 lg:p-0 dark:text-black lg:dark:hover:text-black dark:hover:bg-black dark:hover:text-black lg:dark:hover:bg-transparent dark:border-gray-700 ${
                        isPath("/Dashboard")
                          ? "text-black border-b-red-500"
                          : " text-gray-400 border-b-transparent"
                      }`}
                    >
                      Logout
                    </li>
                  ) : null}
                </ul>
            </div>
        </div>
    </nav>
</header>


</div>

  );
}

