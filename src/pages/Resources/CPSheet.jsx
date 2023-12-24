import React, { useState, useEffect } from 'react';
import CPSheetQuestions from '../../Data/CPSheetQuestions.json';
//import DailyProblem from '../Unusable/DailyProblem.jsx';
import Youtube from "../../images/Youtube.png";
import { useRef } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { motion, AnimatePresence } from 'framer-motion';

const CPSheet = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [CPsolvedQuestions, setCPsolvedQuestions] = useState(() => JSON.parse(localStorage.getItem('CPsolvedQuestions')) || {});
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

    let solved = Object.values(CPsolvedQuestions).filter(val => val).length;
    setCPsolvedProblems(solved);
  }, [CPsolvedQuestions]);

  const selectedTopicRef = useRef(null);

  useEffect(() => {
    if (selectedTopicRef.current) {
      selectedTopicRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTopic]);

  const handleCheckboxChange = (name, isChecked) => {
    const updatedCPsolvedQuestions = { ...CPsolvedQuestions, [name]: isChecked };
    setCPsolvedQuestions(updatedCPsolvedQuestions);
    localStorage.setItem('CPsolvedQuestions', JSON.stringify(updatedCPsolvedQuestions));
  };
  

  return (
    <div className='bg-blue-100 dark:bg-[#050b15]'>
      {/* <DailyProblem /> */}
      <div className='bg-blue-100 dark:bg-[#050b15] min-h-screen flex justify-center'>
        <div className='w-full sm:w-3/4 lg:w-2/3  '>
          <div className='flex justify-between items-center mb-4'>
            <div className='ml-4'>
              <h1 className='text-xl mt-4 dark:text-gray-300 font-semibold mb-4'>STRIVERS CP SHEET</h1>
              <h2 className='text-sm ml-2 text-gray-500 font-bold'>{CPsolvedProblems} / {totalProblems} solved</h2>
            </div>
            <div className='mr-2 mt-2'
             style={{ width: 68, height: 60 }}>
              <CircularProgressbar 
                value={CPsolvedProblems} 
                maxValue={totalProblems} 
                text={`${Math.round((CPsolvedProblems / totalProblems) * 100)}%`} 
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
  const { name, id, link,  onQuestionSolved } = props;
 // const truncatedName = name.length > 30 ? name.substring(0, 30) + '..' : name;
 // const lesstruncatedName = name.length > 45 ? name.substring(0, 42) + '..' : name;
  const truncatedLink = link.length > 50 ? link.substring(0, 50) + '...' : link;
  const extratruncatedLink = link.length > 30 ? link.substring(0, 25) + '...' : link;
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  const [isChecked, setIsChecked] = useState(() => {
    // Get the initial state from local storage or set it to false
    const CPsolvedQuestions = JSON.parse(localStorage.getItem('CPsolvedQuestions')) || {};
    return CPsolvedQuestions[link] || false;
  });
  
  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);
    onQuestionSolved(link, event.target.checked);
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
    <div className={`flex items-center  rounded  ${isChecked ? "bg-green-200 dark:bg-[#141a25]" : "bg-blue-100 dark:bg-[#1c2432]"} rounded-lg p-3 shadow-md ml-2 mt-2 mr-2 mb-2`}>
    <div className="flex-grow flex flex-col sm:flex-row sm:items-center">
      <h3 className={`text-lg dark:text-gray-400 font-semibold truncate ${isSmallScreen ? 'w-full' : 'w-3/5'}`}>
      Question  {name+1}
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
  const { id, name, questions, selectedTopic, setSelectedTopic, CPsolvedQuestions } = props;
  const [CPsolvedQuestionCount, setCPsolvedQuestionCount] = useState(0);
  const isOpen = id === selectedTopic;

  const handleTopicClick = () => {
    setSelectedTopic(isOpen ? null : id);
  };

  useEffect(() => {
    const count = questions.filter(question => CPsolvedQuestions[question.Question_link]).length;
    setCPsolvedQuestionCount(count);
  }, [questions, selectedTopic, CPsolvedQuestions]);


  
    return (
      <div 
        ref={ref} 
        className={`relative bg-white dark:bg-[#141a25] bg-opacity-50 w-[100%]  items-left  rounded-md overflow-hidden transition-shadow duration-300 px-4 py-2  m-1  ${isOpen ? 'pb-8' : ''}`} 
        onClick={handleTopicClick}
      >
        <div className={` gap-4 items-center sm:w-[90%]`}>
          <div className=''>
            <h1 className=' flex text-lg font-semibold text-overflow-ellipsis whitespace-nowrap dark:text-gray-400 text-gray-700'>{name}</h1>
            <p className='text-sm text-gray-600'>{CPsolvedQuestionCount} / {questions.length} solved</p>
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
      name={question.Q_No} 
      link={question.Question_link} 
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

export default CPSheet;
