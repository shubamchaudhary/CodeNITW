import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";

// The end of every page: one link to write to the developer, at the site's
// official address — the same one the contest reminders are sent from. (The
// owner account that unlocks the private pages is separate: see OwnerRoute.)
const EMAIL = "interviewplanprep@gmail.com";
const SUBJECT = encodeURIComponent("About InterviewPlanPrep");
const MAILTO = `mailto:${EMAIL}?subject=${SUBJECT}`;
const GMAIL = `https://mail.google.com/mail/?view=cm&fs=1&to=${EMAIL}&su=${SUBJECT}`;

const linkClass =
  "text-[13px] font-medium text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-300 underline-offset-4 hover:underline";

export default function Footer() {
  const location = useLocation();
  const [noMailApp, setNoMailApp] = useState(false);
  useEffect(() => setNoMailApp(false), [location.pathname]);

  // The auth screens are full-bleed, with no app chrome (same as the header).
  if (["/sign-in", "/sign-up", "/forgot-password"].includes(location.pathname)) return null;

  // A mailto link does nothing on a computer with no mail app set up. When a
  // mail app does open, this window loses focus; if it hasn't shortly after
  // the click, nothing opened, so offer Gmail and the address instead.
  const tryMailApp = () => {
    let left = false;
    const onBlur = () => (left = true);
    window.addEventListener("blur", onBlur, { once: true });
    setTimeout(() => {
      window.removeEventListener("blur", onBlur);
      if (!left && document.visibilityState === "visible") setNoMailApp(true);
    }, 900);
  };

  const copy = () => {
    navigator.clipboard
      ?.writeText(EMAIL)
      .then(() => toast.success(`Copied ${EMAIL}`))
      .catch(() => toast.info(EMAIL));
  };

  return (
    <footer className="border-t border-gray-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0b1020] py-4 text-center">
      <a href={MAILTO} onClick={tryMailApp} className={linkClass}>
        Contact developer
      </a>
      {noMailApp && (
        <p className="mt-1.5 text-[12.5px] text-gray-500 dark:text-gray-400">
          No mail app opened.{" "}
          <a href={GMAIL} target="_blank" rel="noopener noreferrer" className={`${linkClass} !text-violet-600 dark:!text-violet-300`}>
            Write in Gmail
          </a>
          {" · "}
          <button onClick={copy} className={`${linkClass} !text-violet-600 dark:!text-violet-300`}>
            Copy address
          </button>
        </p>
      )}
      {/* Visits are counted (see Data/visitTracker), so say what is kept. */}
      <p className="mt-1.5 text-[11.5px] text-gray-400 dark:text-gray-500">
        Visits are counted to improve the site: pages viewed, approximate location, device, and your account if you're signed in. No IP addresses are stored.
      </p>
    </footer>
  );
}
