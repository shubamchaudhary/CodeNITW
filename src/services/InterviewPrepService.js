import { db } from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import PersonalDSARoadmap from "../Data/PersonalDSARoadmap.json";

/**
 * Central service for interview preparation tracking
 * Handles time tracking, notes, streaks, system design progress, and more
 */
class InterviewPrepService {
  constructor() {
    this.STORAGE_KEYS = {
      TIME_TRACKING: "InterviewPrepTimeTracking",
      PROBLEM_NOTES: "InterviewPrepProblemNotes",
      STREAK_DATA: "InterviewPrepStreakData",
      SYSTEM_DESIGN: "InterviewPrepSystemDesign",
      WEEKLY_GOALS: "InterviewPrepWeeklyGoals",
      COURSE_HOURS: "InterviewPrepCourseHours",
    };

    // Course configuration
    this.COURSE_CONFIG = {
      totalHours: 50, // Total course duration in hours
      defaultCompleted: 3, // User's current progress
    };

    // Topic weights for interview importance (based on frequency in FAANG interviews)
    // Higher weight = more important for interviews
    this.TOPIC_WEIGHTS = {
      // Core DSA - High Priority
      "Arrays": 1.0,
      "Strings": 0.9,
      "Linked List": 0.8,
      "Stack": 0.85,
      "Queue": 0.7,
      "Trees": 0.95,
      "Binary Search Tree": 0.9,
      "Heap": 0.8,
      "Graph": 0.9,
      "Trie": 0.7,

      // Algorithms - Critical
      "Binary Search": 0.95,
      "Two Pointers": 0.9,
      "Sliding Window": 0.9,
      "Recursion": 0.85,
      "Backtracking": 0.85,
      "Greedy": 0.8,
      "Bit Manipulation": 0.6,

      // Dynamic Programming - Very High Priority (combine all DP)
      "DP": 1.0,
      "DP-Easy": 1.0,
      "DP-Advanced": 1.0,
      "Dynamic Programming": 1.0,

      // Math & Others
      "Math": 0.5,
      "Sorting": 0.7,
      "Hashing": 0.85,
    };

    // Map to combine related topics
    this.TOPIC_GROUPS = {
      "DP-Easy": "Dynamic Programming",
      "DP-Advanced": "Dynamic Programming",
      "DP": "Dynamic Programming",
      "Binary Search Tree": "Trees",
    };

    this.SYSTEM_DESIGN_TOPICS = [
      { id: "url-shortener", name: "URL Shortener", difficulty: "Medium", companies: ["Amazon", "Microsoft"] },
      { id: "rate-limiter", name: "Rate Limiter", difficulty: "Medium", companies: ["Google", "Uber"] },
      { id: "chat-system", name: "Chat Application", difficulty: "Hard", companies: ["Meta", "WhatsApp"] },
      { id: "notification", name: "Notification System", difficulty: "Medium", companies: ["Amazon", "Apple"] },
      { id: "newsfeed", name: "News Feed", difficulty: "Hard", companies: ["Meta", "Twitter"] },
      { id: "instagram", name: "Design Instagram", difficulty: "Hard", companies: ["Meta", "Google"] },
      { id: "uber", name: "Design Uber", difficulty: "Hard", companies: ["Uber", "Lyft"] },
      { id: "twitter", name: "Design Twitter", difficulty: "Hard", companies: ["Twitter", "Meta"] },
      { id: "youtube", name: "Design YouTube", difficulty: "Hard", companies: ["Google", "Netflix"] },
      { id: "api-gateway", name: "API Gateway", difficulty: "Medium", companies: ["Amazon", "Netflix"] },
      { id: "distributed-cache", name: "Distributed Cache", difficulty: "Medium", companies: ["Amazon", "Google"] },
      { id: "search-engine", name: "Search Autocomplete", difficulty: "Hard", companies: ["Google", "Amazon"] },
      { id: "payment-system", name: "Payment System", difficulty: "Hard", companies: ["PayPal", "Stripe"] },
      { id: "booking-system", name: "Booking System", difficulty: "Medium", companies: ["Airbnb", "Booking"] },
      { id: "file-storage", name: "File Storage (Dropbox)", difficulty: "Hard", companies: ["Dropbox", "Google"] },
    ];

    this.TARGET_COMPANIES = ["Amazon", "Google", "Microsoft", "Uber", "Netflix", "Meta", "Apple", "LinkedIn"];
  }

  // ==================== TIME TRACKING ====================

  getTimeTracking() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.TIME_TRACKING);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  saveTimeTracking(data) {
    localStorage.setItem(this.STORAGE_KEYS.TIME_TRACKING, JSON.stringify(data));
  }

  startTimer(questionName) {
    const tracking = this.getTimeTracking();
    tracking[questionName] = {
      ...tracking[questionName],
      startTime: Date.now(),
      isRunning: true,
    };
    this.saveTimeTracking(tracking);
  }

  stopTimer(questionName) {
    const tracking = this.getTimeTracking();
    const question = tracking[questionName];

    if (question && question.isRunning) {
      const elapsed = Date.now() - question.startTime;
      const previousTime = question.totalTime || 0;

      tracking[questionName] = {
        ...question,
        totalTime: previousTime + elapsed,
        isRunning: false,
        lastSolved: Date.now(),
        attempts: (question.attempts || 0) + 1,
      };
      this.saveTimeTracking(tracking);
    }

    return tracking[questionName];
  }

  getQuestionTime(questionName) {
    const tracking = this.getTimeTracking();
    return tracking[questionName] || null;
  }

  // ==================== PROBLEM NOTES ====================

  getProblemNotes() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.PROBLEM_NOTES);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  saveProblemNote(questionName, noteData) {
    const notes = this.getProblemNotes();
    notes[questionName] = {
      ...notes[questionName],
      ...noteData,
      updatedAt: Date.now(),
    };
    localStorage.setItem(this.STORAGE_KEYS.PROBLEM_NOTES, JSON.stringify(notes));
  }

  getQuestionNote(questionName) {
    const notes = this.getProblemNotes();
    return notes[questionName] || null;
  }

  // ==================== STREAK TRACKING ====================

  getStreakData() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.STREAK_DATA);
      return data ? JSON.parse(data) : {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        activityMap: {}, // date -> count
        totalDaysActive: 0,
      };
    } catch {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: null,
        activityMap: {},
        totalDaysActive: 0,
      };
    }
  }

  updateStreak() {
    const streakData = this.getStreakData();
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    // Get today's solved count
    const solvedQuestions = JSON.parse(localStorage.getItem("PersonalDSASolvedQuestions") || "{}");
    const todaySolved = Object.values(solvedQuestions).filter(v => v).length;

    // Update activity map
    const dailyProgress = JSON.parse(localStorage.getItem("DailySolvedProgress") || "[]");
    const todayEntry = dailyProgress.find(e => e.date === today);
    const solvedToday = todayEntry ? todayEntry.solvedToday : 0;

    if (solvedToday > 0) {
      streakData.activityMap[today] = solvedToday;

      if (streakData.lastActiveDate === yesterday) {
        streakData.currentStreak += 1;
      } else if (streakData.lastActiveDate !== today) {
        streakData.currentStreak = 1;
      }

      streakData.lastActiveDate = today;
      streakData.longestStreak = Math.max(streakData.longestStreak, streakData.currentStreak);
      streakData.totalDaysActive = Object.keys(streakData.activityMap).length;
    } else if (streakData.lastActiveDate !== today && streakData.lastActiveDate !== yesterday) {
      streakData.currentStreak = 0;
    }

    localStorage.setItem(this.STORAGE_KEYS.STREAK_DATA, JSON.stringify(streakData));
    return streakData;
  }


  // ==================== SYSTEM DESIGN TRACKER ====================

  getSystemDesignProgress() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.SYSTEM_DESIGN);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  updateSystemDesignTopic(topicId, updates) {
    const progress = this.getSystemDesignProgress();
    progress[topicId] = {
      ...progress[topicId],
      ...updates,
      updatedAt: Date.now(),
    };
    localStorage.setItem(this.STORAGE_KEYS.SYSTEM_DESIGN, JSON.stringify(progress));
    return progress;
  }

  getSystemDesignTopics() {
    const progress = this.getSystemDesignProgress();
    return this.SYSTEM_DESIGN_TOPICS.map(topic => ({
      ...topic,
      ...progress[topic.id],
      completed: progress[topic.id]?.completed || false,
      confidence: progress[topic.id]?.confidence || 0,
      notes: progress[topic.id]?.notes || "",
    }));
  }

  // ==================== COURSE HOURS TRACKING ====================

  getCourseHours() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.COURSE_HOURS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error("Error reading course hours:", e);
    }
    // Return default values if no data
    return {
      completed: this.COURSE_CONFIG.defaultCompleted,
      total: this.COURSE_CONFIG.totalHours,
    };
  }

  updateCourseHours(completedHours) {
    const data = {
      completed: Math.min(completedHours, this.COURSE_CONFIG.totalHours),
      total: this.COURSE_CONFIG.totalHours,
      updatedAt: Date.now(),
    };
    localStorage.setItem(this.STORAGE_KEYS.COURSE_HOURS, JSON.stringify(data));

    // Dispatch event to notify dashboard
    window.dispatchEvent(new CustomEvent("courseProgressUpdated", {
      detail: data
    }));

    return data;
  }

  // ==================== WEAKNESS ANALYSIS ====================

  getWeaknessAnalysis() {
    const solvedQuestions = JSON.parse(localStorage.getItem("PersonalDSASolvedQuestions") || "{}");

    const topicStats = {};

    Object.entries(PersonalDSARoadmap).forEach(([topic, questions]) => {
      const solved = questions.filter(q => solvedQuestions[q.Question]).length;
      const total = questions.length;
      const percentage = total > 0 ? Math.round((solved / total) * 100) : 0;

      topicStats[topic] = {
        solved,
        total,
        percentage,
        status: percentage >= 70 ? "strong" : percentage >= 40 ? "medium" : "weak",
      };
    });

    return topicStats;
  }

  // ==================== INTERVIEW READINESS SCORE ====================

  calculateReadinessScore() {
    const solvedQuestions = JSON.parse(localStorage.getItem("PersonalDSASolvedQuestions") || "{}");

    // Calculate weighted DSA score based on topic importance
    let weightedSolved = 0;
    let totalWeight = 0;
    const groupedStats = {};

    Object.entries(PersonalDSARoadmap).forEach(([topic, questions]) => {
      // Get the group name (e.g., DP-Easy -> Dynamic Programming)
      const groupName = this.TOPIC_GROUPS[topic] || topic;

      // Get weight for this topic (default 0.7 if not specified)
      const weight = this.TOPIC_WEIGHTS[topic] || this.TOPIC_WEIGHTS[groupName] || 0.7;

      const solved = questions.filter(q => solvedQuestions[q.Question]).length;
      const total = questions.length;

      // Group stats for combined topics
      if (!groupedStats[groupName]) {
        groupedStats[groupName] = { solved: 0, total: 0, weight };
      }
      groupedStats[groupName].solved += solved;
      groupedStats[groupName].total += total;

      // Calculate weighted score
      weightedSolved += solved * weight;
      totalWeight += total * weight;
    });

    const totalSolved = Object.values(solvedQuestions).filter(v => v).length;
    const totalQuestions = Object.values(PersonalDSARoadmap).reduce((sum, q) => sum + q.length, 0);

    // System Design progress
    const systemDesign = this.getSystemDesignProgress();
    const completedSD = Object.values(systemDesign).filter(s => s.completed).length;
    const totalSD = this.SYSTEM_DESIGN_TOPICS.length;

    // Get course completion from learning materials in Smart Plan
    const planData = this.getSmartPlanData();
    let courseCompletion = 0;
    let completedMaterials = 0;
    let totalMaterials = 0;
    let todayQuestions = 0;
    if (planData && planData.dailyPlans) {
      const allMaterials = planData.dailyPlans.flatMap(day => day.learningMaterials || []);
      completedMaterials = allMaterials.filter(m => m.completed).length;
      totalMaterials = allMaterials.length;
      courseCompletion = totalMaterials > 0 ? completedMaterials / totalMaterials : 0;

      // Get today's questions count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(planData.startDate);
      startDate.setHours(0, 0, 0, 0);
      const dayIndex = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < planData.dailyPlans.length) {
        todayQuestions = planData.dailyPlans[dayIndex].questions?.length || 0;
      }
    }

    // Streak and recent activity
    const streakData = this.getStreakData();
    const dailyProgress = JSON.parse(localStorage.getItem("DailySolvedProgress") || "[]");

    // Recent activity score (last 7 days)
    const last7Days = dailyProgress.slice(-7);
    const recentSolved = last7Days.reduce((sum, day) => sum + (day.solvedToday || 0), 0);
    const recentActivityScore = Math.min(recentSolved / 28, 1); // Target: 4/day * 7 = 28

    // Calculate component percentages (0-1 scale)
    const dsaPercentage = totalWeight > 0 ? (weightedSolved / totalWeight) : 0;
    const coursePercentage = courseCompletion;
    const sdPercentage = completedSD / totalSD;
    const consistencyPercentage = Math.min(streakData.currentStreak / 7, 1) * 0.5 + recentActivityScore * 0.5;

    // Weighted scores (60% DSA, 25% Course, 10% SD, 5% Consistency)
    const dsaScore = dsaPercentage * 60;
    const courseScore = coursePercentage * 25;
    const sdScore = sdPercentage * 10;
    const consistencyScore = consistencyPercentage * 5;

    // Base arithmetic sum
    const baseSum = dsaScore + courseScore + sdScore + consistencyScore;

    // Smart balance formula:
    // - Don't just sum (ignores balance)
    // - Don't just multiply (too harsh on zeros)
    // - Use: baseSum * balanceMultiplier
    //
    // balanceMultiplier rewards having all areas covered
    // If one area is 0, you still get credit but with penalty
    const components = [dsaPercentage, coursePercentage, sdPercentage, consistencyPercentage];
    const minComponent = Math.min(...components);
    const maxComponent = Math.max(...components);

    // Gap penalty: penalize if there's a big gap between best and worst area
    // Also penalize if any area is completely 0
    const gapPenalty = (maxComponent - minComponent) * 0.15; // Max 15% penalty for imbalance
    const zeroPenalty = components.filter(c => c === 0).length * 0.05; // 5% penalty per zero area

    // Balance multiplier: ranges from 0.7 (worst case) to 1.0 (perfect balance)
    const balanceMultiplier = Math.max(0.7, 1 - gapPenalty - zeroPenalty);

    const totalScore = Math.round(baseSum * balanceMultiplier);

    return {
      total: Math.min(100, totalScore),
      breakdown: {
        dsa: Math.round(dsaScore),
        course: Math.round(courseScore),
        systemDesign: Math.round(sdScore),
        consistency: Math.round(consistencyScore),
      },
      percentages: {
        dsa: Math.round(dsaPercentage * 100),
        course: Math.round(coursePercentage * 100),
        systemDesign: Math.round(sdPercentage * 100),
        consistency: Math.round(consistencyPercentage * 100),
      },
      details: {
        problemsSolved: totalSolved,
        totalProblems: totalQuestions,
        sdCompleted: completedSD,
        totalSD: totalSD,
        materialsCompleted: completedMaterials,
        totalMaterials: totalMaterials,
        todayQuestions: todayQuestions,
        currentStreak: streakData.currentStreak,
        recentSolved: recentSolved,
        balanceMultiplier: Math.round(balanceMultiplier * 100),
      },
      groupedStats,
    };
  }

  // Get interview date from Smart Plan
  getSmartPlanData() {
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid || "local_user";
      const cacheKey = `40day_plan_${userId}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const cacheData = JSON.parse(cached);
        // CacheService wraps values with timestamp and expiresAt
        // Check if it's wrapped or raw data
        if (cacheData.value) {
          // Check expiration
          if (cacheData.expiresAt && Date.now() > cacheData.expiresAt) {
            return null;
          }
          return cacheData.value;
        }
        // If no wrapper, return raw data
        return cacheData;
      }
    } catch (e) {
      console.error("Error reading smart plan:", e);
    }
    return null;
  }

  // Get days remaining from Smart Plan
  getDaysRemainingFromPlan() {
    const plan = this.getSmartPlanData();
    if (!plan || !plan.endDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(plan.endDate);
    endDate.setHours(0, 0, 0, 0);

    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  // Get daily targets from Smart Plan
  getDailyTargetsFromPlan() {
    const plan = this.getSmartPlanData();
    const daysRemaining = this.getDaysRemainingFromPlan();

    if (!plan || daysRemaining === null) return null;

    const solvedQuestions = JSON.parse(localStorage.getItem("PersonalDSASolvedQuestions") || "{}");
    const totalSolved = Object.values(solvedQuestions).filter(v => v).length;
    const totalQuestions = plan.goals?.totalQuestions || 243;
    const remaining = Math.max(0, totalQuestions - totalSolved);

    const questionsPerDay = daysRemaining > 0 ? Math.ceil(remaining / daysRemaining) : remaining;

    return {
      daysRemaining,
      questionsPerDay,
      remainingQuestions: remaining,
      totalSolved,
      totalDays: plan.totalDays,
      startDate: plan.startDate,
      endDate: plan.endDate,
    };
  }

  // ==================== SPACED REPETITION ====================

  getProblemsForRevision() {
    const notes = this.getProblemNotes();
    const timeTracking = this.getTimeTracking();
    const solvedQuestions = JSON.parse(localStorage.getItem("PersonalDSASolvedQuestions") || "{}");

    const revisionList = [];
    const now = Date.now();
    const dayInMs = 86400000;

    Object.entries(PersonalDSARoadmap).forEach(([topic, questions]) => {
      questions.forEach(question => {
        if (!solvedQuestions[question.Question]) return;

        const note = notes[question.Question];
        const time = timeTracking[question.Question];

        let priority = 0;
        let reason = "";

        // Check if marked for revision
        if (note?.needsRevision) {
          priority += 3;
          reason = "Marked for revision";
        }

        // Check if struggled (took too long or multiple attempts)
        if (time?.totalTime > 30 * 60 * 1000) { // > 30 minutes
          priority += 2;
          reason = reason || "Took long time";
        }

        if (time?.attempts > 2) {
          priority += 2;
          reason = reason || "Multiple attempts";
        }

        // Check last solved date for spaced repetition
        if (time?.lastSolved) {
          const daysSince = Math.floor((now - time.lastSolved) / dayInMs);
          if (daysSince >= 7 && daysSince < 14) {
            priority += 1;
            reason = reason || "Due for 1-week revision";
          } else if (daysSince >= 14) {
            priority += 2;
            reason = reason || "Due for 2-week revision";
          }
        }

        if (priority > 0) {
          revisionList.push({
            ...question,
            topic,
            priority,
            reason,
            lastSolved: time?.lastSolved,
          });
        }
      });
    });

    return revisionList.sort((a, b) => b.priority - a.priority).slice(0, 10);
  }

  // ==================== FIREBASE SYNC ====================

  async syncToFirebase() {
    const auth = getAuth();
    if (!auth.currentUser) return { success: false, error: "Not authenticated" };

    try {
      const data = {
        timeTracking: this.getTimeTracking(),
        problemNotes: this.getProblemNotes(),
        streakData: this.getStreakData(),
        systemDesign: this.getSystemDesignProgress(),
        updatedAt: serverTimestamp(),
      };

      const docRef = doc(db, "user_interview_prep", auth.currentUser.uid);
      await setDoc(docRef, data);

      return { success: true };
    } catch (error) {
      console.error("Error syncing interview prep data:", error);
      return { success: false, error: error.message };
    }
  }

  async loadFromFirebase() {
    const auth = getAuth();
    if (!auth.currentUser) return { success: false, error: "Not authenticated" };

    try {
      const docRef = doc(db, "user_interview_prep", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        if (data.timeTracking) {
          localStorage.setItem(this.STORAGE_KEYS.TIME_TRACKING, JSON.stringify(data.timeTracking));
        }
        if (data.problemNotes) {
          localStorage.setItem(this.STORAGE_KEYS.PROBLEM_NOTES, JSON.stringify(data.problemNotes));
        }
        if (data.streakData) {
          localStorage.setItem(this.STORAGE_KEYS.STREAK_DATA, JSON.stringify(data.streakData));
        }
        if (data.systemDesign) {
          localStorage.setItem(this.STORAGE_KEYS.SYSTEM_DESIGN, JSON.stringify(data.systemDesign));
        }

        return { success: true, data };
      }

      return { success: false, error: "No data found" };
    } catch (error) {
      console.error("Error loading interview prep data:", error);
      return { success: false, error: error.message };
    }
  }
}

const interviewPrepService = new InterviewPrepService();
export default interviewPrepService;
