import React, { useState, useEffect } from "react";
import AllQuestionsList from "../../Data/AllQuestionsList.json";
//import DailyProblem from '../Unusable/DailyProblem.jsx';
import Youtube from "../../images/Youtube.png";
import { useRef } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { motion, AnimatePresence } from "framer-motion";

const Resources = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [solvedQuestions, setSolvedQuestions] = useState(
    () => JSON.parse(localStorage.getItem("solvedQuestions")) || {}
  );
  const [totalProblems, setTotalProblems] = useState(0);
  const [solvedProblems, setSolvedProblems] = useState(0);

  useEffect(() => {
    const fetchTopics = async () => {
      const topics = Object.keys(AllQuestionsList);
      setTopics(topics);
    };

    fetchTopics();
  }, []);

  useEffect(() => {
    let total = 0;
    for (let topic in AllQuestionsList) {
      total += AllQuestionsList[topic].length;
    }
    setTotalProblems(total);

    let solved = Object.values(solvedQuestions).filter((val) => val).length;
    setSolvedProblems(solved);
  }, [solvedQuestions]);

  const selectedTopicRef = useRef(null);

  useEffect(() => {
    if (selectedTopicRef.current) {
      selectedTopicRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTopic]);

  const handleCheckboxChange = (name, isChecked) => {
    const updatedSolvedQuestions = { ...solvedQuestions, [name]: isChecked };
    setSolvedQuestions(updatedSolvedQuestions);
    localStorage.setItem(
      "solvedQuestions",
      JSON.stringify(updatedSolvedQuestions)
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* <DailyProblem /> */}
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 min-h-screen flex justify-center">
        <div className="w-full sm:w-3/4 lg:w-2/3">
          <div className="flex justify-between items-center mb-4">
            <div className="ml-4">
              <h1 className="text-xl mt-4 dark:text-gray-300 font-semibold mb-4">
                DSA FOR INTERVIEWS
              </h1>
              <h2 className="text-sm ml-2 text-gray-600 dark:text-gray-400 font-bold">
                {solvedProblems} / {totalProblems} solved
              </h2>
            </div>
            <div className="mr-2 mt-2" style={{ width: 68, height: 60 }}>
              <CircularProgressbar
                value={solvedProblems}
                maxValue={totalProblems}
                text={`${Math.round((solvedProblems / totalProblems) * 100)}%`}
                styles={buildStyles({
                  pathColor: "#10b981",
                  trailColor: "#e2e8f0",
                  textColor: "#334155",
                  textSize: "16px",
                })}
              />
            </div>
          </div>
          <AnimatePresence>
            {topics.map((topic, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -100 }} // Initial position and opacity
                animate={{ opacity: 1, y: 0 }} // Animation to apply when entering
                exit={{ opacity: 0, y: -100 }} // Animation to apply when exiting
                transition={{ duration: 0.5, delay: index * 0.1 }} // Animation duration with delay
              >
                <TopicCard
                  key={index}
                  id={topic}
                  name={topic}
                  questions={AllQuestionsList[topic]}
                  selectedTopic={selectedTopic}
                  setSelectedTopic={setSelectedTopic}
                  solvedQuestions={solvedQuestions}
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
  const { name, link, youtube, onQuestionSolved } = props;
  const truncatedName = name.length > 25 ? name.substring(0, 25) + ".." : name;
  const lesstruncatedName =
    name.length > 52 ? name.substring(0, 50) + ".." : name;
  const truncatedLink = link.length > 80 ? link.substring(0, 80) : link;
  const extratruncatedLink =
    link.length > 30 ? link.substring(0, 25) + "..." : link;
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const [isChecked, setIsChecked] = useState(() => {
    // Get the initial state from local storage or set it to false
    const solvedQuestions =
      JSON.parse(localStorage.getItem("solvedQuestions")) || {};
    return solvedQuestions[name] || false;
  });

  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);
    onQuestionSolved(name, event.target.checked);
  };

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 1000); // Adjust the breakpoint as needed
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Check initial screen size

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      className={`flex  items-center  rounded  ${
        isChecked
          ? "bg-emerald-50 dark:bg-emerald-900/20"
          : "bg-white dark:bg-slate-800"
      } rounded-lg px-2 p-[7px] shadow-md m-1 border border-gray-200 dark:border-slate-600`}
    >
      <div className="flex-grow flex flex-row items-center">
        <h3
          className={`md:text-[14px] text-[12px] dark:text-gray-300 font-semibold truncate ${
            isSmallScreen ? "w-full" : "w-3/5"
          }`}
        >
          {isSmallScreen ? truncatedName : lesstruncatedName}
        </h3>
        <div className="flex  text-sm items-center justify-between w-full mt-2 sm:mt-0">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 ml-[40px]  md:ml-[4px] hover:underline"
          >
            {isSmallScreen ? "link" : truncatedLink}
          </a>
          <a
            href={youtube}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto"
          >
            <img
              className={`max-w-[20px] mr-4   rounded-md hover:underline cursor-pointer`}
              src={Youtube}
              alt="contest image"
            />
          </a>
          <input
            className={`ml-2 form-checkbox h-4 w-4 text-emerald-600 rounded focus:ring-emerald-500`}
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
    solvedQuestions,
  } = props;
  const [solvedQuestionCount, setSolvedQuestionCount] = useState(0);
  const isOpen = id === selectedTopic;

  const handleTopicClick = () => {
    setSelectedTopic(isOpen ? null : id);
  };

  useEffect(() => {
    const updateSolvedCount = () => {
      const solvedQuestions =
        JSON.parse(localStorage.getItem("solvedQuestions")) || {};
      const count = questions.filter(
        (question) => solvedQuestions[question.Question]
      ).length;
      setSolvedQuestionCount(count);
    };

    // Call the function initially to set the count
    updateSolvedCount();

    // Listen for changes in local storage
    window.addEventListener("storage", updateSolvedCount);

    // Cleanup the event listener
    return () => window.removeEventListener("storage", updateSolvedCount);
  }, [questions, selectedTopic]);

  useEffect(() => {
    const count = questions.filter(
      (question) => solvedQuestions[question.Question]
    ).length;
    setSolvedQuestionCount(count);
  }, [questions, selectedTopic, solvedQuestions]);

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
          <h1 className="flex md:text-md text-sm font-bold text-overflow-ellipsis whitespace-nowrap dark:text-gray-300 text-gray-700">
            {name}
          </h1>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-[12px] text-gray-600 dark:text-gray-400">
            {solvedQuestionCount} / {questions.length} solved
          </p>
          <div className="flex w-full flex-col  gap-4">
            {/* <Progress value={100*solvedQuestionCount/questions.length} size="lg" color="green" className='max-w-[100px] min-w-[100px] bg-[#273143]' /> */}
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
                  key={index}
                  initial={{ opacity: 0, x: -10 }} // Initial position and opacity
                  animate={{ opacity: 1, x: 0 }} // Animation to apply when entering
                  exit={{ opacity: 0, x: -100 }} // Animation to apply when exiting
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 10,
                    delay: index * 0.05, // Delay each question by a small amount
                  }} // Use spring physics for the animation
                >
                  <QuestionCard
                    key={index}
                    name={question.Question}
                    link={question.Question_link}
                    youtube={question.Solution_link}
                    onQuestionSolved={props.onQuestionSolved} // Pass the prop here
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

export default Resources;

export const ProgressBar = ({ progressPercentage }) => {
  return (
    <div className=" min-w-[90px] max-w-[90px]  h-3 bg-slate-200 dark:bg-slate-600 rounded-md">
      <div
        style={{ width: `${progressPercentage}%` }}
        className={`  rounded-lg bg-emerald-600 ${
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
