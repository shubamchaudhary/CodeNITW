// Money Tracking Service
// Manages daily spending and subscription tracking with auto-distribution

const STORAGE_KEY = 'moneyTrackingData';

// Spending categories
const CATEGORIES = {
  // Regular daily expenses
  food: { id: 'food', name: 'Food', emoji: '🍔', type: 'daily' },
  travel: { id: 'travel', name: 'Travel', emoji: '🚗', type: 'daily' },
  shopping: { id: 'shopping', name: 'Shopping', emoji: '🛍️', type: 'daily' },
  entertainment: { id: 'entertainment', name: 'Entertainment', emoji: '🎬', type: 'daily' },
  gifts: { id: 'gifts', name: 'Gifts', emoji: '🎁', type: 'daily' },
  medical: { id: 'medical', name: 'Medical', emoji: '💊', type: 'daily' },
  other: { id: 'other', name: 'Other', emoji: '📦', type: 'daily' },

  // Subscription/Fixed expenses
  rent: { id: 'rent', name: 'Rent', emoji: '🏠', type: 'subscription', defaultPeriod: 30 },
  electricity: { id: 'electricity', name: 'Electricity', emoji: '⚡', type: 'subscription', defaultPeriod: 30 },
  gymSubscription: { id: 'gymSubscription', name: 'Gym Subscription', emoji: '🏋️', type: 'subscription', defaultPeriod: 30 },
  aiSubscription: { id: 'aiSubscription', name: 'AI Subscriptions', emoji: '🤖', type: 'subscription', defaultPeriod: 30 },
  bingSubscription: { id: 'bingSubscription', name: 'Bing/Microsoft', emoji: '🔍', type: 'subscription', defaultPeriod: 30 },
  otherSubscription: { id: 'otherSubscription', name: 'Other Subscriptions', emoji: '📱', type: 'subscription', defaultPeriod: 30 },
};

class MoneyTrackingService {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {
        dailyEntries: {},
        subscriptions: []
      };
    } catch (e) {
      console.error('Error loading money tracking data:', e);
      return { dailyEntries: {}, subscriptions: [] };
    }
  }

  saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      window.dispatchEvent(new CustomEvent('moneyTrackingUpdated'));
    } catch (e) {
      console.error('Error saving money tracking data:', e);
    }
  }

  getTodayKey() {
    return new Date().toISOString().split('T')[0];
  }

  getCategories() {
    return CATEGORIES;
  }

  getDailyCategories() {
    return Object.values(CATEGORIES).filter(c => c.type === 'daily');
  }

  getSubscriptionCategories() {
    return Object.values(CATEGORIES).filter(c => c.type === 'subscription');
  }

  // Get daily entry for a specific date
  getDailyEntry(date = this.getTodayKey()) {
    if (!this.data.dailyEntries[date]) {
      this.data.dailyEntries[date] = {};
    }
    return this.data.dailyEntries[date];
  }

  // Add/update daily spending
  updateDailySpending(categoryId, amount, date = this.getTodayKey()) {
    if (!this.data.dailyEntries[date]) {
      this.data.dailyEntries[date] = {};
    }
    this.data.dailyEntries[date][categoryId] = parseFloat(amount) || 0;
    this.saveData();
  }

  // Add a subscription
  addSubscription(categoryId, amount, periodDays, startDate = this.getTodayKey()) {
    const subscription = {
      id: `${categoryId}_${Date.now()}`,
      categoryId,
      totalAmount: parseFloat(amount),
      periodDays: parseInt(periodDays),
      startDate,
      dailyAmount: parseFloat(amount) / parseInt(periodDays),
      endDate: this.calculateEndDate(startDate, periodDays),
      createdAt: new Date().toISOString()
    };

    this.data.subscriptions.push(subscription);
    this.saveData();
    return subscription;
  }

  // Calculate end date
  calculateEndDate(startDate, periodDays) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + periodDays - 1);
    return date.toISOString().split('T')[0];
  }

  // Check if a date is within subscription period
  isDateInSubscriptionPeriod(subscription, date) {
    return date >= subscription.startDate && date <= subscription.endDate;
  }

  // Get active subscriptions for a date
  getActiveSubscriptions(date = this.getTodayKey()) {
    return this.data.subscriptions.filter(sub =>
      this.isDateInSubscriptionPeriod(sub, date)
    );
  }

  // Get all subscriptions (for management)
  getAllSubscriptions() {
    return this.data.subscriptions || [];
  }

  // Delete a subscription
  deleteSubscription(subscriptionId) {
    this.data.subscriptions = this.data.subscriptions.filter(
      sub => sub.id !== subscriptionId
    );
    this.saveData();
  }

  // Calculate subscription expense for a date (auto-distributed)
  getSubscriptionExpenseForDate(date = this.getTodayKey()) {
    const activeSubscriptions = this.getActiveSubscriptions(date);
    const subscriptionBreakdown = {};
    let total = 0;

    activeSubscriptions.forEach(sub => {
      if (!subscriptionBreakdown[sub.categoryId]) {
        subscriptionBreakdown[sub.categoryId] = 0;
      }
      subscriptionBreakdown[sub.categoryId] += sub.dailyAmount;
      total += sub.dailyAmount;
    });

    return {
      total,
      breakdown: subscriptionBreakdown,
      activeSubscriptions
    };
  }

  // Get total spending for a date (daily + subscriptions)
  getTotalForDate(date = this.getTodayKey()) {
    const dailyEntry = this.getDailyEntry(date);
    const subscriptionExpense = this.getSubscriptionExpenseForDate(date);

    let dailyTotal = 0;
    Object.values(dailyEntry).forEach(amount => {
      dailyTotal += parseFloat(amount) || 0;
    });

    return {
      dailyTotal,
      subscriptionTotal: subscriptionExpense.total,
      grandTotal: dailyTotal + subscriptionExpense.total,
      dailyBreakdown: dailyEntry,
      subscriptionBreakdown: subscriptionExpense.breakdown,
      activeSubscriptions: subscriptionExpense.activeSubscriptions
    };
  }

  // Get spending analysis for a period
  getSpendingAnalysis(days = 7) {
    const analysis = {
      totalSpent: 0,
      dailyAverage: 0,
      categoryBreakdown: {},
      subscriptionBreakdown: {},
      dailyTrend: []
    };

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];

      const dayTotal = this.getTotalForDate(dateKey);
      analysis.totalSpent += dayTotal.grandTotal;

      // Add to daily trend
      analysis.dailyTrend.push({
        date: dateKey,
        total: dayTotal.grandTotal,
        daily: dayTotal.dailyTotal,
        subscriptions: dayTotal.subscriptionTotal
      });

      // Accumulate category breakdown
      Object.entries(dayTotal.dailyBreakdown).forEach(([cat, amount]) => {
        if (!analysis.categoryBreakdown[cat]) {
          analysis.categoryBreakdown[cat] = 0;
        }
        analysis.categoryBreakdown[cat] += parseFloat(amount) || 0;
      });

      // Accumulate subscription breakdown
      Object.entries(dayTotal.subscriptionBreakdown).forEach(([cat, amount]) => {
        if (!analysis.subscriptionBreakdown[cat]) {
          analysis.subscriptionBreakdown[cat] = 0;
        }
        analysis.subscriptionBreakdown[cat] += amount;
      });
    }

    analysis.dailyAverage = analysis.totalSpent / days;
    analysis.dailyTrend.reverse(); // Oldest first

    return analysis;
  }

  // Get monthly projection
  getMonthlyProjection() {
    const analysis = this.getSpendingAnalysis(30);
    const activeSubscriptions = this.getActiveSubscriptions();

    // Calculate remaining subscription costs this month
    let monthlySubscriptionCost = 0;
    activeSubscriptions.forEach(sub => {
      // Calculate days remaining in this month
      const today = new Date();
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const subEnd = new Date(sub.endDate);
      const effectiveEnd = subEnd < endOfMonth ? subEnd : endOfMonth;

      const daysRemaining = Math.max(0, Math.ceil((effectiveEnd - today) / (1000 * 60 * 60 * 24)));
      monthlySubscriptionCost += sub.dailyAmount * daysRemaining;
    });

    return {
      currentMonthSpent: analysis.totalSpent,
      dailyAverage: analysis.dailyAverage,
      projectedMonthlySpend: analysis.dailyAverage * 30,
      activeSubscriptionMonthly: monthlySubscriptionCost
    };
  }

  // Clear all data
  clearAll() {
    this.data = { dailyEntries: {}, subscriptions: [] };
    this.saveData();
  }
}

const moneyTrackingService = new MoneyTrackingService();
export default moneyTrackingService;
