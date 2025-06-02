import React, { useState } from "react";
import ContestImg from "../../images/codenitwcontest.png";
import { useNavigate } from "react-router-dom";
import {
  AiOutlineCalendar,
  AiOutlineClockCircle,
  AiOutlineLink,
  AiOutlineDown,
  AiOutlineUp,
} from "react-icons/ai";

export default function ContestCard({ contest, status, imageSrc }) {
  let navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-700";
      case "Upcoming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700";
      case "Past":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200 dark:border-gray-700";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200 dark:border-gray-700";
    }
  };

  const getButtonText = (status) => {
    switch (status) {
      case "Active":
        return "Join Now";
      case "Upcoming":
        return "Register";
      case "Past":
        return "Results";
      default:
        return "View";
    }
  };

  const formatDuration = (duration) => {
    if (duration >= 60) {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
    return `${duration}m`;
  };

  // Mobile View (sm and below)
  const MobileCard = () => (
    <div className="bg-white dark:bg-[#1c2432] rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-200 overflow-hidden">
      {/* Mobile Header - Always Visible */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 min-w-0 mr-3">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {contest.name}
            </h3>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                status
              )}`}
            >
              {status === "Active" && (
                <span className="w-1 h-1 bg-green-500 rounded-full mr-1 animate-pulse"></span>
              )}
              {status}
            </span>
          </div>
        </div>
        <div className="text-gray-600 dark:text-gray-400">
          {isExpanded ? (
            <AiOutlineUp className="w-4 h-4" />
          ) : (
            <AiOutlineDown className="w-4 h-4" />
          )}
        </div>
      </div>

      {/* Mobile Expanded Content */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded
            ? "max-h-96 opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="px-3 pb-3">
          {/* Contest Image */}
          <div className="flex items-center justify-center mb-3">
            <div className="w-20 h-10 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center justify-center overflow-hidden">
              <img
                className="max-w-full max-h-full object-contain"
                src={imageSrc || contest.imageSrc || ContestImg}
                alt="contest platform"
              />
            </div>
          </div>

          {/* Contest Details */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <AiOutlineCalendar className="w-3 h-3 mr-2 text-gray-400" />
              <span>{contest.startingTime}</span>
            </div>
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <AiOutlineClockCircle className="w-3 h-3 mr-2 text-gray-400" />
              <span>{formatDuration(contest.duration)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {status === "Past" && contest.editorialLink && (
              <a
                href={contest.editorialLink}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Editorial
              </a>
            )}

            <a
              href={contest.link}
              target="_blank"
              rel="noreferrer"
              className={`flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-white rounded transition-all duration-200 ${
                status === "Active"
                  ? "bg-green-600 hover:bg-green-700"
                  : status === "Upcoming"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-600 hover:bg-gray-700"
              }`}
            >
              {getButtonText(status)}
              <AiOutlineLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  // Desktop View (md and above)
  const DesktopCard = () => (
    <div className="bg-white dark:bg-[#1c2432] rounded-lg shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 overflow-hidden group">
      <div className="flex items-center p-2 md:p-3">
        {/* Contest Image */}
        <div className="flex items-center justify-center flex-shrink-0 mr-3 md:mr-4">
          <div className="w-16 h-8 md:w-20 md:h-10 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center justify-center overflow-hidden">
            <img
              className="max-w-full max-h-full object-contain"
              src={imageSrc || contest.imageSrc || ContestImg}
              alt="contest platform"
            />
          </div>
        </div>

        {/* Contest Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            {/* Left side - Contest info */}
            <div className="flex-1 min-w-0 mb-1 sm:mb-0 sm:mr-4">
              {/* Contest Name and Status */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-1">
                <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {contest.name}
                </h3>
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium border mt-0.5 sm:mt-0 w-fit ${getStatusColor(
                    status
                  )}`}
                >
                  {status === "Active" && (
                    <span className="w-1 h-1 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                  )}
                  {status}
                </span>
              </div>

              {/* Contest Metadata */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-0.5 sm:space-y-0 sm:space-x-3 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <AiOutlineCalendar className="w-3 h-3 mr-1 text-gray-400" />
                  <span className="truncate">{contest.startingTime}</span>
                </div>
                <div className="flex items-center">
                  <AiOutlineClockCircle className="w-3 h-3 mr-1 text-gray-400" />
                  <span>{formatDuration(contest.duration)}</span>
                </div>
              </div>
            </div>

            {/* Right side - Action buttons */}
            <div className="flex items-center space-x-1.5 flex-shrink-0">
              {status === "Past" && contest.editorialLink && (
                <a
                  href={contest.editorialLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-gray-500"
                >
                  <span className="hidden sm:inline">Editorial</span>
                  <span className="sm:hidden">Edit</span>
                </a>
              )}

              <a
                href={contest.link}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center px-2 md:px-3 py-1 text-xs font-medium text-white rounded transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 ${
                  status === "Active"
                    ? "bg-green-600 hover:bg-green-700 shadow hover:shadow-md"
                    : status === "Upcoming"
                    ? "bg-blue-600 hover:bg-blue-700 shadow hover:shadow-md"
                    : "bg-gray-600 hover:bg-gray-700"
                }`}
              >
                <span className="hidden sm:inline">
                  {getButtonText(status)}
                </span>
                <span className="sm:hidden">
                  {status === "Active"
                    ? "Join"
                    : status === "Upcoming"
                    ? "Reg"
                    : "View"}
                </span>
                <AiOutlineLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Show mobile card on small screens, desktop card on larger screens */}
      <div className="block sm:hidden">
        <MobileCard />
      </div>
      <div className="hidden sm:block">
        <DesktopCard />
      </div>
    </>
  );
}
