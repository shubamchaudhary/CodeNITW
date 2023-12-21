// @ExperienceDetail.jsx
import React from 'react';

const ExperienceDetail = ({ experience, onClose }) => {
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
      <button onClick={onClose} className="text-blue-500 hover:text-blue-800 mb-4">Close</button>
      <h2 className="text-2xl text-blue-800 mb-4">{experience.studentName}</h2>
      <h4 className="text-blue-900 mb-2">Online Test Comments:</h4>
      {experience.onlineTestComments.map((comment, index) => (
        <p key={index} className="text-blue-900 bg-gray-100 rounded-lg p-4 shadow-md mb-4">{comment}</p>
      ))}
      <h4 className="text-blue-900 mb-2">Interviews:</h4>
      <ul className="list-disc list-inside">
        {experience.interviews.map((interview, index) => (
          <li key={index} className="mb-2 bg-gray-100 rounded-lg p-4 shadow-md">
            <p className="font-semibold text-gray-700">Round: {interview.round}</p>
            {interview.comments.map((comment, commentIndex) => (
              <>
              <p key={commentIndex} className="text-gray-600"> {comment}</p>
              <br></br>
              </>
            ))}
          </li>
        ))}
      </ul>
      <h4 className="text-blue-900 mb-2">Final Comments:</h4>
      {experience.finalComments.map((comment, index) => (
        <p key={index} className="text-blue-900 bg-gray-100 rounded-lg p-4 shadow-md mb-4">{comment}</p>
      ))}
    </div>
  );
};

export default ExperienceDetail;