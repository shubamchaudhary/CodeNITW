import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  setDoc,
  query,
  where,
  getDocs,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Tilt from "react-parallax-tilt";

async function sha512(str) {
  return crypto.subtle
    .digest("SHA-512", new TextEncoder("utf-8").encode(str))
    .then((buf) => {
      return Array.prototype.map
        .call(new Uint8Array(buf), (x) => ("00" + x.toString(16)).slice(-2))
        .join("");
    });
}

async function addOrUpdateData(updatedScoreArray, leaderboardCollectionRef) {
  const querySnapshot = await getDocs(leaderboardCollectionRef);

  for (const scoreData of updatedScoreArray) {
    const existingDocs = query(
      leaderboardCollectionRef,
      where("name", "==", scoreData.handle)
    );
    const existingDocsSnapshot = await getDocs(existingDocs);

    if (!existingDocsSnapshot.empty) {
      const existingDoc = existingDocsSnapshot.docs[0];
      await setDoc(existingDoc.ref, scoreData, { merge: true });
    } else {
      await addDoc(leaderboardCollectionRef, scoreData);
    }
  }
}

export default function LeaderboardList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [scoreArray, setScoreArray] = useState([]);
  const contests = ["480776", "482262", "483816", "486358", "492543"];
  const [isPushDataButtonVisible, setPushDataButtonVisible] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [hasPushedData, setHasPushedData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const itemsPerPage = 10;
  const [page, setPage] = useState(1);
  const handleChange = (event, value) => {
    setPage(value);
  };

  const filteredLeaderboardData = leaderboardData.filter((data) =>
    data.handle.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredLeaderboardData.length / itemsPerPage);

  // Cache configuration
  const CACHE_KEY = "leaderboard_data";
  const CACHE_TIMESTAMP_KEY = "leaderboard_timestamp";
  const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  // Check if cached data is valid
  const isCacheValid = () => {
    try {
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (!timestamp) return false;

      const cacheTime = parseInt(timestamp);
      const now = Date.now();
      return now - cacheTime < CACHE_DURATION;
    } catch (error) {
      console.error("Error checking cache validity:", error);
      return false;
    }
  };

  // Get cached data
  const getCachedData = () => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      console.error("Error getting cached data:", error);
      return null;
    }
  };

  // Set cached data
  const setCachedData = (data) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.error("Error setting cached data:", error);
    }
  };

  // Clear cache (useful for admin or when data needs refresh)
  const clearCache = () => {
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user && user.email === "rk972006@student.nitw.ac.in") {
        setPushDataButtonVisible(true);
      } else {
        setPushDataButtonVisible(false);
      }
    });
    loadLeaderboardData();
  }, []);

  const loadLeaderboardData = async () => {
    setIsLoading(true);

    // Check if we have valid cached data
    if (isCacheValid()) {
      const cachedData = getCachedData();
      if (cachedData) {
        console.log("📦 Loading data from cache");
        setLeaderboardData(cachedData);
        setScoreArray(cachedData);
        setIsLoading(false);
        return;
      }
    }

    console.log("🔄 Fetching fresh data from database");
    // If no valid cache, fetch from database
    await fetchData();
  };

  async function fetchData() {
    try {
      const lastContestId = contests[contests.length - 1];
      const data = await getStandings(lastContestId);
      if (data && data.status === "OK") {
        let updatedScoreArray = getScores(data, lastContestId, []);

        const leaderboardCollectionRef = collection(db, "leaderboard");
        const leaderboardQuerySnapshot = await getDocs(
          leaderboardCollectionRef
        );
        const lastLeaderboardData = [];
        leaderboardQuerySnapshot.forEach((doc) => {
          lastLeaderboardData.push(doc.data());
        });

        for (const newScore of updatedScoreArray) {
          const existingUserIndex = lastLeaderboardData.findIndex(
            (user) => user.handle === newScore.handle
          );

          if (existingUserIndex !== -1) {
            lastLeaderboardData[existingUserIndex].Score = (
              parseFloat(lastLeaderboardData[existingUserIndex].Score) +
              parseFloat(newScore.Score)
            ).toFixed(2);
          } else {
            lastLeaderboardData.push(newScore);
          }
        }

        setScoreArray(lastLeaderboardData);

        const leaderboardData = [];
        leaderboardQuerySnapshot.forEach((doc) => {
          leaderboardData.push(doc.data());
        });

        // Cache the fetched data
        setCachedData(leaderboardData);
        setLeaderboardData(leaderboardData);

        if (!hasPushedData) {
          for (const contest_id of contests) {
            const data = await getStandings(contest_id);
            if (data && data.status === "OK") {
              const contestRanksItem = getContestRanks(data, contest_id);
              const contestRanksCollectionRef = collection(db, "contestRanks");
              const q = query(
                contestRanksCollectionRef,
                where("contestId", "==", contest_id)
              );
              const querySnapshot = await getDocs(q);
              if (querySnapshot.empty) {
                await addDoc(contestRanksCollectionRef, contestRanksItem);
              }
            }
          }
          setHasPushedData(true);
        }
      } else {
        console.error("API Error:", data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateDataClick() {
    setIsLoading(true);
    try {
      // Clear cache before updating to ensure fresh data
      clearCache();
      const leaderboardCollectionRef = collection(db, "leaderboard");
      await addOrUpdateData(scoreArray, leaderboardCollectionRef);
      // Fetch fresh data after update
      await fetchData();
    } catch (error) {
      console.error("Error updating data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  // Manual refresh function (you can add a refresh button if needed)
  const handleRefresh = async () => {
    clearCache();
    await loadLeaderboardData();
  };

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
    if (!response.ok) {
      console.error("Failed to fetch data from the API:", response.statusText);
      return null;
    }
    const data = await response.json();
    console.log(data);
    return data;
  }

  function getContestRanks(obj, contestId) {
    let startTimeSeconds = obj.result.contest.startTimeSeconds;
    let userId = "";
    let rank = 0;
    let ranksArray = [];
    for (const item of obj.result.rows) {
      rank = item.rank;
      userId = item.party.members[0].handle;
      ranksArray.push({ rank, userId });
    }

    let tempData = {
      contestDate: startTimeSeconds,
      contestId: contestId,
      ranks: ranksArray,
    };

    return tempData;
  }

  function getScores(obj, contestId, previousScores) {
    const updatedScoreArray = [...previousScores];
    let totalScore = 0;

    for (const item of obj.result.problems) {
      if (!item.rating) {
        item.rating = 1500;
      }
      totalScore += item.rating;
    }

    for (const row of obj.result.rows) {
      const points = row.points;
      const penalty = row.penalty;
      const handle = row.party.members[0].handle;
      const rollno = 0;
      let Score = 100 * points + (1 - penalty / totalScore);
      Score = Score.toFixed(2);

      const existingUserIndex = updatedScoreArray.findIndex(
        (user) => user.handle === handle
      );

      if (existingUserIndex !== -1) {
        updatedScoreArray[existingUserIndex].Score = (
          parseFloat(updatedScoreArray[existingUserIndex].Score) +
          parseFloat(Score)
        ).toFixed(2);
      } else {
        updatedScoreArray.push({
          Score,
          contestId,
          handle,
          rollno,
        });
      }
    }

    return updatedScoreArray;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <section className="max-w-6xl mx-auto flex justify-center items-center flex-col px-4 py-4">
        {/* Modern Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🏆 Coding Leaderboard
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-4">
            Track your progress and compete with fellow coders
          </p>

          {/* Stats Cards */}
          <div className="flex justify-center space-x-4 ">
            <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg shadow-md border border-gray-200 dark:border-slate-600">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Participants
              </div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {leaderboardData.length}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg shadow-md border border-gray-200 dark:border-slate-600">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Contests
              </div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {contests.length}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Button */}
        {isPushDataButtonVisible && (
          <div className="flex justify-center space-x-3 mb-6">
            <button
              onClick={handleUpdateDataClick}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  Updating...
                </div>
              ) : (
                <>🔄 Update Data</>
              )}
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              🔄 Refresh
            </button>
          </div>
        )}

        {/* Leaderboard Container */}
        <div className="w-full bg-white dark:bg-slate-800 shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-600">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Loading leaderboard...
                </p>
              </div>
            </div>
          ) : (
            <>
              <CustomLeaderboard
                leaderboardData={leaderboardData}
                page={page}
                setPage={setPage}
                itemsPerPage={itemsPerPage}
                searchTerm={searchTerm}
              />

              {/* Modern Pagination */}
              <div className="flex justify-center p-4 bg-slate-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNumber) => (
                    <button
                      className={`mx-1 px-3 py-1.5 rounded-lg font-medium transition-all duration-200 text-xs ${
                        page === pageNumber
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-white dark:bg-slate-600 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-500 border border-gray-300 dark:border-slate-500"
                      }`}
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export const CustomLeaderboard = ({
  leaderboardData,
  page,
  setPage,
  itemsPerPage,
  searchTerm,
}) => {
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = page * itemsPerPage;

  const sortedLeaderboardData = leaderboardData.sort(
    (a, b) => b.Score - a.Score
  );

  const rank =
    leaderboardData.findIndex(
      (item) => item.handle.toLowerCase() === searchTerm.toLowerCase()
    ) + 1;

  const filteredLeaderboardData = sortedLeaderboardData.filter((data) =>
    data.handle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const leaderboardItems = filteredLeaderboardData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredLeaderboardData.length / itemsPerPage);

  const goToNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const goToPreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  return (
    <div className="p-4">
      {/* Modern Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-slate-600">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-slate-100 to-blue-100 dark:from-slate-700 dark:to-slate-600">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Rank
              </th>
              <th className="px-4 py-2 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Handle
              </th>
              <th className="px-4 py-2 text-right text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Score
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-600">
            {leaderboardItems.map((item, index) => {
              const globalRank = startIndex + index + 1;
              let rankEmoji = "";
              let rowClass =
                "hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200";

              if (globalRank === 1) {
                rankEmoji = "👑";
                rowClass =
                  "bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20 border-l-4 border-yellow-400";
              } else if (globalRank === 2) {
                rankEmoji = "🥈";
                rowClass =
                  "bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-700/20 dark:to-slate-600/20 border-l-4 border-slate-400";
              } else if (globalRank === 3) {
                rankEmoji = "🥉";
                rowClass =
                  "bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 border-l-4 border-amber-400";
              }

              return (
                <tr key={index} className={rowClass}>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      <span
                        className={`text-xs font-bold ${
                          globalRank === 1
                            ? "text-yellow-600"
                            : globalRank === 2
                            ? "text-slate-600"
                            : globalRank === 3
                            ? "text-amber-600"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        #{globalRank}
                      </span>
                      {rankEmoji && (
                        <span className="text-sm">{rankEmoji}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <a
                      href={`https://codeforces.com/profile/${item.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors hover:underline text-xs"
                    >
                      {item.handle}
                    </a>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {parseFloat(item.Score).toFixed(2)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rank > 0 && (
        <p className="mt-3 text-center text-gray-600 dark:text-gray-400 text-sm">
          <span className="font-medium">{searchTerm}</span> is ranked #{rank}
        </p>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-center mt-4 space-x-2">
        <button
          onClick={goToPreviousPage}
          disabled={page === 1}
          className="px-4 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-xs"
        >
          ← Previous
        </button>
        <button
          onClick={goToNextPage}
          disabled={page === totalPages}
          className="px-4 py-1.5 rounded-lg bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-xs"
        >
          Next →
        </button>
      </div>
    </div>
  );
};
