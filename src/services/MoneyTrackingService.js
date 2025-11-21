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
      { id: "gifts", name: "Gifts", icon: "🎁", color: "#f59e0b" },
      { id: "gym", name: "Gym", icon: "💪", color: "#14b8a6" },
      { id: "entertainment", name: "Entertainment", icon: "🎬", color: "#6366f1" },
      { id: "courses", name: "Courses", icon: "📚", color: "#a855f7" },
      { id: "ai_subscription", name: "AI Subscription", icon: "🤖", color: "#ec4899" },
      { id: "bing_subscription", name: "Bing Subscription", icon: "🔍", color: "#06b6d4" },
      { id: "other_subscriptions", name: "Other Subscriptions", icon: "📱", color: "#f43f5e" },
      { id: "other", name: "Other", icon: "💰", color: "#64748b" },
    ];

    // Subscription categories (need period)
    this.SUBSCRIPTION_CATEGORIES = ["courses", "ai_subscription", "bing_subscription", "other_subscriptions"];

    // Fixed monthly expenses (distributed daily)
    this.FIXED_EXPENSES = ["rent", "electricity", "gym"];
  }

  // Get all spending data
  getData() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : { dailyEntries: {}, fixedMonthly: {}, subscriptions: {} };
    } catch (e) {
      console.error("Error reading money data:", e);
      return { dailyEntries: {}, fixedMonthly: {}, subscriptions: {} };
    }
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

  // Add/update subscription with period
  addSubscription(date, category, amount, period, note = "") {
    const data = this.getData();
    const dateKey = this.formatDate(date);

    if (!data.dailyEntries[dateKey]) {
      data.dailyEntries[dateKey] = {};
    }

    data.dailyEntries[dateKey][category] = {
      amount: parseFloat(amount) || 0,
      period: period || "monthly", // monthly, yearly, etc.
      note: note || "",
    };
    this.saveData(data);

    return data;
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

    // Sum up daily spending
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = this.formatDate(date);
      const daySpending = data.dailyEntries[dateKey] || {};

      Object.entries(daySpending).forEach(([category, value]) => {
        // Handle both old format (number) and new format (object with amount)
        const amount = typeof value === 'object' ? (value.amount || 0) : value;
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      });
    }

    // Add distributed fixed costs
    this.FIXED_EXPENSES.forEach(category => {
      const monthlyAmount = data.fixedMonthly[category] || 0;
      const dailyAmount = monthlyAmount / 30; // Divide monthly by 30 days
      categoryTotals[category] += dailyAmount * days;
    });

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

      // Handle both old format (number) and new format (object with amount)
      const total = Object.values(daySpending).reduce((sum, value) => {
        const amount = typeof value === 'object' ? (value.amount || 0) : value;
        return sum + amount;
      }, 0);

      trends.push({
        date: dateKey,
        total: Math.round(total),
        label: this.formatDateLabel(date),
      });
    }

    return trends;
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
