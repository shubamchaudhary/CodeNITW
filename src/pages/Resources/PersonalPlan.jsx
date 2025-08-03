import React, { useState, useEffect } from "react";
import DSAQuestions from "../../Data/PersonalDSARoadmap.json";
//import DailyProblem from '../Unusable/DailyProblem.jsx';
import Youtube from "../../images/Youtube.png";
import { useRef } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { motion, AnimatePresence } from "framer-motion";
import useProgressSync from "../../hooks/useProgressSync";
import SyncButton from "../../components/SyncButton";

const PersonalPlan = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [personalSolvedQuestions, setPersonalSolvedQuestions] = useState(
    () => JSON.parse(localStorage.getItem("PersonalDSASolvedQuestions")) || {}
  );
  const [totalProblems, setTotalProblems] = useState(0);
  const [solvedProblems, setSolvedProblems] = useState(0);

  // Initialize sync functionality
  const {
    isSyncing,
    isLoading,
    syncStatus,
    hasUnsyncedChanges,
    syncToDatabase,
    loadFromDatabase,
    markAsChanged,
    isAuthenticated,
  } = useProgressSync("PERSONAL_DSA");

  useEffect(() => {
    const fetchTopics = async () => {
      const topics = Object.keys(DSAQuestions);
      setTopics(topics);
    };

    fetchTopics();
  }, []);

  useEffect(() => {
    let total = 0;
    for (let topic in DSAQuestions) {
      total += DSAQuestions[topic].length;
    }
    setTotalProblems(total);

    let solved = Object.values(personalSolvedQuestions).filter(
      (val) => val
    ).length;
    setSolvedProblems(solved);
  }, [personalSolvedQuestions]);

  const selectedTopicRef = useRef(null);

  useEffect(() => {
    if (selectedTopicRef.current) {
      selectedTopicRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTopic]);

  const handleCheckboxChange = (name, isChecked) => {
    const updatedPersonalSolvedQuestions = {
      ...personalSolvedQuestions,
      [name]: isChecked,
    };
    setPersonalSolvedQuestions(updatedPersonalSolvedQuestions);
    localStorage.setItem(
      "PersonalDSASolvedQuestions",
      JSON.stringify(updatedPersonalSolvedQuestions)
    );
    // Mark that we have unsaved changes
    markAsChanged();
  };

  // Listen for progress data loaded from database
  useEffect(() => {
    const handleProgressDataLoaded = (event) => {
      if (event.detail.sheetType === "PERSONAL_DSA") {
        setPersonalSolvedQuestions(event.detail.data);
      }
    };

    window.addEventListener("progressDataLoaded", handleProgressDataLoaded);
    return () =>
      window.removeEventListener(
        "progressDataLoaded",
        handleProgressDataLoaded
      );
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* <DailyProblem /> */}
      <div className="min-h-screen flex justify-center">
        <div className="w-full sm:w-3/4 lg:w-2/3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <div className="ml-4">
              <h1 className="text-xl mt-4 dark:text-gray-300 font-semibold mb-4">
                Personal DSA Roadmap
              </h1>
              <h2 className="text-sm ml-2 text-gray-600 font-bold">
                {solvedProblems} / {totalProblems} solved
              </h2>
            </div>

            {/* Progress circle and sync controls */}
            <div className="flex flex-col sm:flex-row items-center gap-4 mr-4">
              <div className="mt-2" style={{ width: 68, height: 60 }}>
                <CircularProgressbar
                  value={solvedProblems}
                  maxValue={totalProblems}
                  text={`${Math.round(
                    (solvedProblems / totalProblems) * 100
                  )}%`}
                  styles={buildStyles({
                    pathColor: "#805ad5",
                    trailColor: "lightgray",
                    textSize: "16px",
                  })}
                />
              </div>

              {/* Sync Button */}
              <SyncButton
                onSyncToDatabase={syncToDatabase}
                onLoadFromDatabase={loadFromDatabase}
                isSyncing={isSyncing}
                isLoading={isLoading}
                hasUnsyncedChanges={hasUnsyncedChanges}
                syncStatus={syncStatus}
                isAuthenticated={isAuthenticated}
                className="mt-2 sm:mt-0"
              />
            </div>
          </div>
          <AnimatePresence>
            {topics.map((topic, index) => (
              <motion.div
                key={topic}
                initial={{ opacity: 0, y: -100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -100 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <TopicCard
                  id={topic}
                  name={topic}
                  questions={DSAQuestions[topic]}
                  selectedTopic={selectedTopic}
                  setSelectedTopic={setSelectedTopic}
                  DSASolvedQuestions={personalSolvedQuestions}
                  onQuestionSolved={handleCheckboxChange}
                  ref={topic === selectedTopic ? selectedTopicRef : null}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export function QuestionCard(props) {
  const { id, number, name, link, onQuestionSolved } = props;
  const truncatedName = name.length > 25 ? name.substring(0, 25) + ".." : name;
  const lesstruncatedName =
    name.length > 52 ? name.substring(0, 50) + ".." : name;
  const truncatedLink = link.length > 80 ? link.substring(0, 80) : link;
  const extratruncatedLink =
    link.length > 30 ? link.substring(0, 25) + "..." : link;
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const [isChecked, setIsChecked] = useState(() => {
    const personalSolvedQuestions =
      JSON.parse(localStorage.getItem("PersonalDSASolvedQuestions")) || {};
    return personalSolvedQuestions[name] || false;
  });

  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);
    onQuestionSolved(name, event.target.checked);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 1000);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      className={`flex items-center rounded ${
        isChecked
          ? "bg-blue-200 dark:bg-indigo-900/30"
          : "bg-slate-100 dark:bg-slate-700"
      } rounded-lg px-2 p-[7px] shadow-md m-1 hover:shadow-lg transition-shadow`}
    >
      <div className="flex-grow flex flex-row items-center">
        <h3
          className={`md:text-[14px] text-[12px] dark:text-gray-400 font-semibold truncate ${
            isSmallScreen ? "w-full" : "w-3/5"
          }`}
        >
          {isSmallScreen ? truncatedName : lesstruncatedName}
        </h3>
        <div className="flex text-sm items-center justify-between w-full mt-2 sm:mt-0">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 ml-[40px] md:ml-[4px] hover:underline"
          >
            {isSmallScreen ? "link" : truncatedLink}
          </a>
          <input
            className={`ml-2 form-checkbox h-4 w-4 `}
            type="checkbox"
            checked={isChecked}
            onChange={handleCheckboxChange}
          />
        </div>
      </div>
    </div>
  );
}

export const TopicCard = React.forwardRef((props, ref) => {
  const {
    id,
    name,
    questions,
    selectedTopic,
    setSelectedTopic,
    DSASolvedQuestions: personalSolvedQuestions, // Rename for consistency
  } = props;
  const [solvedQuestionCount, setSolvedQuestionCount] = useState(0);
  const isOpen = id === selectedTopic;

  const handleTopicClick = () => {
    setSelectedTopic(isOpen ? null : id);
  };

  useEffect(() => {
    const updateSolvedCount = () => {
      const personalSolvedQuestions =
        JSON.parse(localStorage.getItem("PersonalDSASolvedQuestions")) || {};
      const count = questions.filter(
        (question) => personalSolvedQuestions[question.Question]
      ).length;
      setSolvedQuestionCount(count);
    };

    updateSolvedCount();
    window.addEventListener("storage", updateSolvedCount);

    return () => window.removeEventListener("storage", updateSolvedCount);
  }, [questions, selectedTopic]);

  useEffect(() => {
    const count = questions.filter(
      (question) => personalSolvedQuestions[question.Question]
    ).length;
    setSolvedQuestionCount(count);
  }, [questions, selectedTopic, personalSolvedQuestions]);

  return (
    <div
      ref={ref}
      className={`relative md:cursor-pointer bg-white dark:bg-slate-800 shadow-lg rounded-md overflow-hidden transition-shadow duration-300 px-2 py-0.5 my-1 border border-gray-200 dark:border-slate-600${
        isOpen ? " pb-4" : ""
      }`}
      onClick={handleTopicClick}
    >
      <div className="flex justify-between items-center sm:w-[90%]">
        <div className="flex-grow">
          <h1 className="flex md:text-md text-sm font-bold text-overflow-ellipsis whitespace-nowrap dark:text-gray-400 text-gray-700">
            {name}
          </h1>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-[12px] text-gray-600 ">
            {solvedQuestionCount} / {questions.length} solved
          </p>
          <div className="flex w-full flex-col gap-4">
            <ProgressBar
              progressPercentage={
                (100 * solvedQuestionCount) / questions.length
              }
            />
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
          <div
            className={` items-center sm:w-[70%] md:w-[80%] lg:w-[90%] mx-auto`}
          >
            <AnimatePresence>
              {questions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 10,
                    delay: index * 0.05,
                  }}
                >
                  <QuestionCard
                    name={question.Question} // Note: JSON has 'Question', not 'Question_Name'? Wait, in JSON it's 'Question', but code uses question.Question_Name. Need to check.
                    link={question.Question_link}
                    onQuestionSolved={props.onQuestionSolved}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
});

export default PersonalPlan;

export const ProgressBar = ({ progressPercentage }) => {
  return (
    <div className=" min-w-[90px] max-w-[90px]  h-3 bg-slate-200 dark:bg-slate-600 rounded-md">
      <div
        style={{ width: `${progressPercentage}%` }}
        className={`  rounded-lg bg-purple-600 ${
          progressPercentage < 5
            ? "h-[60%] mt-[2.5px]"
            : progressPercentage < 12
            ? "h-[80%] mt-[1.5px]"
            : "h-[90%] mt-[0.5px]"
        }`}
      ></div>
    </div>
  );
};
