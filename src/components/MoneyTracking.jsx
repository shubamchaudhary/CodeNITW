import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Chart } from "chart.js/auto";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { FaWallet, FaCalendarAlt, FaSync, FaCloudDownloadAlt, FaChartPie, FaPlus, FaTrash, FaCog, FaPiggyBank } from "react-icons/fa";
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
  const [subscriptions, setSubscriptions] = useState({});
  const [showSubModal, setShowSubModal] = useState(false);
  const [newSub, setNewSub] = useState({ category: '', amount: '', periodDays: 30, note: '' });
  const [dailyBudget, setDailyBudget] = useState(1500);
  const [showBudgetEdit, setShowBudgetEdit] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [bankBalance, setBankBalance] = useState(0);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankAction, setBankAction] = useState({ type: 'add', amount: '', note: '' });

  const pieChartRef = useRef(null);
  const pieChartInstance = useRef(null);
  const trendChartRef = useRef(null);
  const trendChartInstance = useRef(null);
  const calendarRef = useRef(null);

  useEffect(() => {
    loadData();
    loadAnalysis();
    loadTrends();
    loadSubscriptions();
    loadSettings();
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
  const loadSubscriptions = () => setSubscriptions(moneyTrackingService.getAllSubscriptions());
  const loadSettings = () => {
    setDailyBudget(moneyTrackingService.getDailyBudget());
    setBankBalance(moneyTrackingService.getBankBalance());
  };

  // Filter to only show subscriptions active for the selected date
  const activeSubscriptions = Object.entries(subscriptions).filter(([_, sub]) => {
    const currentDateKey = moneyTrackingService.formatDate(selectedDate);
    return currentDateKey >= sub.startDate && currentDateKey <= sub.endDate;
  });

  const handleAddSubscription = () => {
    if (!newSub.category || !newSub.amount || newSub.amount <= 0) {
      toast.error("Please select category and enter amount");
      return;
    }
    // Use selectedDate instead of today
    moneyTrackingService.addSubscription(newSub.category, newSub.amount, newSub.periodDays, selectedDate, newSub.note);
    toast.success(`Subscription added from ${moneyTrackingService.formatDate(selectedDate)}! ₹${Math.round(newSub.amount / newSub.periodDays)}/day for ${newSub.periodDays} days`);
    setNewSub({ category: '', amount: '', periodDays: 30, note: '' });
    setShowSubModal(false);
    loadSubscriptions();
    loadAnalysis();
    loadTrends();
  };

  const handleDeleteSubscription = (category) => {
    if (deleteConfirm === category) {
      moneyTrackingService.deleteSubscription(category);
      toast.success("Subscription removed");
      setDeleteConfirm(null);
      loadSubscriptions();
      loadAnalysis();
      loadTrends();
    } else {
      setDeleteConfirm(category);
      setTimeout(() => setDeleteConfirm(null), 3000); // Reset after 3s
    }
  };

  const handleBudgetSave = () => {
    moneyTrackingService.setDailyBudget(dailyBudget);
    setShowBudgetEdit(false);
    toast.success(`Daily budget set to ₹${dailyBudget}`);
    loadTrends();
  };

  const handleBankAction = () => {
    if (!bankAction.amount || bankAction.amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (bankAction.type === 'add') {
      moneyTrackingService.addMoney(bankAction.amount, bankAction.note);
      toast.success(`Added ₹${bankAction.amount} to balance`);
    } else {
      moneyTrackingService.deductMoney(bankAction.amount, bankAction.note);
      toast.success(`Deducted ₹${bankAction.amount} from balance`);
    }
    setBankBalance(moneyTrackingService.getBankBalance());
    setBankAction({ type: 'add', amount: '', note: '' });
    setShowBankModal(false);
  };

  const handleSave = async () => {
    // Get previous total for this date to calculate difference
    const previousData = moneyTrackingService.getDailySpending(selectedDate);
    const previousTotal = Object.entries(previousData).reduce((sum, [cat, v]) => {
      if (moneyTrackingService.SUBSCRIPTION_CATEGORY_IDS.includes(cat)) return sum;
      return sum + (typeof v === 'object' ? (v.amount || 0) : v);
    }, 0);

    let saved = 0;
    let newTotal = 0;
    // Save all expenses (including 0 amounts to clear them)
    for (const [category, value] of Object.entries(dailySpending)) {
      const amount = typeof value === 'object' ? value.amount : value;
      const amountNum = parseFloat(amount) || 0;
      if (amountNum > 0) {
        await moneyTrackingService.addDailySpending(selectedDate, category, amountNum);
        newTotal += amountNum;
        saved++;
      }
    }

    // Calculate difference and adjust bank balance
    const difference = newTotal - previousTotal;
    if (difference !== 0) {
      if (difference > 0) {
        moneyTrackingService.deductMoney(difference, `Additional expenses for ${moneyTrackingService.formatDate(selectedDate)}`);
        toast.success(`Saved changes and deducted ₹${Math.round(difference)} from balance`);
      } else {
        moneyTrackingService.addMoney(Math.abs(difference), `Reduced expenses for ${moneyTrackingService.formatDate(selectedDate)}`);
        toast.success(`Saved changes and added back ₹${Math.round(Math.abs(difference))} to balance`);
      }
      setBankBalance(moneyTrackingService.getBankBalance());
    } else if (saved > 0) {
      toast.success(`Saved ${saved} expense(s) (no balance change)`);
    } else {
      toast.info("No changes to save");
    }

    // Refresh data to prevent duplicate calculations on next save
    loadData();
    loadAnalysis();
    loadTrends();
  };

  const handleSync = async () => {
    setIsSyncing(true);
    const result = await moneyTrackingService.loadFromCloud(true);
    if (result.success) {
      toast.success("Synced with cloud!");
      loadData();
      loadAnalysis();
      loadTrends();
      loadSubscriptions();
      loadSettings();
    }
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
          { label: `Limit (₹${dailyBudget})`, data: trends.map(() => dailyBudget), borderColor: "#ef4444", borderDash: [5, 5], pointRadius: 0, fill: false, borderWidth: 2 },
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

  // Calculate today's total (regular expenses + subscription daily amounts)
  const regularExpenses = Object.entries(dailySpending).reduce((sum, [cat, v]) => {
    if (moneyTrackingService.SUBSCRIPTION_CATEGORY_IDS.includes(cat)) return sum;
    return sum + (typeof v === 'object' ? (v.amount || 0) : v);
  }, 0);
  const subscriptionDaily = moneyTrackingService.getDailySubscriptionAmount(selectedDate);
  const todayTotal = regularExpenses + subscriptionDaily;
  const isOverBudget = todayTotal > dailyBudget;

  // Categories grouped by type - exclude subscription categories from regular daily input
  const regularCategories = moneyTrackingService.CATEGORIES.filter(c => !moneyTrackingService.SUBSCRIPTION_CATEGORY_IDS.includes(c.id));

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
                    <input type="date" value={moneyTrackingService.formatDate(selectedDate)} onChange={(e) => { setSelectedDate(new Date(e.target.value)); }} className="w-full p-2 rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
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
            {/* Bank Balance Card */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FaPiggyBank className="text-2xl" />
                  <div>
                    <p className="text-xs opacity-80">Bank Balance</p>
                    <p className="text-2xl font-bold">₹{Math.round(bankBalance).toLocaleString()}</p>
                  </div>
                </div>
                <button onClick={() => setShowBankModal(true)} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-all">
                  <FaPlus className="inline mr-1" /> Add/Deduct
                </button>
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
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 flex justify-between items-center">
                <h2 className="text-base font-bold text-white">📱 Subscriptions & Fixed Expenses</h2>
                <button onClick={() => setShowSubModal(true)} className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-all">
                  <FaPlus className="text-white text-sm" />
                </button>
              </div>
              <div className="p-3">
                {/* Active Subscriptions */}
                {activeSubscriptions.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Active Subscriptions:</p>
                    {activeSubscriptions.map(([catId, sub]) => {
                      const cat = moneyTrackingService.CATEGORIES.find(c => c.id === catId);
                      return (
                        <div key={catId} className="flex items-center justify-between p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{cat?.icon || '📱'}</span>
                            <div>
                              <p className="text-xs font-medium text-gray-700 dark:text-gray-200">{cat?.name || catId}</p>
                              <p className="text-[10px] text-gray-500">₹{sub.amount} / {sub.periodDays} days = ₹{sub.dailyAmount}/day</p>
                              <p className="text-[10px] text-gray-400">{sub.startDate} to {sub.endDate}</p>
                            </div>
                          </div>
                          <button onClick={() => handleDeleteSubscription(catId)} className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${deleteConfirm === catId ? 'bg-red-500 text-white' : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}>
                            {deleteConfirm === catId ? 'Confirm?' : <FaTrash />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">No active subscriptions. Click + to add.</p>
                )}

                {/* Daily subscription total */}
                {activeSubscriptions.length > 0 && (
                  <div className="mt-2 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-center">
                    <p className="text-xs text-purple-600 dark:text-purple-400">Today's subscription cost:</p>
                    <p className="text-lg font-bold text-purple-700 dark:text-purple-300">₹{Math.round(moneyTrackingService.getDailySubscriptionAmount(selectedDate))}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Subscription Modal */}
            <AnimatePresence>
              {showSubModal && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSubModal(false)}>
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-4 max-w-md w-full" onClick={e => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Add Subscription / Fixed Expense</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                        <select value={newSub.category} onChange={e => setNewSub(prev => ({ ...prev, category: e.target.value }))} className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                          <option value="">Select category...</option>
                          {moneyTrackingService.SUBSCRIPTION_CATEGORIES.map(sub => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Total Amount (₹)</label>
                        <input type="number" min="0" placeholder="e.g., 3000" value={newSub.amount} onChange={e => setNewSub(prev => ({ ...prev, amount: e.target.value }))} className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Period (days)</label>
                        <div className="flex gap-2">
                          {[30, 60, 90, 365].map(days => (
                            <button key={days} onClick={() => setNewSub(prev => ({ ...prev, periodDays: days }))} className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${newSub.periodDays === days ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
                              {days === 365 ? '1yr' : `${days}d`}
                            </button>
                          ))}
                        </div>
                        <input type="number" min="1" value={newSub.periodDays} onChange={e => setNewSub(prev => ({ ...prev, periodDays: parseInt(e.target.value) || 30 }))} className="w-full mt-2 p-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white" placeholder="Custom days" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Note (optional)</label>
                        <input type="text" placeholder="e.g., Netflix, ChatGPT" value={newSub.note} onChange={e => setNewSub(prev => ({ ...prev, note: e.target.value }))} className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                      </div>
                      {newSub.amount && newSub.periodDays && (
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                          <p className="text-xs text-purple-600 dark:text-purple-400">Daily cost:</p>
                          <p className="text-xl font-bold text-purple-700 dark:text-purple-300">₹{Math.round((newSub.amount / newSub.periodDays) * 100) / 100}/day</p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => setShowSubModal(false)} className="flex-1 py-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-lg font-medium">Cancel</button>
                        <button onClick={handleAddSubscription} className="flex-1 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700">Add Subscription</button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onClick={handleSave} className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
              Save Expenses
            </motion.button>
          </div>

          {/* Right - Stats */}
          <div className="space-y-4">
            {/* Today's Budget */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Today's Spending</h3>
                <div className="flex items-center gap-2">
                  <div className={`text-2xl font-bold ${isOverBudget ? "text-red-500" : "text-green-500"}`}>
                    ₹{Math.round(todayTotal)}
                    <span className="text-xs font-normal text-gray-400 ml-1">/ ₹{dailyBudget}</span>
                  </div>
                  <button onClick={() => setShowBudgetEdit(!showBudgetEdit)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <FaCog className="text-sm" />
                  </button>
                </div>
              </div>
              {showBudgetEdit && (
                <div className="mt-2 flex gap-2">
                  <input type="number" min="100" value={dailyBudget} onChange={(e) => setDailyBudget(parseInt(e.target.value) || 1500)} className="flex-1 px-2 py-1 text-sm rounded border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                  <button onClick={handleBudgetSave} className="px-3 py-1 bg-indigo-600 text-white text-sm rounded font-medium">Save</button>
                </div>
              )}
              <div className="mt-2 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full transition-all ${isOverBudget ? "bg-red-500" : "bg-green-500"}`} style={{ width: `${Math.min(100, (todayTotal / dailyBudget) * 100)}%` }} />
              </div>
              {subscriptionDaily > 0 && (
                <div className="mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Daily expenses: ₹{Math.round(regularExpenses)}</span>
                  <span>Subscriptions: ₹{Math.round(subscriptionDaily)}</span>
                </div>
              )}
            </motion.div>

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
                    <p className="text-lg font-bold text-purple-700 dark:text-purple-300">₹{dailyBudget}/d</p>
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
                <span className="text-xs text-red-500 font-medium">Red = ₹{dailyBudget} limit</span>
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

      {/* Bank Balance Modal */}
      <AnimatePresence>
        {showBankModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowBankModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-4 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Manage Bank Balance</h3>
              <div className="text-center mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <p className="text-xs text-indigo-600 dark:text-indigo-400">Current Balance</p>
                <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">₹{Math.round(bankBalance).toLocaleString()}</p>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button onClick={() => setBankAction(prev => ({ ...prev, type: 'add' }))} className={`flex-1 py-2 rounded-lg text-sm font-medium ${bankAction.type === 'add' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
                    Add Money
                  </button>
                  <button onClick={() => setBankAction(prev => ({ ...prev, type: 'deduct' }))} className={`flex-1 py-2 rounded-lg text-sm font-medium ${bankAction.type === 'deduct' ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
                    Deduct Money
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Amount (₹)</label>
                  <input type="number" min="0" placeholder="Enter amount" value={bankAction.amount} onChange={e => setBankAction(prev => ({ ...prev, amount: e.target.value }))} className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Note (optional)</label>
                  <input type="text" placeholder="e.g., Salary, ATM withdrawal" value={bankAction.note} onChange={e => setBankAction(prev => ({ ...prev, note: e.target.value }))} className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setShowBankModal(false)} className="flex-1 py-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-lg font-medium">Cancel</button>
                  <button onClick={handleBankAction} className={`flex-1 py-2 text-white rounded-lg font-medium ${bankAction.type === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                    {bankAction.type === 'add' ? 'Add' : 'Deduct'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoneyTracking;
