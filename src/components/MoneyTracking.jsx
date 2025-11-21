import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Chart } from "chart.js/auto";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { FaWallet, FaCalendarAlt, FaSync, FaCloudDownloadAlt, FaChartPie } from "react-icons/fa";
import { toast } from "react-toastify";
import moneyTrackingService from "../services/MoneyTrackingService";

const MoneyTracking = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [dailySpending, setDailySpending] = useState({});
  const [analysis, setAnalysis] = useState(null);
  const [trends, setTrends] = useState([]);
  const [period, setPeriod] = useState(30);
  const [trendPeriod, setTrendPeriod] = useState(7);
  const [isSyncing, setIsSyncing] = useState(false);

  const pieChartRef = useRef(null);
  const pieChartInstance = useRef(null);
  const trendChartRef = useRef(null);
  const trendChartInstance = useRef(null);
  const calendarRef = useRef(null);

  useEffect(() => {
    loadData();
    loadAnalysis();
    loadTrends();
  }, [selectedDate, period, trendPeriod]);

  useEffect(() => {
    if (analysis) renderPieChart();
    if (trends.length > 0) renderTrendChart();
    return () => {
      pieChartInstance.current?.destroy();
      trendChartInstance.current?.destroy();
    };
  }, [analysis, trends]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) setShowCalendar(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadData = () => setDailySpending(moneyTrackingService.getDailySpending(selectedDate));
  const loadAnalysis = () => setAnalysis(moneyTrackingService.getSpendingAnalysis(period));
  const loadTrends = () => setTrends(moneyTrackingService.getSpendingTrends(trendPeriod));

  const handleSave = async () => {
    let saved = 0;
    for (const [category, value] of Object.entries(dailySpending)) {
      const amount = typeof value === 'object' ? value.amount : value;
      if (amount && parseFloat(amount) > 0) {
        await moneyTrackingService.addDailySpending(selectedDate, category, amount);
        saved++;
      }
    }
    if (saved > 0) { toast.success(`Saved ${saved} expense(s)!`); loadAnalysis(); loadTrends(); }
    else toast.info("No expenses to save");
  };

  const handleSync = async () => {
    setIsSyncing(true);
    const result = await moneyTrackingService.loadFromCloud(true);
    if (result.success) { toast.success("Synced with cloud!"); loadData(); loadAnalysis(); loadTrends(); }
    else toast.error(result.error || "Sync failed");
    setIsSyncing(false);
  };

  const updateSpending = (categoryId, amount) => {
    setDailySpending(prev => ({
      ...prev,
      [categoryId]: { ...(prev[categoryId] || {}), amount: parseFloat(amount) || 0 },
    }));
  };

  const formatDateDisplay = (date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const renderPieChart = () => {
    if (!pieChartRef.current || !analysis?.breakdown?.length) return;
    pieChartInstance.current?.destroy();
    const isDark = document.documentElement.classList.contains("dark");

    pieChartInstance.current = new Chart(pieChartRef.current, {
      type: "doughnut",
      data: {
        labels: analysis.breakdown.map(c => c.name),
        datasets: [{ data: analysis.breakdown.map(c => c.amount), backgroundColor: analysis.breakdown.map(c => c.color), borderWidth: 0 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'right', labels: { color: isDark ? '#9ca3af' : '#4b5563', font: { size: 11 }, boxWidth: 12, padding: 8 } },
          tooltip: { callbacks: { label: (ctx) => `₹${ctx.raw} (${analysis.breakdown[ctx.dataIndex].percentage}%)` } },
        },
      },
    });
  };

  const renderTrendChart = () => {
    if (!trendChartRef.current || !trends.length) return;
    trendChartInstance.current?.destroy();
    const isDark = document.documentElement.classList.contains("dark");
    const gridColor = isDark ? "#374151" : "#e5e7eb";
    const textColor = isDark ? "#9ca3af" : "#4b5563";

    trendChartInstance.current = new Chart(trendChartRef.current, {
      type: "line",
      data: {
        labels: trends.map(t => t.label),
        datasets: [
          { label: "Spending", data: trends.map(t => t.total), borderColor: "#3b82f6", backgroundColor: "rgba(59, 130, 246, 0.1)", fill: true, tension: 0.4, pointRadius: 3 },
          { label: "Limit (₹1200)", data: trends.map(() => 1200), borderColor: "#ef4444", borderDash: [5, 5], pointRadius: 0, fill: false, borderWidth: 2 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: textColor, font: { size: 10 } }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { color: textColor, font: { size: 10 }, callback: v => `₹${v}` }, grid: { color: gridColor } },
        },
      },
    });
  };

  const todayTotal = Object.values(dailySpending).reduce((sum, v) => sum + (typeof v === 'object' ? (v.amount || 0) : v), 0);
  const isOverBudget = todayTotal > 1200;

  // Categories grouped by type
  const regularCategories = moneyTrackingService.CATEGORIES.filter(c => !moneyTrackingService.FIXED_EXPENSES.includes(c.id) && !moneyTrackingService.SUBSCRIPTION_CATEGORIES.includes(c.id));
  const subscriptionCategories = moneyTrackingService.CATEGORIES.filter(c => moneyTrackingService.SUBSCRIPTION_CATEGORIES.includes(c.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <FaWallet className="text-green-500" /> Money Tracker
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track your daily expenses</p>
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
                    <input type="date" value={moneyTrackingService.formatDate(selectedDate)} onChange={(e) => { setSelectedDate(new Date(e.target.value)); setShowCalendar(false); }} className="w-full p-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
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
          {/* Left - Input */}
          <div className="space-y-4">
            {/* Today's Budget */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Today's Spending</h3>
                <div className={`text-2xl font-bold ${isOverBudget ? "text-red-500" : "text-green-500"}`}>
                  ₹{Math.round(todayTotal)}
                  <span className="text-xs font-normal text-gray-400 ml-1">/ ₹1200</span>
                </div>
              </div>
              <div className="mt-2 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full transition-all ${isOverBudget ? "bg-red-500" : "bg-green-500"}`} style={{ width: `${Math.min(100, (todayTotal / 1200) * 100)}%` }} />
              </div>
            </motion.div>

            {/* Daily Expenses */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500">
                <h2 className="text-base font-bold text-white">💸 Daily Expenses</h2>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {regularCategories.map((cat) => {
                    const value = dailySpending[cat.id];
                    const amount = typeof value === 'object' ? (value.amount || 0) : (value || 0);
                    const hasValue = amount > 0;

                    return (
                      <div key={cat.id} className={`relative p-2 rounded-lg border-2 transition-all ${hasValue ? "border-green-400 bg-green-50 dark:bg-green-900/20" : "border-transparent bg-gray-50 dark:bg-slate-700/50"}`}>
                        <div className="text-center">
                          <span className="text-2xl block">{cat.icon}</span>
                          <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 block mt-1">{cat.name}</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="₹0"
                            value={amount || ""}
                            onChange={(e) => updateSpending(cat.id, e.target.value)}
                            className="w-full mt-1 px-1 py-0.5 text-xs text-center rounded border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Subscriptions */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500">
                <h2 className="text-base font-bold text-white">📱 Subscriptions</h2>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {subscriptionCategories.map((cat) => {
                    const value = dailySpending[cat.id];
                    const amount = typeof value === 'object' ? (value.amount || 0) : (value || 0);
                    const hasValue = amount > 0;

                    return (
                      <div key={cat.id} className={`p-2 rounded-lg border-2 transition-all ${hasValue ? "border-purple-400 bg-purple-50 dark:bg-purple-900/20" : "border-transparent bg-gray-50 dark:bg-slate-700/50"}`}>
                        <div className="text-center">
                          <span className="text-xl block">{cat.icon}</span>
                          <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 block mt-1">{cat.name}</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="₹0"
                            value={amount || ""}
                            onChange={(e) => updateSpending(cat.id, e.target.value)}
                            className="w-full mt-1 px-1 py-0.5 text-xs text-center rounded border border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={handleSave} className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
              Save Expenses
            </motion.button>
          </div>

          {/* Right - Stats */}
          <div className="space-y-4">
            {/* Summary Stats */}
            {analysis && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-800 dark:text-white">Period Summary</h3>
                  <div className="flex gap-1">
                    {[7, 30, 90].map((d) => (
                      <button key={d} onClick={() => setPeriod(d)} className={`px-2 py-0.5 rounded text-xs font-medium ${period === d ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"}`}>{d}d</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400">Total</p>
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-300">₹{analysis.total}</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-xs text-green-600 dark:text-green-400">Daily Avg</p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">₹{analysis.dailyAverage}</p>
                  </div>
                  <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-xs text-purple-600 dark:text-purple-400">Target</p>
                    <p className="text-lg font-bold text-purple-700 dark:text-purple-300">₹1200/d</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Trend Period Selector */}
            <div className="flex gap-2">
              {[7, 14, 30].map((days) => (
                <button key={days} onClick={() => setTrendPeriod(days)} className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${trendPeriod === days ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700"}`}>
                  {days}d
                </button>
              ))}
            </div>

            {/* Spending Trend */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-gray-800 dark:text-white">💰 Spending Trend</h3>
                <span className="text-xs text-red-500 font-medium">Red = ₹1200 limit</span>
              </div>
              <div className="h-40"><canvas ref={trendChartRef}></canvas></div>
            </motion.div>

            {/* Pie Chart */}
            {analysis?.breakdown?.length > 0 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <FaChartPie className="text-purple-500" />
                  <h3 className="text-xs font-bold text-gray-800 dark:text-white">Spending Breakdown</h3>
                </div>
                <div className="h-48"><canvas ref={pieChartRef}></canvas></div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoneyTracking;
