import React, { useState, useEffect } from "react";
import CPSheetQuestions from "../../Data/CPSheetQuestions.json";
//import DailyProblem from '../Unusable/DailyProblem.jsx';
import Youtube from "../../images/Youtube.png";
import { useRef } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { motion, AnimatePresence } from "framer-motion";

const CPSheet = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [CPsolvedQuestions, setCPsolvedQuestions] = useState(
    () => JSON.parse(localStorage.getItem("CPsolvedQuestions")) || {}
  );
  const [totalProblems, setTotalProblems] = useState(0);
  const [CPsolvedProblems, setCPsolvedProblems] = useState(0);

  useEffect(() => {
    const fetchTopics = async () => {
      const topics = Object.keys(CPSheetQuestions);
      setTopics(topics);
    };

    fetchTopics();
  }, []);

  useEffect(() => {
    let total = 0;
    for (let topic in CPSheetQuestions) {
      total += CPSheetQuestions[topic].length;
    }
    setTotalProblems(total);

    let solved = Object.values(CPsolvedQuestions).filter((val) => val).length;
    setCPsolvedProblems(solved);
  }, [CPsolvedQuestions]);

  const selectedTopicRef = useRef(null);

  useEffect(() => {
    if (selectedTopicRef.current) {
      selectedTopicRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTopic]);

  const handleCheckboxChange = (name, isChecked) => {
    const updatedCPsolvedQuestions = {
      ...CPsolvedQuestions,
      [name]: isChecked,
    };
    setCPsolvedQuestions(updatedCPsolvedQuestions);
    localStorage.setItem(
      "CPsolvedQuestions",
      JSON.stringify(updatedCPsolvedQuestions)
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* <DailyProblem /> */}
      <div className="min-h-screen flex justify-center">
        <div className="w-full sm:w-3/4 lg:w-2/3">
          <div className="flex justify-between items-center mb-4">
            <div className="ml-4">
              <h1 className="text-xl mt-4 dark:text-gray-300 font-semibold mb-4">
                STRIVERS CP SHEET
              </h1>
              <h2 className="text-sm ml-2 text-gray-600 font-bold">
                {CPsolvedProblems} / {totalProblems} solved
              </h2>
            </div>
            <div className="mr-2 mt-2" style={{ width: 68, height: 60 }}>
              <CircularProgressbar
                value={CPsolvedProblems}
                maxValue={totalProblems}
                text={`${Math.round(
                  (CPsolvedProblems / totalProblems) * 100
                )}%`}
                styles={buildStyles({
                  pathColor: "#8b5cf6",
                  trailColor: "lightgray",
                  textSize: "16px",
                })}
              />
            </div>
          </div>
          <AnimatePresence>
            {topics.map((topic, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -100 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <TopicCard
                  key={index}
                  id={topic}
                  name={topic}
                  questions={CPSheetQuestions[topic]}
                  selectedTopic={selectedTopic}
                  setSelectedTopic={setSelectedTopic}
                  CPsolvedQuestions={CPsolvedQuestions}
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
  const { name, id, link, onQuestionSolved } = props;
  const truncatedLink = link.length > 80 ? link.substring(0, 80) + "..." : link;
  const extratruncatedLink =
    link.length > 30 ? link.substring(0, 25) + "..." : link;
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const [isChecked, setIsChecked] = useState(() => {
    const CPsolvedQuestions =
      JSON.parse(localStorage.getItem("CPsolvedQuestions")) || {};
    return CPsolvedQuestions[link] || false;
  });

  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);
    onQuestionSolved(link, event.target.checked);
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
      className={`flex items-center  rounded  ${
        isChecked
          ? "bg-purple-200 dark:bg-purple-900/30"
          : "bg-slate-100 dark:bg-slate-700"
      } rounded-lg p-2 shadow-md m-1`}
    >
      <div className="flex-grow flex flex-row items-center">
        <h3
          className={`md:text-[14px] text-[12px] dark:text-gray-400 font-semibold truncate ${
            isSmallScreen ? "w-full" : "w-3/5"
          }`}
        >
          Question {name + 1}
        </h3>
        <div className="flex  text-sm items-center justify-between w-full mt-2 sm:mt-0">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {isSmallScreen ? "link" : truncatedLink}
          </a>
          <input
            className={`ml-2 form-checkbox h-4 w-4  `}
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
    CPsolvedQuestions,
  } = props;
  const [CPsolvedQuestionCount, setCPsolvedQuestionCount] = useState(0);
  const isOpen = id === selectedTopic;

  const handleTopicClick = () => {
    setSelectedTopic(isOpen ? null : id);
  };

  useEffect(() => {
    const count = questions.filter(
      (question) => CPsolvedQuestions[question.Question_link]
    ).length;
    setCPsolvedQuestionCount(count);
  }, [questions, selectedTopic, CPsolvedQuestions]);

  return (
    <div
      ref={ref}
      className={`relative md:cursor-pointer bg-white dark:bg-slate-800 shadow-lg rounded-md overflow-hidden transition-shadow duration-300 px-4 py-1 my-[3px] border border-gray-200 dark:border-slate-600 ${
        isOpen ? "pb-8" : ""
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
            {CPsolvedQuestionCount} / {questions.length} solved
          </p>
          <div className="flex w-full flex-col  gap-4">
            <ProgressBar
              progressPercentage={
                (100 * CPsolvedQuestionCount) / questions.length
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
                  key={index}
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
                    key={index}
                    name={question.Q_No}
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

export default CPSheet;

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
