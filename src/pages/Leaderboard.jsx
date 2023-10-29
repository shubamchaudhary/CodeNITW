import React, { useState, useEffect } from "react";
import { Leaderboard } from "flywheel-leaderboard";
import { SHA256, enc } from "crypto-js";

async function sha512(str) {
  return crypto.subtle
    .digest("SHA-512", new TextEncoder("utf-8").encode(str))
    .then((buf) => {
      return Array.prototype.map
        .call(new Uint8Array(buf), (x) => ("00" + x.toString(16)).slice(-2))
        .join("");
    });
}

export default function LeaderboardList() {
  const [scoreArray, setScoreArray] = useState([]);
  const contests = ["480776", "477676"]; // Add more contest IDs as needed

  useEffect(() => {
    async function fetchData() {
      let updatedScoreArray = [];

      for (const contest_id of contests) {
        const data = await getStandings(contest_id);
        updatedScoreArray = getScores(data, contest_id, updatedScoreArray);
      }
      setScoreArray(updatedScoreArray);
    }

    fetchData();
  }, []);

  async function getStandings(contest_id) {
    const rand = String(Math.floor(Math.random() * 100000)).padStart(6, "0");
    const current_time = String(Math.floor(Date.now() / 1000));
    const api_key = "7bcb2c2a57feab460343d341d164e26b4ae32fd1";
    const api_secret = "3e67186659f5f9f35c5841127c40a5b0339180b1";
    const api_sig =
      rand +
      "/contest.standings?apiKey=" +
      api_key +
      "&contestId=" +
      contest_id +
      "&time=" +
      current_time +
      "#" +
      api_secret;
    const hash = await sha512(api_sig);
    const hashWithRand = rand + hash;
    const url = `https://codeforces.com/api/contest.standings?contestId=${contest_id}&apiKey=${api_key}&time=${current_time}&apiSig=${hashWithRand}`;
    const response = await fetch(url);
    const data = await response.json();
    // console.log(data);
    // data.map((d) => {
    //   // console.log(d.score);
    // });
    return data;
  }

  function getScores(obj, contestId, previousScores) {
    const updatedScoreArray = [...previousScores];
    let totalScore = 0;

    for (const item of obj.result.problems) {
      totalScore += item.rating;
    }

    for (const row of obj.result.rows) {
      const points = row.points;
      const penalty = row.penalty;
      const handle = row.party.members[0].handle;
      const rollno = 0;
      let Score = 100 * points + (1 - penalty / totalScore);
      Score = Score.toFixed(2);

      // Check if handle already exists in updatedScoreArray
      const existingUserIndex = updatedScoreArray.findIndex(
        (user) => user.handle === handle
      );

      if (existingUserIndex !== -1) {
        // Update the existing user's score for the contest
        updatedScoreArray[existingUserIndex].Score = (
          parseFloat(updatedScoreArray[existingUserIndex].Score) +
          parseFloat(Score)
        ).toFixed(2);
      } else {
        // Create a new entry for the user for the given contest
        updatedScoreArray.push({
          Score,
          contestId,
          handle,
          rollno,
        });
      }
    }
    // updatedScoreArray.map((d) => {
    //   console.log(d.Score);
    // });
    console.log(updatedScoreArray);

    return updatedScoreArray;
  }

  return (
    <>
      <h2 className="text-4xl font-bold text-red-950 flex justify-center mb-4">
        Leaderboard
      </h2>
      <div className="p-4 flex justify-center overflow-x-auto">
        <div className="flex justify-center w-[70%] ">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-center text-red-950 font-bold text-2xl">
                  Rank
                </th>
                <th className="text-center text-red-950 font-bold text-2xl">
                  Handle
                </th>
                <th className="text-center text-red-950 font-bold text-2xl">
                  Score
                </th>
              </tr>
            </thead>

            <tbody className="overflow-y-auto max-h-60">
              {scoreArray.map((student, index) => (
                <tr
                  key={student.handle}
                  className="hover:bg-gray-100 border-b-2  border-gray-200"
                >
                  <td className="text-center text-2xl">{index + 1}</td>
                  <td className="text-center text-blue-900 text-2xl">
                    <a
                      target="_blank"
                      rel="noopener"
                      href={`https://codeforces.com/profile/${student.handle}`}
                    >
                      {student.handle}
                    </a>
                  </td>
                  <td className="text-center text-2xl">{student.Score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
