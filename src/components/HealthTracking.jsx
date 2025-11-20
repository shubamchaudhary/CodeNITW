import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Chart } from "chart.js/auto";
import {
  FaHeart,
  FaAppleAlt,
  FaBed,
  FaDumbbell,
  FaSave,
  FaSync,
  FaDownload,
  FaCalendarAlt,
  FaChartBar,
} from "react-icons/fa";
import { toast } from "react-toastify";
import healthTrackingService from "../services/HealthTrackingService";

const HealthTracking = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entry, setEntry] = useState({
    meals: {},
    food: {},
    sleep: { bedTime: "", wakeTime: "" },
    gym: { attended: false, duration: 0, exercises: [], note: "" },
  });
  const [stats, setStats] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState(7);

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    loadEntry();
    loadStats();
  }, [selectedDate]);

  useEffect(() => {
    loadStats();
  }, [statsPeriod]);

  useEffect(() => {
    if (stats) {
      renderChart();
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [stats]);

  // Listen for updates
  useEffect(() => {
    const handleUpdate = () => {
      loadEntry();
      loadStats();
    };

    window.addEventListener("healthTrackingUpdated", handleUpdate);
    return () => window.removeEventListener("healthTrackingUpdated", handleUpdate);
  }, [selectedDate, statsPeriod]);

  const loadEntry = () => {
    const data = healthTrackingService.getEntry(selectedDate);
    setEntry(data);
  };

  const loadStats = () => {
    const statistics = healthTrackingService.getHealthStats(statsPeriod);
    setStats(statistics);
  };

  const handleMealChange = (mealId, value) => {
    const newEntry = { ...entry };
    newEntry.meals[mealId] = value;
    setEntry(newEntry);
  };

  const saveMeal = (mealId) => {
    const details = entry.meals[mealId] || "";
    healthTrackingService.updateMeal(selectedDate, mealId, details);
    toast.success("Meal saved!");
  };

  const handleFoodChange = (foodId, field, value) => {
    const newEntry = { ...entry };
    if (!newEntry.food[foodId]) {
      newEntry.food[foodId] = { checked: false, note: "" };
    }
    newEntry.food[foodId][field] = value;
    setEntry(newEntry);
  };

  const saveFoodItem = (foodId) => {
    const foodData = entry.food[foodId] || { checked: false, note: "" };
    healthTrackingService.updateFood(selectedDate, foodId, foodData.checked, foodData.note);
    toast.success("Food item saved!");
  };

  const handleSleepChange = (field, value) => {
    const newSleep = { ...entry.sleep, [field]: value };
    setEntry(prev => ({ ...prev, sleep: newSleep }));
  };

  const saveSleep = () => {
    healthTrackingService.updateSleep(selectedDate, entry.sleep.bedTime, entry.sleep.wakeTime);
    toast.success("Sleep schedule saved!");
  };

  const handleGymChange = (field, value) => {
    const newGym = { ...entry.gym, [field]: value };
    setEntry(prev => ({ ...prev, gym: newGym }));
  };

  const toggleExercise = (exercise) => {
    const exercises = entry.gym.exercises || [];
    const newExercises = exercises.includes(exercise)
      ? exercises.filter(e => e !== exercise)
      : [...exercises, exercise];

    handleGymChange("exercises", newExercises);
  };

  const saveGym = () => {
    healthTrackingService.updateGym(
      selectedDate,
      entry.gym.attended,
      entry.gym.duration,
      entry.gym.exercises,
      entry.gym.note
    );
    toast.success("Gym session saved!");
  };

  const handleSync = async () => {
    setIsSyncing(true);
    const result = await healthTrackingService.syncToFirebase();
    if (result.success) {
      toast.success("Health data synced to cloud!");
    } else {
      toast.error("Failed to sync: " + result.error);
    }
    setIsSyncing(false);
  };

  const handleLoad = async () => {
    setIsSyncing(true);
    const result = await healthTrackingService.loadFromFirebase();
    if (result.success) {
      toast.success("Health data loaded from cloud!");
      loadEntry();
      loadStats();
    } else {
      toast.error("Failed to load: " + result.error);
    }
    setIsSyncing(false);
  };

  const renderChart = () => {
    if (!chartRef.current || !stats) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");

    // Prepare data for multiple metrics
    const datasets = [
      {
        label: "Sleep Hours",
        data: [stats.averageSleep || 0],
        backgroundColor: "#3b82f6",
        borderColor: "#2563eb",
        borderWidth: 2,
      },
      {
        label: "Sleep Target",
        data: [8], // 8 hours target
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "#2563eb",
        borderWidth: 2,
        borderDash: [5, 5],
      },
      {
        label: "Gym Days",
        data: [stats.gymDays || 0],
        backgroundColor: "#f97316",
        borderColor: "#ea580c",
        borderWidth: 2,
      },
      {
        label: "Gym Target",
        data: [statsPeriod >= 7 ? 5 : 1], // 5 days per week
        backgroundColor: "rgba(249, 115, 22, 0.2)",
        borderColor: "#ea580c",
        borderWidth: 2,
        borderDash: [5, 5],
      },
      {
        label: "Avg Gym Duration (min)",
        data: [(stats.avgGymDuration || 0) / 10], // Scale down to fit
        backgroundColor: "#10b981",
        borderColor: "#059669",
        borderWidth: 2,
      },
      {
        label: "Duration Target",
        data: [6], // 60 min target (scaled to 6)
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        borderColor: "#059669",
        borderWidth: 2,
        borderDash: [5, 5],
      },
    ];

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Sleep (hrs)", "Gym (days)", "Duration (×10 min)"],
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: document.documentElement.classList.contains("dark") ? "#e5e7eb" : "#1f2937",
              filter: (item) => !item.text.includes("Target"), // Hide target from legend
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                let label = context.dataset.label || "";
                if (label.includes("Duration")) {
                  return `${label}: ${context.parsed.y * 10} min`;
                }
                return `${label}: ${context.parsed.y}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: document.documentElement.classList.contains("dark") ? "#e5e7eb" : "#1f2937",
            },
            grid: {
              color: document.documentElement.classList.contains("dark") ? "#374151" : "#e5e7eb",
            },
          },
          x: {
            ticks: {
              color: document.documentElement.classList.contains("dark") ? "#e5e7eb" : "#1f2937",
            },
            grid: {
              color: document.documentElement.classList.contains("dark") ? "#374151" : "#e5e7eb",
            },
          },
        },
      },
    });
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getFoodValue = (foodId, field) => {
    const food = entry.food[foodId];
    if (!food) return field === 'checked' ? false : "";
    if (typeof food === 'object') {
      return food[field] || (field === 'checked' ? false : "");
    }
    return field === 'checked' ? food : "";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold dark:text-white flex items-center">
              <FaHeart className="mr-3 text-red-500" />
              Health Tracking
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your food, sleep, and workout habits
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
            >
              {isSyncing ? <FaSync className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
              Save to Cloud
            </button>
            <button
              onClick={handleLoad}
              disabled={isSyncing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center disabled:opacity-50"
            >
              <FaDownload className="mr-2" />
              Load from Cloud
            </button>
          </div>
        </div>

        {/* Date Selector */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 flex items-center justify-between border border-gray-200 dark:border-slate-700">
          <div className="flex items-center">
            <FaCalendarAlt className="text-blue-500 mr-2" />
            <span className="dark:text-white font-medium">Select Date:</span>
          </div>
          <input
            type="date"
            value={formatDate(selectedDate)}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
          />
        </div>

        {/* Meals Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold dark:text-white mb-4 flex items-center">
            <FaAppleAlt className="mr-2 text-green-500" />
            Meals - What did you eat?
          </h2>

          <div className="space-y-3">
            {healthTrackingService.MEALS.map((meal) => (
              <div key={meal.id} className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg border border-gray-200 dark:border-slate-600">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{meal.icon}</span>
                  <label className="text-sm font-medium dark:text-gray-200">{meal.label}</label>
                </div>
                <div className="ml-10">
                  <textarea
                    value={entry.meals[meal.id] || ""}
                    onChange={(e) => handleMealChange(meal.id, e.target.value)}
                    placeholder={`What did you have for ${meal.label.toLowerCase()}?`}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                  />
                  <button
                    onClick={() => saveMeal(meal.id)}
                    className="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Save {meal.label}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Food Items Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold dark:text-white mb-4">Food Items Tracker</h2>

          <div className="space-y-3">
            {healthTrackingService.FOOD_ITEMS.map((item) => (
              <div key={item.id} className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg border border-gray-200 dark:border-slate-600">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={`food-${item.id}`}
                    checked={getFoodValue(item.id, 'checked')}
                    onChange={(e) => handleFoodChange(item.id, 'checked', e.target.checked)}
                    className="mr-3 h-5 w-5"
                  />
                  <label htmlFor={`food-${item.id}`} className="flex items-center cursor-pointer flex-1">
                    <span className="text-2xl mr-2">{item.icon}</span>
                    <span className="dark:text-white font-medium">{item.label}</span>
                  </label>
                </div>
                <div className="ml-10">
                  <input
                    type="text"
                    placeholder="Add note..."
                    value={getFoodValue(item.id, 'note')}
                    onChange={(e) => handleFoodChange(item.id, 'note', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded dark:bg-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <button
                    onClick={() => saveFoodItem(item.id)}
                    className="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sleep Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold dark:text-white mb-4 flex items-center">
            <FaBed className="mr-2 text-blue-500" />
            Sleep Schedule
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
              <label className="block text-sm font-medium dark:text-gray-300 mb-2">
                Bed Time
              </label>
              <input
                type="time"
                value={entry.sleep.bedTime || ""}
                onChange={(e) => handleSleepChange("bedTime", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                style={{ colorScheme: document.documentElement.classList.contains("dark") ? "dark" : "light" }}
              />
            </div>
            <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
              <label className="block text-sm font-medium dark:text-gray-300 mb-2">
                Wake Up Time
              </label>
              <input
                type="time"
                value={entry.sleep.wakeTime || ""}
                onChange={(e) => handleSleepChange("wakeTime", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                style={{ colorScheme: document.documentElement.classList.contains("dark") ? "dark" : "light" }}
              />
            </div>
          </div>

          {entry.sleep.bedTime && entry.sleep.wakeTime && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Sleep Duration: {healthTrackingService.calculateSleepHours(
                  entry.sleep.bedTime,
                  entry.sleep.wakeTime
                ).toFixed(1)} hours
              </p>
            </div>
          )}

          <button
            onClick={saveSleep}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
          >
            <FaSave className="mr-2" />
            Save Sleep Schedule
          </button>
        </div>

        {/* Gym Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold dark:text-white mb-4 flex items-center">
            <FaDumbbell className="mr-2 text-orange-500" />
            Gym Session
          </h2>

          <div className="mb-4">
            <label className="flex items-center p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600">
              <input
                type="checkbox"
                checked={entry.gym.attended || false}
                onChange={(e) => handleGymChange("attended", e.target.checked)}
                className="mr-3 h-5 w-5"
              />
              <span className="dark:text-white font-medium">Hit gym today?</span>
            </label>
          </div>

          {entry.gym.attended && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
                <label className="block text-sm font-medium dark:text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={entry.gym.duration || ""}
                  onChange={(e) => handleGymChange("duration", parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
                  placeholder="e.g., 60"
                />
              </div>

              <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
                <label className="block text-sm font-medium dark:text-gray-300 mb-2">
                  Exercises
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {healthTrackingService.EXERCISE_TYPES.map((exercise) => (
                    <button
                      key={exercise}
                      onClick={() => toggleExercise(exercise)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        (entry.gym.exercises || []).includes(exercise)
                          ? "bg-orange-600 text-white"
                          : "bg-white dark:bg-slate-800 dark:text-gray-300 border border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700"
                      }`}
                    >
                      {exercise}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-lg border border-gray-200 dark:border-slate-600">
                <label className="block text-sm font-medium dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={entry.gym.note || ""}
                  onChange={(e) => handleGymChange("note", e.target.value)}
                  placeholder="How did your workout go?"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 resize-none"
                />
              </div>
            </div>
          )}

          <button
            onClick={saveGym}
            className="w-full mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center"
          >
            <FaSave className="mr-2" />
            Save Gym Session
          </button>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold dark:text-white flex items-center">
                <FaChartBar className="mr-2 text-purple-500" />
                Health Stats
              </h2>
              <select
                value={statsPeriod}
                onChange={(e) => setStatsPeriod(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
              </select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-600 dark:text-blue-400">Avg Sleep</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {stats.averageSleep}h
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Target: 8h</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-600 dark:text-orange-400">Gym Days</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {stats.gymDays}/{statsPeriod}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  ({stats.gymPercentage}%)
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-600 dark:text-green-400">Avg Gym Duration</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {stats.avgGymDuration}m
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">Target: 60m</p>
              </div>
            </div>

            {/* Bar Chart with Benchmarks */}
            <div className="relative h-64 bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
              <canvas ref={chartRef}></canvas>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default HealthTracking;
