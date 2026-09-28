import React from "react";

// The site's name and mark, in one place so the header and the sign-in page
// always match. The name is the domain (interviewplanprep.vercel.app); the
// mark is the favicon's prompt glyph, flat.
export const SITE_NAME = "InterviewPlanPrep";

export default function Brand({ size = "md" }) {
  const lg = size === "lg";
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 32 32" className={`shrink-0 ${lg ? "w-8 h-8" : "w-7 h-7"}`} aria-hidden="true">
        <rect width="32" height="32" rx="8" className="fill-violet-600 dark:fill-violet-500" />
        <path d="M9.5 10.5 L15.5 16 L9.5 21.5" stroke="white" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 21.5 H23" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
      <span
        className={`${lg ? "text-[22px]" : "text-[16px] sm:text-[18px]"} font-extrabold tracking-tight text-gray-900 dark:text-white`}
      >
        Interview<span className="text-violet-600 dark:text-violet-400">Plan</span>Prep
      </span>
    </span>
  );
}
