import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { addDoc, collection, serverTimestamp, updateDoc, arrayUnion, getDocs, doc } from "firebase/firestore";
import { getAuth } from '@firebase/auth';
import DailyProblem from './DailyProblem.jsx'


const Resources = () => {
  const [topics, setTopics] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [newTopic, setNewTopic] = useState("");
  const [newQuestion, setNewQuestion] = useState({ name: '', link: '',defficulty:'easy' });
  

  useEffect(() => {
    const fetchTopics = async () => {
      const querySnapshot = await getDocs(collection(db, "resources"));
      setTopics(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchTopics();
  }, []);

  const addTopic = async (e) => {
    e.preventDefault();
    const docRef = await addDoc(collection(db, "resources"), {
      topicName: newTopic,
      questions: [],
      timestamp: serverTimestamp(),
    });
    setTopics([...topics, { id: docRef.id, topicName: newTopic, questions: [] }]);
    setNewTopic("");
  };

  const addQuestion = async ({isAdmin}) => {
    if (selectedTopic) {
      const docRef = doc(db, "resources", selectedTopic);
      await updateDoc(docRef, {
        questions: arrayUnion(newQuestion)
      });
      setTopics(topics.map(topic => topic.id === selectedTopic ? { ...topic, questions: [...topic.questions, newQuestion] } : topic));
      setNewQuestion({ name: '', link: '',defficulty:'easy' });
    }
  };
  const auth = getAuth();
  const user=auth.currentUser;
  const userEmail = user && user.email;

  return (
    <div className='bg-blue-100'>
    <DailyProblem />
    <div className='bg-blue-100 min-h-screen flex justify-center'>
    <div className='w-full sm:w-3/4 lg:w-2/3  '>
      {topics.map(topic => (
        <TopicCard  
          key={topic.id} 
          id={topic.id}
          name={topic.topicName} 
          questions={topic.questions} 
          addQuestion={addQuestion} 
          newQuestion={newQuestion} 
          setNewQuestion={setNewQuestion}
          selectedTopic={selectedTopic}
          setSelectedTopic={setSelectedTopic}
          isAdmin={isAdmin}
        />
      ))}
      {(userEmail === 'sc922055@student.nitw.ac.in' || userEmail === 'rk972006@student.nitw.ac.in') && <div className='flex justify-center p-2 mt-2'> 
        <input className='border-2 border-gray-500 text-xl rounded-lg mx-2' type="text" value={newTopic} onChange={e => setNewTopic(e.target.value)} placeholder="Topic name" />
        <button className='bg-blue-600 text-white text-sm rounded-full hover:bg-blue-900 py-4 px-2 transition duration-300 inline-block font-medium' onClick={addTopic}>Add Topic</button>
      </div>}
    </div>
    </div>
    </div>
  );
};

export function QuestionCard({ name, link, defficulty }) {
  const truncatedName = name.length > 20 ? name.substring(0, 37) + '...' : name;
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

  const getTagStyle = () => {
    // Define the background colors for different tags
    const backgroundColors = {
      easy: 'bg-green-400',
      medium: 'bg-yellow-400',
      hard: 'bg-red-400',
    };

    // Get the background class based on the tag
    const backgroundClass = backgroundColors[defficulty] || '';

    return `px-2 py-1 rounded ${backgroundClass} text-Black `;
  };

  return (
    <div className="flex items-center border rounded p-4 bg-blue-100 rounded-lg p-4 shadow-md ml-2 mt-2 mr-2 mb-2">
    <div className="flex-grow">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ width: '40%' }}>
          {name}
        </h3>
        <span className={getTagStyle()}>
          {defficulty}
        </span>
        {isSmallScreen ? (
          <a
          href={link}
          target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline ml-6"
            style={{ width: '10%' }}
          >
            Link
          </a>
        ) : (
          <a
            href={link}
            className="text-blue-500 hover:underline ml-6"
            target="_blank"
            rel="noopener noreferrer"
            style={{ width: '46%' }}
          >
            {link}
          </a>
//             {/* <select className="px-2 py-1 rounded bg-blue-500 text-white" style={{ width: '7%' }}
// //                     value={action}
// //                   >
// //                     <option value="Done">Done</option>
// //                     <option value="Pending">Pending</option>
// //                   </select> */}
        )}
      </div>
    </div>
  </div>
  );
}

export function TopicCard({ id, name, questions, addQuestion, newQuestion, setNewQuestion, selectedTopic, setSelectedTopic, isAdmin }) {
  const isOpen = id === selectedTopic;

  const handleTopicClick = () => {
    setSelectedTopic(isOpen ? null : id);
  };
  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user && user.email;

  return (
    <>
    <div className={`relative bg-white bg-opacity-50 w-[100%]  items-left  rounded-md overflow-hidden transition-shadow duration-300 p-4 border-2 m-1 border-gray-300 ${isOpen ? 'pb-8' : ''}`} onClick={handleTopicClick}>
      <div className={` gap-4 items-center sm:w-[90%]`}>
        <div className=''>
          <h1 className=' flex text-2xl font-semibold text-overflow-ellipsis whitespace-nowrap text-gray-700'>{name}</h1>
        </div>
      </div>
      {isOpen && (
        <div className='mt-4' onClick={e => e.stopPropagation()}>
          <div className={` items-center sm:w-[70%] md:w-[80%] lg:w-[90%] mx-auto`}>
            {questions.map((question, index) => (
              <QuestionCard key={index} name={question.name} link={question.link} defficulty={question.defficulty} />
            ))}
          </div>
          {(userEmail === 'sc922055@student.nitw.ac.in' || userEmail === 'rk972006@student.nitw.ac.in') && (
            <div className='flex justify-center p-2 mt-2'>
              <input
                 className='border-2 border-gray-500 text-xl rounded-lg mx-2'
                type="text"
                value={newQuestion.name}
                onChange={e => {
                  e.stopPropagation();
                  setNewQuestion({ ...newQuestion, name: e.target.value });
                }}
                placeholder="Question name"
                onClick={e => e.stopPropagation()}
              />
              <input
              className='border-2 border-gray-500 text-xl rounded-lg mx-2'
                type="text"
                value={newQuestion.link}
                onChange={e => {
                  e.stopPropagation();
                  setNewQuestion({ ...newQuestion, link: e.target.value });
                }}
                placeholder="Question link"
                onClick={e => e.stopPropagation()}
              />
              <select
                  id="defficulty"
                  onChange={e => {
                    e.stopPropagation();
                    setNewQuestion({ ...newQuestion, defficulty: e.target.value });
                  }}
                  className="w-[100px]  text-gray-700 bg-gray-100 rounded-lg"
                >
                   <option id="easy" value="easy">
                    Easy
                  </option>
                  <option id="medium" value="medium">
                    Medium
                  </option>
                 
                  <option id="hard" value="hard">
                    Hard
                  </option>
                  
                </select>
              <button
             className='bg-blue-600 text-white text-sm rounded-full hover:bg-blue-900 py-4 px-2 transition duration-300 inline-block font-medium'
                onClick={e => {
                  e.stopPropagation();
                  addQuestion({ isAdmin: { isAdmin } });
                }}
              >
                Add Question
              </button>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
export default Resources;