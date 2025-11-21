import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import healthTrackingService from "../../services/HealthTrackingService";

const HealthTracking = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [entry, setEntry] = useState(null);
  const [score, setScore] = useState({ total: 0, breakdown: {}, maxPossible: 110 });
  const [stats, setStats] = useState(null);
  const [statsPeriod, setStatsPeriod] = useState(7);

  // Load entry for selected date
  useEffect(() => {
    loadEntry();
  }, [selectedDate]);

  const loadEntry = () => {
    const currentEntry = healthTrackingService.getEntry(selectedDate);
    setEntry(currentEntry);
    const scoreData = healthTrackingService.calculateScore(selectedDate);
    setScore(scoreData);
    setStats(healthTrackingService.getStats(statsPeriod));
  };

  const handleMealChange = (meal, eaten) => {
    const time = eaten ? new Date().toTimeString().slice(0, 5) : null;
    const newScore = healthTrackingService.updateMeal(meal, eaten, time, selectedDate);
    setScore(newScore);
    loadEntry();
  };

  const handleWaterChange = (liters) => {
    const value = parseFloat(liters) || 0;
    const newScore = healthTrackingService.updateWater(value, selectedDate);
    setScore(newScore);
    loadEntry();
  };

  const handleGymChange = (attended) => {
    const newScore = healthTrackingService.updateGym(attended, selectedDate);
    setScore(newScore);
    loadEntry();
  };

  const handleFruitsChange = (eaten) => {
    const newScore = healthTrackingService.updateFruits(eaten, selectedDate);
    setScore(newScore);
    loadEntry();
  };

  const handleDryFruitsChange = (eaten) => {
    const newScore = healthTrackingService.updateDryFruits(eaten, selectedDate);
    setScore(newScore);
    loadEntry();
  };

  const handleJunkChange = (eaten) => {
    const newScore = healthTrackingService.updateJunk(eaten, selectedDate);
    setScore(newScore);
    loadEntry();
  };

  const handleSleepChange = (field, value) => {
    const bedTime = field === 'bedTime' ? value : entry?.sleep?.bedTime;
    const wakeTime = field === 'wakeTime' ? value : entry?.sleep?.wakeTime;
    const newScore = healthTrackingService.updateSleep(bedTime, wakeTime, selectedDate);
    setScore(newScore);
    loadEntry();
  };

  useEffect(() => {
    setStats(healthTrackingService.getStats(statsPeriod));
  }, [statsPeriod]);

  if (!entry) return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">Loading...</div>;

  const scorePercentage = Math.round((score.total / score.maxPossible) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Health Tracker</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track your daily health habits</p>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200"
            />
          </div>
        </div>

        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div style={{ width: 120, height: 120 }}>
              <CircularProgressbar
                value={scorePercentage}
                text={`${score.total}`}
                styles={buildStyles({
                  pathColor: scorePercentage >= 70 ? '#22c55e' : scorePercentage >= 40 ? '#eab308' : '#ef4444',
                  textColor: '#374151',
                  trailColor: '#e5e7eb',
                  textSize: '22px',
                })}
              />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Today's Score</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Max possible: {score.maxPossible} points</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <ScoreItem label="Meals" value={score.breakdown.breakfast + score.breakdown.lunch + score.breakdown.snack + score.breakdown.dinner} max={40} />
                <ScoreItem label="Water" value={score.breakdown.water} max={10} />
                <ScoreItem label="Gym" value={score.breakdown.gym} max={20} />
                <ScoreItem label="Fruits" value={score.breakdown.fruits + score.breakdown.dryFruits} max={20} />
                <ScoreItem label="Sleep" value={score.breakdown.sleep} max={20} />
              </div>
              {score.breakdown.junk < 0 && (
                <p className="text-red-500 text-sm mt-2">Junk food penalty: {score.breakdown.junk} points</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Tracking Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Meals Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <span>🍽️</span> Meals (10 pts each)
            </h3>
            <div className="space-y-3">
              <MealItem
                label="Breakfast"
                time="9:00 AM"
                checked={entry.meals.breakfast.eaten}
                onChange={(checked) => handleMealChange('breakfast', checked)}
              />
              <MealItem
                label="Lunch"
                time="1:00 PM"
                checked={entry.meals.lunch.eaten}
                onChange={(checked) => handleMealChange('lunch', checked)}
              />
              <MealItem
                label="Snack"
                time="7:00 PM"
                checked={entry.meals.snack.eaten}
                onChange={(checked) => handleMealChange('snack', checked)}
              />
              <MealItem
                label="Dinner"
                time="10:00 PM"
                checked={entry.meals.dinner.eaten}
                onChange={(checked) => handleMealChange('dinner', checked)}
              />
            </div>
          </motion.div>

          {/* Water Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <span>💧</span> Water Intake (2.5 pts/L, max 4L)
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  value={entry.water || ''}
                  onChange={(e) => handleWaterChange(e.target.value)}
                  placeholder="Enter liters"
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 text-lg"
                />
                <span className="text-gray-600 dark:text-gray-400 text-lg">Liters</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleWaterChange(amount)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      entry.water === amount
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    {amount}L
                  </button>
                ))}
              </div>
              <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${Math.min((entry.water / 4) * 100, 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Points: {Math.min(entry.water, 4) * 2.5}/10
              </p>
            </div>
          </motion.div>

          {/* Activities Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <span>🏋️</span> Activities & Nutrition
            </h3>
            <div className="space-y-4">
              <CheckItem
                label="Gym / Workout"
                points={20}
                checked={entry.gym}
                onChange={handleGymChange}
                emoji="💪"
              />
              <CheckItem
                label="Fruits"
                points={10}
                checked={entry.fruits}
                onChange={handleFruitsChange}
                emoji="🍎"
              />
              <CheckItem
                label="Dry Fruits"
                points={10}
                checked={entry.dryFruits}
                onChange={handleDryFruitsChange}
                emoji="🥜"
              />
              <CheckItem
                label="Junk Food (Penalty!)"
                points={-20}
                checked={entry.junk}
                onChange={handleJunkChange}
                emoji="🍔"
                isNegative
              />
            </div>
          </motion.div>

          {/* Sleep Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <span>😴</span> Sleep Schedule (20 pts)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Expected: Sleep at 12:30 AM, Wake at 8:00 AM (~7.5 hrs)
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Bed Time</label>
                <input
                  type="time"
                  value={entry.sleep?.bedTime || ''}
                  onChange={(e) => handleSleepChange('bedTime', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Wake Time</label>
                <input
                  type="time"
                  value={entry.sleep?.wakeTime || ''}
                  onChange={(e) => handleSleepChange('wakeTime', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"
                />
              </div>
              {entry.sleep?.bedTime && entry.sleep?.wakeTime && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Duration: {healthTrackingService.calculateSleepDuration(entry.sleep.bedTime, entry.sleep.wakeTime).toFixed(1)} hours
                  <br />
                  <span className={score.breakdown.sleep >= 15 ? 'text-green-500' : score.breakdown.sleep >= 10 ? 'text-yellow-500' : 'text-red-500'}>
                    Sleep score: {score.breakdown.sleep.toFixed(1)}/20
                  </span>
                </p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mt-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Statistics</h3>
            <select
              value={statsPeriod}
              onChange={(e) => setStatsPeriod(Number(e.target.value))}
              className="px-3 py-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </div>
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Avg Score" value={stats.avgScore} unit="pts" />
              <StatCard label="Avg Water" value={stats.avgWater} unit="L" />
              <StatCard label="Gym Days" value={stats.gymDays} unit={`/${statsPeriod}`} />
              <StatCard label="Avg Sleep" value={stats.avgSleep} unit="hrs" />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

const ScoreItem = ({ label, value, max }) => (
  <div className="text-center p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
    <div className="font-semibold text-gray-800 dark:text-gray-200">{value}/{max}</div>
    <div className="text-gray-500 dark:text-gray-400">{label}</div>
  </div>
);

const MealItem = ({ label, time, checked, onChange }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
    <div>
      <span className="font-medium text-gray-800 dark:text-gray-200">{label}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({time})</span>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
    </label>
  </div>
);

const CheckItem = ({ label, points, checked, onChange, emoji, isNegative }) => (
  <div className={`flex items-center justify-between p-3 rounded-lg ${
    isNegative
      ? checked ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-slate-700'
      : checked ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-slate-700'
  }`}>
    <div className="flex items-center gap-2">
      <span>{emoji}</span>
      <span className="font-medium text-gray-800 dark:text-gray-200">{label}</span>
      <span className={`text-xs ${isNegative ? 'text-red-500' : 'text-green-500'}`}>
        ({isNegative ? '' : '+'}{points} pts)
      </span>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 ${
        isNegative ? 'peer-focus:ring-red-300 dark:peer-focus:ring-red-800' : 'peer-focus:ring-green-300 dark:peer-focus:ring-green-800'
      } rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 ${
        isNegative ? 'peer-checked:bg-red-500' : 'peer-checked:bg-green-500'
      }`}></div>
    </label>
  </div>
);

const StatCard = ({ label, value, unit }) => (
  <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
    <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
      {value}<span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">{unit}</span>
    </div>
    <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
  </div>
);

export default HealthTracking;
