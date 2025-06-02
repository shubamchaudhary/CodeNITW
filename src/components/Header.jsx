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
    relative block py-3 px-4 font-medium text-sm
    transition-all duration-200 ease-in-out
    lg:hover:bg-transparent lg:p-3
    ${
      isActiveItem
        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
        : "text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg"
    }
  `;

  return (
    <header>
      <nav className="bg-white dark:bg-slate-900 shadow-lg border-b border-gray-200 dark:border-slate-700 px-4 lg:px-6 py-4 sticky top-0 z-50">
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
              <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                <HiUser className="text-lg text-blue-600 dark:text-blue-400" />
                <span className="max-w-[150px] truncate font-medium">
                  {user.email}
                </span>
              </div>
            )}

            {/* Dark mode toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="text-gray-600 dark:text-gray-400 text-2xl p-2 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
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
              className="inline-flex items-center p-2 text-gray-600 dark:text-gray-400 rounded-lg lg:hidden bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
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
                  bg-white dark:bg-slate-900
                  lg:bg-transparent dark:lg:bg-transparent
                  rounded-b-2xl lg:rounded-none
                  border lg:border-0 border-gray-200 dark:border-slate-700
                  shadow-lg lg:shadow-none
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
                  <li className="dropdown-container relative lg:static">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className={`${navItemClass(
                        isActive("/learning-resources") ||
                          isActive("/problems") ||
                          isActive("/ot-material") ||
                          isActive("/DSA-450") ||
                          isActive("/cp-sheet") ||
                          isActive("/interview-exps")
                      )} flex items-center gap-1 w-full lg:w-auto justify-between lg:justify-center`}
                    >
                      {activePage}
                      <motion.span
                        animate={{ rotate: dropdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-blue-600 dark:text-blue-400"
                      >
                        ▼
                      </motion.span>
                    </button>

                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="lg:absolute lg:left-0 lg:mt-2 lg:w-40 lg:bg-white lg:dark:bg-slate-800 lg:rounded-lg lg:shadow-xl lg:border lg:border-gray-200 lg:dark:border-slate-600 overflow-hidden"
                        >
                          <ul className="lg:block">
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
                                className="lg:block"
                              >
                                <button
                                  onClick={() => {
                                    handlePageSelect(item.path, item.name);
                                    setDropdownOpen(false);
                                  }}
                                  className="w-full px-4 py-2 lg:py-3 text-sm text-left text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg lg:rounded-none ml-4 lg:ml-0 my-1 lg:my-0"
                                >
                                  {item.name}
                                </button>
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>

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
                          px-4 py-2 lg:px-3 lg:py-2
                          text-red-600 dark:text-red-400 
                          hover:text-red-700 dark:hover:text-red-300
                          hover:bg-red-50 dark:hover:bg-red-900/20
                          rounded-lg transition-colors font-medium
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
