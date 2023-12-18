import React, { useState, useEffect } from 'react';
import AllQuestionsList from '../Data/AllQuestionsList.json';
import DailyProblem from './DailyProblem.jsx';
import Youtube from "../images/Youtube.png";
import { useRef } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { motion, AnimatePresence } from 'framer-motion';

const Resources = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [solvedQuestions, setSolvedQuestions] = useState(() => JSON.parse(localStorage.getItem('solvedQuestions')) || {});
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

    let solved = Object.values(solvedQuestions).filter(val => val).length;
    setSolvedProblems(solved);
  }, [solvedQuestions]);

  const selectedTopicRef = useRef(null);

  useEffect(() => {
    if (selectedTopicRef.current) {
      selectedTopicRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTopic]);

  const handleCheckboxChange = (name, isChecked) => {
    const updatedSolvedQuestions = { ...solvedQuestions, [name]: isChecked };
    setSolvedQuestions(updatedSolvedQuestions);
    localStorage.setItem('solvedQuestions', JSON.stringify(updatedSolvedQuestions));
  };
  

  return (
    <div className='bg-blue-100 dark:bg-[#1C1C1EFF]'>
      {/* <DailyProblem /> */}
      <div className='bg-blue-100 dark:bg-[#1C1C1EFF] min-h-screen flex justify-center'>
        <div className='w-full sm:w-3/4 lg:w-2/3  '>
          <div className='flex justify-between items-center mb-4'>
            <div className='ml-4'>
              <h1 className='text-xl mt-4 dark:text-gray-300 font-semibold mb-4'>DSA FOR INTERVIEWS</h1>
              <h2 className='text-sm ml-2 text-gray-500 font-bold'>{solvedProblems} / {totalProblems} solved</h2>
            </div>
            <div className='mr-2 mt-2'
             style={{ width: 68, height: 60 }}>
              <CircularProgressbar 
                value={solvedProblems} 
                maxValue={totalProblems} 
                text={`${Math.round((solvedProblems / totalProblems) * 100)}%`} 
                styles={buildStyles({
                  pathColor: 'green',
                  trailColor: 'lightgray',
                  textSize: '16px',
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
  const truncatedName = name.length > 30 ? name.substring(0, 30) + '..' : name;
  const lesstruncatedName = name.length > 45 ? name.substring(0, 42) + '..' : name;
  const truncatedLink = link.length > 50 ? link.substring(0, 50) + '...' : link;
  const extratruncatedLink = link.length > 30 ? link.substring(0, 25) + '...' : link;
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const [isChecked, setIsChecked] = useState(() => {
    // Get the initial state from local storage or set it to false
    const solvedQuestions = JSON.parse(localStorage.getItem('solvedQuestions')) || {};
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

    window.addEventListener('resize', handleResize);
    handleResize(); // Check initial screen size

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className={`flex items-center  rounded  ${isChecked ? "bg-green-200 dark:bg-[#2c2c2e]" : "bg-blue-100 dark:bg-[#343436]"} rounded-lg p-3 shadow-md ml-2 mt-2 mr-2 mb-2`}>
    <div className="flex-grow flex flex-col sm:flex-row sm:items-center">
      <h3 className={`text-lg dark:text-gray-400 font-semibold truncate ${isSmallScreen ? 'w-full' : 'w-3/5'}`}>
        {isSmallScreen ? truncatedName : lesstruncatedName}
      </h3>
      <div className="flex items-center justify-between w-full mt-2 sm:mt-0">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          {isSmallScreen ? extratruncatedLink : truncatedLink}
        </a>
        <a
          href={youtube}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto"
        >
          <img
            className="max-w-[50px] p-2  rounded-md hover:underline cursor-pointer"
            src={Youtube}
            alt="contest image"
          /> 
        </a>
        <input
  className={`ml-2 form-checkbox h-6 w-6 s `}
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
  const { id, name, questions, selectedTopic, setSelectedTopic, solvedQuestions } = props;
  const [solvedQuestionCount, setSolvedQuestionCount] = useState(0);
  const isOpen = id === selectedTopic;

  const handleTopicClick = () => {
    setSelectedTopic(isOpen ? null : id);
  };

  useEffect(() => {
    const updateSolvedCount = () => {
      const solvedQuestions = JSON.parse(localStorage.getItem('solvedQuestions')) || {};
      const count = questions.filter(question => solvedQuestions[question.Question]).length;
      setSolvedQuestionCount(count);
    };

    // Call the function initially to set the count
    updateSolvedCount();

    // Listen for changes in local storage
    window.addEventListener('storage', updateSolvedCount);

    // Cleanup the event listener
    return () => window.removeEventListener('storage', updateSolvedCount);
  }, [questions, selectedTopic]);

  useEffect(() => {
    const count = questions.filter(question => solvedQuestions[question.Question]).length;
    setSolvedQuestionCount(count);
  }, [questions, selectedTopic, solvedQuestions]);
  
    return (
      <div 
        ref={ref} 
        className={`relative bg-white dark:bg-[#2C2C2EFF] bg-opacity-50 w-[100%]  items-left  rounded-md overflow-hidden transition-shadow duration-300 px-4 py-2  m-1  ${isOpen ? 'pb-8' : ''}`} 
        onClick={handleTopicClick}
      >
        <div className={` gap-4 items-center sm:w-[90%]`}>
          <div className=''>
            <h1 className=' flex text-lg font-semibold text-overflow-ellipsis whitespace-nowrap dark:text-gray-400 text-gray-700'>{name}</h1>
            <p className='text-sm text-gray-600'>{solvedQuestionCount} / {questions.length} solved</p>
          </div>
        </div>
        {isOpen && (
          <div className='mt-4' onClick={e => e.stopPropagation()}>
            <div className={` items-center sm:w-[70%] md:w-[80%] lg:w-[90%] mx-auto`}>
              <AnimatePresence>
              {questions.map((question, index) => (
  <motion.div
    key={index}
    initial={{ opacity: 0, x: -10 }} // Initial position and opacity
    animate={{ opacity: 1, x: 0 }} // Animation to apply when entering
    exit={{ opacity: 0, x: -100 }} // Animation to apply when exiting
    transition={{
      type: 'spring',
      stiffness: 200,
      damping: 10,
      delay: index * 0.05 // Delay each question by a small amount
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
  })

export default Resources;





<div className='mb-4 bg-white dark:bg-[#050b15] border-gray-200 p-10 rounded-lg shadow overflow-auto'>
<h2 className="font-bold text-2xl text-blue-600 mb-4"> <span className="h-6 flex items-center sm:h-7">
       <svg class="flex-shrink-0 h-10 w-10 text-cyan-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
         <path fill-rule="evenodd" d="M10 2a2 2 0 00-2 2v12a2 2 0 002 2 2 2 0 002-2V4a2 2 0 00-2-2zm3 2a3 3 0 11-6 0 3 3 0 016 0z" clip-rule="evenodd" />
       </svg>
     Data Structures and Algorithms </span></h2>
<p className="mb-4 text-lg dark:text-gray-400 text-gray-700">We assume that you are proficient in any one of the coding Languages, if not we suggest you to try C++.</p>
<ul className="list-disc ml-5 space-y-2 text-gray-600">
  <li className="flex items-start">
    <span className="h-6 flex items-center sm:h-7">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-5 w-5 text-cyan-500">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      </svg>
    </span>
    <p className="ml-2 dark:text-gray-400">
      For basics of C++: <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="text-blue-500 ">Youtube Video</a>
    </p>
  </li>
  <li className="flex items-start">
    <span className="h-6 flex items-center sm:h-7">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-5 w-5 text-cyan-500">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      </svg>
    </span>
    <p className="ml-2 dark:text-gray-400">
C++ Standard Template Library: <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="text-blue-500 ">Youtube Video</a>, <a href="https://www.example.com/" target="_blank" rel="noreferrer" className="text-blue-500 dark:text-gray-300">Article Link</a>
<br />
<ul className=" ml-2">
<li>  <span className="h-6 flex items-center sm:h-7 ">
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-5 w-5 text-cyan-500">
<circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
</svg> 
<a href="https://www.example.com/" target="_blank" rel="noreferrer">Pair</a>
</span></li>
<li>  <span className="h-6 flex items-center sm:h-7">
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-5 w-5 text-cyan-500">
<circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
</svg> 
<a href="https://www.example.com/" target="_blank" rel="noreferrer">Vectors</a>
</span></li>
<li>  <span className="h-6 flex items-center sm:h-7">
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-5 w-5 text-cyan-500">
<circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
</svg> 
<a href="https://www.example.com/" target="_blank" rel="noreferrer">Map</a>
</span></li>
<li>  <span className="h-6 flex items-center sm:h-7">
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-5 w-5 text-cyan-500">
<circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
</svg> 
<a href="https://www.example.com/" target="_blank" rel="noreferrer">Set</a>
</span></li>
<li>  <span className="h-6 flex items-center sm:h-7">
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-5 w-5 text-cyan-500">
<circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
</svg> 
<a href="https://www.example.com/" target="_blank" rel="noreferrer">Priority Queue</a>
</span></li>
<li>  <span className="h-6 flex items-center sm:h-7">
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-5 w-5 text-cyan-500">
<circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
</svg> 
<a href="https://www.example.com/" target="_blank" rel="noreferrer">Stacks</a>
</span></li>
</ul>
</p>
  </li>
  <li className="flex items-start">
    <span className="h-6 flex items-center sm:h-7">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-5 w-5 text-cyan-500">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      </svg>
    </span>
    <p className="ml-2 dark:text-gray-400">
      Linked List: <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="text-blue-400 ">Youtube Playlist</a>, <a href="https://www.example.com/" target="_blank" rel="noreferrer" className="text-blue-500 ">Problems List</a>
    </p>
  </li>
  <li className="flex items-start">
    <span className="h-6 flex items-center sm:h-7">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-5 w-5 text-cyan-500">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      </svg>
    </span>
    <p className="ml-2 dark:text-gray-400">
      Binary Search: <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="text-blue-400 ">Youtube Playlist</a>, <a href="https://www.example.com/" target="_blank" rel="noreferrer" className="text-blue-500 ">Problems List</a>
    </p>
  </li>
  <li className="flex items-start">
    <span className="h-6 flex items-center sm:h-7">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-5 w-5 text-cyan-500">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      </svg>
    </span>
    <p className="ml-2 dark:text-gray-400">
      Stacks: <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="text-blue-400">Youtube Playlist</a>, <a href="https://www.example.com/" target="_blank" rel="noreferrer" className="text-blue-500 ">Problems List</a>
    </p>
  </li>
  <li className="flex items-start">
    <span className="h-6 flex items-center sm:h-7">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-5 w-5 text-cyan-500">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      </svg>
    </span>
    <p className="ml-2 dark:text-gray-400">
      Heaps: <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="text-blue-400 ">  Youtube Playlist</a>, Arrays: <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="text-blue-400 ">Youtube Playlist</a> Strings: <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="text-blue-400 ">Youtube Playlist</a> and Maps: <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="text-blue-400 ">Youtube Playlist</a> <a href="https://www.problems.com/" target="_blank" rel="noreferrer" className="text-blue-500 ">Problems List</a>
    </p>
  </li>
  <li className="flex items-start">
    <span className="h-6 flex items-center sm:h-7">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-5 w-5 text-cyan-500">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      </svg>
    </span>
    <p className="ml-2 dark:text-gray-400">
      Recursion: <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="text-blue-500 ">Youtube Playlist</a>, <a href="https://www.example.com/" target="_blank" rel="noreferrer" className="text-blue-500 ">Problems List</a>
    </p>
  </li>
  <li className="flex items-start">
    <span className="h-6 flex items-center sm:h-7">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-5 w-5 text-cyan-500">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      </svg>
    </span>
    <p className="ml-2 dark:text-gray-400">
      Trees: <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="text-blue-500 ">Youtube Playlist</a>, <a href="https://www.example.com/" target="_blank" rel="noreferrer" className="text-blue-500 ">Problems List</a>
    </p>
  </li>
  <li className="flex items-start">
    <span className="h-6 flex items-center sm:h-7">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-5 w-5 text-cyan-500">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      </svg>
    </span>
    <p className="ml-2 dark:text-gray-400">
      Dynamic Programming: <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="text-blue-400  ">Youtube Playlist</a> <a href="https://www.example.com/" target="_blank" rel="noreferrer" className="text-blue-500 ">Problems List</a>
    </p>
  </li>
  <li className="flex items-start">
    <span className="h-6 flex items-center sm:h-7">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-5 w-5 text-cyan-500">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      </svg>
    </span>
    <p className="ml-2 dark:text-gray-400">
      Graphs: <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="text-blue-400 ">   Youtube Playlist</a>   <a href="https://www.example.com/" target="_blank" rel="noreferrer" className="text-blue-500">   Problems List</a>
    </p>
  </li>
</ul>
</div>

 {/* CORE CSE SUBJECTS */}
<div className='mb-4 bg-white dark:bg-[#3A3A3CFF] border-gray-200 p-10 rounded-lg shadow overflow-auto'>
<h2 className="font-bold text-2xl text-blue-600 mb-4"> <span className="h-6 flex items-center sm:h-7">
       <svg class="flex-shrink-0 h-10 w-10 text-cyan-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
         <path fill-rule="evenodd" d="M10 2a2 2 0 00-2 2v12a2 2 0 002 2 2 2 0 002-2V4a2 2 0 00-2-2zm3 2a3 3 0 11-6 0 3 3 0 016 0z" clip-rule="evenodd" />
       </svg>
    Core CSE Subjects </span></h2>
<p className="mb-4 text-lg dark:text-gray-400 text-gray-700">One must have knowledge of OOPS, DBMS, CN and OS in order to crack interviews and are even asked in some OTs.</p>
<ul className="list-disc ml-5 space-y-2 text-gray-600">
  <li className="flex items-start">
    <span className="h-6 flex items-center sm:h-7">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-5 w-5 text-cyan-500">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      </svg>
    </span>
    <p className="ml-2 dark:text-gray-400">
      Object Oriented Programming: <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="text-blue-400 ">Full Length Youtube Playlist</a><a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="text-blue-500 ">     One Shot Youtube Video</a> <a href="https://www.example.com/" target="_blank" rel="noreferrer" className="text-blue-600 ">Pdf Notes</a>
    </p>
  </li>
  <li className="flex items-start">
    <span className="h-6 flex items-center sm:h-7">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-5 w-5 text-cyan-500">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      </svg>
    </span>
    <p className="ml-2 dark:text-gray-400">
      Database Management System: <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="text-blue-400 ">Full Length Youtube Playlist</a><a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="text-blue-500 ">     One Shot Youtube Video</a> <a href="https://www.example.com/" target="_blank" rel="noreferrer" className="text-blue-600 ">Pdf Notes</a>
    </p>
  </li>
  <li className="flex items-start">
    <span className="h-6 flex items-center sm:h-7">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-5 w-5 text-cyan-500">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      </svg>
    </span>
    <p className="ml-2 dark:text-gray-400">
      Operating Systems: <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="text-blue-400 ">Full Length Youtube Playlist</a><a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="text-blue-500 ">     One Shot Youtube Video</a> <a href="https://www.example.com/" target="_blank" rel="noreferrer" className="text-blue-600 ">Pdf Notes</a>
    </p>
  </li>
  <li className="flex items-start">
    <span className="h-6 flex items-center sm:h-7">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="flex-shrink-0 h-5 w-5 text-cyan-500">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      </svg>
    </span>
    <p className="ml-2 dark:text-gray-400">
      Computer Networks: <a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="text-blue-400 ">Full Length Youtube Playlist</a><a href="https://www.youtube.com/" target="_blank" rel="noreferrer" className="text-blue-500 ">     One Shot Youtube Video</a> <a href="https://www.example.com/" target="_blank" rel="noreferrer" className="text-blue-600 ">Pdf Notes</a>
    </p>
  </li>
</ul>
</div>
{/* WEB DEV */}
<DevContainer name="web dev" description="lijkefbelwj ld sjvej" />