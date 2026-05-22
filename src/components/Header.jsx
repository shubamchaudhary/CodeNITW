import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { SiDarkreader } from "react-icons/si";
import { BsBrightnessHigh } from "react-icons/bs";
import { HiUser, HiLogout } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

const NAV_ITEMS = [
  { path: "/interview-prep", label: "INTERVIEW PREP" },
  { path: "/dsa-prep", label: "DSA" },
  { path: "/planning", label: "PLANNING" },
];

export default function Header() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    JSON.parse(localStorage.getItem("darkMode")) || false
  );

  const auth = getAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setUser(user));
    return unsubscribe;
  }, [auth]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const isActive = (path) => location.pathname === path;

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

  const handlePageSelect = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const navItemClass = (isActiveItem) => `
    relative block py-2 px-3 font-semibold text-xs tracking-wide
    transition-all duration-200 ease-in-out rounded-lg
    ${
      isActiveItem
        ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
        : "text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
    }
  `;

  return (
    <header>
      <nav className="bg-white dark:bg-slate-900 shadow-lg border-b border-gray-200 dark:border-slate-700 px-3 lg:px-5 py-3 sticky top-0 z-50">
        <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
          {/* Logo */}
          <button
            onClick={() => handlePageSelect("/interview-prep")}
            className="flex items-center gap-1 group"
          >
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 dark:from-indigo-400 dark:via-violet-400 dark:to-indigo-300 group-hover:scale-105 transition-transform">
              InterviewPrep
            </span>
          </button>

          {/* Right side controls */}
          <div className="flex items-center gap-2 lg:order-2">
            {user && (
              <div className="hidden lg:flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                <HiUser className="text-md text-indigo-600 dark:text-indigo-400" />
                <span className="max-w-[120px] truncate font-medium">{user.email}</span>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="text-gray-600 dark:text-gray-400 text-xl p-1 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              onClick={() => setDarkMode(!darkMode)}
            >
              <AnimatePresence mode="wait">
                {darkMode ? (
                  <motion.div key="light" initial={{ rotate: -180, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 180, opacity: 0 }} transition={{ duration: 0.3 }}>
                    <BsBrightnessHigh />
                  </motion.div>
                ) : (
                  <motion.div key="dark" initial={{ rotate: 180, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -180, opacity: 0 }} transition={{ duration: 0.3 }}>
                    <SiDarkreader />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <button
              type="button"
              className="inline-flex items-center p-1 text-gray-600 dark:text-gray-400 rounded-lg lg:hidden bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              onClick={toggleMenu}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                {menuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" fill="none" />
                ) : (
                  <path fillRule="evenodd" d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
                )}
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
                  w-full lg:w-auto absolute lg:relative top-[58px] lg:top-auto left-0 lg:left-auto
                  bg-white dark:bg-slate-900 lg:bg-transparent dark:lg:bg-transparent
                  rounded-b-2xl lg:rounded-none border lg:border-0 border-gray-200 dark:border-slate-700
                  shadow-lg lg:shadow-none lg:flex lg:order-1
                `}
              >
                <ul className="flex flex-col p-3 lg:p-0 font-medium lg:flex-row lg:space-x-2 lg:mt-0 lg:items-center">
                  {NAV_ITEMS.map((item) => (
                    <li key={item.path}>
                      <button onClick={() => handlePageSelect(item.path)} className={navItemClass(isActive(item.path))}>
                        {item.label}
                      </button>
                    </li>
                  ))}

                  {user && (
                    <li>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-1 lg:px-2 lg:py-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium text-xs"
                      >
                        <HiLogout className="text-md" />
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
