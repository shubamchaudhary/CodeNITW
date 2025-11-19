import React, { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import "chartjs-adapter-date-fns";
import { FaSync, FaChartBar, FaSave } from "react-icons/fa";
import { getAuth } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";

const DailySolvedChart = () => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [chartData, setChartData] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);

  // Load data from localStorage on mount, seed if needed
  useEffect(() => {
    const existingData = localStorage.getItem("DailySolvedProgress");
    if (!existingData || JSON.parse(existingData).length === 0) {
      // Seed with historical data - 94 questions over last 25 days
      seedHistoricalData();
    } else {
      loadLocalData();
    }
  }, []);

  const seedHistoricalData = () => {
    const totalQuestions = 94;
    const days = 25;
    const data = [];

    // Generate random distribution (0-8 per day) that sums to 94
    let remaining = totalQuestions;
    const dailyAmounts = [];

    for (let i = 0; i < days - 1; i++) {
      // Calculate max we can assign (ensure we can still distribute remaining)
      const maxForDay = Math.min(8, remaining - (days - i - 1) * 0);
      const minForDay = Math.max(0, remaining - (days - i - 1) * 8);

      // Random amount between min and max
      const amount = Math.floor(Math.random() * (maxForDay - minForDay + 1)) + minForDay;
      dailyAmounts.push(amount);
      remaining -= amount;
    }
    // Last day gets whatever is remaining
    dailyAmounts.push(remaining);

    // Shuffle the amounts to make it more random
    for (let i = dailyAmounts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dailyAmounts[i], dailyAmounts[j]] = [dailyAmounts[j], dailyAmounts[i]];
    }

    // Create date entries for last 25 days
    let runningTotal = 0;
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const solvedToday = dailyAmounts[days - 1 - i];
      runningTotal += solvedToday;

      data.push({
        date: dateStr,
        totalSolved: runningTotal,
        solvedToday: solvedToday,
      });
    }

    localStorage.setItem("DailySolvedProgress", JSON.stringify(data));
    setChartData(data);
    setHasUnsyncedChanges(true);
  };

  // Calculate and update chart when solved questions change
  useEffect(() => {
    const handleStorageChange = () => {
      updateDailyProgress();
    };

    // Listen for localStorage changes
    window.addEventListener("storage", handleStorageChange);

    // Also update when component mounts
    updateDailyProgress();

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Render chart when data changes
  useEffect(() => {
    renderChart();
  }, [chartData]);

  const loadLocalData = () => {
    try {
      const saved = localStorage.getItem("DailySolvedProgress");
      if (saved) {
        const data = JSON.parse(saved);
        setChartData(data);
      }
    } catch (error) {
      console.error("Error loading local progress data:", error);
    }
  };

  const updateDailyProgress = () => {
    try {
      // Get current solved questions
      const solvedQuestions = JSON.parse(
        localStorage.getItem("PersonalDSASolvedQuestions") || "{}"
      );
      const solvedCount = Object.values(solvedQuestions).filter((v) => v).length;

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];

      // Load existing data
      const existingData = JSON.parse(
        localStorage.getItem("DailySolvedProgress") || "[]"
      );

      // If no data exists, don't update (wait for seed)
      if (existingData.length === 0) {
        return;
      }

      // Find today's entry
      const todayIndex = existingData.findIndex((entry) => entry.date === today);

      if (todayIndex >= 0) {
        // Get yesterday's total (or 0 if today is the first day)
        const yesterdayTotal = todayIndex > 0
          ? existingData[todayIndex - 1].totalSolved
          : 0;

        // Calculate how many solved today based on actual current count
        const solvedToday = Math.max(0, solvedCount - yesterdayTotal);

        // Only update if there's a change
        if (existingData[todayIndex].totalSolved !== solvedCount) {
          existingData[todayIndex] = {
            date: today,
            totalSolved: solvedCount,
            solvedToday: solvedToday,
          };
          setHasUnsyncedChanges(true);

          // Save to localStorage
          localStorage.setItem("DailySolvedProgress", JSON.stringify(existingData));
          setChartData(existingData);
        }
      } else {
        // Today doesn't exist in data yet - add new entry
        const previousTotal =
          existingData.length > 0
            ? existingData[existingData.length - 1].totalSolved
            : 0;
        const solvedToday = Math.max(0, solvedCount - previousTotal);

        existingData.push({
          date: today,
          totalSolved: solvedCount,
          solvedToday: solvedToday,
        });
        setHasUnsyncedChanges(true);

        // Save to localStorage
        localStorage.setItem("DailySolvedProgress", JSON.stringify(existingData));
        setChartData(existingData);
      }
    } catch (error) {
      console.error("Error updating daily progress:", error);
    }
  };

  const renderChart = () => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (!chartRef.current || chartData.length === 0) {
      return;
    }

    const ctx = chartRef.current.getContext("2d");

    // Prepare data for chart - show problems solved per day
    const formattedData = chartData.map((entry) => ({
      x: new Date(entry.date),
      y: entry.solvedToday,
    }));

    // Detect theme for colors
    const isDarkMode = document.documentElement.classList.contains("dark");
    const legendColor = isDarkMode ? "#e5e7eb" : "#374151";
    const titleColor = isDarkMode ? "#9ca3af" : "#6b7280";
    const gridColor = isDarkMode ? "#374151" : "#e5e7eb";
    const tickColor = isDarkMode ? "#9ca3af" : "#6b7280";

    // Create gradient for bars
    const barGradient = ctx.createLinearGradient(0, ctx.canvas.height, 0, 0);
    barGradient.addColorStop(0, "rgba(139, 92, 246, 0.3)");
    barGradient.addColorStop(1, "rgba(139, 92, 246, 0.8)");

    // Create gradient for line area
    const lineGradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    lineGradient.addColorStop(0, "rgba(34, 197, 94, 0.4)");
    lineGradient.addColorStop(1, "rgba(34, 197, 94, 0.05)");

    // Prepare cumulative data for line
    const cumulativeData = chartData.map((entry) => ({
      x: new Date(entry.date),
      y: entry.totalSolved,
    }));

    // Prepare benchmark/target data (4 for weekdays, 6 for weekends)
    let benchmarkTotal = 0;
    const benchmarkData = chartData.map((entry) => {
      const date = new Date(entry.date);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const target = isWeekend ? 6 : 4;
      benchmarkTotal += target;
      return {
        x: date,
        y: benchmarkTotal,
      };
    });

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        datasets: [
          {
            label: "Daily Solved",
            data: formattedData,
            backgroundColor: barGradient,
            borderColor: "#8b5cf6",
            borderWidth: 2,
            borderRadius: 4,
            hoverBackgroundColor: "#7c3aed",
            yAxisID: "y",
            order: 3,
            barPercentage: 1.0,
            categoryPercentage: 1.0,
          },
          {
            label: "Total Progress",
            data: cumulativeData,
            type: "line",
            borderColor: "#22c55e",
            backgroundColor: lineGradient,
            borderWidth: 4,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "#22c55e",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            yAxisID: "y1",
            order: 2,
          },
          {
            label: "Target",
            data: benchmarkData,
            type: "line",
            borderColor: "#22c55e",
            backgroundColor: "transparent",
            borderWidth: 4,
            borderDash: [8, 4],
            fill: false,
            tension: 0.4,
            pointBackgroundColor: "#22c55e",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1,
            pointRadius: 3,
            pointHoverRadius: 5,
            yAxisID: "y1",
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            left: 10,
            right: 10,
            top: 10,
            bottom: 10,
          },
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              color: legendColor,
              font: {
                size: window.innerWidth < 768 ? 12 : 14,
                weight: "500",
              },
              padding: window.innerWidth < 768 ? 10 : 20,
              usePointStyle: true,
              pointStyle: "rect",
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            borderColor: "#8b5cf6",
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            titleFont: {
              size: window.innerWidth < 768 ? 12 : 14,
              weight: "600",
            },
            bodyFont: {
              size: window.innerWidth < 768 ? 11 : 13,
            },
            padding: window.innerWidth < 768 ? 8 : 12,
            callbacks: {
              title: function (context) {
                const date = new Date(context[0].parsed.x);
                return date.toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });
              },
              label: function (context) {
                if (context.dataset.label === "Total Progress") {
                  return `Total: ${context.parsed.y} problems`;
                }
                if (context.dataset.label === "Target") {
                  return `Target: ${context.parsed.y} problems`;
                }
                return `Daily: ${context.parsed.y} problems`;
              },
            },
          },
        },
        scales: {
          x: {
            type: "time",
            time: {
              unit: "day",
              displayFormats: {
                day: window.innerWidth < 768 ? "MM/dd" : "MMM dd",
              },
            },
            title: {
              display: true,
              text: "Date",
              color: titleColor,
              font: {
                size: window.innerWidth < 768 ? 10 : 12,
                weight: "500",
              },
            },
            grid: {
              color: gridColor,
              lineWidth: 1,
            },
            ticks: {
              color: tickColor,
              font: {
                size: window.innerWidth < 768 ? 9 : 11,
              },
              maxTicksLimit: window.innerWidth < 768 ? 5 : 10,
              maxRotation: window.innerWidth < 768 ? 45 : 0,
            },
          },
          y: {
            beginAtZero: true,
            position: "left",
            title: {
              display: true,
              text: "Daily Solved",
              color: "#8b5cf6",
              font: {
                size: window.innerWidth < 768 ? 10 : 12,
                weight: "500",
              },
            },
            grid: {
              color: gridColor,
              lineWidth: 1,
            },
            ticks: {
              color: "#8b5cf6",
              font: {
                size: window.innerWidth < 768 ? 9 : 11,
              },
              stepSize: 1,
            },
          },
          y1: {
            beginAtZero: true,
            position: "right",
            title: {
              display: true,
              text: "Total Progress",
              color: "#22c55e",
              font: {
                size: window.innerWidth < 768 ? 10 : 12,
                weight: "500",
              },
            },
            grid: {
              drawOnChartArea: false,
            },
            ticks: {
              color: "#22c55e",
              font: {
                size: window.innerWidth < 768 ? 9 : 11,
              },
            },
          },
        },
        animation: {
          duration: 1000,
          easing: "easeInOutQuart",
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  };

  const syncToDatabase = async () => {
    const auth = getAuth();
    if (!auth.currentUser) {
      toast.error("Please log in to sync your progress");
      return;
    }

    setIsSyncing(true);
    try {
      const docRef = doc(db, "user_daily_solved_progress", auth.currentUser.uid);
      await setDoc(docRef, {
        userId: auth.currentUser.uid,
        progressData: chartData,
        lastSynced: serverTimestamp(),
      });

      setHasUnsyncedChanges(false);
      toast.success("Daily progress synced to cloud!");
    } catch (error) {
      console.error("Error syncing to database:", error);
      toast.error("Failed to sync progress");
    } finally {
      setIsSyncing(false);
    }
  };

  const loadFromDatabase = async () => {
    const auth = getAuth();
    if (!auth.currentUser) {
      toast.error("Please log in to load your progress");
      return;
    }

    setIsLoading(true);
    try {
      const docRef = doc(db, "user_daily_solved_progress", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const progressData = data.progressData || [];

        // Merge with local data (keep newer entries)
        const localData = JSON.parse(
          localStorage.getItem("DailySolvedProgress") || "[]"
        );

        // Create a map of dates for quick lookup
        const dataMap = new Map();

        // First add all cloud data
        progressData.forEach((entry) => {
          dataMap.set(entry.date, entry);
        });

        // Then merge with local data (local takes precedence for same date)
        localData.forEach((entry) => {
          const existing = dataMap.get(entry.date);
          if (!existing || entry.totalSolved > existing.totalSolved) {
            dataMap.set(entry.date, entry);
          }
        });

        // Convert back to array and sort by date
        const mergedData = Array.from(dataMap.values()).sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        // Save merged data
        localStorage.setItem("DailySolvedProgress", JSON.stringify(mergedData));
        setChartData(mergedData);
        setHasUnsyncedChanges(false);

        toast.success(`Daily progress loaded! (${mergedData.length} days)`);
      } else {
        toast.info("No saved progress found in cloud");
      }
    } catch (error) {
      console.error("Error loading from database:", error);
      toast.error("Failed to load progress");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const totalSolved = chartData.length > 0
    ? chartData[chartData.length - 1].totalSolved
    : 0;
  const averagePerDay = chartData.length > 0
    ? (chartData.reduce((sum, entry) => sum + entry.solvedToday, 0) / chartData.length).toFixed(1)
    : 0;
  const maxInDay = chartData.length > 0
    ? Math.max(...chartData.map((entry) => entry.solvedToday))
    : 0;
  const totalDays = chartData.length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FaChartBar className="text-2xl text-purple-600 dark:text-purple-400 mr-3" />
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              Daily Progress Chart
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track your problem-solving journey
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadFromDatabase}
            disabled={isLoading}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm"
            title="Load from cloud"
          >
            <FaSync className={isLoading ? "animate-spin mr-1" : "mr-1"} />
            Load
          </button>
          <button
            onClick={syncToDatabase}
            disabled={isSyncing}
            className={`flex items-center px-3 py-2 rounded-lg transition disabled:opacity-50 text-sm ${
              hasUnsyncedChanges
                ? "bg-orange-600 hover:bg-orange-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
            title="Save to cloud"
          >
            <FaSave className={isSyncing ? "animate-spin mr-1" : "mr-1"} />
            {hasUnsyncedChanges ? "Save" : "Saved"}
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg">
          <p className="text-xs text-purple-600 dark:text-purple-400">Total Solved</p>
          <p className="text-xl font-bold text-purple-800 dark:text-purple-300">
            {totalSolved}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
          <p className="text-xs text-blue-600 dark:text-blue-400">Avg/Day</p>
          <p className="text-xl font-bold text-blue-800 dark:text-blue-300">
            {averagePerDay}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
          <p className="text-xs text-green-600 dark:text-green-400">Best Day</p>
          <p className="text-xl font-bold text-green-800 dark:text-green-300">
            {maxInDay}
          </p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-lg">
          <p className="text-xs text-orange-600 dark:text-orange-400">Days Active</p>
          <p className="text-xl font-bold text-orange-800 dark:text-orange-300">
            {totalDays}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-96 md:h-[30rem]">
        {chartData.length > 0 ? (
          <canvas ref={chartRef} className="w-full h-full"></canvas>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <FaChartBar className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                No progress data yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Start solving problems to see your progress!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info text */}
      {chartData.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-3 text-center">
          This chart shows your daily problem-solving activity. Data persists across plan changes.
        </p>
      )}
    </div>
  );
};

export default DailySolvedChart;
