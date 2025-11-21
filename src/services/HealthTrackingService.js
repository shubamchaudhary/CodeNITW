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
      { id: 'breakfast', label: 'Breakfast', icon: '🌅', time: '8:00 AM' },
      { id: 'lunch', label: 'Lunch', icon: '☀️', time: '1:00 PM' },
      { id: 'dinner', label: 'Dinner', icon: '🌙', time: '8:00 PM' },
    ];

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
    let score = 50;
    const meals = entry.meals || {};
    const food = entry.food || {};

    // Meals score (+15 each)
    if (meals.breakfast?.checked) score += 15;
    if (meals.lunch?.checked) score += 15;
    if (meals.dinner?.checked) score += 15;

    // Water score (max +10, scaled)
    const water = food.water || 0;
    score += Math.min(10, (water / 4) * 10);

    // Junk penalty
    if (food.junk?.had) score -= 20;

    // Healthy additions
    if (food.fruits?.had) score += 5;
    if (food.dry_fruits?.had) score += 5;
    if (food.protein_shake?.had) score += 5;

    return Math.max(0, Math.min(100, Math.round(score)));
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
