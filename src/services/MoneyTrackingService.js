import { db } from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * MoneyTrackingService - Track daily spending and analyze habits
 */
class MoneyTrackingService {
  constructor() {
    this.STORAGE_KEY = "MoneyTrackingData";
    this.LAST_SYNC_KEY = "MoneyTrackingLastSync";
    this.SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes

    this.CATEGORIES = [
      { id: "meals", name: "Meals", icon: "🍽️", color: "#ef4444" },
      { id: "groceries", name: "Groceries", icon: "🛒", color: "#10b981" },
      { id: "fast_food", name: "Fast Food", icon: "🍕", color: "#f97316" },
      { id: "rent", name: "Rent", icon: "🏠", color: "#3b82f6" },
      { id: "shopping", name: "Shopping", icon: "🛍️", color: "#ec4899" },
      { id: "travel", name: "Travel", icon: "🚗", color: "#8b5cf6" },
      { id: "electricity", name: "Electricity", icon: "⚡", color: "#eab308" },
      { id: "medical", name: "Medical", icon: "💊", color: "#f59e0b" },
      { id: "gym", name: "Gym", icon: "💪", color: "#14b8a6" },
      { id: "entertainment", name: "Entertainment", icon: "🎬", color: "#6366f1" },
      { id: "courses", name: "Courses", icon: "📚", color: "#a855f7" },
      { id: "ai_subscription", name: "AI Subscription", icon: "🤖", color: "#ec4899" },
      { id: "bing_subscription", name: "Bing Subscription", icon: "🔍", color: "#06b6d4" },
      { id: "other_subscriptions", name: "Other Subscriptions", icon: "📱", color: "#f43f5e" },
      { id: "other", name: "Other", icon: "💰", color: "#64748b" },
    ];

    // Subscription categories (need period in days)
    this.SUBSCRIPTION_CATEGORIES = [
      { id: "rent", defaultPeriod: 30, name: "Rent" },
      { id: "electricity", defaultPeriod: 30, name: "Electricity" },
      { id: "gym", defaultPeriod: 90, name: "Gym Subscription" },
      { id: "ai_subscription", defaultPeriod: 30, name: "AI Subscription" },
      { id: "bing_subscription", defaultPeriod: 30, name: "Bing Subscription" },
      { id: "other_subscriptions", defaultPeriod: 30, name: "Other Subscriptions" },
      { id: "courses", defaultPeriod: 30, name: "Courses" },
    ];

    // Get subscription category IDs
    this.SUBSCRIPTION_CATEGORY_IDS = this.SUBSCRIPTION_CATEGORIES.map(c => c.id);

    // Fixed monthly expenses (distributed daily) - legacy, now handled by subscriptions
    this.FIXED_EXPENSES = [];
  }

  // Get all spending data
  getData() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const parsed = data ? JSON.parse(data) : {};
      return {
        dailyEntries: parsed.dailyEntries || {},
        fixedMonthly: parsed.fixedMonthly || {},
        subscriptions: parsed.subscriptions || {},
        settings: parsed.settings || { dailyBudget: 1500 },
        bankBalance: parsed.bankBalance || 0,
        balanceHistory: parsed.balanceHistory || [],
      };
    } catch (e) {
      console.error("Error reading money data:", e);
      return { dailyEntries: {}, fixedMonthly: {}, subscriptions: {}, settings: { dailyBudget: 1500 }, bankBalance: 0, balanceHistory: [] };
    }
  }

  // Get/set daily budget
  getDailyBudget() {
    const data = this.getData();
    return data.settings?.dailyBudget || 1500;
  }

  setDailyBudget(amount) {
    const data = this.getData();
    if (!data.settings) data.settings = {};
    data.settings.dailyBudget = parseFloat(amount) || 1500;
    this.saveData(data);
    return data.settings.dailyBudget;
  }

  // Bank balance methods
  getBankBalance() {
    const data = this.getData();
    return data.bankBalance || 0;
  }

  setBankBalance(amount) {
    const data = this.getData();
    data.bankBalance = parseFloat(amount) || 0;
    this.saveData(data);
    return data.bankBalance;
  }

  addMoney(amount, note = "") {
    const data = this.getData();
    const added = parseFloat(amount) || 0;
    data.bankBalance = (data.bankBalance || 0) + added;
    if (!data.balanceHistory) data.balanceHistory = [];
    data.balanceHistory.push({
      type: 'credit',
      amount: added,
      note,
      date: this.formatDate(new Date()),
      timestamp: Date.now(),
      balanceAfter: data.bankBalance,
    });
    this.saveData(data);
    return data.bankBalance;
  }

  deductMoney(amount, note = "") {
    const data = this.getData();
    const deducted = parseFloat(amount) || 0;
    data.bankBalance = (data.bankBalance || 0) - deducted;
    if (!data.balanceHistory) data.balanceHistory = [];
    data.balanceHistory.push({
      type: 'debit',
      amount: deducted,
      note,
      date: this.formatDate(new Date()),
      timestamp: Date.now(),
      balanceAfter: data.bankBalance,
    });
    this.saveData(data);
    return data.bankBalance;
  }

  getBalanceHistory(limit = 10) {
    const data = this.getData();
    const history = data.balanceHistory || [];
    return history.slice(-limit).reverse();
  }

  // Save to both cache AND cloud simultaneously
  async saveData(data) {
    // Save to cache immediately
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("moneyTrackingUpdated", { detail: data }));

    // Sync to cloud in background
    this.syncToCloud(data).catch(err => console.warn('Background sync failed:', err));
  }

  shouldFetchFromCloud() {
    const lastSync = localStorage.getItem(this.LAST_SYNC_KEY);
    if (!lastSync) return true;
    return Date.now() - parseInt(lastSync) > this.SYNC_INTERVAL;
  }

  async syncToCloud(data = null) {
    const auth = getAuth();
    if (!auth.currentUser) return { success: false, error: "Not authenticated" };

    try {
      const dataToSync = data || this.getData();
      const docRef = doc(db, "user_money_tracking", auth.currentUser.uid);
      await setDoc(docRef, { ...dataToSync, updatedAt: serverTimestamp() });
      localStorage.setItem(this.LAST_SYNC_KEY, Date.now().toString());
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async loadFromCloud(force = false) {
    if (!force && !this.shouldFetchFromCloud()) {
      return { success: true, fromCache: true };
    }

    const auth = getAuth();
    if (!auth.currentUser) return { success: false, error: "Not authenticated" };

    try {
      const docRef = doc(db, "user_money_tracking", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        delete cloudData.updatedAt;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cloudData));
        localStorage.setItem(this.LAST_SYNC_KEY, Date.now().toString());
        window.dispatchEvent(new CustomEvent("moneyTrackingUpdated"));
        return { success: true, data: cloudData };
      }
      return { success: false, error: "No data found" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Add/update daily spending with notes
  addDailySpending(date, category, amount, note = "") {
    const data = this.getData();
    const dateKey = this.formatDate(date);

    if (!data.dailyEntries[dateKey]) {
      data.dailyEntries[dateKey] = {};
    }

    data.dailyEntries[dateKey][category] = {
      amount: parseFloat(amount) || 0,
      note: note || "",
    };
    this.saveData(data);

    return data;
  }

  // Add/update subscription with period (days)
  addSubscription(category, amount, periodDays, startDate = new Date(), note = "") {
    const data = this.getData();
    if (!data.subscriptions) data.subscriptions = {};

    const startDateKey = this.formatDate(startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + periodDays - 1);
    const endDateKey = this.formatDate(endDate);

    data.subscriptions[category] = {
      amount: parseFloat(amount) || 0,
      periodDays: parseInt(periodDays) || 30,
      startDate: startDateKey,
      endDate: endDateKey,
      dailyAmount: Math.round((parseFloat(amount) / parseInt(periodDays)) * 100) / 100,
      note: note || "",
    };
    this.saveData(data);

    return data;
  }

  // Get active subscriptions for a given date
  getActiveSubscriptions(date) {
    const data = this.getData();
    const dateKey = this.formatDate(date);
    const active = [];

    if (!data.subscriptions) return active;

    Object.entries(data.subscriptions).forEach(([category, sub]) => {
      if (dateKey >= sub.startDate && dateKey <= sub.endDate) {
        active.push({
          category,
          ...sub,
        });
      }
    });

    return active;
  }

  // Get daily subscription amount for a date
  getDailySubscriptionAmount(date) {
    const active = this.getActiveSubscriptions(date);
    return active.reduce((sum, sub) => sum + (sub.dailyAmount || 0), 0);
  }

  // Set fixed monthly expense
  setFixedMonthly(category, amount) {
    const data = this.getData();
    data.fixedMonthly[category] = parseFloat(amount) || 0;
    this.saveData(data);

    return data;
  }

  // Get spending for a specific date
  getDailySpending(date) {
    const data = this.getData();
    const dateKey = this.formatDate(date);
    return data.dailyEntries[dateKey] || {};
  }

  // Get spending analysis for a period (7, 30, or 90 days)
  getSpendingAnalysis(days = 30) {
    const data = this.getData();
    const today = new Date();
    const categoryTotals = {};

    // Initialize category totals
    this.CATEGORIES.forEach(cat => {
      categoryTotals[cat.id] = 0;
    });

    // Sum up daily spending and subscriptions
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = this.formatDate(date);
      const daySpending = data.dailyEntries[dateKey] || {};

      // Add regular daily spending (exclude subscription categories as they're handled separately)
      Object.entries(daySpending).forEach(([category, value]) => {
        if (!this.SUBSCRIPTION_CATEGORY_IDS.includes(category)) {
          const amount = typeof value === 'object' ? (value.amount || 0) : value;
          categoryTotals[category] = (categoryTotals[category] || 0) + amount;
        }
      });

      // Add subscription daily amounts for this date
      const activeSubscriptions = this.getActiveSubscriptions(date);
      activeSubscriptions.forEach(sub => {
        categoryTotals[sub.category] = (categoryTotals[sub.category] || 0) + (sub.dailyAmount || 0);
      });
    }

    // Calculate total and percentages
    const total = Object.values(categoryTotals).reduce((sum, amt) => sum + amt, 0);
    const breakdown = this.CATEGORIES.map(cat => ({
      ...cat,
      amount: Math.round(categoryTotals[cat.id] || 0),
      percentage: total > 0 ? Math.round((categoryTotals[cat.id] / total) * 100) : 0,
    })).filter(cat => cat.amount > 0);

    return {
      total: Math.round(total),
      breakdown,
      period: days,
      dailyAverage: Math.round(total / days),
    };
  }

  // Get spending trends (last 7/30 days)
  getSpendingTrends(days = 7) {
    const data = this.getData();
    const trends = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = this.formatDate(date);
      const daySpending = data.dailyEntries[dateKey] || {};

      // Sum regular expenses (exclude subscription categories)
      let total = Object.entries(daySpending).reduce((sum, [category, value]) => {
        if (this.SUBSCRIPTION_CATEGORY_IDS.includes(category)) return sum;
        const amount = typeof value === 'object' ? (value.amount || 0) : value;
        return sum + amount;
      }, 0);

      // Add daily subscription amounts
      total += this.getDailySubscriptionAmount(date);

      trends.push({
        date: dateKey,
        total: Math.round(total),
        label: this.formatDateLabel(date),
      });
    }

    return trends;
  }

  // Get all subscriptions
  getAllSubscriptions() {
    const data = this.getData();
    return data.subscriptions || {};
  }

  // Delete a subscription
  deleteSubscription(category) {
    const data = this.getData();
    if (data.subscriptions && data.subscriptions[category]) {
      delete data.subscriptions[category];
      this.saveData(data);
    }
    return data;
  }

  // Format date as YYYY-MM-DD
  formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Format date for display
  formatDateLabel(date) {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  // Legacy methods for backward compatibility
  async syncToFirebase() { return await this.syncToCloud(); }
  async loadFromFirebase() { return await this.loadFromCloud(true); }
}

const moneyTrackingService = new MoneyTrackingService();
export default moneyTrackingService;
