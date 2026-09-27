import React from "react";
import { useLocation } from "react-router-dom";

// The end of every page: one link to write to the developer.
const MAILTO = `mailto:beshubam@gmail.com?subject=${encodeURIComponent("About InterviewPlanPrep")}`;

export default function Footer() {
  const location = useLocation();
  // The auth screens are full-bleed, with no app chrome (same as the header).
  if (["/sign-in", "/sign-up", "/forgot-password"].includes(location.pathname)) return null;

  return (
    <footer className="border-t border-gray-200/80 dark:border-white/[0.07] bg-white dark:bg-[#0b1020] py-4 text-center">
      <a
        href={MAILTO}
        className="text-[13px] font-medium text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-300 underline-offset-4 hover:underline"
      >
        Contact developer
      </a>
    </footer>
  );
}
