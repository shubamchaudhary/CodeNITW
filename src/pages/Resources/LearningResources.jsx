import React, { useState } from "react";
import {
  AiOutlineDown,
  AiOutlineUp,
  AiOutlinePlayCircle,
  AiOutlineFileText,
  AiOutlineCode,
  AiOutlineBulb,
  AiOutlineRocket,
  AiOutlineTool,
} from "react-icons/ai";
import { dsa, dev, core, ml } from "../../Data/LearningResourcesData";

const ModernCard = ({
  name,
  description,
  videoLink,
  problemSetLink,
  subtopics,
  card,
  index,
  total,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getCardIcon = (cardType) => {
    switch (cardType) {
      case "dsa":
        return <AiOutlineCode className="w-3 h-3" />;
      case "core":
        return <AiOutlineBulb className="w-3 h-3" />;
      case "dev":
        return <AiOutlineRocket className="w-3 h-3" />;
      case "ml":
        return <AiOutlineTool className="w-3 h-3" />;
      default:
        return <AiOutlineCode className="w-3 h-3" />;
    }
  };

  const isLastCard = index === total - 1;

  return (
    <div className="relative flex">
      {/* Timeline */}
      <div className="flex flex-col items-center mr-2 md:mr-3">
        <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 border border-white dark:border-gray-700 shadow-sm z-10"></div>
        {!isLastCard && (
          <div className="w-0.5 bg-gradient-to-b from-blue-500 to-cyan-500 flex-grow mt-1 mb-1 min-h-[40px]"></div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex-1 mb-2 w-[120%]">
        <div className="bg-white dark:bg-[#1c2432] rounded-md shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-200">
          {/* Card Header */}
          <div className="p-2 md:p-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-[#1a2332] dark:to-[#1c2432]">
            <div className="flex items-center space-x-2 md:space-x-2.5">
              <div className="p-1 bg-white dark:bg-gray-700 rounded text-blue-600 dark:text-blue-400 shadow-sm">
                {getCardIcon(card)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white mb-0.5">
                  {name}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                  {description}
                </p>
              </div>
            </div>
          </div>

          {/* Primary Links */}
          <div className="p-2 md:p-2.5 pt-1">
            <div className="flex flex-wrap gap-1.5 mb-1">
              <a
                href={videoLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded text-xs font-medium transition-all duration-200 hover:scale-105 shadow-sm"
              >
                <AiOutlinePlayCircle className="w-2.5 h-2.5 mr-1" />
                {card === "dsa" ? "Playlist" : "Video 1"}
              </a>

              <a
                href={problemSetLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded text-xs font-medium transition-all duration-200 hover:scale-105 shadow-sm"
              >
                <AiOutlineFileText className="w-2.5 h-2.5 mr-1" />
                {card === "dsa" ? "Practice" : "Video 2"}
              </a>
            </div>

            {/* Subtopics for DSA */}
            {card === "dsa" && subtopics && subtopics.length > 0 && (
              <div>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center justify-between w-full p-1.5 bg-gray-50 dark:bg-gray-800 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mb-1"
                >
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Subtopics ({subtopics.length})
                  </span>
                  {isExpanded ? (
                    <AiOutlineUp className="w-2.5 h-2.5 text-gray-600 dark:text-gray-400" />
                  ) : (
                    <AiOutlineDown className="w-2.5 h-2.5 text-gray-600 dark:text-gray-400" />
                  )}
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5">
                    {subtopics.map((subtopic, index) => (
                      <a
                        key={index}
                        href={subtopic.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center p-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      >
                        <span className="w-0.5 h-0.5 bg-blue-500 rounded-full mr-1 flex-shrink-0"></span>
                        <span className="truncate">{subtopic.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ModernContainer = ({ name, description, cards, card }) => {
  const [isOpen, setIsOpen] = useState(true);

  const getSectionIcon = (cardType) => {
    switch (cardType) {
      case "dsa":
        return <AiOutlineCode className="w-6 h-6 md:w-8 md:h-8" />;
      case "core":
        return <AiOutlineBulb className="w-6 h-6 md:w-8 md:h-8" />;
      case "dev":
        return <AiOutlineRocket className="w-6 h-6 md:w-8 md:h-8" />;
      case "ml":
        return <AiOutlineTool className="w-6 h-6 md:w-8 md:h-8" />;
      default:
        return <AiOutlineCode className="w-6 h-6 md:w-8 md:h-8" />;
    }
  };

  const getSectionColor = (cardType) => {
    switch (cardType) {
      case "dsa":
        return "from-blue-600 to-cyan-600";
      case "core":
        return "from-purple-600 to-pink-600";
      case "dev":
        return "from-green-600 to-teal-600";
      case "ml":
        return "from-orange-600 to-red-600";
      default:
        return "from-blue-600 to-cyan-600";
    }
  };

  return (
    <div className="mb-8 md:mb-12">
      <div className="bg-white dark:bg-[#121620] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Section Header */}
        <div
          className="p-6 md:p-8 cursor-pointer bg-gradient-to-r from-gray-50 to-blue-50 dark:from-[#1a2332] dark:to-[#1c2432] hover:from-blue-50 hover:to-indigo-50 dark:hover:from-[#1c2432] dark:hover:to-[#1e2634] transition-all duration-200 border-b border-gray-200 dark:border-gray-700"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`p-3 md:p-4 bg-gradient-to-r ${getSectionColor(
                  card
                )} rounded-xl text-white shadow-lg`}
              >
                {getSectionIcon(card)}
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {name}
                </h2>
                <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
                  {description}
                </p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-xs font-medium">
                    {cards.length} topic{cards.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-blue-600 dark:text-blue-400 transition-transform duration-200">
              {isOpen ? (
                <AiOutlineUp className="w-6 h-6" />
              ) : (
                <AiOutlineDown className="w-6 h-6" />
              )}
            </div>
          </div>
        </div>

        {/* Section Content */}
        <div
          className={`transition-all duration-500 ease-in-out ${
            isOpen
              ? "max-h-none opacity-100"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <div className="p-3 md:p-4 bg-gradient-to-b from-gray-50/30 to-white dark:from-gray-900/30 dark:to-[#121620]">
            {cards.map((cardData, index) => (
              <ModernCard
                key={index}
                name={cardData.name}
                description={cardData.description}
                videoLink={cardData.videolink}
                problemSetLink={cardData.problemsetLink}
                subtopics={cardData.subtopics}
                card={card}
                index={index}
                total={cards.length}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function LearningResources() {
  const getTotalTopics = () => {
    return (
      dsa.reduce((sum, section) => sum + section.data.length, 0) +
      core.reduce((sum, section) => sum + section.data.length, 0) +
      dev.reduce((sum, section) => sum + section.data.length, 0)
    );
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-[#050b15] dark:via-[#0a1020] dark:to-[#0f1419] min-h-screen font-sans">
      <div className="container mx-auto px-4 py-6 md:py-10 max-w-6xl">
        {/* Page Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Learning Resources
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6">
            Comprehensive roadmaps and curated resources to master programming
            concepts and advance your career
          </p>

          {/* Stats */}
          <div className="flex items-center justify-center space-x-6">
            <div className="bg-white dark:bg-[#121620] px-4 py-2 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Topics
              </span>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {getTotalTopics()}
              </div>
            </div>
            <div className="bg-white dark:bg-[#121620] px-4 py-2 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Categories
              </span>
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {dsa.length + core.length + dev.length}
              </div>
            </div>
          </div>
        </div>

        {/* Learning Sections */}
        <div className="space-y-8">
          {dsa.map((section, index) => (
            <ModernContainer
              key={`dsa-${index}`}
              name={section.name}
              description={section.description}
              cards={section.data}
              card="dsa"
            />
          ))}

          {core.map((section, index) => (
            <ModernContainer
              key={`core-${index}`}
              name={section.name}
              description={section.description}
              cards={section.data}
              card="core"
            />
          ))}

          {dev.map((section, index) => (
            <ModernContainer
              key={`dev-${index}`}
              name={section.name}
              description={section.description}
              cards={section.data}
              card="dev"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
