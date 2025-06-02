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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Profile Section - Header Style */}
        <div className="mb-8">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-6 text-white rounded-t-2xl shadow-lg">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold">{name?.charAt(0)}</span>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">{name}</h1>
                  <p className="text-blue-100 text-sm md:text-base">
                    {formData.course} • {formData.year} Year
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setEditing(!editing)}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20"
                >
                  {editing ? "Cancel" : "Edit Handles"}
                </button>

                <CopyToClipboard
                  text={`${window.location.origin}/Profile/${ciphertext}`}
                  onCopy={() =>
                    toast.success("Profile Link has been copied to Clipboard")
                  }
                >
                  <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200 backdrop-blur-sm border border-white/20">
                    Share Profile
                  </button>
                </CopyToClipboard>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="bg-white dark:bg-slate-800 px-6 py-6 border-x border-b border-gray-200 dark:border-slate-600 rounded-b-2xl shadow-lg">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </span>
                <p className="text-blue-600 dark:text-blue-400 font-semibold text-sm md:text-base">
                  {formData.name}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Roll No
                </span>
                <p className="text-blue-600 dark:text-blue-400 font-semibold text-sm md:text-base">
                  {formData.rollno}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Course
                </span>
                <p className="text-blue-600 dark:text-blue-400 font-semibold text-sm md:text-base">
                  {formData.course}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Codeforces
                </span>
                <p className="text-blue-600 dark:text-blue-400 font-semibold text-sm md:text-base">
                  {formData.cfhandle || "Not set"}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Leetcode
                </span>
                <p className="text-blue-600 dark:text-blue-400 font-semibold text-sm md:text-base">
                  {formData.lchandle || "Not set"}
                </p>
              </div>
            </div>

            {editing && (
              <form onSubmit={handleFormSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Codeforces Handle
                    </label>
                    <input
                      type="text"
                      name="cfhandle"
                      value={formData.cfhandle}
                      onChange={handleInputChange}
                      placeholder="Enter your Codeforces handle"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Leetcode Handle
                    </label>
                    <input
                      type="text"
                      name="lchandle"
                      value={formData.lchandle}
                      onChange={handleInputChange}
                      placeholder="Enter your Leetcode handle"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white transition-colors"
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-600 dark:hover:bg-slate-500 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Performance Chart Section */}
        <section className="flex justify-center items-center flex-col">
          <div className="w-full bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-slate-600">
            <div className="h-[500px] md:h-[600px] w-full">
              <PerformanceChart
                name={name}
                data={data}
                handle={formData.cfhandle}
              />
            </div>
            {/* Chart title */}
            <h2 className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 text-center mt-6 font-semibold">
              {name}'s Performance Chart
            </h2>
          </div>
        </section>
      </div>
    </div>
  );
}
