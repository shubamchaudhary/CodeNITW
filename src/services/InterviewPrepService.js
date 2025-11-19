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

    const systemDesign = this.getSystemDesignProgress();
    const completedSD = Object.values(systemDesign).filter(s => s.completed).length;
    const totalSD = this.SYSTEM_DESIGN_TOPICS.length;

    const streakData = this.getStreakData();

    // Calculate component scores with weighted DSA
    const weightedDsaPercentage = totalWeight > 0 ? (weightedSolved / totalWeight) : 0;
    const dsaScore = weightedDsaPercentage * 40; // 40% weight
    const sdScore = (completedSD / totalSD) * 30; // 30% weight
    const consistencyScore = Math.min(streakData.currentStreak / 7, 1) * 15; // 15% weight

    // Practice depth score based on coverage of high-weight topics
    const highPriorityTopics = Object.entries(groupedStats)
      .filter(([_, data]) => data.weight >= 0.9)
      .map(([name, data]) => ({
        name,
        percentage: data.total > 0 ? (data.solved / data.total) * 100 : 0
      }));
    const avgHighPriorityCompletion = highPriorityTopics.length > 0
      ? highPriorityTopics.reduce((sum, t) => sum + t.percentage, 0) / highPriorityTopics.length
      : 0;
    const practiceScore = (avgHighPriorityCompletion / 100) * 15; // 15% weight

    const totalScore = Math.round(dsaScore + sdScore + consistencyScore + practiceScore);

    return {
      total: totalScore,
      breakdown: {
        dsa: Math.round(dsaScore),
        systemDesign: Math.round(sdScore),
        consistency: Math.round(consistencyScore),
        practice: Math.round(practiceScore),
      },
      details: {
        problemsSolved: totalSolved,
        totalProblems: totalQuestions,
        sdCompleted: completedSD,
        totalSD: totalSD,
        currentStreak: streakData.currentStreak,
        weightedCompletion: Math.round(weightedDsaPercentage * 100),
      },
      groupedStats,
    };
  }

  // Get interview date from Smart Plan
  getSmartPlanData() {
    try {
      const planData = localStorage.getItem("aiDailyPlan");
      if (planData) {
        return JSON.parse(planData);
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
