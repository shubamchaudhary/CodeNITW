import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Chart } from "chart.js/auto";
import {
  FaWallet,
  FaCalendarAlt,
  FaSave,
  FaSync,
  FaDownload,
  FaChartPie,
  FaChartBar,
  FaStickyNote,
} from "react-icons/fa";
import { toast } from "react-toastify";
import moneyTrackingService from "../services/MoneyTrackingService";

const MoneyTracking = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailySpending, setDailySpending] = useState({});
  const [fixedMonthly, setFixedMonthly] = useState({});
  const [analysis, setAnalysis] = useState(null);
  const [trends, setTrends] = useState([]);
  const [period, setPeriod] = useState(30);
  const [trendPeriod, setTrendPeriod] = useState(7);
  const [isSyncing, setIsSyncing] = useState(false);

  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const trendChartRef = useRef(null);
  const trendChartInstance = useRef(null);

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  useEffect(() => {
    loadAnalysis();
  }, [period]);

  useEffect(() => {
    loadTrends();
  }, [trendPeriod]);

  useEffect(() => {
    if (analysis) {
      renderChart();
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [analysis]);

  useEffect(() => {
    if (trends && trends.length > 0) {
      renderTrendChart();
    }

    return () => {
      if (trendChartInstance.current) {
        trendChartInstance.current.destroy();
      }
    };
  }, [trends]);

  // Listen for updates
  useEffect(() => {
    const handleUpdate = () => {
      loadData();
      loadAnalysis();
      loadTrends();
    };

    window.addEventListener("moneyTrackingUpdated", handleUpdate);
    return () => window.removeEventListener("moneyTrackingUpdated", handleUpdate);
  }, [selectedDate, period, trendPeriod]);

  const loadData = () => {
    const spending = moneyTrackingService.getDailySpending(selectedDate);
    const data = moneyTrackingService.getData();
    setDailySpending(spending);
    setFixedMonthly(data.fixedMonthly || {});
  };

  const loadAnalysis = () => {
    const stats = moneyTrackingService.getSpendingAnalysis(period);
    setAnalysis(stats);
  };

  const loadTrends = () => {
    const trendData = moneyTrackingService.getSpendingTrends(trendPeriod);
    setTrends(trendData);
  };

  const handleSpendingChange = (category, field, value) => {
    setDailySpending(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [field]: value,
      },
    }));
  };

  const handleFixedChange = (category, value) => {
    setFixedMonthly(prev => ({ ...prev, [category]: value }));
  };

  const saveDailySpending = () => {
    let savedCount = 0;
    Object.entries(dailySpending).forEach(([category, value]) => {
      if (!value) return;

      const amount = typeof value === 'object' ? value.amount : value;
      const note = typeof value === 'object' ? (value.note || "") : "";
      const period = typeof value === 'object' ? (value.period || "") : "";

      // Check if amount is a valid number (including 0)
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount) && amount !== "") {
        if (moneyTrackingService.SUBSCRIPTION_CATEGORIES.includes(category)) {
          // For subscriptions, require period to be selected
          if (period) {
            moneyTrackingService.addSubscription(selectedDate, category, numAmount, period, note);
            savedCount++;
          }
        } else {
          moneyTrackingService.addDailySpending(selectedDate, category, numAmount, note);
          savedCount++;
        }
      }
    });

    if (savedCount > 0) {
      toast.success(`Saved ${savedCount} expense(s)!`);
      loadData();
      loadAnalysis();
      loadTrends();
    } else {
      toast.info("No expenses to save. Add amounts to save.");
    }
  };

  const saveFixedExpenses = () => {
    Object.entries(fixedMonthly).forEach(([category, amount]) => {
      if (amount) {
        moneyTrackingService.setFixedMonthly(category, amount);
      }
    });
    loadAnalysis(); // Refresh analysis
    toast.success("Fixed expenses saved!");
  };

  const handleSync = async () => {
    setIsSyncing(true);
    const result = await moneyTrackingService.syncToFirebase();
    if (result.success) {
      toast.success("Money data synced to cloud!");
    } else {
      toast.error("Failed to sync: " + result.error);
    }
    setIsSyncing(false);
  };

  const handleLoad = async () => {
    setIsSyncing(true);
    const result = await moneyTrackingService.loadFromFirebase();
    if (result.success) {
      toast.success("Money data loaded from cloud!");
      loadData();
      loadAnalysis();
    } else {
      toast.error("Failed to load: " + result.error);
    }
    setIsSyncing(false);
  };

  const renderChart = () => {
    if (!chartRef.current || !analysis || analysis.breakdown.length === 0) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext("2d");

    chartInstance.current = new Chart(ctx, {
      type: "pie",
      data: {
        labels: analysis.breakdown.map(cat => cat.name),
        datasets: [
          {
            data: analysis.breakdown.map(cat => cat.amount),
            backgroundColor: analysis.breakdown.map(cat => cat.color),
            borderColor: "#ffffff",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              color: document.documentElement.classList.contains("dark") ? "#e5e7eb" : "#1f2937",
              generateLabels: (chart) => {
                const data = chart.data;
                return data.labels.map((label, i) => ({
                  text: `${label}: ₹${data.datasets[0].data[i]} (${analysis.breakdown[i].percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i,
                }));
              },
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const cat = analysis.breakdown[context.dataIndex];
                return `${cat.name}: ₹${cat.amount} (${cat.percentage}%)`;
              },
            },
          },
        },
      },
    });
  };

  const renderTrendChart = () => {
    if (!trendChartRef.current || !trends || trends.length === 0) return;

    if (trendChartInstance.current) {
      trendChartInstance.current.destroy();
    }

    const ctx = trendChartRef.current.getContext("2d");
    const isDark = document.documentElement.classList.contains("dark");

    // Create benchmark line at 1200 rs
    const benchmarkData = trends.map(() => 1200);

    trendChartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: trends.map(t => t.label),
        datasets: [
          {
            label: "Daily Spending",
            data: trends.map(t => t.total),
            backgroundColor: trends.map(t => t.total > 1200 ? "#ef4444" : "#10b981"),
            borderColor: trends.map(t => t.total > 1200 ? "#dc2626" : "#059669"),
            borderWidth: 1,
          },
          {
            label: "Target (₹1200/day)",
            data: benchmarkData,
            type: "line",
            borderColor: "#f59e0b",
            backgroundColor: "transparent",
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            pointHoverRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: {
              color: isDark ? "#e5e7eb" : "#1f2937",
            },
            grid: {
              color: isDark ? "#374151" : "#e5e7eb",
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: isDark ? "#e5e7eb" : "#1f2937",
              callback: (value) => `₹${value}`,
            },
            grid: {
              color: isDark ? "#374151" : "#e5e7eb",
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: isDark ? "#e5e7eb" : "#1f2937",
            },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                if (context.datasetIndex === 0) {
                  const amount = context.parsed.y;
                  const status = amount > 1200 ? "Over budget" : "Within budget";
                  return `₹${amount} (${status})`;
                }
                return `Target: ₹${context.parsed.y}`;
              },
            },
          },
        },
      },
    });
  };

  const formatDate = (date) => {
    return date.toISOString().split('T')[0];
  };

  const getValue = (category, field) => {
    const value = dailySpending[category];
    if (!value) return "";
    if (typeof value === 'object') {
      return value[field] || "";
    }
    return field === 'amount' ? value : "";
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
              <FaWallet className="mr-3 text-green-500" />
              Money Tracking
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your spending habits and analyze patterns
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

        {/* Daily Spending Form */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold dark:text-white flex items-center">
              <FaCalendarAlt className="mr-2 text-blue-500" />
              Daily Spending
            </h2>
            <input
              type="date"
              value={formatDate(selectedDate)}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded dark:bg-slate-700 dark:text-white"
              style={{ colorScheme: document.documentElement.classList.contains("dark") ? "dark" : "light" }}
            />
          </div>

          <div className="space-y-2">
            {moneyTrackingService.CATEGORIES.filter(
              cat => !moneyTrackingService.FIXED_EXPENSES.includes(cat.id)
            ).map((category) => {
              const isSubscription = moneyTrackingService.SUBSCRIPTION_CATEGORIES.includes(category.id);

              return (
                <div key={category.id} className="bg-gray-50 dark:bg-slate-700 p-2 rounded border border-gray-200 dark:border-slate-600">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-xl">{category.icon}</span>
                    <label className="text-xs font-medium dark:text-gray-200 flex-1">{category.name}</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="₹0"
                      value={getValue(category.id, 'amount')}
                      onChange={(e) => handleSpendingChange(category.id, 'amount', e.target.value)}
                      className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded dark:bg-slate-800 dark:text-white text-right"
                    />
                  </div>

                  {isSubscription && (
                    <div className="ml-7 mb-1">
                      <select
                        value={getValue(category.id, 'period')}
                        onChange={(e) => handleSpendingChange(category.id, 'period', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded dark:bg-slate-800 dark:text-white"
                      >
                        <option value="">Select period</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  )}

                  <div className="ml-7">
                    <input
                      type="text"
                      placeholder="Add note (where you spent)"
                      value={getValue(category.id, 'note')}
                      onChange={(e) => handleSpendingChange(category.id, 'note', e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded dark:bg-slate-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={saveDailySpending}
            className="w-full mt-3 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
          >
            <FaSave className="mr-2" />
            Save Today's Spending
          </button>
        </div>

        {/* Fixed Monthly Expenses */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-bold dark:text-white mb-4">
            Fixed Monthly Expenses (Auto-distributed)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {moneyTrackingService.CATEGORIES.filter(
              cat => moneyTrackingService.FIXED_EXPENSES.includes(cat.id)
            ).map((category) => (
              <div key={category.id} className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg border border-gray-200 dark:border-slate-600">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{category.icon}</span>
                  <label className="text-sm font-medium dark:text-gray-200 flex-1">{category.name}/month</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="₹0"
                    value={fixedMonthly[category.id] || ""}
                    onChange={(e) => handleFixedChange(category.id, e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 dark:border-slate-600 rounded dark:bg-slate-800 dark:text-white text-right"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={saveFixedExpenses}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
          >
            <FaSave className="mr-2" />
            Save Fixed Expenses
          </button>
        </div>

        {/* Daily Spending Trends */}
        {trends && trends.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold dark:text-white flex items-center">
                <FaChartBar className="mr-2 text-blue-500" />
                Daily Spending Trends
              </h2>
              <select
                value={trendPeriod}
                onChange={(e) => setTrendPeriod(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
              </select>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-600 dark:text-blue-400">Total Spent</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  ₹{trends.reduce((sum, t) => sum + t.total, 0)}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-600 dark:text-green-400">Daily Average</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  ₹{Math.round(trends.reduce((sum, t) => sum + t.total, 0) / trends.length)}
                </p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-600 dark:text-orange-400">Daily Target</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  ₹1200
                </p>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="relative h-80 bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
              <canvas ref={trendChartRef}></canvas>
            </div>
          </div>
        )}

        {/* Spending Analysis */}
        {analysis && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold dark:text-white flex items-center">
                <FaChartPie className="mr-2 text-purple-500" />
                Spending Analysis
              </h2>
              <select
                value={period}
                onChange={(e) => setPeriod(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-600 dark:text-blue-400">Total Spent</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  ₹{analysis.total}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-600 dark:text-green-400">Daily Average</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  ₹{analysis.dailyAverage}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-sm text-purple-600 dark:text-purple-400">Period</p>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {analysis.period} days
                </p>
              </div>
            </div>

            {/* Pie Chart */}
            {analysis.breakdown.length > 0 ? (
              <div className="relative h-96 bg-white dark:bg-slate-900 rounded-lg p-4">
                <canvas ref={chartRef}></canvas>
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8 bg-gray-50 dark:bg-slate-900 rounded-lg">
                No spending data for the selected period
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MoneyTracking;
