import React from "react";

// The site's name and mark, in one place so the header and the sign-in page
// always match. The name is the domain (interviewplanprep.vercel.app). The
// favicon (public/favicon.svg, and the PNGs/ICO rendered from it) is this same
// mark — change them together.
export const SITE_NAME = "InterviewPlanPrep";

export default function Brand({ size = "md" }) {
  const lg = size === "lg";
  return (
    <span className="flex items-center gap-2">
      <svg viewBox="0 0 32 32" className={`shrink-0 ${lg ? "w-8 h-8" : "w-6 h-6"}`} aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#7c3aed" />
        <path d="M9.5 10.5 L15.5 16 L9.5 21.5" stroke="white" strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 21.5 H23" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
      <span className={`${lg ? "text-[22px]" : "text-[16px]"} font-semibold tracking-[-0.01em] text-fg`}>{SITE_NAME}</span>
    </span>
  );
}
