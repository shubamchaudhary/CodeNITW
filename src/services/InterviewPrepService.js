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
      INTERVIEW_DATE: "InterviewPrepTargetDate",
      SYSTEM_DESIGN: "InterviewPrepSystemDesign",
      WEEKLY_GOALS: "InterviewPrepWeeklyGoals",
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

  // ==================== INTERVIEW COUNTDOWN ====================

  getInterviewDate() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.INTERVIEW_DATE);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  setInterviewDate(date, company = "Target Company") {
    const data = {
      date: date,
      company: company,
      setAt: Date.now(),
    };
    localStorage.setItem(this.STORAGE_KEYS.INTERVIEW_DATE, JSON.stringify(data));
    return data;
  }

  getDaysRemaining() {
    const interviewData = this.getInterviewDate();
    if (!interviewData) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const interviewDate = new Date(interviewData.date);
    interviewDate.setHours(0, 0, 0, 0);

    const diffTime = interviewDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  getDailyTargets() {
    const daysRemaining = this.getDaysRemaining();
    if (!daysRemaining || daysRemaining <= 0) return null;

    const solvedQuestions = JSON.parse(localStorage.getItem("PersonalDSASolvedQuestions") || "{}");
    const totalSolved = Object.values(solvedQuestions).filter(v => v).length;
    const totalQuestions = 243; // From PersonalDSARoadmap
    const remaining = totalQuestions - totalSolved;

    const questionsPerDay = Math.ceil(remaining / daysRemaining);

    return {
      daysRemaining,
      questionsPerDay,
      remainingQuestions: remaining,
      totalSolved,
    };
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
    const totalSolved = Object.values(solvedQuestions).filter(v => v).length;
    const totalQuestions = 243;

    const systemDesign = this.getSystemDesignProgress();
    const completedSD = Object.values(systemDesign).filter(s => s.completed).length;
    const totalSD = this.SYSTEM_DESIGN_TOPICS.length;

    const streakData = this.getStreakData();
    const timeTracking = this.getTimeTracking();

    // Calculate component scores
    const dsaScore = (totalSolved / totalQuestions) * 40; // 40% weight
    const sdScore = (completedSD / totalSD) * 30; // 30% weight
    const consistencyScore = Math.min(streakData.currentStreak / 7, 1) * 15; // 15% weight
    const practiceScore = Math.min(Object.keys(timeTracking).length / 50, 1) * 15; // 15% weight

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
      },
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
        interviewDate: this.getInterviewDate(),
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
        if (data.interviewDate) {
          localStorage.setItem(this.STORAGE_KEYS.INTERVIEW_DATE, JSON.stringify(data.interviewDate));
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
