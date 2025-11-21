import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import moneyTrackingService from "../../services/MoneyTrackingService";

const MoneyTracking = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyEntry, setDailyEntry] = useState({});
  const [dayTotal, setDayTotal] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analysisPeriod, setAnalysisPeriod] = useState(7);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);

  // Subscription form state
  const [newSubscription, setNewSubscription] = useState({
    categoryId: 'rent',
    amount: '',
    periodDays: 30,
    startDate: new Date().toISOString().split('T')[0]
  });

  const categories = moneyTrackingService.getCategories();
  const dailyCategories = moneyTrackingService.getDailyCategories();
  const subscriptionCategories = moneyTrackingService.getSubscriptionCategories();

  useEffect(() => {
    loadData();
  }, [selectedDate, analysisPeriod]);

  const loadData = () => {
    setDailyEntry(moneyTrackingService.getDailyEntry(selectedDate));
    setDayTotal(moneyTrackingService.getTotalForDate(selectedDate));
    setAnalysis(moneyTrackingService.getSpendingAnalysis(analysisPeriod));
    setSubscriptions(moneyTrackingService.getAllSubscriptions());
  };

  const handleDailyExpenseChange = (categoryId, value) => {
    moneyTrackingService.updateDailySpending(categoryId, value, selectedDate);
    loadData();
  };

  const handleAddSubscription = () => {
    if (!newSubscription.amount || newSubscription.amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    moneyTrackingService.addSubscription(
      newSubscription.categoryId,
      newSubscription.amount,
      newSubscription.periodDays,
      newSubscription.startDate
    );

    setNewSubscription({
      categoryId: 'rent',
      amount: '',
      periodDays: 30,
      startDate: new Date().toISOString().split('T')[0]
    });
    setShowSubscriptionModal(false);
    loadData();
  };

  const handleDeleteSubscription = (subscriptionId) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      moneyTrackingService.deleteSubscription(subscriptionId);
      loadData();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Money Tracker</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track daily expenses & subscriptions</p>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200"
            />
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              + Add Subscription
            </button>
          </div>
        </div>

        {/* Today's Summary */}
        {dayTotal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6"
          >
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Day Summary - {selectedDate}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(dayTotal.dailyTotal)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Daily Expenses</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(dayTotal.subscriptionTotal)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Subscriptions (Daily)</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(dayTotal.grandTotal)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
              </div>
            </div>

            {/* Active subscriptions for this day */}
            {dayTotal.activeSubscriptions && dayTotal.activeSubscriptions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Active Subscriptions Today:</h4>
                <div className="flex flex-wrap gap-2">
                  {dayTotal.activeSubscriptions.map(sub => (
                    <span
                      key={sub.id}
                      className="px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded-full text-sm text-gray-700 dark:text-gray-300"
                    >
                      {categories[sub.categoryId]?.emoji} {categories[sub.categoryId]?.name}: {formatCurrency(sub.dailyAmount)}/day
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Expenses */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Daily Expenses</h3>
            <div className="space-y-3">
              {dailyCategories.map(category => (
                <div key={category.id} className="flex items-center gap-3">
                  <span className="text-xl w-8">{category.emoji}</span>
                  <span className="flex-1 text-gray-700 dark:text-gray-300">{category.name}</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={dailyEntry[category.id] || ''}
                    onChange={(e) => handleDailyExpenseChange(category.id, e.target.value)}
                    placeholder="0"
                    className="w-28 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 text-right"
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Active Subscriptions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Subscriptions</h3>
            {subscriptions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No subscriptions added yet.<br />
                Click "Add Subscription" to add your first one.
              </p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {subscriptions.map(sub => {
                  const category = categories[sub.categoryId];
                  const isActive = moneyTrackingService.isDateInSubscriptionPeriod(sub, selectedDate);
                  const daysRemaining = Math.max(0, Math.ceil((new Date(sub.endDate) - new Date()) / (1000 * 60 * 60 * 24)));

                  return (
                    <div
                      key={sub.id}
                      className={`p-3 rounded-lg border ${
                        isActive
                          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                          : 'border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-700/50 opacity-60'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span>{category?.emoji}</span>
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {category?.name}
                            </span>
                            {isActive && (
                              <span className="px-2 py-0.5 text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {formatCurrency(sub.totalAmount)} / {sub.periodDays} days = {formatCurrency(sub.dailyAmount)}/day
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {sub.startDate} to {sub.endDate}
                            {isActive && <span className="ml-2">({daysRemaining} days left)</span>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteSubscription(sub.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Delete subscription"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Analysis Section */}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mt-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Spending Analysis</h3>
              <select
                value={analysisPeriod}
                onChange={(e) => setAnalysisPeriod(Number(e.target.value))}
                className="px-3 py-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  {formatCurrency(analysis.totalSpent)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Spent</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  {formatCurrency(analysis.dailyAverage)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Daily Average</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  {formatCurrency(analysis.dailyAverage * 30)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Projected Monthly</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  {analysisPeriod}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Days Analyzed</div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Daily Expenses Breakdown</h4>
                <div className="space-y-2">
                  {Object.entries(analysis.categoryBreakdown)
                    .filter(([_, amount]) => amount > 0)
                    .sort(([_, a], [__, b]) => b - a)
                    .map(([categoryId, amount]) => {
                      const category = categories[categoryId];
                      const percentage = (amount / analysis.totalSpent) * 100;
                      return (
                        <div key={categoryId} className="flex items-center gap-2">
                          <span className="w-6">{category?.emoji}</span>
                          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{category?.name}</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {formatCurrency(amount)}
                          </span>
                          <span className="text-xs text-gray-500 w-12 text-right">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Subscription Expenses Breakdown</h4>
                <div className="space-y-2">
                  {Object.entries(analysis.subscriptionBreakdown)
                    .filter(([_, amount]) => amount > 0)
                    .sort(([_, a], [__, b]) => b - a)
                    .map(([categoryId, amount]) => {
                      const category = categories[categoryId];
                      const percentage = (amount / analysis.totalSpent) * 100;
                      return (
                        <div key={categoryId} className="flex items-center gap-2">
                          <span className="w-6">{category?.emoji}</span>
                          <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{category?.name}</span>
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {formatCurrency(amount)}
                          </span>
                          <span className="text-xs text-gray-500 w-12 text-right">
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  {Object.keys(analysis.subscriptionBreakdown).length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No subscription expenses in this period</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Add Subscription Modal */}
        <AnimatePresence>
          {showSubscriptionModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowSubscriptionModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full max-w-md"
                onClick={e => e.stopPropagation()}
              >
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Add Subscription</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Category</label>
                    <select
                      value={newSubscription.categoryId}
                      onChange={e => setNewSubscription({...newSubscription, categoryId: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"
                    >
                      {subscriptionCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.emoji} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount (Rs)</label>
                    <input
                      type="number"
                      min="0"
                      value={newSubscription.amount}
                      onChange={e => setNewSubscription({...newSubscription, amount: e.target.value})}
                      placeholder="e.g., 3000"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Period (Days)</label>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {[30, 60, 90, 180, 365].map(days => (
                        <button
                          key={days}
                          onClick={() => setNewSubscription({...newSubscription, periodDays: days})}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            newSubscription.periodDays === days
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {days === 30 ? '1 month' : days === 60 ? '2 months' : days === 90 ? '3 months' : days === 180 ? '6 months' : '1 year'}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={newSubscription.periodDays}
                      onChange={e => setNewSubscription({...newSubscription, periodDays: parseInt(e.target.value) || 30})}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={newSubscription.startDate}
                      onChange={e => setNewSubscription({...newSubscription, startDate: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200"
                    />
                  </div>

                  {newSubscription.amount && newSubscription.periodDays > 0 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Daily cost: {formatCurrency(parseFloat(newSubscription.amount) / newSubscription.periodDays)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowSubscriptionModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddSubscription}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add Subscription
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MoneyTracking;
