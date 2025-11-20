import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
    food: {},
    sleep: { bedTime: "", wakeTime: "" },
    gym: { attended: false, duration: 0, exercises: [] },
  });
  const [stats, setStats] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState(7);

  useEffect(() => {
    loadEntry();
    loadStats();
  }, [selectedDate]);

  useEffect(() => {
    loadStats();
  }, [statsPeriod]);

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

  const handleFoodChange = (foodId, checked) => {
    healthTrackingService.updateFood(selectedDate, foodId, checked);
    setEntry(prev => ({
      ...prev,
      food: { ...prev.food, [foodId]: checked },
    }));
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
      entry.gym.exercises
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

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              {isSyncing ? <FaSync className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
              Save to Cloud
            </button>
            <button
              onClick={handleLoad}
              disabled={isSyncing}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
            >
              <FaDownload className="mr-2" />
              Load from Cloud
            </button>
          </div>
        </div>

        {/* Date Selector */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 flex items-center justify-between">
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

        {/* Food Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold dark:text-white mb-4 flex items-center">
            <FaAppleAlt className="mr-2 text-green-500" />
            Food Intake
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthTrackingService.FOOD_ITEMS.map((item) => (
              <div
                key={item.id}
                className="flex items-center p-3 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
              >
                <input
                  type="checkbox"
                  id={item.id}
                  checked={entry.food[item.id] || false}
                  onChange={(e) => handleFoodChange(item.id, e.target.checked)}
                  className="mr-3 h-5 w-5"
                />
                <label
                  htmlFor={item.id}
                  className="flex items-center cursor-pointer flex-1"
                >
                  <span className="text-2xl mr-2">{item.icon}</span>
                  <span className="dark:text-white">{item.label}</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Sleep Section */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold dark:text-white mb-4 flex items-center">
            <FaBed className="mr-2 text-blue-500" />
            Sleep Schedule
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium dark:text-gray-300 mb-2">
                Bed Time
              </label>
              <input
                type="time"
                value={entry.sleep.bedTime || ""}
                onChange={(e) => handleSleepChange("bedTime", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-300 mb-2">
                Wake Up Time
              </label>
              <input
                type="time"
                value={entry.sleep.wakeTime || ""}
                onChange={(e) => handleSleepChange("wakeTime", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>

          {entry.sleep.bedTime && entry.sleep.wakeTime && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
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
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold dark:text-white mb-4 flex items-center">
            <FaDumbbell className="mr-2 text-orange-500" />
            Gym Session
          </h2>

          <div className="mb-4">
            <label className="flex items-center p-3 border border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700">
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
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium dark:text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={entry.gym.duration || ""}
                  onChange={(e) => handleGymChange("duration", parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                  placeholder="e.g., 60"
                />
              </div>

              <div className="mb-4">
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
                          : "bg-gray-200 dark:bg-slate-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-500"
                      }`}
                    >
                      {exercise}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            onClick={saveGym}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center justify-center"
          >
            <FaSave className="mr-2" />
            Save Gym Session
          </button>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400">Avg Sleep</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {stats.averageSleep}h
                </p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg">
                <p className="text-sm text-orange-600 dark:text-orange-400">Gym Days</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {stats.gymDays}/{statsPeriod}
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  ({stats.gymPercentage}%)
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">Avg Gym Duration</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {stats.avgGymDuration}m
                </p>
              </div>
            </div>

            {/* Food Stats */}
            <div className="mb-4">
              <h3 className="font-semibold dark:text-white mb-2">Food Habits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {healthTrackingService.FOOD_ITEMS.map((item) => {
                  const stat = stats.food[item.id];
                  return stat ? (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700 rounded">
                      <span className="text-sm dark:text-gray-300">
                        {item.icon} {item.label}
                      </span>
                      <span className="text-sm font-medium dark:text-white">
                        {stat.percentage}%
                      </span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            {/* Top Exercises */}
            {Object.keys(stats.exerciseCount).length > 0 && (
              <div>
                <h3 className="font-semibold dark:text-white mb-2">Top Exercises</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.exerciseCount)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([exercise, count]) => (
                      <div
                        key={exercise}
                        className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm"
                      >
                        {exercise} ({count})
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default HealthTracking;
