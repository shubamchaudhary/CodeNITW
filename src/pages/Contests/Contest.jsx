import React, { useState, useEffect } from "react";
import { doc, getDoc, orderBy, query, limit, where } from "firebase/firestore";
import { Link, useParams } from "react-router-dom";
import { db } from "../../firebase";
import { getAuth } from "firebase/auth";
import { Dna } from "react-loader-spinner";
import { getDocs, collection } from "firebase/firestore";
import { AiOutlineDown, AiOutlineUp } from "react-icons/ai";
import ContestCard from "./ContestCard";
import AtcoderImage from "../../images/AtCoder.png";
import CodechefImage from "../../images/CodeChef.png";
import CodeforcesImage from "../../images/CodeForces.png";
import GFGImage from "../../images/gfg.png";
import LeetcodeImage from "../../images/LeetCode.png";
import DefaultImage from "../../images/codenitwcontest.png";

export default function Contest() {
  const [Listings, setListings] = useState({
    active: [],
    upcoming: [],
    past: [],
  });
  const [activeContests, setActiveContests] = useState([]);
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dropdown states
  const [isUpcomingOpen, setIsUpcomingOpen] = useState(true);
  const [isCCPDOpen, setIsCCPDOpen] = useState(true);

  // Cache configuration
  const CCPD_CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
  const EXTERNAL_CACHE_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days

  // Cache keys
  const CCPD_CACHE_KEY = "ccpd_contests_cache";
  const CCPD_TIMESTAMP_KEY = "ccpd_contests_timestamp";
  const EXTERNAL_CACHE_KEY = "external_contests_cache";
  const EXTERNAL_TIMESTAMP_KEY = "external_contests_timestamp";

  // Cache utility functions
  const isCacheValid = (timestampKey, duration) => {
    try {
      const timestamp = localStorage.getItem(timestampKey);
      if (!timestamp) return false;

      const cacheTime = parseInt(timestamp);
      const now = Date.now();
      return now - cacheTime < duration;
    } catch (error) {
      console.error("Error checking cache validity:", error);
      return false;
    }
  };

  const getCachedData = (cacheKey) => {
    try {
      const cachedData = localStorage.getItem(cacheKey);
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      console.error("Error getting cached data:", error);
      return null;
    }
  };

  const setCachedData = (cacheKey, timestampKey, data) => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(timestampKey, Date.now().toString());
    } catch (error) {
      console.error("Error setting cached data:", error);
    }
  };

  const clearExpiredCache = () => {
    try {
      // Clear CCPD cache if expired
      if (!isCacheValid(CCPD_TIMESTAMP_KEY, CCPD_CACHE_DURATION)) {
        localStorage.removeItem(CCPD_CACHE_KEY);
        localStorage.removeItem(CCPD_TIMESTAMP_KEY);
      }

      // Clear external cache if expired
      if (!isCacheValid(EXTERNAL_TIMESTAMP_KEY, EXTERNAL_CACHE_DURATION)) {
        localStorage.removeItem(EXTERNAL_CACHE_KEY);
        localStorage.removeItem(EXTERNAL_TIMESTAMP_KEY);
      }
    } catch (error) {
      console.error("Error clearing expired cache:", error);
    }
  };

  useEffect(() => {
    // Clear expired cache on component mount
    clearExpiredCache();

    async function fetchListings() {
      try {
        // Check for cached CCPD data first
        if (isCacheValid(CCPD_TIMESTAMP_KEY, CCPD_CACHE_DURATION)) {
          const cachedListings = getCachedData(CCPD_CACHE_KEY);
          if (cachedListings) {
            console.log("📊 Loading CCPD contests from cache");
            setListings(cachedListings);
            return;
          }
        }

        console.log("🔄 Fetching fresh CCPD contests data");
        const listingRef = collection(db, "listings");
        const q = query(listingRef, orderBy("timestamp", "desc"));
        const querySnap = await getDocs(q);
        const activeListings = [];
        const upcomingListings = [];
        const pastListings = [];
        const currentTime = new Date().getTime();

        querySnap.forEach((doc) => {
          const listing = {
            id: doc.id,
            data: doc.data(),
          };

          const temp = listing.data.startingTimeAsDate;
          const listingStartTimeDate = temp.toDate();
          const listingStartTime = listingStartTimeDate.getTime();
          const listingEndTime =
            listingStartTime + listing.data.duration * 60 * 1000;

          if (
            listingStartTime <= currentTime &&
            currentTime <= listingEndTime
          ) {
            activeListings.push(listing);
          } else if (listingStartTime > currentTime) {
            upcomingListings.push(listing);
          } else {
            pastListings.push(listing);
          }
        });

        const listingsData = {
          active: activeListings,
          upcoming: upcomingListings,
          past: pastListings,
        };

        // Cache the CCPD data
        setCachedData(CCPD_CACHE_KEY, CCPD_TIMESTAMP_KEY, listingsData);
        setListings(listingsData);
      } catch (error) {
        console.log("Error fetching CCPD contests:", error);
      }
    }

    async function getOtherContest() {
      try {
        // Check for cached external contests data first
        if (isCacheValid(EXTERNAL_TIMESTAMP_KEY, EXTERNAL_CACHE_DURATION)) {
          const cachedExternalData = getCachedData(EXTERNAL_CACHE_KEY);
          if (cachedExternalData) {
            console.log("📊 Loading external contests from cache");
            setActiveContests(cachedExternalData.activeContests || []);
            setUpcomingContests(cachedExternalData.upcomingContests || []);
            return;
          }
        }

        console.log("🔄 Fetching fresh external contests data");

        let response;
        let apiData;

        try {
          // For development, use CORS proxy
          if (
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1"
          ) {
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
              "https://contest-api-eight.vercel.app/contest"
            )}`;
            response = await fetch(proxyUrl);

            if (response.ok) {
              const proxyData = await response.json();
              apiData = JSON.parse(proxyData.contents);
            } else {
              throw new Error("Proxy request failed");
            }
          } else {
            // For production, try direct API call
            response = await fetch(
              "https://contest-api-eight.vercel.app/contest"
            );
            if (response.ok) {
              apiData = await response.json();
            } else {
              throw new Error("Direct API request failed");
            }
          }
        } catch (error) {
          console.warn("Primary API failed, trying alternative:", error);
          try {
            // Fallback to alternative API
            response = await fetch("https://kontests.net/api/v1/all");
            if (response.ok) {
              apiData = await response.json();
            } else {
              throw new Error("Alternative API also failed");
            }
          } catch (fallbackError) {
            console.error("All APIs failed:", fallbackError);
            setActiveContests([]);
            setUpcomingContests([]);
            return;
          }
        }

        // Handle different API response formats
        let contestObjects = [];
        if (apiData && apiData.objects) {
          contestObjects = apiData.objects; // Original API format
        } else if (Array.isArray(apiData)) {
          contestObjects = apiData; // Alternative API format
        } else if (apiData && apiData.result && Array.isArray(apiData.result)) {
          contestObjects = apiData.result; // Codeforces API format
        }

        const activeContests = [];
        const upcomingContests = [];

        for (let item of contestObjects) {
          try {
            // Handle different API response formats
            const host = item.host || item.site || "";
            const contestName =
              item.event || item.name || item.title || "Contest";
            const startTime =
              item.start || item.startTimeSeconds || item.start_time;
            const duration = item.duration || item.durationSeconds || 3600;
            const contestUrl = item.href || item.url || item.link || "#";

            // Filter for specific platforms
            const isValidPlatform =
              host === "atcoder.jp" ||
              host === "leetcode.com" ||
              host === "codechef.com" ||
              host === "codeforces.com" ||
              host === "geeksforgeeks.org" ||
              contestName.toLowerCase().includes("codeforces") ||
              contestName.toLowerCase().includes("leetcode") ||
              contestName.toLowerCase().includes("codechef") ||
              contestName.toLowerCase().includes("atcoder");

            if (isValidPlatform) {
              // Handle duration conversion
              let modifiedDuration;
              if (typeof duration === "number") {
                modifiedDuration = duration > 1000 ? duration / 60 : duration;
              } else {
                modifiedDuration = 120; // Default 2 hours
              }

              const currentDate = new Date();
              let inputDate;

              // Handle different date formats
              if (typeof startTime === "number") {
                inputDate = new Date(
                  startTime > 1000000000000 ? startTime : startTime * 1000
                );
              } else {
                inputDate = new Date(startTime);
              }

              // Skip invalid dates
              if (isNaN(inputDate.getTime())) {
                continue;
              }

              const options = {
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              };
              const formattedDate = inputDate.toLocaleString(
                undefined,
                options
              );

              // Determine image source
              let imageSrc;
              const hostLower = host.toLowerCase();
              const nameLower = contestName.toLowerCase();

              if (
                hostLower.includes("atcoder") ||
                nameLower.includes("atcoder")
              ) {
                imageSrc = AtcoderImage;
              } else if (
                hostLower.includes("leetcode") ||
                nameLower.includes("leetcode")
              ) {
                imageSrc = LeetcodeImage;
              } else if (
                hostLower.includes("codechef") ||
                nameLower.includes("codechef")
              ) {
                imageSrc = CodechefImage;
              } else if (
                hostLower.includes("codeforces") ||
                nameLower.includes("codeforces")
              ) {
                imageSrc = CodeforcesImage;
              } else if (
                hostLower.includes("geeksforgeeks") ||
                nameLower.includes("gfg")
              ) {
                imageSrc = GFGImage;
              } else {
                imageSrc = DefaultImage;
              }

              const contestItem = {
                imageName: host,
                link: contestUrl,
                name: contestName,
                startingTime: formattedDate,
                duration: modifiedDuration,
                imageSrc: imageSrc,
              };

              const contestEndTime =
                inputDate.getTime() + modifiedDuration * 60 * 1000;
              if (currentDate.getTime() < contestEndTime) {
                if (currentDate.getTime() >= inputDate.getTime()) {
                  activeContests.push(contestItem);
                } else {
                  upcomingContests.push(contestItem);
                }
              }
            }
          } catch (itemError) {
            console.warn("Error processing contest item:", itemError);
            continue;
          }
        }

        // Cache the external contests data
        const externalContestsData = {
          activeContests,
          upcomingContests,
        };
        setCachedData(
          EXTERNAL_CACHE_KEY,
          EXTERNAL_TIMESTAMP_KEY,
          externalContestsData
        );

        setActiveContests(activeContests);
        setUpcomingContests(upcomingContests);
      } catch (error) {
        console.error(
          "An error occurred while fetching external contests:",
          error
        );
        setActiveContests([]);
        setUpcomingContests([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchListings();
    getOtherContest();
  }, []);

  const CollapsibleSection = ({
    title,
    isOpen,
    setIsOpen,
    children,
    count = 0,
  }) => (
    <div className="bg-white dark:bg-[#121620] shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl">
      <div
        className="flex items-center justify-between p-4 md:p-6 cursor-pointer bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#1a2332] dark:to-[#1c2432] hover:from-blue-100 hover:to-indigo-100 dark:hover:from-[#1c2432] dark:hover:to-[#1e2634] transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-3">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          {count > 0 && (
            <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs md:text-sm font-medium">
              {count}
            </span>
          )}
        </div>
        <div className="text-blue-600 dark:text-blue-400 transition-transform duration-200">
          {isOpen ? (
            <AiOutlineUp className="w-5 h-5 md:w-6 md:h-6" />
          ) : (
            <AiOutlineDown className="w-5 h-5 md:w-6 md:h-6" />
          )}
        </div>
      </div>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen
            ? "max-h-none opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="p-4 md:p-6 pt-0">{children}</div>
      </div>
    </div>
  );

  const ContestSubSection = ({ title, contests, status, color = "blue" }) => {
    if (contests.length === 0) return null;

    const colorClasses = {
      green: "text-green-600 dark:text-green-400",
      blue: "text-blue-600 dark:text-blue-400",
      gray: "text-gray-600 dark:text-gray-400",
    };

    return (
      <div className="mb-6 last:mb-0">
        <h3
          className={`text-lg md:text-xl font-semibold ${colorClasses[color]} mb-4 flex items-center`}
        >
          <span
            className={`w-2 h-2 rounded-full mr-2 ${
              status === "Active"
                ? "bg-green-500 animate-pulse"
                : status === "Upcoming"
                ? "bg-blue-500"
                : "bg-gray-400"
            }`}
          ></span>
          {title}
          <span className="ml-2 text-sm text-gray-500">
            ({contests.length})
          </span>
        </h3>
        <div className="space-y-3">
          {contests.map((contest, index) => (
            <div
              key={contest.id || index}
              className="transform transition-all duration-200 hover:scale-[1.02]"
            >
              <ContestCard
                contest={contest.data || contest}
                id={contest.id}
                status={status}
                imageSrc={contest.imageSrc}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Cache status indicator for development/debugging
  const CacheStatusIndicator = () => {
    const ccpdCached = isCacheValid(CCPD_TIMESTAMP_KEY, CCPD_CACHE_DURATION);
    const externalCached = isCacheValid(
      EXTERNAL_TIMESTAMP_KEY,
      EXTERNAL_CACHE_DURATION
    );

    return (
      <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 text-xs border border-gray-200 dark:border-gray-700 opacity-75 hover:opacity-100 transition-opacity">
        <div className="flex items-center space-x-2">
          <span
            className={`w-2 h-2 rounded-full ${
              ccpdCached ? "bg-green-500" : "bg-red-500"
            }`}
          ></span>
          <span className="text-gray-600 dark:text-gray-400">CCPD</span>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`w-2 h-2 rounded-full ${
              externalCached ? "bg-green-500" : "bg-red-500"
            }`}
          ></span>
          <span className="text-gray-600 dark:text-gray-400">External</span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-blue-100 dark:bg-[#050b15] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Dna visible={true} height="80" width="80" ariaLabel="dna-loading" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading contests...
          </p>
        </div>
      </div>
    );
  }

  const totalUpcoming = upcomingContests.length + activeContests.length;
  const totalCCPD =
    Listings.active.length + Listings.upcoming.length + Listings.past.length;

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-[#050b15] dark:via-[#0a1020] dark:to-[#0f1419] min-h-screen font-sans">
      <div className="container mx-auto px-4 py-3 md:py-6 space-y-4 md:space-y-6 max-w-7xl">
        {/* Page Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Coding Contests...
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover and participate in coding contests from top platforms
          </p>
        </div>

        {/* Upcoming Contests Section (Other Platforms) */}
        <CollapsibleSection
          title="Upcoming Contests"
          isOpen={isUpcomingOpen}
          setIsOpen={setIsUpcomingOpen}
          count={totalUpcoming}
        >
          <ContestSubSection
            title="Active Contests"
            contests={activeContests}
            status="Active"
            color="green"
          />
          <ContestSubSection
            title="Upcoming Contests"
            contests={upcomingContests}
            status="Upcoming"
            color="blue"
          />
          {totalUpcoming === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No upcoming contests available
              </p>
            </div>
          )}
        </CollapsibleSection>

        {/* CCPD Contests Section */}
        <CollapsibleSection
          title="CCPD Contests"
          isOpen={isCCPDOpen}
          setIsOpen={setIsCCPDOpen}
          count={totalCCPD}
        >
          <ContestSubSection
            title="Active Contests"
            contests={Listings.active}
            status="Active"
            color="green"
          />
          <ContestSubSection
            title="Upcoming Contests"
            contests={Listings.upcoming}
            status="Upcoming"
            color="blue"
          />
          <ContestSubSection
            title="Past Contests"
            contests={Listings.past}
            status="Past"
            color="gray"
          />
          {totalCCPD === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No CCPD contests available
              </p>
            </div>
          )}
        </CollapsibleSection>
      </div>

      {/* Cache Status Indicator (remove in production) */}
      {process.env.NODE_ENV === "development" && <CacheStatusIndicator />}
    </div>
  );
}
