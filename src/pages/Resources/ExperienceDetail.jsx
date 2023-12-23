// @ExperienceDetail.jsx
import React from 'react';

const ExperienceDetail = ({ experience, onClose }) => {
  return (
    <div className="bg-blue-100 dark:bg-[#141a25] shadow overflow-hidden sm:rounded-lg p-6">
      <button onClick={onClose} className="text-blue-500 hover:text-blue-800 mb-4">Close</button>
      <h2 className="text-2xl dark:text-blue-600 text-blue-900 mb-4">{experience.studentName}</h2>
      <h4 className="text-gray-800 dark:text-gray-400 mb-2">Online Test Comments:</h4>
      {experience.onlineTestComments.map((comment, index) => (
        <p key={index} className="text-gray-800 dark:text-gray-400 bg-blue-50 dark:bg-[#1c2432] rounded-lg p-4 shadow-md mb-4">{comment}</p>
      ))}
      <h4 className="text-gray-800 dark:text-gray-400 mb-2">Interviews:</h4>
      <ul className="list-disc list-inside">
        {experience.interviews.map((interview, index) => (
          <div key={index} className="mb-2 bg-blue-50 dark:bg-[#1c2432] rounded-lg p-4 shadow-md">
            <p className="font-semibold text-gray-800 dark:text-gray-400 ">Round: {interview.round}</p>
            {interview.comments.map((comment, commentIndex) => (
              <>
              <p key={commentIndex} className="text-gray-800 dark:text-gray-400"> {comment}</p>
              <br></br>
              </>
            ))}
          </div>
        ))}
      </ul>
      <h4 className="text-gray-800 dark:text-gray-400 mb-2">Final Comments:</h4>
      {experience.finalComments.map((comment, index) => (
        <p key={index} className="text-gray-800 dark:text-gray-400 bg-blue-50 dark:bg-[#1c2432] rounded-lg p-4 shadow-md mb-4">{comment}</p>
      ))}
    </div>
  );
};

export default ExperienceDetail;