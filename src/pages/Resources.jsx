import React, { useState, useEffect } from 'react';
import AllQuestionsList from '../Data/AllQuestionsList.json';
import DailyProblem from './DailyProblem.jsx';
import Youtube from "../images/Youtube.png";
import { useRef } from 'react';

const Resources = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [solvedQuestions, setSolvedQuestions] = useState(() => JSON.parse(localStorage.getItem('solvedQuestions')) || {});

  useEffect(() => {
    const fetchTopics = async () => {
      const topics = Object.keys(AllQuestionsList);
      setTopics(topics);
    };

    fetchTopics();
  }, []);

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
    <div className='bg-blue-100'>
      <DailyProblem />
      <div className='bg-blue-100 min-h-screen flex justify-center'>
        <div className='w-full sm:w-3/4 lg:w-2/3  '>
        {topics.map((topic, index) => (
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
))}
        </div>
      </div>
    </div>
  );
};



export function QuestionCard(props) {
  const { name, link, youtube, onQuestionSolved } = props;
  const truncatedName = name.length > 35 ? name.substring(0, 30) + '..' : name;
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
    <div className={`flex items-center border rounded p-4 ${isChecked ? "bg-green-200" : "bg-blue-100"} rounded-lg p-4 shadow-md ml-2 mt-2 mr-2 mb-2`}>
    <div className="flex-grow flex flex-col sm:flex-row sm:items-center">
      <h3 className={`text-lg font-semibold truncate ${isSmallScreen ? 'w-full' : 'w-3/5'}`}>
        {isSmallScreen ? truncatedName : name}
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
  className={`ml-2 form-checkbox h-6 w-6 s text-green-500 ${isChecked ? 'ring ring-green-200 bg-green-200' : 'ring-red-500 bg-blue-100'}`}
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
        className={`relative bg-white bg-opacity-50 w-[100%]  items-left  rounded-md overflow-hidden transition-shadow duration-300 p-4 border-2 m-1 border-gray-300 ${isOpen ? 'pb-8' : ''}`} 
        onClick={handleTopicClick}
      >
        <div className={` gap-4 items-center sm:w-[90%]`}>
          <div className=''>
            <h1 className=' flex text-2xl font-semibold text-overflow-ellipsis whitespace-nowrap text-gray-700'>{name}</h1>
            <p>{solvedQuestionCount} / {questions.length} solved</p>
          </div>
        </div>
        {isOpen && (
          <div className='mt-4' onClick={e => e.stopPropagation()}>
            <div className={` items-center sm:w-[70%] md:w-[80%] lg:w-[90%] mx-auto`}>
              {questions && questions.map((question, index) => (
                <QuestionCard 
                  key={index} 
                  name={question.Question} 
                  link={question.Question_link} 
                  youtube={question.Solution_link} 
                  onQuestionSolved={props.onQuestionSolved} // Pass the prop here
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  })

export default Resources;
