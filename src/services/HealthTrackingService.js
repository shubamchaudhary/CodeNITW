import { db } from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

/**
 * HealthTrackingService - Track food, sleep, and gym habits
 */
class HealthTrackingService {
  constructor() {
    this.STORAGE_KEY = "HealthTrackingData";

    this.FOOD_ITEMS = [
      { id: "fruits", label: "Ate fruits today?", icon: "🍎" },
      { id: "protein_shake", label: "Protein shake?", icon: "🥤" },
      { id: "tea", label: "Tea?", icon: "☕" },
      { id: "vegetables", label: "Vegetables?", icon: "🥗" },
      { id: "water_8glasses", label: "8 glasses of water?", icon: "💧" },
      { id: "breakfast", label: "Healthy breakfast?", icon: "🍳" },
      { id: "junk_food", label: "Avoided junk food?", icon: "🚫🍔" },
    ];

    this.EXERCISE_TYPES = [
      "Chest", "Back", "Shoulders", "Arms", "Legs", "Core",
      "Cardio", "Full Body", "Stretching", "Other"
    ];
  }

  // Get all health data
  getData() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : { dailyEntries: {} };
    } catch (e) {
      console.error("Error reading health data:", e);
      return { dailyEntries: {} };
    }
  }

  // Save health data
  saveData(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));

    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent("healthTrackingUpdated", { detail: data }));
  }

  // Get entry for a specific date
  getEntry(date) {
    const data = this.getData();
    const dateKey = this.formatDate(date);
    return data.dailyEntries[dateKey] || {
      food: {},
      sleep: { bedTime: "", wakeTime: "" },
      gym: { attended: false, duration: 0, exercises: [] },
    };
  }

  // Update food item for a date
  updateFood(date, foodId, checked) {
    const data = this.getData();
    const dateKey = this.formatDate(date);

    if (!data.dailyEntries[dateKey]) {
      data.dailyEntries[dateKey] = {
        food: {},
        sleep: { bedTime: "", wakeTime: "" },
        gym: { attended: false, duration: 0, exercises: [] },
      };
    }

    data.dailyEntries[dateKey].food[foodId] = checked;
    this.saveData(data);

    return data;
  }

  // Update sleep schedule for a date
  updateSleep(date, bedTime, wakeTime) {
    const data = this.getData();
    const dateKey = this.formatDate(date);

    if (!data.dailyEntries[dateKey]) {
      data.dailyEntries[dateKey] = {
        food: {},
        sleep: { bedTime: "", wakeTime: "" },
        gym: { attended: false, duration: 0, exercises: [] },
      };
    }

    data.dailyEntries[dateKey].sleep = { bedTime, wakeTime };
    this.saveData(data);

    return data;
  }

  // Update gym session for a date
  updateGym(date, attended, duration = 0, exercises = []) {
    const data = this.getData();
    const dateKey = this.formatDate(date);

    if (!data.dailyEntries[dateKey]) {
      data.dailyEntries[dateKey] = {
        food: {},
        sleep: { bedTime: "", wakeTime: "" },
        gym: { attended: false, duration: 0, exercises: [] },
      };
    }

    data.dailyEntries[dateKey].gym = { attended, duration, exercises };
    this.saveData(data);

    return data;
  }

  // Get health stats for a period
  getHealthStats(days = 7) {
    const data = this.getData();
    const today = new Date();
    const stats = {
      food: {},
      sleepHours: [],
      gymDays: 0,
      totalGymMinutes: 0,
      exerciseCount: {},
    };

    // Initialize food stats
    this.FOOD_ITEMS.forEach(item => {
      stats.food[item.id] = { count: 0, percentage: 0 };
    });

    let validDays = 0;

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = this.formatDate(date);
      const entry = data.dailyEntries[dateKey];

      if (entry) {
        validDays++;

        // Food stats
        Object.entries(entry.food || {}).forEach(([foodId, checked]) => {
          if (checked && stats.food[foodId]) {
            stats.food[foodId].count++;
          }
        });

        // Sleep stats
        if (entry.sleep?.bedTime && entry.sleep?.wakeTime) {
          const hours = this.calculateSleepHours(entry.sleep.bedTime, entry.sleep.wakeTime);
          if (hours > 0) {
            stats.sleepHours.push(hours);
          }
        }

        // Gym stats
        if (entry.gym?.attended) {
          stats.gymDays++;
          stats.totalGymMinutes += entry.gym.duration || 0;

          (entry.gym.exercises || []).forEach(exercise => {
            stats.exerciseCount[exercise] = (stats.exerciseCount[exercise] || 0) + 1;
          });
        }
      }
    }

    // Calculate percentages
    Object.keys(stats.food).forEach(foodId => {
      stats.food[foodId].percentage = validDays > 0
        ? Math.round((stats.food[foodId].count / validDays) * 100)
        : 0;
    });

    // Average sleep
    stats.averageSleep = stats.sleepHours.length > 0
      ? (stats.sleepHours.reduce((sum, h) => sum + h, 0) / stats.sleepHours.length).toFixed(1)
      : 0;

    stats.gymPercentage = validDays > 0 ? Math.round((stats.gymDays / validDays) * 100) : 0;
    stats.avgGymDuration = stats.gymDays > 0 ? Math.round(stats.totalGymMinutes / stats.gymDays) : 0;

    return stats;
  }

  // Calculate sleep duration
  calculateSleepHours(bedTime, wakeTime) {
    if (!bedTime || !wakeTime) return 0;

    try {
      const bed = new Date(`2000-01-01T${bedTime}`);
      let wake = new Date(`2000-01-01T${wakeTime}`);

      // If wake time is before bed time, it's next day
      if (wake < bed) {
        wake = new Date(`2000-01-02T${wakeTime}`);
      }

      const diff = wake - bed;
      return diff / (1000 * 60 * 60); // Convert to hours
    } catch (e) {
      return 0;
    }
  }

  // Format date as YYYY-MM-DD
  formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // ==================== FIREBASE SYNC ====================

  async syncToFirebase() {
    const auth = getAuth();
    if (!auth.currentUser) return { success: false, error: "Not authenticated" };

    try {
      const data = this.getData();
      const docRef = doc(db, "user_health_tracking", auth.currentUser.uid);
      await setDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error("Error syncing health tracking data:", error);
      return { success: false, error: error.message };
    }
  }

  async loadFromFirebase() {
    const auth = getAuth();
    if (!auth.currentUser) return { success: false, error: "Not authenticated" };

    try {
      const docRef = doc(db, "user_health_tracking", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        delete data.updatedAt; // Remove timestamp
        this.saveData(data);
        return { success: true, data };
      }

      return { success: false, error: "No data found" };
    } catch (error) {
      console.error("Error loading health tracking data:", error);
      return { success: false, error: error.message };
    }
  }
}

const healthTrackingService = new HealthTrackingService();
export default healthTrackingService;
