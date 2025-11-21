import { db } from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * HealthTrackingService - Redesigned with smart sync
 * Tracks: meals, water, junk, tea/coffee, fruits, dry fruits, protein shake, sleep, gym
 */
class HealthTrackingService {
  constructor() {
    this.STORAGE_KEY = "HealthTrackingData";
    this.LAST_SYNC_KEY = "HealthTrackingLastSync";
    this.SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes

    // Meals configuration
    this.MEALS = [
      { id: 'breakfast', label: 'Breakfast', icon: '🌅', time: '9:00 AM' },
      { id: 'lunch', label: 'Lunch', icon: '☀️', time: '1:00 PM' },
      { id: 'snacks', label: 'Snacks', icon: '🍿', time: '7:00 PM' },
      { id: 'dinner', label: 'Dinner', icon: '🌙', time: '10:00 PM' },
    ];

    // Sleep expectations
    this.EXPECTED_SLEEP_TIME = '00:30'; // 12:30 AM
    this.EXPECTED_WAKE_TIME = '08:00';  // 8:00 AM

    // Food items with scoring
    this.FOOD_ITEMS = [
      { id: 'water', label: 'Water', icon: '💧', unit: 'L', target: 4, type: 'quantity' },
      { id: 'junk', label: 'Junk Food', icon: '🍔', type: 'bad', score: -20 },
      { id: 'tea_coffee', label: 'Tea/Coffee', icon: '☕', type: 'neutral', score: 0 },
      { id: 'fruits', label: 'Fruits', icon: '🍎', type: 'good', score: 5 },
      { id: 'dry_fruits', label: 'Dry Fruits', icon: '🥜', type: 'good', score: 5 },
      { id: 'protein_shake', label: 'Protein Shake', icon: '🥤', type: 'good', score: 5 },
    ];

    // Exercise types
    this.EXERCISE_TYPES = [
      { id: 'chest', label: 'Chest', icon: '💪' },
      { id: 'back', label: 'Back', icon: '🔙' },
      { id: 'shoulders', label: 'Shoulders', icon: '🎯' },
      { id: 'arms', label: 'Arms', icon: '💪' },
      { id: 'legs', label: 'Legs', icon: '🦵' },
      { id: 'core', label: 'Core', icon: '🎯' },
      { id: 'cardio', label: 'Cardio', icon: '🏃' },
    ];
  }

  // ==================== SMART SYNC METHODS ====================

  getData() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : { dailyEntries: {} };
    } catch (e) {
      return { dailyEntries: {} };
    }
  }

  // Save to both cache AND cloud simultaneously
  async saveData(data) {
    // Save to cache immediately
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("healthTrackingUpdated", { detail: data }));

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
      const docRef = doc(db, "user_health_tracking", auth.currentUser.uid);
      await setDoc(docRef, {
        ...dataToSync,
        updatedAt: serverTimestamp(),
      });
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
      const docRef = doc(db, "user_health_tracking", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const cloudData = docSnap.data();
        delete cloudData.updatedAt;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cloudData));
        localStorage.setItem(this.LAST_SYNC_KEY, Date.now().toString());
        window.dispatchEvent(new CustomEvent("healthTrackingUpdated"));
        return { success: true, data: cloudData };
      }
      return { success: false, error: "No data found" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Legacy methods
  async syncToFirebase() { return await this.syncToCloud(); }
  async loadFromFirebase() { return await this.loadFromCloud(true); }

  // ==================== DATA METHODS ====================

  getEntry(date) {
    const data = this.getData();
    const dateKey = this.formatDate(date);
    return data.dailyEntries[dateKey] || this.getEmptyEntry();
  }

  getEmptyEntry() {
    return {
      meals: {},
      food: {},
      sleep: { bedTime: '', wakeTime: '', hours: 0 },
      gym: { attended: false, duration: 0, exercises: [] },
    };
  }

  async saveEntry(date, entry) {
    const data = this.getData();
    const dateKey = this.formatDate(date);
    data.dailyEntries[dateKey] = entry;
    await this.saveData(data);
    return { success: true };
  }

  // ==================== CALCULATIONS ====================

  calculateSleepHours(bedTime, wakeTime) {
    if (!bedTime || !wakeTime) return 0;
    try {
      const [bedH, bedM] = bedTime.split(':').map(Number);
      const [wakeH, wakeM] = wakeTime.split(':').map(Number);

      let bedMinutes = bedH * 60 + bedM;
      let wakeMinutes = wakeH * 60 + wakeM;

      if (wakeMinutes < bedMinutes) wakeMinutes += 24 * 60;
      return Math.round((wakeMinutes - bedMinutes) / 60 * 10) / 10;
    } catch {
      return 0;
    }
  }

  calculateEatingScore(entry) {
    let score = 0; // Start from 0
    const meals = entry.meals || {};
    const food = entry.food || {};

    // Meals score (+10 each, max 40)
    if (meals.breakfast?.checked) score += 10;
    if (meals.lunch?.checked) score += 10;
    if (meals.snacks?.checked) score += 10;
    if (meals.dinner?.checked) score += 10;

    // Water score: 2.5 points per liter, max 10 points (up to 4L)
    const water = this.getWaterValue(food);
    score += Math.min(10, water * 2.5);

    // Gym: +20 points
    if (entry.gym?.attended) score += 20;

    // Fruits: +10 points
    if (food.fruits?.had) score += 10;

    // Dry Fruits: +10 points
    if (food.dry_fruits?.had) score += 10;

    // Sleep score: +20 points (with deductions)
    score += this.calculateSleepScore(entry.sleep);

    // Junk penalty: -20 points
    if (food.junk?.had) score -= 20;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // Helper to get water value (handles both old and new format)
  getWaterValue(food) {
    if (!food.water) return 0;
    // Handle nested object format {water: {water: value}} or direct value
    if (typeof food.water === 'object') {
      return parseFloat(food.water.water) || parseFloat(food.water.value) || 0;
    }
    return parseFloat(food.water) || 0;
  }

  calculateSleepScore(sleep) {
    if (!sleep?.bedTime || !sleep?.wakeTime) return 0;

    let sleepScore = 20; // Start with full points
    const sleepHours = this.calculateSleepHours(sleep.bedTime, sleep.wakeTime);

    // Expected: 7.5 hours (12:30 AM to 8:00 AM)
    const expectedHours = 7.5;

    // Deduct for sleeping less or more than expected
    const hoursDiff = Math.abs(sleepHours - expectedHours);
    if (hoursDiff > 2) {
      sleepScore -= 10; // Major deviation
    } else if (hoursDiff > 1) {
      sleepScore -= 5; // Moderate deviation
    }

    // Parse bed time and check if sleeping late
    const [bedH, bedM] = sleep.bedTime.split(':').map(Number);
    const bedMinutes = bedH * 60 + bedM;

    // Expected bed time: 00:30 (12:30 AM) = 30 minutes
    // Allow some tolerance: 23:30 to 01:30 is okay
    // Late is after 01:30 (90 minutes)
    const earlyNightMinutes = bedH < 12 ? bedMinutes : bedMinutes - 24 * 60;
    if (earlyNightMinutes > 90) { // After 1:30 AM
      sleepScore -= 5; // Sleeping too late
    } else if (earlyNightMinutes < -60) { // Before 11:00 PM
      sleepScore -= 3; // Sleeping too early (unusual)
    }

    // Parse wake time and check if waking late
    const [wakeH, wakeM] = sleep.wakeTime.split(':').map(Number);
    const wakeMinutes = wakeH * 60 + wakeM;

    // Expected wake: 08:00 = 480 minutes
    // Late wake is after 09:00 (540 minutes)
    if (wakeMinutes > 540) {
      sleepScore -= 5; // Waking too late
    } else if (wakeMinutes < 360) { // Before 6:00 AM
      sleepScore -= 3; // Waking too early
    }

    return Math.max(0, sleepScore);
  }

  // ==================== STATISTICS ====================

  getStats(days = 7) {
    const data = this.getData();
    const today = new Date();
    const stats = {
      sleepData: [],
      gymData: [],
      eatingScoreData: [],
      averageSleep: 0,
      averageEatingScore: 0,
      gymDays: 0,
      totalGymDuration: 0,
      avgGymDuration: 0,
    };

    let totalSleep = 0, sleepDays = 0, totalEatingScore = 0;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = this.formatDate(date);
      const entry = data.dailyEntries[dateKey] || this.getEmptyEntry();

      const sleepHours = entry.sleep?.hours || 0;
      const gymDuration = entry.gym?.attended ? (entry.gym.duration || 0) : 0;
      const eatingScore = this.calculateEatingScore(entry);

      stats.sleepData.push({ date: dateKey, label: this.formatDateLabel(date), value: sleepHours });
      stats.gymData.push({ date: dateKey, label: this.formatDateLabel(date), value: gymDuration });
      stats.eatingScoreData.push({ date: dateKey, label: this.formatDateLabel(date), value: eatingScore });

      if (sleepHours > 0) { totalSleep += sleepHours; sleepDays++; }
      if (entry.gym?.attended) { stats.gymDays++; stats.totalGymDuration += gymDuration; }
      totalEatingScore += eatingScore;
    }

    stats.averageSleep = sleepDays > 0 ? Math.round(totalSleep / sleepDays * 10) / 10 : 0;
    stats.averageEatingScore = Math.round(totalEatingScore / days);
    stats.avgGymDuration = stats.gymDays > 0 ? Math.round(stats.totalGymDuration / stats.gymDays) : 0;

    return stats;
  }

  formatDate(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  formatDateLabel(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }
}

const healthTrackingService = new HealthTrackingService();
export default healthTrackingService;
