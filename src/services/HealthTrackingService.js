// Health Tracking Service
// Manages daily health tracking with proper scoring

const STORAGE_KEY = 'healthTrackingData';
const SUBSCRIPTIONS_KEY = 'healthTrackingSubscriptions';

// Expected times
const EXPECTED_SLEEP_TIME = '00:30'; // 12:30 AM
const EXPECTED_WAKE_TIME = '08:00'; // 8:00 AM
const MEAL_TIMES = {
  breakfast: '09:00',
  lunch: '13:00',
  snack: '19:00',
  dinner: '22:00'
};

// Scoring weights
const SCORING = {
  breakfast: 10,
  lunch: 10,
  snack: 10,
  dinner: 10,
  waterPerLiter: 2.5,
  maxWaterLiters: 4,
  gym: 20,
  fruits: 10,
  dryFruits: 10,
  sleepSchedule: 20,
  junkPenalty: -20
};

class HealthTrackingService {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : { entries: {} };
    } catch (e) {
      console.error('Error loading health tracking data:', e);
      return { entries: {} };
    }
  }

  saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      window.dispatchEvent(new CustomEvent('healthTrackingUpdated'));
    } catch (e) {
      console.error('Error saving health tracking data:', e);
    }
  }

  getTodayKey() {
    return new Date().toISOString().split('T')[0];
  }

  getEntry(date = this.getTodayKey()) {
    if (!this.data.entries[date]) {
      this.data.entries[date] = {
        meals: {
          breakfast: { eaten: false, time: null },
          lunch: { eaten: false, time: null },
          snack: { eaten: false, time: null },
          dinner: { eaten: false, time: null }
        },
        water: 0, // in liters
        gym: false,
        fruits: false,
        dryFruits: false,
        junk: false,
        sleep: {
          bedTime: null,
          wakeTime: null
        }
      };
    }
    return this.data.entries[date];
  }

  updateMeal(meal, eaten, time = null, date = this.getTodayKey()) {
    const entry = this.getEntry(date);
    entry.meals[meal] = { eaten, time };
    this.saveData();
    return this.calculateScore(date);
  }

  updateWater(liters, date = this.getTodayKey()) {
    const entry = this.getEntry(date);
    entry.water = Math.max(0, Math.min(liters, 10)); // Cap at 10 liters for safety
    this.saveData();
    return this.calculateScore(date);
  }

  updateGym(attended, date = this.getTodayKey()) {
    const entry = this.getEntry(date);
    entry.gym = attended;
    this.saveData();
    return this.calculateScore(date);
  }

  updateFruits(eaten, date = this.getTodayKey()) {
    const entry = this.getEntry(date);
    entry.fruits = eaten;
    this.saveData();
    return this.calculateScore(date);
  }

  updateDryFruits(eaten, date = this.getTodayKey()) {
    const entry = this.getEntry(date);
    entry.dryFruits = eaten;
    this.saveData();
    return this.calculateScore(date);
  }

  updateJunk(eaten, date = this.getTodayKey()) {
    const entry = this.getEntry(date);
    entry.junk = eaten;
    this.saveData();
    return this.calculateScore(date);
  }

  updateSleep(bedTime, wakeTime, date = this.getTodayKey()) {
    const entry = this.getEntry(date);
    entry.sleep = { bedTime, wakeTime };
    this.saveData();
    return this.calculateScore(date);
  }

  // Parse time string "HH:MM" to minutes since midnight
  parseTime(timeStr) {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Calculate sleep duration in hours
  calculateSleepDuration(bedTime, wakeTime) {
    if (!bedTime || !wakeTime) return 0;

    let bedMinutes = this.parseTime(bedTime);
    let wakeMinutes = this.parseTime(wakeTime);

    // If bed time is after midnight (e.g., 00:30), it's already correct
    // If bed time is before midnight (e.g., 23:00), we need to add 24 hours to wake time
    if (bedMinutes > wakeMinutes) {
      wakeMinutes += 24 * 60;
    }

    const durationMinutes = wakeMinutes - bedMinutes;
    return durationMinutes / 60;
  }

  // Calculate sleep score based on timing and duration
  calculateSleepScore(bedTime, wakeTime) {
    if (!bedTime || !wakeTime) return 0;

    let score = SCORING.sleepSchedule;

    const expectedBed = this.parseTime(EXPECTED_SLEEP_TIME);
    const expectedWake = this.parseTime(EXPECTED_WAKE_TIME);
    const actualBed = this.parseTime(bedTime);
    const actualWake = this.parseTime(wakeTime);

    // Expected duration: 7.5 hours (00:30 to 08:00)
    const expectedDuration = 7.5;
    const actualDuration = this.calculateSleepDuration(bedTime, wakeTime);

    // Penalty for sleep duration deviation (2 points per hour difference)
    const durationDiff = Math.abs(actualDuration - expectedDuration);
    score -= Math.min(10, durationDiff * 2);

    // Penalty for bedtime deviation (1 point per 30 minutes)
    // Handle the case where bed time could be before or after midnight
    let bedDiff;
    if (actualBed > 12 * 60) {
      // Bed time is in the evening (e.g., 23:00 = 1380 minutes)
      // Expected is 00:30 = 30 minutes, so we need to calculate properly
      bedDiff = Math.abs((24 * 60 - actualBed) + expectedBed);
    } else {
      bedDiff = Math.abs(actualBed - expectedBed);
    }
    score -= Math.min(5, (bedDiff / 30));

    // Penalty for wake time deviation (1 point per 30 minutes)
    const wakeDiff = Math.abs(actualWake - expectedWake);
    score -= Math.min(5, (wakeDiff / 30));

    return Math.max(0, score);
  }

  calculateScore(date = this.getTodayKey()) {
    const entry = this.getEntry(date);
    let score = 0; // Start at 0

    const breakdown = {
      breakfast: 0,
      lunch: 0,
      snack: 0,
      dinner: 0,
      water: 0,
      gym: 0,
      fruits: 0,
      dryFruits: 0,
      sleep: 0,
      junk: 0
    };

    // Meals (10 points each)
    if (entry.meals.breakfast.eaten) {
      breakdown.breakfast = SCORING.breakfast;
      score += SCORING.breakfast;
    }
    if (entry.meals.lunch.eaten) {
      breakdown.lunch = SCORING.lunch;
      score += SCORING.lunch;
    }
    if (entry.meals.snack.eaten) {
      breakdown.snack = SCORING.snack;
      score += SCORING.snack;
    }
    if (entry.meals.dinner.eaten) {
      breakdown.dinner = SCORING.dinner;
      score += SCORING.dinner;
    }

    // Water (2.5 points per liter, max 4 liters = 10 points)
    const waterScore = Math.min(entry.water, SCORING.maxWaterLiters) * SCORING.waterPerLiter;
    breakdown.water = waterScore;
    score += waterScore;

    // Gym (20 points)
    if (entry.gym) {
      breakdown.gym = SCORING.gym;
      score += SCORING.gym;
    }

    // Fruits (10 points)
    if (entry.fruits) {
      breakdown.fruits = SCORING.fruits;
      score += SCORING.fruits;
    }

    // Dry Fruits (10 points)
    if (entry.dryFruits) {
      breakdown.dryFruits = SCORING.dryFruits;
      score += SCORING.dryFruits;
    }

    // Sleep (20 points with deductions)
    const sleepScore = this.calculateSleepScore(entry.sleep.bedTime, entry.sleep.wakeTime);
    breakdown.sleep = sleepScore;
    score += sleepScore;

    // Junk penalty (-20 points)
    if (entry.junk) {
      breakdown.junk = SCORING.junkPenalty;
      score += SCORING.junkPenalty;
    }

    return {
      total: Math.max(0, score), // Don't go negative
      breakdown,
      maxPossible: 110, // All positive factors
      entry
    };
  }

  // Get stats for a period
  getStats(days = 7) {
    const stats = {
      avgScore: 0,
      avgWater: 0,
      gymDays: 0,
      fruitDays: 0,
      dryFruitDays: 0,
      junkDays: 0,
      avgSleep: 0,
      mealCompletion: {
        breakfast: 0,
        lunch: 0,
        snack: 0,
        dinner: 0
      }
    };

    let totalScore = 0;
    let totalWater = 0;
    let totalSleep = 0;
    let daysWithData = 0;

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];

      if (this.data.entries[dateKey]) {
        const entry = this.data.entries[dateKey];
        const scoreData = this.calculateScore(dateKey);

        totalScore += scoreData.total;
        totalWater += entry.water || 0;

        if (entry.gym) stats.gymDays++;
        if (entry.fruits) stats.fruitDays++;
        if (entry.dryFruits) stats.dryFruitDays++;
        if (entry.junk) stats.junkDays++;

        if (entry.meals.breakfast.eaten) stats.mealCompletion.breakfast++;
        if (entry.meals.lunch.eaten) stats.mealCompletion.lunch++;
        if (entry.meals.snack.eaten) stats.mealCompletion.snack++;
        if (entry.meals.dinner.eaten) stats.mealCompletion.dinner++;

        const sleepDuration = this.calculateSleepDuration(entry.sleep?.bedTime, entry.sleep?.wakeTime);
        totalSleep += sleepDuration;

        daysWithData++;
      }
    }

    if (daysWithData > 0) {
      stats.avgScore = Math.round(totalScore / daysWithData);
      stats.avgWater = (totalWater / daysWithData).toFixed(1);
      stats.avgSleep = (totalSleep / daysWithData).toFixed(1);
    }

    return stats;
  }

  // Get all entries for export/display
  getAllEntries() {
    return this.data.entries;
  }

  // Clear all data
  clearAll() {
    this.data = { entries: {} };
    this.saveData();
  }
}

const healthTrackingService = new HealthTrackingService();
export default healthTrackingService;
