import React, { useState } from 'react';

import AnimatedModal from './Modal';
import MarkdownPreview from '@uiw/react-markdown-preview';
import AbhishekNavadiya from '../../Data/Experiences/Abhishek Navadiya.txt';
import GaneshYadava from '../../Data/Experiences/Ganesh Yadava.txt';
import AryanSrivastava from '../../Data/Experiences/Aryan Srivastava.txt';
import VedantNagre from '../../Data/Experiences/Vedant Nagre.txt';
import NikhilBoob from '../../Data/Experiences/Nikhil Boob.txt';
import ManideepSaiBoddepalli from '../../Data/Experiences/manideep sai boddepalli.txt';
import MeghanaThallada from '../../Data/Experiences/Meghana Thallada.txt';
import AdithyaVardhanReddy from '../../Data/Experiences/K N Adithya Vardhan Reddy.txt';
import JoelCecil from '../../Data/Experiences/Joel Cecil.txt';
import HarshilPatel from '../../Data/Experiences/Harshil Patel.txt';
import ParthSoni from '../../Data/Experiences/Parth Soni.txt';
import AdarshRao from '../../Data/Experiences/Adarsh Rao.txt';
import MSATanzeel from '../../Data/Experiences/M S A Tanzeel.txt';
import ChirantanMuliya from '../../Data/Experiences/Chirantan Muliya.txt'
import VijayChowdaryNelakurthi from '../../Data/Experiences/Vijay Chowdary Nelakurthi.txt'




const ExperienceDetail = ({ experience, onClose }) => {
  
const [darkMode, setDarkMode] = useState( JSON.parse(localStorage.getItem("darkMode")) || false);
  return (
    <div className="bg-blue-100 dark:bg-[#141a25] shadow overflow-hidden sm:rounded-lg p-6">
      <button onClick={onClose} className="text-blue-500 hover:text-blue-800 mb-4">Close</button>
      <div className={`bg-blue-100 dark:bg-[#141a25]`}>
        <MarkdownPreview 
          source={experience} 
          wrapperElement={{
            "data-color-mode": darkMode ? "dark" : "light"
          }}
        />
      </div>
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
      experiences: [
        {
          name: 'Abhishek Navadiya',
          file: AbhishekNavadiya
        }
      ]
    },
    {
      name : 'De Shaw',
      experiences : [
        {
          name: 'Ganesh Yadava',
          file: GaneshYadava
        },
        {
          name: 'Aryan Srivastava',
          file: AryanSrivastava
        }
      ]
    },
    {
      name : 'Service Now',
      experiences : [
        {
          name: 'Vedant Nagre',
          file: VedantNagre
        }
      ]
    },
    {
      name : 'Chronus',
      experiences : [
        {
          name: 'Nikhil Boob',
          file: NikhilBoob
        }
      ]
    },
    {
      name : 'VISA',
      experiences : [
        {
          name: 'Manideep Sai Boddepalli',
          file: ManideepSaiBoddepalli
        }
      ]
    },
    {
      name : 'GOLDMAN SACHS',
      experiences : [
        {
          name: 'Meghana Thallada',
          file: MeghanaThallada
        },
        {
          name: 'K N Adithya Vardhan Reddy',
          file: AdithyaVardhanReddy
        }
      ]
    },
    {
      name : 'Oracle',
      experiences : [
        {
          name: 'Joel Cecil',
          file: JoelCecil
        },
        {
          name: 'Harshil Patel',
          file: HarshilPatel
        }
      ]
    },
    {
      name : 'QUALCOMM',
      experiences : [
        {
          name: 'Parth Soni',
          file: ParthSoni
        }
      ]
    },
    {
      name : 'MasterCard',
      experiences : [
        {
          name: 'Adarsh Rao',
          file: AdarshRao
        }
      ]
    },
    {
      name : 'CodeNation',
      experiences : [
        {
          name : 'M S A Tanzeel',
          file : MSATanzeel
        }
      ]
    },
    {
      name : 'Microsoft',
      experiences : [
        {
          name : 'Chirantan Muliya',
          file : ChirantanMuliya
        }
      ]
    },
    {
      name : 'John Deere',
      experiences : [
        {
          name : 'Vijay Chowdary Nelakurthi',
          file : VijayChowdaryNelakurthi
        }
      ]
    }
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
              {company.experiences.map((experience, index) => (
              <li key={index} onClick={() => handleExperienceClick(experience.file)} className="cursor-pointer mb-2 text-[20px] ">
                {experience.name}
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