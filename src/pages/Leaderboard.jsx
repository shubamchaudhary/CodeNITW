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
    console.log(updatedScoreArray);

    return updatedScoreArray;
  }

  return (
    <section className="max-w-6xl mx-auto flex justify-center items-center flex-col mt-[100px]">
      <h1 className="text-3xl text-center cursive">Leaderboard</h1>
      <Leaderboard
        className="max-w-6xl"
        theme="cyan"
        scoringMetric="Score"
        id="rollno"
        cell1="handle"
        cell2="Score"
        items={scoreArray}
      ></Leaderboard>
    </section>
  );
}
