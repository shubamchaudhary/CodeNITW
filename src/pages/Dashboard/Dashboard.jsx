import { getAuth, updateProfile } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  collection,
  deleteDoc,
  addDoc,
  doc,
  getDocs,
  getDoc,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "react-toastify";
import PerformanceChart from "./PerformanceChart";
import CryptoJS from "crypto-js";
import { CopyToClipboard } from "react-copy-to-clipboard";

export default function Dashboard() {
  const [data, setData] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user ? user.displayName : "",
    email: user ? user.email : "",
  });

  const { name, email } = formData;

  const secretKey = "gNyWB0zvLYtmhf0vNhY33nZ5m1epu7J1";
  const ciphertext = CryptoJS.AES.encrypt(user.email, secretKey).toString();

  // Cache configuration for chart data
  const CHART_CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

  const getChartCacheKey = (handle) => `chart_data_${handle}`;
  const getChartTimestampKey = (handle) => `chart_timestamp_${handle}`;

  const isChartCacheValid = (handle) => {
    try {
      const timestamp = localStorage.getItem(getChartTimestampKey(handle));
      if (!timestamp) return false;

      const cacheTime = parseInt(timestamp);
      const now = Date.now();
      return now - cacheTime < CHART_CACHE_DURATION;
    } catch (error) {
      console.error("Error checking chart cache validity:", error);
      return false;
    }
  };

  const getCachedChartData = (handle) => {
    try {
      const cachedData = localStorage.getItem(getChartCacheKey(handle));
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      console.error("Error getting cached chart data:", error);
      return null;
    }
  };

  const setCachedChartData = (handle, data) => {
    try {
      localStorage.setItem(getChartCacheKey(handle), JSON.stringify(data));
      localStorage.setItem(getChartTimestampKey(handle), Date.now().toString());
    } catch (error) {
      console.error("Error setting cached chart data:", error);
    }
  };

  useEffect(() => {
    async function fetchContestRanks() {
      try {
        const userCollectionRef = collection(db, "users");
        const userDocRef = doc(userCollectionRef, auth.currentUser.uid);
        const userDocSnapshot = await getDoc(userDocRef);
        const userDocData = userDocSnapshot.data();
        setFormData({
          name: userDocData.name || "",
          email: userDocData.email || "",
          rollno: userDocData.rollno || "",
          course: userDocData.course || "",
          year: userDocData.year || "",
          cfhandle: userDocData.cfhandle || "",
          lchandle: userDocData.lchandle || "",
        });

        // Load chart data with caching
        if (userDocData.cfhandle) {
          await loadChartData(userDocData.cfhandle);
        }
      } catch (error) {
        console.error("Error fetching contest ranks:", error);
      }
    }
    fetchContestRanks();
  }, [auth.currentUser]);

  const loadChartData = async (cfhandle) => {
    // Check cache first
    if (isChartCacheValid(cfhandle)) {
      const cachedData = getCachedChartData(cfhandle);
      if (cachedData) {
        console.log(`📊 Loading chart data for ${cfhandle} from cache`);
        setData(cachedData);
        return;
      }
    }

    console.log(`🔄 Fetching fresh chart data for ${cfhandle}`);
    // Fetch fresh data
    try {
      const contestRanksCollectionRef = collection(db, "contestRanks");
      const orderedQuery = query(
        contestRanksCollectionRef,
        orderBy("contestDate")
      );
      const querySnapshot = await getDocs(orderedQuery);

      const chartData = Array.from({ length: querySnapshot.size }, () => ({
        x: null,
        y: null,
      }));
      let index = 0;

      querySnapshot.forEach((doc) => {
        const contestRanks = doc.data();
        const ranks = contestRanks.ranks;
        const date = new Date(contestRanks.contestDate * 1000);
        chartData[index].x = date;

        for (let rankItem of ranks) {
          if (rankItem.userId === cfhandle) {
            chartData[index].y = rankItem.rank;
            break;
          }
        }
        index++;
      });

      // Cache the data
      setCachedChartData(cfhandle, chartData);
      setData(chartData);
    } catch (error) {
      console.error("Error fetching contest ranks:", error);
    }
  };

  const [editing, setEditing] = useState(false);

  const handleInputChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    try {
      const userCollectionRef = collection(db, "users");
      const userDocRef = doc(userCollectionRef, auth.currentUser.uid);
      let updateData = {};
      if (formData.cfhandle) {
        updateData.cfhandle = formData.cfhandle;
      }
      if (formData.lchandle) {
        updateData.lchandle = formData.lchandle;
      }

      if (Object.keys(updateData).length > 0) {
        await updateDoc(userDocRef, updateData);

        // If codeforces handle changed, reload chart data
        if (updateData.cfhandle) {
          await loadChartData(updateData.cfhandle);
        }

        toast.success("Handles updated successfully!");
        setEditing(false);
      }
    } catch (error) {
      console.error("Error updating handles:", error);
      toast.error("Error updating handles.");
    }
  };

  return (
    <div className="px-[20px] dark:bg-[#050b15] bg-blue-100 min-h-screen font-serif">
      <div className="pt-10">
        {/* Profile Section - Header Style */}
        <div className="max-w-6xl mx-auto mb-8">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-4 text-white rounded-t-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-2xl font-bold">{name}</h1>
                  <p className="text-blue-100">
                    {formData.course} • {formData.year} Year
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setEditing(!editing)}
                  className="bg-[#5e8fde] text-white px-3 py-1 rounded"
                >
                  Edit Handles
                </button>

                <CopyToClipboard
                  text={`${window.location.origin}/Profile/${ciphertext}`}
                  onCopy={() =>
                    toast.success("Profile Link has been copied to Clipboard")
                  }
                >
                  <button className="bg-[#5e8fde] text-white px-3 py-1 rounded">
                    Share Profile
                  </button>
                </CopyToClipboard>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="bg-white dark:bg-[#121620] px-6 py-4 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-lg shadow-lg">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Name:
                </span>
                <p className="text-blue-400 font-semibold">{formData.name}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Roll No:
                </span>
                <p className="text-blue-400 font-semibold">{formData.rollno}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Course:
                </span>
                <p className="text-blue-400 font-semibold">{formData.course}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Codeforces:
                </span>
                <p className="text-blue-400 font-semibold">
                  {formData.cfhandle}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Leetcode:
                </span>
                <p className="text-blue-400 font-semibold">
                  {formData.lchandle}
                </p>
              </div>
            </div>

            {editing && (
              <form onSubmit={handleFormSubmit} className="mt-4">
                <input
                  type="text"
                  name="cfhandle"
                  value={formData.cfhandle}
                  onChange={handleInputChange}
                  placeholder="Codeforces Handle"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                <input
                  type="text"
                  name="lchandle"
                  value={formData.lchandle}
                  onChange={handleInputChange}
                  placeholder="Leetcode Handle"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mt-4"
                />
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-700 text-white mr-2 my-2 px-2 py-1 rounded mb-2"
                >
                  Submit
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Performance Chart Section - 2x bigger with title at bottom */}
        <section className="max-w-6xl mx-auto flex justify-center items-center flex-col">
          <div className="w-full bg-white dark:bg-[#121620] shadow-2xl rounded-lg p-6">
            <div className="h-full w-full">
              <PerformanceChart name={name} data={data} />
            </div>
            {/* Chart title moved to bottom */}
            <h2 className="text-2xl dark:text-gray-400 text-center mt-4 cursive">
              {name}'s Performance Chart
            </h2>
          </div>
        </section>
      </div>
    </div>
  );
}
