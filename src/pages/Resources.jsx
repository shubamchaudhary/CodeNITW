import React, { useState, useEffect } from 'react';
import AllQuestionsList from '../Data/AllQuestionsList.json';
import DailyProblem from './DailyProblem.jsx';
import Youtube from "../images/Youtube.png";

const Resources = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const fetchTopics = async () => {
      const topics = Object.keys(AllQuestionsList);
      setTopics(topics);
    };

    fetchTopics();
  }, []);

  useEffect(() => {
    if (selectedTopic) {
      const fetchedQuestions = AllQuestionsList[selectedTopic];
      setQuestions(fetchedQuestions);
    }
  }, [selectedTopic]);

  return (
    <div className='bg-blue-100'>
      <DailyProblem />
      <div className='bg-blue-100 min-h-screen flex justify-center'>
        <div className='w-full sm:w-3/4 lg:w-2/3  '>
          {topics.map((topic, index) => (
            <TopicCard  
              key={index} 
              id={topic} // Change here
              name={topic} 
              questions={selectedTopic === topic ? questions : []} 
              selectedTopic={selectedTopic}
              setSelectedTopic={setSelectedTopic}
            />
          ))}
        </div>
      </div>
    </div>
  );
};



export function QuestionCard({ name, link, youtube }) {
  const truncatedName = name.length > 20 ? name.substring(0, 20) + '..' : name;
  const truncatedLink = link.length > 40 ? link.substring(0, 40) + '...' : link;
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  
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
    <div className="flex items-center border rounded p-4 bg-blue-100 rounded-lg p-4 shadow-md ml-2 mt-2 mr-2 mb-2">
      <div className="flex-grow flex justify-between">
        <h3 className="text-lg font-semibold truncate w-3/5">
          {isSmallScreen ? truncatedName : name}
        </h3>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-blue-500 hover:underline ${`isSmallScreen ? -mr-12 : mr-[200px]`} ${isSmallScreen ? 'w-1/5' : 'w-2/5'}`}
        >
          {isSmallScreen ? 'Link' : truncatedLink}
        </a>
        <a
  href={youtube}
  target="_blank"
  rel="noopener noreferrer"
  className="ml-auto"
>
  <img
    className="max-w-[50px] p-2 rounded-md hover:underline cursor-pointer"
    src={Youtube}
    alt="contest image"
  /> 
</a>
      </div>
    </div>
  );
}

export function TopicCard({ id, name, questions, selectedTopic, setSelectedTopic }) {
    const isOpen = id === selectedTopic;
  
    const handleTopicClick = () => {
      setSelectedTopic(isOpen ? null : id);
    };
  
    return (
      <div className={`relative bg-white bg-opacity-50 w-[100%]  items-left  rounded-md overflow-hidden transition-shadow duration-300 p-4 border-2 m-1 border-gray-300 ${isOpen ? 'pb-8' : ''}`} onClick={handleTopicClick}>
        <div className={` gap-4 items-center sm:w-[90%]`}>
          <div className=''>
            <h1 className=' flex text-2xl font-semibold text-overflow-ellipsis whitespace-nowrap text-gray-700'>{name}</h1>
          </div>
        </div>
        {isOpen && (
          <div className='mt-4' onClick={e => e.stopPropagation()}>
            <div className={` items-center sm:w-[70%] md:w-[80%] lg:w-[90%] mx-auto`}>
              {questions && questions.map((question, index) => (
                <QuestionCard key={index} name={question.Question} link={question.Question_link} youtube={question.Solution_link} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
export default Resources;