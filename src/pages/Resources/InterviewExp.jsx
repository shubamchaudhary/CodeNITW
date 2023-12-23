import React, { useState } from 'react';
import ExperienceDetail from './ExperienceDetail';
import AnimatedModal from './Modal'; // Import your AnimatedModal component
import experiences from '../../Data/Experiences.json';


const InterviewExp = () => {
  
    const [selectedExperience, setSelectedExperience] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const handleExperienceClick = (event, experience) => {
        event.stopPropagation();
        setSelectedExperience(experience);
        setIsModalOpen(true);
      };
  
    const handleCloseDetail = () => {
      setSelectedExperience(null);
      setIsModalOpen(false);
    };

    const handleCompanyClick = (company) => {
      if (selectedCompany === company.id) {
        setSelectedCompany(null);
      } else {
        setSelectedCompany(company.id);
      }
    };
  
    return (
      <div className="p-10 bg-blue-100 min-h-screen dark:bg-[#050b15] text-gray-700 dark:text-gray-400">
        <h1 className="text-4xl mb-4">INTERVIEW EXPERIENCES</h1>
        <ul className="">
          {experiences.map((company) => (
            <li key={company.id} className="py-4 ml-2" onClick={() => handleCompanyClick(company)}>
              <h2 className="text-2xl text-gray-600 dark:text-gray-500 font-semibold cursor-pointer">{company.company}</h2>
              {selectedCompany === company.id && (
                <ul className="mt-2">
                  {company.experiences.map((experience, index) => (
                    <li key={index} className="text-blue-500 hover:text-blue-800 cursor-pointer" onClick={(event) => handleExperienceClick(event, experience)}>
                      {experience.studentName}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        {isModalOpen && (
          <AnimatedModal isOpen={isModalOpen} onRequestClose={handleCloseDetail}>
            <ExperienceDetail
              experience={selectedExperience}
              onClose={handleCloseDetail}
            />
          </AnimatedModal>
        )}
      </div>
    );
  };
  
  export default InterviewExp;
