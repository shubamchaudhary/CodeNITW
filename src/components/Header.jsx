import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import Codeit from "../images/codenitw.png";
import { CiLight } from "react-icons/ci";
import { SiDarkreader } from "react-icons/si";
import { BsBrightnessHigh } from "react-icons/bs";
import { CiBrightnessUp } from "react-icons/ci";
import { HiUser, HiLogout, HiLogin } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { toast } from "react-toastify";

export default function Header() {
  const [pageState, setPageState] = useState("sign-in");
  const [displayPageName, setDisplayPageName] = useState("Sign in");
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState(
    localStorage.getItem("lastOpenedPage") || "PROBLEMS"
  );
  const [darkMode, setDarkMode] = useState(
    JSON.parse(localStorage.getItem("darkMode")) || false
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const auth = getAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const userEmail = user && user.email;

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        setPageState("Dashboard");
        setDisplayPageName("Dashboard");
      } else {
        setPageState("sign-in");
        setDisplayPageName("Sign in");
      }
    });
    return unsubscribe;
  }, [auth]);

  useEffect(() => {
    const pageMap = {
      "/problems": "PROBLEMS",
      "/DSA-450": "450DSA",
      "/cp-sheet": "CP SHEET",
      "/learning-resources": "ROADMAPS",
      "/ot-material": "OT MATERIAL",
      "/interview-exps": "INT EXPS",
    };
    setActivePage(pageMap[location.pathname] || "RESOURCES");
  }, [location.pathname]);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (location.pathname === "/") {
        navigate(user ? "/Dashboard" : "/sign-in");
      }
      setUser(user);
    });
  }, [auth, navigate, location.pathname]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const isActive = (path) => location.pathname === path;
  const isPath = (route) => route === location.pathname;

  const handleLogout = () => {
    if (user) {
      signOut(auth)
        .then(() => {
          navigate("/sign-in");
          toast.info("Logged Out Successfully");
        })
        .catch((error) => {
          console.error("Logout error:", error);
          toast.error("Error logging out");
        });
    }
  };

  const handleLogin = () => {
    navigate("/sign-in");
  };

  const handlePageSelect = (path, pageName) => {
    navigate(path);
    if (pageName) {
      setActivePage(pageName);
      localStorage.setItem("lastOpenedPage", pageName);
    }
    setMenuOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest(".dropdown-container")) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [dropdownOpen]);

  const navItemClass = (isActiveItem) => `
    relative block py-2 pr-4 pl-3 
    hover:text-gray-800 dark:hover:text-white
    hover:cursor-pointer 
    transition-all duration-200 ease-in-out
    lg:hover:bg-transparent lg:p-0
    ${
      isActiveItem
        ? "text-gray-800 font-bold dark:text-white"
        : "text-gray-600 dark:text-gray-300"
    }
    after:content-[''] after:absolute after:bottom-0 after:left-0 
    after:w-0 after:h-0.5 after:bg-current
    after:transition-all after:duration-300
    hover:after:w-full
    ${isActiveItem ? "after:w-full" : ""}
  `;

  return (
    <header>
      <nav className="bg-[#e9f1ff] dark:bg-[#050b15] border-b-2 border-blue-100 dark:border-transparent dark:text-white px-4 lg:px-6 py-4 sticky top-0 z-50">
        <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
          {/* Logo */}
          <a href="/" className="flex items-center">
            <Tilt
              className="parallax-effect-img"
              tiltMaxAngleX={0}
              tiltMaxAngleY={20}
              perspective={2000}
              transitionSpeed={100}
              scale={1.05}
              gyroscope={true}
            >
              <img
                src={Codeit}
                className="mr-3 h-8 sm:h-12 lg:h-14 transition-transform duration-300 hover:scale-110"
                alt="Codeit Logo"
              />
            </Tilt>
          </a>

          {/* Right side controls */}
          <div className="flex items-center gap-3 lg:order-2">
            {/* User indicator */}
            {user && (
              <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <HiUser className="text-lg" />
                <span className="max-w-[150px] truncate">{user.email}</span>
              </div>
            )}

            {/* Dark mode toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="text-gray-700 text-2xl dark:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setDarkMode(!darkMode)}
            >
              <AnimatePresence mode="wait">
                {darkMode ? (
                  <motion.div
                    key="light"
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 180, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <BsBrightnessHigh />
                  </motion.div>
                ) : (
                  <motion.div
                    key="dark"
                    initial={{ rotate: 180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -180, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <SiDarkreader />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              className="inline-flex items-center p-2 text-gray-700 dark:text-gray-300 rounded-lg lg:hidden hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={toggleMenu}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <AnimatePresence mode="wait">
                  {menuOpen ? (
                    <motion.path
                      key="close"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      exit={{ pathLength: 0 }}
                      d="M6 18L18 6M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                    />
                  ) : (
                    <motion.path
                      key="open"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      exit={{ pathLength: 0 }}
                      fillRule="evenodd"
                      d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"
                    />
                  )}
                </AnimatePresence>
              </svg>
            </button>
          </div>

          {/* Navigation menu */}
          <AnimatePresence>
            {(menuOpen || window.innerWidth >= 1024) && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className={`
                  ${menuOpen ? "block" : "hidden"}
                  w-full lg:w-auto
                  absolute lg:relative
                  top-[72px] lg:top-auto
                  left-0 lg:left-auto
                  bg-white/95 dark:bg-[#050b15]/95
                  backdrop-blur-sm
                  lg:bg-transparent dark:lg:bg-transparent
                  rounded-b-2xl lg:rounded-none
                  border lg:border-0 border-blue-100 dark:border-gray-800
                  lg:flex lg:order-1
                `}
              >
                <ul className="flex flex-col p-4 lg:p-0 font-medium lg:flex-row lg:space-x-8 lg:mt-0">
                  <li>
                    <button
                      onClick={() => handlePageSelect("/discussion")}
                      className={navItemClass(isActive("/discussion"))}
                    >
                      DISCUSS
                    </button>
                  </li>

                  {/* Resources Dropdown */}
                  <li className="dropdown-container relative">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className={`${navItemClass(
                        isActive("/learning-resources") ||
                          isActive("/problems") ||
                          isActive("/ot-material") ||
                          isActive("/DSA-450") ||
                          isActive("/cp-sheet") ||
                          isActive("/interview-exps")
                      )} flex items-center gap-1`}
                    >
                      {activePage}
                      <motion.span
                        animate={{ rotate: dropdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        ▼
                      </motion.span>
                    </button>

                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.ul
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="absolute left-0 mt-2 w-40 bg-white dark:bg-[#0a1529] rounded-lg shadow-xl overflow-hidden"
                        >
                          {[
                            { path: "/problems", name: "PROBLEMS" },
                            { path: "/DSA-450", name: "450DSA" },
                            { path: "/cp-sheet", name: "CP SHEET" },
                            { path: "/learning-resources", name: "ROADMAPS" },
                            { path: "/interview-exps", name: "INT EXPS" },
                          ].map((item, index) => (
                            <motion.li
                              key={item.path}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <button
                                onClick={() => {
                                  handlePageSelect(item.path, item.name);
                                  setDropdownOpen(false);
                                }}
                                className="w-full px-4 py-3 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              >
                                {item.name}
                              </button>
                            </motion.li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </li>

                  {/* Admin only - Add Contest */}
                  {/* {(userEmail === "sc922055@student.nitw.ac.in" ||
                    userEmail === "rk972006@student.nitw.ac.in") && (
                    <li>
                      <button
                        onClick={() => handlePageSelect("/add-contest")}
                        className={navItemClass(isActive("/add-contest"))}
                      >
                        ADD CONTEST
                      </button>
                    </li>
                  )} */}

                  <li>
                    <button
                      onClick={() => handlePageSelect("/contest")}
                      className={navItemClass(isActive("/contest"))}
                    >
                      CONTESTS
                    </button>
                  </li>

                  <li>
                    <button
                      onClick={() => handlePageSelect("/leaderboard")}
                      className={navItemClass(isActive("/leaderboard"))}
                    >
                      LEADERBOARD
                    </button>
                  </li>

                  {/* Dashboard - Only show if logged in */}
                  {user && (
                    <li>
                      <button
                        onClick={() => handlePageSelect("/Dashboard")}
                        className={navItemClass(isPath("/Dashboard"))}
                      >
                        DASHBOARD
                      </button>
                    </li>
                  )}

                  {/* Login/Logout button - Only show logout when user is logged in */}
                  {user && (
                    <li>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLogout}
                        className={`
                          flex items-center gap-2
                          px-4 py-2 lg:px-0 lg:py-0
                          ${navItemClass(false)}
                          text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300
                        `}
                      >
                        <HiLogout className="text-lg" />
                        <span>LOG OUT</span>
                      </motion.button>
                    </li>
                  )}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </header>
  );
}
