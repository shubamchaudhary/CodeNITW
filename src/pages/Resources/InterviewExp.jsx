import React, { useState } from "react";
import {
  AiOutlineDown,
  AiOutlineUp,
  AiOutlineUser,
  AiOutlineClose,
  AiOutlineFileText,
} from "react-icons/ai";
import AnimatedModal from "./Modal";
import MarkdownPreview from "@uiw/react-markdown-preview";
import AbhishekNavadiya from "../../Data/Experiences/Abhishek Navadiya.txt";
import GaneshYadava from "../../Data/Experiences/Ganesh Yadava.txt";
import AryanSrivastava from "../../Data/Experiences/Aryan Srivastava.txt";
import VedantNagre from "../../Data/Experiences/Vedant Nagre.txt";
import NikhilBoob from "../../Data/Experiences/Nikhil Boob.txt";
import ManideepSaiBoddepalli from "../../Data/Experiences/manideep sai boddepalli.txt";
import MeghanaThallada from "../../Data/Experiences/Meghana Thallada.txt";
import AdithyaVardhanReddy from "../../Data/Experiences/K N Adithya Vardhan Reddy.txt";
import JoelCecil from "../../Data/Experiences/Joel Cecil.txt";
import HarshilPatel from "../../Data/Experiences/Harshil Patel.txt";
import ParthSoni from "../../Data/Experiences/Parth Soni.txt";
import AdarshRao from "../../Data/Experiences/Adarsh Rao.txt";
import MSATanzeel from "../../Data/Experiences/M S A Tanzeel.txt";
import ChirantanMuliya from "../../Data/Experiences/Chirantan Muliya.txt";
import VijayChowdaryNelakurthi from "../../Data/Experiences/Vijay Chowdary Nelakurthi.txt";

const ExperienceDetail = ({ experience, onClose }) => {
  const [darkMode, setDarkMode] = useState(
    JSON.parse(localStorage.getItem("darkMode")) || false
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-7xl h-[95vh] overflow-hidden border border-gray-200 dark:border-slate-600 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-gray-200 dark:border-slate-600 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl">
              <AiOutlineFileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Interview Experience
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Read the complete interview journey
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-600/50 rounded-xl transition-all duration-200 hover:scale-105"
          >
            <AiOutlineClose className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-6 md:p-8 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/50 dark:to-slate-800">
            <div className="prose prose-lg prose-blue dark:prose-invert max-w-none">
              <MarkdownPreview
                source={experience}
                wrapperElement={{
                  "data-color-mode": darkMode ? "dark" : "light",
                }}
                className="bg-transparent leading-relaxed"
                style={{
                  fontSize: "16px",
                  lineHeight: "1.8",
                  "--color-fg-default": darkMode ? "#e5e7eb" : "#374151",
                  "--color-canvas-default": "transparent",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CompanyCard = ({ company, isOpen, onToggle, onExperienceClick }) => {
  const getCompanyIcon = (companyName) => {
    // You can add specific company icons here if needed
    return "🏢";
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-600 overflow-hidden transition-all duration-300 hover:shadow-xl">
      {/* Company Header */}
      <div
        className="flex items-center justify-between p-1 md:p-2 cursor-pointer  from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 hover:from-blue-50 hover:to-indigo-100 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-200"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg md:text-xl">
            {getCompanyIcon(company.name)}
          </span>
          <div>
            <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
              {company.name}
            </h2>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              {company.experiences.length} experience
              {company.experiences.length !== 1 ? "s" : ""}
            </p>
          </div>
          <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
            {company.experiences.length}
          </span>
        </div>
        <div className="text-blue-600 dark:text-blue-400 transition-transform duration-200">
          {isOpen ? (
            <AiOutlineUp className="w-4 h-4 md:w-5 md:h-5" />
          ) : (
            <AiOutlineDown className="w-4 h-4 md:w-5 md:h-5" />
          )}
        </div>
      </div>

      {/* Experiences List */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="p-4 md:p-6 pt-0">
          <div className="space-y-2 md:space-y-3">
            {company.experiences.map((experience, index) => (
              <div
                key={index}
                onClick={() => onExperienceClick(experience.file)}
                className="flex items-center p-3 md:p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-600 cursor-pointer transition-all duration-200 border border-transparent hover:border-blue-200 dark:hover:border-blue-700 group"
              >
                <div className="flex items-center flex-1">
                  <AiOutlineUser className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400 mr-3 group-hover:scale-110 transition-transform" />
                  <div>
                    <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {experience.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Click to read experience
                    </p>
                  </div>
                </div>
                <div className="text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  <AiOutlineFileText className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const InterviewExp = () => {
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openCompanyIndex, setOpenCompanyIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleCompany = (index) => {
    setOpenCompanyIndex(openCompanyIndex === index ? null : index);
  };

  const companies = [
    {
      name: "Uber",
      experiences: [{ name: "Abhishek Navadiya", file: AbhishekNavadiya }],
    },
    {
      name: "De Shaw",
      experiences: [
        { name: "Ganesh Yadava", file: GaneshYadava },
        { name: "Aryan Srivastava", file: AryanSrivastava },
      ],
    },
    {
      name: "Service Now",
      experiences: [{ name: "Vedant Nagre", file: VedantNagre }],
    },
    {
      name: "Chronus",
      experiences: [{ name: "Nikhil Boob", file: NikhilBoob }],
    },
    {
      name: "VISA",
      experiences: [
        { name: "Manideep Sai Boddepalli", file: ManideepSaiBoddepalli },
      ],
    },
    {
      name: "Goldman Sachs",
      experiences: [
        { name: "Meghana Thallada", file: MeghanaThallada },
        { name: "K N Adithya Vardhan Reddy", file: AdithyaVardhanReddy },
      ],
    },
    {
      name: "Oracle",
      experiences: [
        { name: "Joel Cecil", file: JoelCecil },
        { name: "Harshil Patel", file: HarshilPatel },
      ],
    },
    {
      name: "Qualcomm",
      experiences: [{ name: "Parth Soni", file: ParthSoni }],
    },
    {
      name: "MasterCard",
      experiences: [{ name: "Adarsh Rao", file: AdarshRao }],
    },
    {
      name: "CodeNation",
      experiences: [{ name: "M S A Tanzeel", file: MSATanzeel }],
    },
    {
      name: "Microsoft",
      experiences: [{ name: "Chirantan Muliya", file: ChirantanMuliya }],
    },
    {
      name: "John Deere",
      experiences: [
        { name: "Vijay Chowdary Nelakurthi", file: VijayChowdaryNelakurthi },
      ],
    },
  ];

  const handleExperienceClick = async (file) => {
    setIsLoading(true);
    try {
      const response = await fetch(file);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      setSelectedExperience(text);
      setIsModalOpen(true);
    } catch (error) {
      console.log("Fetch Error: ", error);
      // You could add a toast notification here for better UX
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedExperience(null);
    setIsModalOpen(false);
  };

  const totalExperiences = companies.reduce(
    (total, company) => total + company.experiences.length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Page Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Interview Experiences
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-6">
            Learn from the experiences of students who successfully cracked
            interviews at top companies
          </p>
          <div className="flex items-center justify-center mt-4 space-x-4">
            <div className="bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {companies.length} Companies
              </span>
            </div>
            <div className="bg-green-100 dark:bg-green-900 px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                {totalExperiences} Experiences
              </span>
            </div>
          </div>
        </div>

        {/* Companies Grid */}
        <div className="space-y-6">
          {companies.map((company, index) => (
            <CompanyCard
              key={index}
              company={company}
              isOpen={openCompanyIndex === index}
              onToggle={() => toggleCompany(index)}
              onExperienceClick={handleExperienceClick}
            />
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-900 dark:text-white">
                Loading experience...
              </span>
            </div>
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <ExperienceDetail
            experience={selectedExperience}
            onClose={handleCloseDetail}
          />
        )}
      </div>
    </div>
  );
};

export default InterviewExp;
