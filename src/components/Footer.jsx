import React from "react";

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          {/* Made and maintained by */}
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            MADE AND MAINTAINED BY {"   "}
            <a
              href="https://shubamchaudhary.vercel.app/"
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors hover:underline"
            >
              SHUBAM CHAUDHARY
            </a>
          </div>

          {/* Horizontal line */}
          <hr className="border-gray-300 dark:border-slate-600 mb-4" />

          {/* Copyright */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
