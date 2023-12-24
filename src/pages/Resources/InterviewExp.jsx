import React, { useState } from 'react';

import AnimatedModal from './Modal';
import MarkdownPreview from '@uiw/react-markdown-preview';
import path from 'path';


const ExperienceDetail = ({ experience, onClose }) => {
  return (
    <div className="bg-blue-100 dark:bg-[#141a25] shadow overflow-hidden sm:rounded-lg p-6">
      <button onClick={onClose} className="text-blue-500 hover:text-blue-800 mb-4">Close</button>
      <MarkdownPreview source={experience} 
          wrapperElement={{
            "data-color-mode": "light"
          }}
      />
    </div>
  );
};



const InterviewExp = () => {
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openCompanyIndex, setOpenCompanyIndex] = useState(null);

  const toggleCompany = (index) => {
    if (openCompanyIndex === index) {
      setOpenCompanyIndex(null);
    } else {
      setOpenCompanyIndex(index);
    }
  };
  const getFileName = (filePath) => {
    const parts = filePath.split('/');
    const file = parts[parts.length - 1];
    return file.split('.')[0]; // remove the extension
  };
  const companies = [
    {
      name: 'Uber',
      experiences: ['src/Data/Experiences/Abhishek Navadiya.txt' ]
    },
    {
      name : 'De Shaw',
      experiences : ['src/Data/Experiences/Ganesh Yadava.txt' ,'src/Data/Experiences/Aryan Srivastava.txt' ]
    },
    {
      name : 'Service Now',
      experiences : ['src/Data/Experiences/Vedant Nagre.txt']
    },
    {
      name : 'Chronus',
      experiences : ['src/Data/Experiences/Nikhil Boob.txt']
    },
    {
      name : 'VISA',
      experiences : ['src/Data/Experiences/manideep sai boddepalli.txt']
    },
    {
      name : 'GOLDMAN SACHS',
      experiences : ['src/Data/Experiences/Meghana Thallada.txt' , 'src/Data/Experiences/K N Adithya Vardhan Reddy.txt']
    },
    {
      name : 'Oracle',
      experiences : ['src/Data/Experiences/Joel Cecil.txt','src/Data/Experiences/Harshil Patel.txt']
    },
    {
      name : 'QUALCOMM',
      experiences : ['src/Data/Experiences/Parth Soni.txt',]
    },
    {
      name : 'MasterCard',
      experiences : ['src/Data/Experiences/Adarsh Rao.txt',]
    },
  ];

  const handleExperienceClick = async (file) => {
    try {
      const response = await fetch(file);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      setSelectedExperience(text);
      setIsModalOpen(true);
    } catch (error) {
      console.log('Fetch Error: ', error);
    }
  };

  const handleCloseDetail = () => {
    setSelectedExperience(null);
    setIsModalOpen(false);
  };

  return (
    <div className="p-10 bg-blue-100 min-h-screen dark:bg-[#050b15] text-gray-700 dark:text-gray-400">
      <h1 className="text-4xl mb-4">INTERVIEW EXPERIENCES</h1>
      {companies.map((company, index) => (
        <div key={index} className="ml-5 mb-4">
          <h2 onClick={() => toggleCompany(index)} className="cursor-pointer text-blue text-[25px] mb-2">
            {company.name}
          </h2>
          {openCompanyIndex === index && (
            <ul className="list-disc list-inside pl-5 bg-gray-100 dark:bg-[#050b15] rounded-lg p-4">
              {company.experiences.map((file, index) => (
                <li key={index} onClick={() => handleExperienceClick(file)} className="cursor-pointer mb-2 text-[20px] ">
                  {getFileName(file)} {/* Render the file name without extension */}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
      {isModalOpen && (
        <AnimatedModal isOpen={isModalOpen} onRequestClose={handleCloseDetail}>
          <ExperienceDetail experience={selectedExperience} onClose={handleCloseDetail} />
        </AnimatedModal>
      )}
    </div>
  );
};

export default InterviewExp;  