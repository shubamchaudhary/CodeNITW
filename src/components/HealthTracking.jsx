import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Chart } from "chart.js/auto";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { FaHeart, FaSync, FaCloudDownloadAlt, FaCalendarAlt, FaCheck, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { toast } from "react-toastify";
import healthTrackingService from "../services/HealthTrackingService";

const HealthTracking = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [entry, setEntry] = useState(healthTrackingService.getEmptyEntry());
  const [stats, setStats] = useState(null);
  const [statsPeriod, setStatsPeriod] = useState(7);
  const [isSyncing, setIsSyncing] = useState(false);
  const [scoreCalendarMonth, setScoreCalendarMonth] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState(null);
  const [scoreHistory, setScoreHistory] = useState({});

  const sleepChartRef = useRef(null);
  const sleepChartInstance = useRef(null);
  const gymChartRef = useRef(null);
  const gymChartInstance = useRef(null);
  const eatingChartRef = useRef(null);
  const eatingChartInstance = useRef(null);
  const bigScoreChartRef = useRef(null);
  const bigScoreChartInstance = useRef(null);
  const calendarRef = useRef(null);

  useEffect(() => {
    loadEntry();
    loadStats();
    loadScoreHistory();
  }, [selectedDate, statsPeriod, scoreCalendarMonth]);

  useEffect(() => {
    if (stats) renderCharts();
    return () => {
      sleepChartInstance.current?.destroy();
      gymChartInstance.current?.destroy();
      eatingChartInstance.current?.destroy();
      bigScoreChartInstance.current?.destroy();
    };
  }, [stats]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadEntry = () => setEntry(healthTrackingService.getEntry(selectedDate));
  const loadStats = () => setStats(healthTrackingService.getStats(statsPeriod));

  const loadScoreHistory = () => {
    const history = {};
    const year = scoreCalendarMonth.getFullYear();
    const month = scoreCalendarMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = healthTrackingService.formatDate(date);
      const dayEntry = healthTrackingService.getEntry(date);
      history[dateKey] = healthTrackingService.calculateEatingScore(dayEntry);
    }
    setScoreHistory(history);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    if (score > 0) return 'bg-red-500';
    return 'bg-gray-200 dark:bg-slate-700';
  };

  const renderScoreCalendar = () => {
    const year = scoreCalendarMonth.getFullYear();
    const month = scoreCalendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-6 h-6"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateKey = healthTrackingService.formatDate(date);
      const score = scoreHistory[dateKey] || 0;
      const isToday = dateKey === healthTrackingService.formatDate(new Date());

      days.push(
        <div
          key={day}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium cursor-pointer relative transition-all ${getScoreColor(score)} ${isToday ? 'ring-2 ring-indigo-500' : ''}`}
          onMouseEnter={() => setHoveredDay({ day, score, dateKey })}
          onMouseLeave={() => setHoveredDay(null)}
          onClick={() => { setSelectedDate(date); }}
        >
          <span className={score > 0 ? 'text-white' : 'text-gray-600 dark:text-gray-400'}>{day}</span>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <button onClick={() => setScoreCalendarMonth(new Date(year, month - 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
            <FaChevronLeft className="text-xs text-gray-500" />
          </button>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{monthNames[month]} {year}</span>
          <button onClick={() => setScoreCalendarMonth(new Date(year, month + 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
            <FaChevronRight className="text-xs text-gray-500" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-[10px] font-medium text-gray-400 w-6">{d}</div>
          ))}
          {days}
        </div>
        {hoveredDay && (
          <div className="mt-2 p-2 bg-gray-100 dark:bg-slate-700 rounded-lg text-center">
            <p className="text-xs text-gray-600 dark:text-gray-300">{hoveredDay.dateKey}</p>
            <p className="text-lg font-bold text-gray-800 dark:text-white">Score: {hoveredDay.score}</p>
          </div>
        )}
        <div className="flex justify-center gap-2 text-[10px] mt-2">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span>80+</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500"></span>50-79</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span>1-49</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-200"></span>0</span>
        </div>
      </div>
    );
  };

  const handleSave = async () => {
    const updatedEntry = {
      ...entry,
      sleep: { ...entry.sleep, hours: healthTrackingService.calculateSleepHours(entry.sleep.bedTime, entry.sleep.wakeTime) },
    };
    await healthTrackingService.saveEntry(selectedDate, updatedEntry);
    toast.success("Health data saved!");
    loadStats();
  };

  const handleSync = async () => {
    setIsSyncing(true);
    const result = await healthTrackingService.loadFromCloud(true);
    if (result.success) { toast.success("Synced with cloud!"); loadEntry(); loadStats(); }
    else toast.error(result.error || "Sync failed");
    setIsSyncing(false);
  };

  const updateMeal = (mealId, field, value) => {
    setEntry(prev => ({ ...prev, meals: { ...prev.meals, [mealId]: { ...prev.meals[mealId], [field]: value } } }));
  };

  const updateFood = (foodId, field, value) => {
    setEntry(prev => ({
      ...prev,
      food: { ...prev.food, [foodId]: typeof prev.food[foodId] === 'object' ? { ...prev.food[foodId], [field]: value } : { [field]: value } },
    }));
  };

  const updateSleep = (field, value) => setEntry(prev => ({ ...prev, sleep: { ...prev.sleep, [field]: value } }));
  const updateGym = (field, value) => setEntry(prev => ({ ...prev, gym: { ...prev.gym, [field]: value } }));

  const toggleExercise = (exerciseId) => {
    setEntry(prev => {
      const exercises = prev.gym.exercises || [];
      return { ...prev, gym: { ...prev.gym, exercises: exercises.includes(exerciseId) ? exercises.filter(e => e !== exerciseId) : [...exercises, exerciseId] } };
    });
  };

  const formatDateDisplay = (date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const renderCharts = () => {
    const isDark = document.documentElement.classList.contains("dark");
    const gridColor = isDark ? "#374151" : "#e5e7eb";
    const textColor = isDark ? "#9ca3af" : "#4b5563";

    // Sleep Chart
    if (sleepChartRef.current && stats?.sleepData) {
      sleepChartInstance.current?.destroy();
      sleepChartInstance.current = new Chart(sleepChartRef.current, {
        type: "line",
        data: {
          labels: stats.sleepData.map(d => d.label),
          datasets: [
            { label: "Sleep", data: stats.sleepData.map(d => d.value), borderColor: "#8b5cf6", backgroundColor: "rgba(139, 92, 246, 0.1)", fill: true, tension: 0.4, pointRadius: 3 },
            { label: "Target (7.5h)", data: stats.sleepData.map(() => 7.5), borderColor: "#10b981", borderDash: [5, 5], pointRadius: 0, fill: false },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } }, y: { beginAtZero: true, max: 12, ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } } } },
      });
    }

    // Gym Chart
    if (gymChartRef.current && stats?.gymData) {
      gymChartInstance.current?.destroy();
      gymChartInstance.current = new Chart(gymChartRef.current, {
        type: "line",
        data: {
          labels: stats.gymData.map(d => d.label),
          datasets: [
            { label: "Gym", data: stats.gymData.map(d => d.value), borderColor: "#f97316", backgroundColor: "rgba(249, 115, 22, 0.1)", fill: true, tension: 0.4, pointRadius: 3 },
            { label: "Target (60min)", data: stats.gymData.map(() => 60), borderColor: "#10b981", borderDash: [5, 5], pointRadius: 0, fill: false },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } } } },
      });
    }

    // Eating Score Chart (small)
    if (eatingChartRef.current && stats?.eatingScoreData) {
      eatingChartInstance.current?.destroy();
      eatingChartInstance.current = new Chart(eatingChartRef.current, {
        type: "line",
        data: {
          labels: stats.eatingScoreData.map(d => d.label),
          datasets: [
            { label: "Score", data: stats.eatingScoreData.map(d => d.value), borderColor: "#06b6d4", backgroundColor: "rgba(6, 182, 212, 0.1)", fill: true, tension: 0.4, pointRadius: 3 },
            { label: "Target (80)", data: stats.eatingScoreData.map(() => 80), borderColor: "#10b981", borderDash: [5, 5], pointRadius: 0, fill: false },
          ],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } }, y: { beginAtZero: true, max: 100, ticks: { color: textColor, font: { size: 10 } }, grid: { color: gridColor } } } },
      });
    }

    // Big Score Chart (at bottom)
    if (bigScoreChartRef.current && stats?.eatingScoreData) {
      bigScoreChartInstance.current?.destroy();
      bigScoreChartInstance.current = new Chart(bigScoreChartRef.current, {
        type: "line",
        data: {
          labels: stats.eatingScoreData.map(d => d.label),
          datasets: [
            { label: "Health Score", data: stats.eatingScoreData.map(d => d.value), borderColor: "#8b5cf6", backgroundColor: "rgba(139, 92, 246, 0.2)", fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: stats.eatingScoreData.map(d => d.value >= 80 ? '#10b981' : d.value >= 50 ? '#f59e0b' : '#ef4444') },
            { label: "Target (80)", data: stats.eatingScoreData.map(() => 80), borderColor: "#10b981", borderDash: [5, 5], pointRadius: 0, fill: false, borderWidth: 2 },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'top', labels: { color: textColor, font: { size: 11 } } },
            tooltip: {
              callbacks: {
                label: (ctx) => `Score: ${ctx.raw} ${ctx.raw >= 80 ? '(Great!)' : ctx.raw >= 50 ? '(Good)' : '(Needs work)'}`,
              },
            },
          },
          scales: {
            x: { ticks: { color: textColor, font: { size: 11 } }, grid: { display: false } },
            y: { beginAtZero: true, max: 100, ticks: { color: textColor, font: { size: 11 }, stepSize: 20 }, grid: { color: gridColor } },
          },
        },
      });
    }
  };

  const eatingScore = healthTrackingService.calculateEatingScore(entry);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <FaHeart className="text-red-500" /> Health Tracker
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track your daily wellness</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative" ref={calendarRef}>
              <button onClick={() => setShowCalendar(prev => !prev)} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-600 hover:shadow-lg transition-all">
                <FaCalendarAlt className="text-indigo-500" />
                <span className="text-gray-700 dark:text-gray-200 font-medium">{formatDateDisplay(selectedDate)}</span>
              </button>
              <AnimatePresence>
                {showCalendar && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 top-12 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-600 p-3">
                    <input type="date" value={healthTrackingService.formatDate(selectedDate)} onChange={(e) => { setSelectedDate(new Date(e.target.value)); setShowCalendar(false); }} className="w-full p-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button onClick={handleSync} disabled={isSyncing} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50" title="Sync with Cloud">
              {isSyncing ? <FaSync className="animate-spin" /> : <FaCloudDownloadAlt />}
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left - Forms */}
          <div className="space-y-4">
            {/* Meals & Nutrition */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500">
                <h2 className="text-base font-bold text-white">🍽️ Meals & Nutrition</h2>
              </div>
              <div className="p-3 space-y-2">
                {healthTrackingService.MEALS.map((meal) => (
                  <div key={meal.id} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2 border border-gray-100 dark:border-slate-600">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={entry.meals[meal.id]?.checked || false} onChange={(e) => updateMeal(meal.id, 'checked', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
                      <span className="text-xl">{meal.icon}</span>
                      <span className="font-medium text-sm text-gray-700 dark:text-gray-200">{meal.label}</span>
                      <span className="text-xs text-gray-400 ml-auto">{meal.time}</span>
                    </label>
                    <AnimatePresence>
                      {entry.meals[meal.id]?.checked && (
                        <motion.input initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} type="text" placeholder={`What did you eat?`} value={entry.meals[meal.id]?.details || ""} onChange={(e) => updateMeal(meal.id, 'details', e.target.value)} className="w-full mt-2 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {/* Water */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><span className="text-xl">💧</span><span className="font-medium text-sm text-gray-700 dark:text-gray-200">Water</span></div>
                    <div className="flex items-center gap-2">
                      <input type="number" min="0" max="10" step="0.5" value={healthTrackingService.getWaterValue(entry.food)} onChange={(e) => setEntry(prev => ({ ...prev, food: { ...prev.food, water: parseFloat(e.target.value) || 0 } }))} className="w-14 px-2 py-1 text-center text-sm rounded-lg border border-blue-200 dark:border-blue-700 dark:bg-slate-800 dark:text-white" />
                      <span className="text-xs text-gray-500">/ 4L</span>
                    </div>
                  </div>
                  <div className="mt-1 h-1.5 bg-blue-100 dark:bg-blue-900 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.min(100, (healthTrackingService.getWaterValue(entry.food) / 4) * 100)}%` }} />
                  </div>
                </div>

                {/* Junk */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 border border-red-100 dark:border-red-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={entry.food.junk?.had || false} onChange={(e) => updateFood('junk', 'had', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500" />
                    <span className="text-xl">🍔</span>
                    <span className="font-medium text-sm text-gray-700 dark:text-gray-200">Had Junk?</span>
                  </label>
                  <AnimatePresence>
                    {entry.food.junk?.had && (
                      <motion.input initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} type="text" placeholder="What?" value={entry.food.junk?.details || ""} onChange={(e) => updateFood('junk', 'details', e.target.value)} className="w-full mt-2 px-2 py-1.5 text-xs rounded-lg border border-red-200 dark:border-red-800 dark:bg-slate-800 dark:text-white" />
                    )}
                  </AnimatePresence>
                </div>

                {/* Other Items */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[{ id: 'tea_coffee', label: 'Tea/Coffee', icon: '☕' }, { id: 'fruits', label: 'Fruits', icon: '🍎' }, { id: 'dry_fruits', label: 'Dry Fruits', icon: '🥜' }, { id: 'protein_shake', label: 'Protein', icon: '🥤' }].map((item) => (
                    <label key={item.id} className={`flex flex-col items-center p-2 rounded-lg cursor-pointer transition-all border-2 ${entry.food[item.id]?.had ? "bg-green-50 dark:bg-green-900/20 border-green-400" : "bg-gray-50 dark:bg-slate-700/50 border-transparent hover:border-gray-200"}`}>
                      <input type="checkbox" checked={entry.food[item.id]?.had || false} onChange={(e) => updateFood(item.id, 'had', e.target.checked)} className="sr-only" />
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 text-center mt-1">{item.label}</span>
                      {entry.food[item.id]?.had && <FaCheck className="text-green-500 text-xs mt-1" />}
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Sleep */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="p-3 bg-gradient-to-r from-violet-500 to-purple-500">
                <h2 className="text-base font-bold text-white">😴 Sleep</h2>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Bed Time</label><input type="time" value={entry.sleep.bedTime || ""} onChange={(e) => updateSleep('bedTime', e.target.value)} className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white" /></div>
                  <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Wake Time</label><input type="time" value={entry.sleep.wakeTime || ""} onChange={(e) => updateSleep('wakeTime', e.target.value)} className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white" /></div>
                </div>
                {entry.sleep.bedTime && entry.sleep.wakeTime && (
                  <div className="mt-2 p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg text-center">
                    <span className="text-xl font-bold text-violet-600 dark:text-violet-400">{healthTrackingService.calculateSleepHours(entry.sleep.bedTime, entry.sleep.wakeTime)}h</span>
                    <span className="text-xs text-gray-500 ml-1">sleep</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Gym */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-500">
                <h2 className="text-base font-bold text-white">💪 Gym</h2>
              </div>
              <div className="p-3 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={entry.gym.attended || false} onChange={(e) => updateGym('attended', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                  <span className="font-medium text-sm text-gray-700 dark:text-gray-200">Hit the gym today?</span>
                </label>
                <AnimatePresence>
                  {entry.gym.attended && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2">
                      <div><label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Duration (min)</label><input type="number" min="0" value={entry.gym.duration || ""} onChange={(e) => updateGym('duration', parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white" /></div>
                      <div className="flex flex-wrap gap-1">
                        {healthTrackingService.EXERCISE_TYPES.map((ex) => (
                          <button key={ex.id} onClick={() => toggleExercise(ex.id)} className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${(entry.gym.exercises || []).includes(ex.id) ? "bg-orange-500 text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"}`}>
                            {ex.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={handleSave} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
              Save Health Data
            </motion.button>
          </div>

          {/* Right - Stats */}
          <div className="space-y-4">
            {/* Score Card */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-4">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">Today's Score</h3>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20">
                  <CircularProgressbar value={eatingScore} text={`${eatingScore}`} styles={buildStyles({ pathColor: eatingScore >= 80 ? "#10b981" : eatingScore >= 50 ? "#f59e0b" : "#ef4444", textColor: "#1f2937", trailColor: "#e5e7eb" })} />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                  <p>🍽️ Meals: +10 each (40)</p>
                  <p>💧 Water: +2.5/L (max 10)</p>
                  <p>💪 Gym: +20</p>
                  <p>🍎 Fruits: +10</p>
                  <p>🥜 Dry Fruits: +10</p>
                  <p>😴 Sleep: +20 (timing)</p>
                  <p>🍔 Junk: -20</p>
                </div>
              </div>
            </motion.div>

            {/* Score Calendar */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-4">
              <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">Score History</h3>
              {renderScoreCalendar()}
            </motion.div>

            {/* Period Selector */}
            <div className="flex gap-2">
              {[7, 14, 30].map((days) => (
                <button key={days} onClick={() => setStatsPeriod(days)} className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${statsPeriod === days ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700"}`}>
                  {days}d
                </button>
              ))}
            </div>

            {/* Charts */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-gray-800 dark:text-white">😴 Sleep</h3>
                <span className="text-xs text-violet-500 font-medium">{stats?.averageSleep || 0}h avg</span>
              </div>
              <div className="h-32"><canvas ref={sleepChartRef}></canvas></div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-gray-800 dark:text-white">💪 Gym Duration</h3>
                <span className="text-xs text-orange-500 font-medium">{stats?.gymDays || 0} days</span>
              </div>
              <div className="h-32"><canvas ref={gymChartRef}></canvas></div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-gray-800 dark:text-white">🍎 Eating Score</h3>
                <span className="text-xs text-cyan-500 font-medium">{stats?.averageEatingScore || 0} avg</span>
              </div>
              <div className="h-32"><canvas ref={eatingChartRef}></canvas></div>
            </motion.div>
          </div>
        </div>

        {/* Big Score Trend Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">📊 Health Score Trend</h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">Average: <span className="font-bold text-indigo-600 dark:text-indigo-400">{stats?.averageEatingScore || 0}</span></span>
              <div className="flex gap-1">
                {[7, 14, 30].map((days) => (
                  <button key={days} onClick={() => setStatsPeriod(days)} className={`px-2 py-1 rounded text-xs font-medium ${statsPeriod === days ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"}`}>{days}d</button>
                ))}
              </div>
            </div>
          </div>
          <div className="h-64"><canvas ref={bigScoreChartRef}></canvas></div>
        </motion.div>
      </div>
    </div>
  );
};

export default HealthTracking;
