import React from "react";

const CustomLeaderboard = ({ leaderboardData, page, itemsPerPage }) => {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = page * itemsPerPage;
  const leaderboardItems = leaderboardData
    .sort((a, b) => b.Score - a.Score) // Sort entries by score in descending order
    .slice(startIndex, endIndex);

  return (
    <div className="leaderboard">
      <h1 className="leaderboard-title">Leaderboard</h1>
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th className="leaderboard-cell">Rank</th>
            <th className="leaderboard-cell">Handle</th>
            <th className="leaderboard-cell">Score</th>
          </tr>
        </thead>
        <tbody>
          {leaderboardItems.map((item, index) => (
            <tr key={index}>
              <td className="leaderboard-cell">{startIndex + index + 1}</td>
              <td className="leaderboard-cell">{item.handle}</td>
              <td className="leaderboard-cell">{item.Score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};



export default CustomLeaderboard;