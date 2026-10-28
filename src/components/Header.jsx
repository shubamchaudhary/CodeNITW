import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { toast } from "react-toastify";
import { isOwner } from "./OwnerRoute";
import { requestSignIn } from "../Data/authGate";
import Brand, { SITE_NAME } from "./Brand";
import { WEB_BASICS_PATHS, PYTHON_BASICS_PATHS } from "../Data/WebBasics";

const NAV_ITEMS = [
  { path: "/core-stack", label: "Core Stack" },
  { path: "/dsa-prep", label: "DSA" },
  // Owner-only (see OWNER_NAV_ITEMS), but it sits beside DSA, its sibling.
  { path: "/hld-prep", label: "HLD", ownerOnly: true },
  { path: "/planning", label: "Planning" },
  { path: "/job-tracker", label: "Jobs" },
  { path: "/contests", label: "Contests" },
];

// Owner-only pages: rendered in the nav ONLY for the owner account, so other
// users never see any hint these pages exist.
const OWNER_NAV_ITEMS = [
  { path: "/ai-stack", label: "AI Stack" },
  // One entry per group of question banks; the page switches between them.
  { path: "/javascript", label: "JS · React · Node", also: WEB_BASICS_PATHS },
  { path: "/python", label: "Python · FastAPI", also: PYTHON_BASICS_PATHS },
  { path: "/projects", label: "Projects" },
];

const ICON = "w-4 h-4";
const SunIcon = () => (
  <svg className={ICON} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.06 1.06M11.54 11.54l1.06 1.06M3.4 12.6l1.06-1.06M11.54 4.46l1.06-1.06" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const MoonIcon = () => (
  <svg className={ICON} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);
const LogoutIcon = () => (
  <svg className={ICON} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M6 2.5H3.5v11H6M10.5 5l3 3-3 3M13.5 8H6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// A ghost square icon button: the theme toggle and the menu button.
const ICON_BUTTON =
  "w-8 h-8 rounded-md flex items-center justify-center text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors";

export default function Header() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // Theme is per tab: each tab remembers its own choice (sessionStorage, which
  // survives a refresh of that tab only). A new tab starts from the most
  // recent choice made in any tab (localStorage).
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const own = sessionStorage.getItem("darkMode");
      const saved = own ?? localStorage.getItem("darkMode");
      // Light until someone picks a theme.
      return saved === null ? false : JSON.parse(saved) === true;
    } catch (_) {
      return false;
    }
  });

  const auth = getAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      sessionStorage.setItem("darkMode", JSON.stringify(darkMode));
      localStorage.setItem("darkMode", JSON.stringify(darkMode));
    } catch (_) {}
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // authChecked keeps the Sign in button from flashing for a signed-in user
  // while Firebase restores the session.
  const [authChecked, setAuthChecked] = useState(false);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthChecked(true);
    });
    return unsubscribe;
  }, [auth]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  // A stack's topic pages live under /notes/<stack>/…, so its nav item stays
  // lit while you read.
  const NOTES_OF = { "/core-stack": "/notes/corestack/", "/ai-stack": "/notes/aistack/", "/projects": "/notes/projects/" };
  const isActive = (path, also) =>
    location.pathname === path ||
    (also && also.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`))) ||
    (NOTES_OF[path] && location.pathname.startsWith(NOTES_OF[path]));

  const handleLogout = () => {
    if (user) {
      signOut(auth)
        .then(() => {
          // Pages stay readable signed out; owner-only pages send you home.
          navigate("/core-stack");
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

  // Wide screens: full-height links, the current one underlined on the bar's
  // bottom edge. The menu (narrow screens): rows, the current one filled.
  const navItemClass = (active) =>
    `relative flex items-center whitespace-nowrap text-[14px] font-medium transition-colors
     w-full h-10 px-3 rounded-md lg:w-auto lg:h-14 lg:px-2.5 xl:px-3 lg:rounded-none
     ${
       active
         ? "text-fg bg-surface-hover lg:bg-transparent lg:after:absolute lg:after:inset-x-2.5 xl:after:inset-x-3 lg:after:bottom-0 lg:after:h-0.5 lg:after:bg-fg"
         : "text-fg-muted hover:text-fg hover:bg-surface-hover lg:hover:bg-transparent"
     }`;

  // The auth screens are full-bleed and immersive — no app chrome there.
  if (["/sign-in", "/sign-up", "/forgot-password"].includes(location.pathname)) {
    return null;
  }

  const items = [...NAV_ITEMS.filter((i) => !i.ownerOnly || isOwner(user)), ...(isOwner(user) ? OWNER_NAV_ITEMS : [])];

  return (
    <header>
      {/* A flat bar on the page colour with one hairline under it. */}
      <nav className="sticky top-0 z-50 bg-canvas border-b border-line px-4 lg:px-5">
        {/* Full width, like the pages under it: the logo sits flush left over
            the topic list, the page links sit in the centre, account controls
            go far right. The two outer columns are equal, so the middle one is
            centred on the page whatever the logo and controls measure. */}
        <div className="h-14 flex items-center gap-x-4 xl:gap-x-8 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          <button
            onClick={() => handlePageSelect("/core-stack")}
            className="flex items-center shrink-0 rounded-md lg:justify-self-start"
            aria-label={`${SITE_NAME} home`}
          >
            <Brand />
          </button>

          {/* Right side controls */}
          <div className="flex items-center gap-1.5 ml-auto lg:ml-0 lg:order-2 lg:justify-self-end">
            {user ? (
              <>
                <span className={`hidden ${isOwner(user) ? "2xl:block" : "xl:block"} max-w-[180px] truncate px-1 text-[12px] text-fg-subtle`}>
                  {user.email}
                </span>
                {/* On wide screens log out lives with the account, not among the pages */}
                <button
                  onClick={handleLogout}
                  title="Log out"
                  aria-label="Log out"
                  className="hidden lg:flex items-center gap-2 h-8 px-2.5 rounded-md text-[13px] font-medium whitespace-nowrap text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
                >
                  <LogoutIcon />
                  {/* Icon only until there's room: the owner's menu is long. */}
                  <span className="hidden xl:inline">Log out</span>
                </button>
              </>
            ) : (
              authChecked && (
                <button
                  onClick={() => requestSignIn()}
                  className="h-8 px-3 rounded-md text-[13px] font-medium bg-primary text-on-primary hover:bg-primary-hover transition-colors"
                >
                  Sign in
                </button>
              )
            )}

            <button
              className={ICON_BUTTON}
              data-tour="theme"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <SunIcon /> : <MoonIcon />}
            </button>

            <button type="button" className={`${ICON_BUTTON} lg:hidden`} onClick={toggleMenu} aria-label="Menu" aria-expanded={menuOpen}>
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                {menuOpen ? (
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                ) : (
                  <path d="M2.5 4h11M2.5 8h11M2.5 12h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>

          {/* Navigation: a dropdown on narrow screens, the centre column on wide */}
          {(menuOpen || window.innerWidth >= 1024) && (
            <div
              className={`
                ${menuOpen ? "block" : "hidden"}
                absolute lg:relative top-14 lg:top-auto inset-x-0 lg:inset-x-auto
                bg-canvas lg:bg-transparent border-b border-line lg:border-0 shadow-overlay lg:shadow-none
                lg:flex lg:order-1 lg:justify-self-center
              `}
            >
              <ul className="flex flex-col p-2 lg:p-0 lg:flex-row lg:items-center lg:gap-1">
                {items.map((item) => (
                  <li key={item.path}>
                    <button onClick={() => handlePageSelect(item.path)} className={navItemClass(isActive(item.path, item.also))}>
                      {item.label}
                    </button>
                  </li>
                ))}

                {user && (
                  <li className="lg:hidden mt-1 pt-1 border-t border-line">
                    <button
                      onClick={handleLogout}
                      className="w-full h-10 px-3 rounded-md flex items-center gap-2 text-[14px] font-medium text-danger-fg hover:bg-danger-subtle transition-colors"
                    >
                      <LogoutIcon />
                      Log out
                    </button>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
