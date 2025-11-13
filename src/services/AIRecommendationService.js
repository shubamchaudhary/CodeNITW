import PersonalDSARoadmap from "../Data/PersonalDSARoadmap.json";
import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";

/**
 * Smart recommendation service for personalized DSA question suggestions
 * and study plan generation for interview preparation
 *
 * Uses intelligent algorithms to analyze user progress, identify weak areas,
 * and generate recommendations based on market trends and interview patterns.
 */
class AIRecommendationService {
  constructor() {
    this.userProfile = {
      name: "Shubam Chaudhary",
      experience: "2 years",
      role: "Java Spring Boot Developer",
      targetRole: "Senior Java Spring Boot Developer",
      skills: [
        "Java",
        "Spring Boot",
        "Microservices",
        "REST APIs",
        "System Design",
        "PostgreSQL",
        "React",
        "Docker",
      ],
      targetCompanies: ["Amazon", "Google", "Microsoft", "Uber", "Netflix"],
      switchTimeline: 45, // days
      startDate: new Date("2025-11-13"),
    };

    // Interview focus areas for Java Spring Boot with 2 YoE
    this.interviewFocusAreas = {
      "System Design": {
        weight: 0.25,
        topics: [
          "Microservices Architecture",
          "API Design",
          "Database Design",
          "Caching Strategies",
          "Load Balancing",
        ],
      },
      "Data Structures": {
        weight: 0.20,
        topics: [
          "Arrays and Hashing",
          "LinkedList",
          "Stack/Queue",
          "Trees",
          "Graphs",
        ],
      },
      Algorithms: {
        weight: 0.20,
        topics: [
          "Sliding Window",
          "Two Pointers",
          "Binary Search",
          "DFS/BFS",
          "Dynamic Programming",
        ],
      },
      "Java Specific": {
        weight: 0.15,
        topics: [
          "Multithreading",
          "Collections",
          "JVM",
          "Memory Management",
          "Stream API",
        ],
      },
      "Spring Boot": {
        weight: 0.10,
        topics: [
          "Dependency Injection",
          "REST Controllers",
          "Spring Security",
          "JPA/Hibernate",
          "Microservices",
        ],
      },
      "Problem Solving": {
        weight: 0.10,
        topics: ["LeetCode Medium/Hard", "Real-world scenarios"],
      },
    };

    // Market trending topics (based on 2024-2025 trends)
    this.trendingTopics = [
      "System Design",
      "Microservices",
      "Event-Driven Architecture",
      "Kafka/Message Queues",
      "Redis/Caching",
      "Docker/Kubernetes",
      "Cloud (AWS/Azure)",
      "API Gateway",
      "Authentication/Authorization",
      "Database Optimization",
    ];
  }

  /**
   * Analyzes user's current progress and generates comprehensive insights
   */
  async analyzeUserProgress(userId) {
    try {
      const progressDoc = await getDoc(
        doc(db, "user_progress", `${userId}_personal_dsa_progress`)
      );

      if (!progressDoc.exists()) {
        return this.getDefaultAnalysis();
      }

      const progressData = progressDoc.data();
      const solvedQuestions = progressData.progress?.solved || {};
      const starredQuestions = progressData.progress?.starred || {};

      // Analyze by topic
      const topicAnalysis = {};
      const allTopics = Object.keys(PersonalDSARoadmap);

      allTopics.forEach((topic) => {
        const questions = PersonalDSARoadmap[topic];
        const solved = questions.filter(
          (q) => solvedQuestions[q.Question]
        ).length;
        const starred = questions.filter(
          (q) => starredQuestions[q.Question]
        ).length;
        const total = questions.length;

        topicAnalysis[topic] = {
          total,
          solved,
          starred,
          unsolved: total - solved,
          completionRate: ((solved / total) * 100).toFixed(2),
          priority: this.calculateTopicPriority(topic, solved, total, starred),
        };
      });

      // Calculate overall stats
      const totalQuestions = allTopics.reduce(
        (sum, topic) => sum + PersonalDSARoadmap[topic].length,
        0
      );
      const totalSolved = Object.keys(solvedQuestions).filter(
        (k) => solvedQuestions[k]
      ).length;
      const totalStarred = Object.keys(starredQuestions).filter(
        (k) => starredQuestions[k]
      ).length;

      return {
        totalQuestions,
        totalSolved,
        totalStarred,
        overallCompletion: ((totalSolved / totalQuestions) * 100).toFixed(2),
        topicAnalysis,
        solvedQuestions,
        starredQuestions,
        weakAreas: this.identifyWeakAreas(topicAnalysis),
        strongAreas: this.identifyStrongAreas(topicAnalysis),
      };
    } catch (error) {
      console.error("Error analyzing user progress:", error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Calculate priority for a topic based on multiple factors
   */
  calculateTopicPriority(topic, solved, total, starred) {
    const completionRate = solved / total;
    const interviewWeight = this.getInterviewWeight(topic);
    const starWeight = starred / total;

    // Higher priority for:
    // - Low completion rate (need more practice)
    // - High interview weight (important for interviews)
    // - High star weight (user marked as important)
    const priority =
      (1 - completionRate) * 0.4 + interviewWeight * 0.4 + starWeight * 0.2;

    return priority;
  }

  /**
   * Get interview weight for a topic
   */
  getInterviewWeight(topic) {
    const topicLower = topic.toLowerCase();
    for (const [area, data] of Object.entries(this.interviewFocusAreas)) {
      if (topicLower.includes(area.toLowerCase())) {
        return data.weight / 0.25; // Normalize to 0-1 scale
      }
    }
    return 0.3; // Default weight
  }

  /**
   * Identify weak areas that need more focus
   */
  identifyWeakAreas(topicAnalysis) {
    return Object.entries(topicAnalysis)
      .filter(([_, data]) => parseFloat(data.completionRate) < 30)
      .sort((a, b) => b[1].priority - a[1].priority)
      .slice(0, 5)
      .map(([topic, data]) => ({
        topic,
        completionRate: data.completionRate,
        priority: data.priority,
      }));
  }

  /**
   * Identify strong areas
   */
  identifyStrongAreas(topicAnalysis) {
    return Object.entries(topicAnalysis)
      .filter(([_, data]) => parseFloat(data.completionRate) >= 70)
      .sort((a, b) => parseFloat(b[1].completionRate) - parseFloat(a[1].completionRate))
      .slice(0, 5)
      .map(([topic, data]) => ({
        topic,
        completionRate: data.completionRate,
      }));
  }

  /**
   * Generate smart question recommendations based on user progress analysis
   * Uses weighted algorithm: 30% starred, 40% weak areas, 20% trending, 10% revision
   */
  async generateRecommendations(userId, count = 10) {
    const analysis = await this.analyzeUserProgress(userId);
    const recommendations = [];

    // Priority 1: Starred questions (user marked important) - 30%
    const starredRecommendations = this.getStarredRecommendations(
      analysis,
      Math.ceil(count * 0.3)
    );
    recommendations.push(...starredRecommendations);

    // Priority 2: Weak area questions - 40%
    const weakAreaRecommendations = this.getWeakAreaRecommendations(
      analysis,
      Math.ceil(count * 0.4)
    );
    recommendations.push(...weakAreaRecommendations);

    // Priority 3: Trending topic questions - 20%
    const trendingRecommendations = this.getTrendingRecommendations(
      analysis,
      Math.ceil(count * 0.2)
    );
    recommendations.push(...trendingRecommendations);

    // Priority 4: Revision of solved questions - 10%
    const revisionRecommendations = this.getRevisionRecommendations(
      analysis,
      Math.ceil(count * 0.1)
    );
    recommendations.push(...revisionRecommendations);

    return {
      recommendations: recommendations.slice(0, count),
      analysis,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get recommendations from starred questions
   */
  getStarredRecommendations(analysis, count) {
    const recommendations = [];
    const { starredQuestions, solvedQuestions } = analysis;

    for (const topic in PersonalDSARoadmap) {
      const questions = PersonalDSARoadmap[topic];
      for (const question of questions) {
        if (
          starredQuestions[question.Question] &&
          !solvedQuestions[question.Question]
        ) {
          recommendations.push({
            ...question,
            topic,
            reason: "⭐ Starred by you - High Priority",
            priority: "CRITICAL",
            source: "personal",
          });
        }
      }
    }

    return recommendations.slice(0, count);
  }

  /**
   * Get recommendations from weak areas
   */
  getWeakAreaRecommendations(analysis, count) {
    const recommendations = [];
    const { weakAreas, solvedQuestions, starredQuestions } = analysis;

    for (const weakArea of weakAreas) {
      const questions = PersonalDSARoadmap[weakArea.topic] || [];
      const unsolvedQuestions = questions.filter(
        (q) =>
          !solvedQuestions[q.Question] && !starredQuestions[q.Question]
      );

      // Prioritize "Must Solve" and "Important" questions
      const priorityQuestions = unsolvedQuestions.filter(
        (q) => q.Priority === "Must Solve" || q.Priority === "Important"
      );

      const questionsToAdd = priorityQuestions.length
        ? priorityQuestions
        : unsolvedQuestions;

      for (const question of questionsToAdd.slice(0, 2)) {
        recommendations.push({
          ...question,
          topic: weakArea.topic,
          reason: `📊 Weak area (${weakArea.completionRate}% complete)`,
          priority: "HIGH",
          source: "personal",
        });
      }
    }

    return recommendations.slice(0, count);
  }

  /**
   * Get recommendations based on trending topics
   */
  getTrendingRecommendations(analysis, count) {
    const recommendations = [];
    const { solvedQuestions, starredQuestions } = analysis;

    for (const trendingTopic of this.trendingTopics) {
      for (const topic in PersonalDSARoadmap) {
        if (topic.toLowerCase().includes(trendingTopic.toLowerCase())) {
          const questions = PersonalDSARoadmap[topic];
          const unsolvedQuestions = questions.filter(
            (q) =>
              !solvedQuestions[q.Question] &&
              !starredQuestions[q.Question]
          );

          if (unsolvedQuestions.length > 0) {
            recommendations.push({
              ...unsolvedQuestions[0],
              topic,
              reason: `🔥 Trending: ${trendingTopic}`,
              priority: "MEDIUM",
              source: "personal",
            });
          }
        }
      }
    }

    return recommendations.slice(0, count);
  }

  /**
   * Get recommendations for revision
   */
  getRevisionRecommendations(analysis, count) {
    const recommendations = [];
    const { solvedQuestions } = analysis;

    const solvedQuestionsList = [];
    for (const topic in PersonalDSARoadmap) {
      const questions = PersonalDSARoadmap[topic];
      for (const question of questions) {
        if (solvedQuestions[question.Question]) {
          solvedQuestionsList.push({ ...question, topic });
        }
      }
    }

    // Randomly select for revision
    const shuffled = solvedQuestionsList.sort(() => 0.5 - Math.random());

    return shuffled.slice(0, count).map((q) => ({
      ...q,
      reason: "🔄 Revision recommended",
      priority: "LOW",
      source: "personal",
    }));
  }

  /**
   * Generate external question recommendations
   */
  async generateExternalRecommendations(analysis, count = 5) {
    // These would be searched from external sources based on:
    // 1. User's weak areas
    // 2. Market trends
    // 3. Company-specific questions
    const externalRecommendations = [];

    // Focus areas based on analysis
    const focusAreas = analysis.weakAreas.map((w) => w.topic);

    // Add company-specific recommendations
    for (const company of this.userProfile.targetCompanies.slice(0, 3)) {
      externalRecommendations.push({
        Question: `${company} interview question`,
        topic: focusAreas[0] || "System Design",
        company,
        reason: `💼 ${company} frequently asks this`,
        priority: "HIGH",
        source: "external",
        searchUrl: `https://leetcode.com/company/${company.toLowerCase()}/`,
      });
    }

    // Add trending questions
    externalRecommendations.push({
      Question: "Design a rate limiter",
      topic: "System Design",
      reason: "🔥 Trending in 2024-2025 interviews",
      priority: "CRITICAL",
      source: "external",
      searchUrl: "https://leetcode.com/problems/design-hit-counter/",
    });

    externalRecommendations.push({
      Question: "Implement LRU Cache",
      topic: "Design",
      reason: "🔥 Common in Java Spring Boot interviews",
      priority: "HIGH",
      source: "external",
      searchUrl: "https://leetcode.com/problems/lru-cache/",
    });

    return externalRecommendations.slice(0, count);
  }

  /**
   * Generate a 45-day study plan
   */
  async generate45DayPlan(userId) {
    const analysis = await this.analyzeUserProgress(userId);
    const startDate = new Date(this.userProfile.startDate);
    const dailyPlans = [];

    // Calculate daily targets
    const totalDays = this.userProfile.switchTimeline;
    const unsolvedCount = analysis.totalQuestions - analysis.totalSolved;
    const questionsPerDay = Math.ceil(unsolvedCount / totalDays);

    // Allocate time for different activities
    const dailyAllocation = {
      dsa: questionsPerDay, // DSA questions
      systemDesign: Math.floor(totalDays / 10), // System design every 10 days
      revision: Math.floor(totalDays / 7), // Revision every week
      mockInterview: Math.floor(totalDays / 5), // Mock every 5 days
    };

    for (let day = 0; day < totalDays; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);

      const dayPlan = {
        day: day + 1,
        date: currentDate.toISOString().split("T")[0],
        questions: [],
        topics: [],
        completed: false,
        progress: {
          questionsCompleted: 0,
          topicsCompleted: 0,
        },
      };

      // Week-based structure
      const week = Math.floor(day / 7) + 1;

      // Day-specific focus
      if (day % 10 === 0) {
        // System Design focus
        dayPlan.topics.push({
          type: "System Design",
          title: this.getSystemDesignTopic(week),
          estimatedTime: "2 hours",
          resources: ["System Design Primer", "Grokking System Design"],
        });
      }

      if (day % 7 === 0 && day > 0) {
        // Revision day
        dayPlan.topics.push({
          type: "Revision",
          title: "Review previous week's questions",
          estimatedTime: "1 hour",
        });
      }

      if (day % 5 === 4) {
        // Mock interview
        dayPlan.topics.push({
          type: "Mock Interview",
          title: "Practice interview questions",
          estimatedTime: "1.5 hours",
          platform: "Pramp / Interviewing.io",
        });
      }

      // Add daily DSA questions
      const recommendations = await this.generateRecommendations(
        userId,
        questionsPerDay
      );
      dayPlan.questions = recommendations.recommendations.map((r) => ({
        ...r,
        completed: false,
      }));

      // Add topic learning based on weak areas
      if (day < 20) {
        // First 20 days: Focus on weak areas
        const weakArea = analysis.weakAreas[day % analysis.weakAreas.length];
        if (weakArea) {
          dayPlan.topics.push({
            type: "Topic Study",
            title: `Deep dive: ${weakArea.topic}`,
            estimatedTime: "1 hour",
            resources: ["GeeksForGeeks", "LeetCode Explore"],
          });
        }
      } else {
        // Last 25 days: Focus on interview-specific topics
        const focusArea = Object.keys(this.interviewFocusAreas)[
          day % Object.keys(this.interviewFocusAreas).length
        ];
        dayPlan.topics.push({
          type: "Interview Prep",
          title: focusArea,
          estimatedTime: "1 hour",
          resources: ["Company Interview Experiences"],
        });
      }

      dailyPlans.push(dayPlan);
    }

    return {
      userId,
      startDate: startDate.toISOString(),
      endDate: new Date(
        startDate.getTime() + totalDays * 24 * 60 * 60 * 1000
      ).toISOString(),
      totalDays,
      dailyPlans,
      goals: {
        totalQuestions: unsolvedCount,
        questionsPerDay,
        targetCompletion: 100,
      },
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Get system design topic for the week
   */
  getSystemDesignTopic(week) {
    const topics = [
      "URL Shortener Design",
      "Design Instagram",
      "Design Rate Limiter",
      "Design Notification System",
      "Design Chat Application",
      "Design API Gateway",
      "Design Distributed Cache",
    ];
    return topics[(week - 1) % topics.length];
  }

  /**
   * Save daily plan to Firestore
   */
  async saveDailyPlan(userId, plan) {
    try {
      const docRef = doc(db, "user_daily_plans", userId);
      await setDoc(docRef, {
        ...plan,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      console.error("Error saving daily plan:", error);
      return { success: false, error };
    }
  }

  /**
   * Load daily plan from Firestore
   */
  async loadDailyPlan(userId) {
    try {
      const docRef = doc(db, "user_daily_plans", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error("Error loading daily plan:", error);
      return null;
    }
  }

  /**
   * Update daily progress
   */
  async updateDailyProgress(userId, dayNumber, updates) {
    try {
      const docRef = doc(db, "user_daily_plans", userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return { success: false, error: "Plan not found" };
      }

      const plan = docSnap.data();
      const dayIndex = dayNumber - 1;

      if (!plan.dailyPlans[dayIndex]) {
        return { success: false, error: "Day not found" };
      }

      // Update the specific day
      plan.dailyPlans[dayIndex] = {
        ...plan.dailyPlans[dayIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(docRef, {
        dailyPlans: plan.dailyPlans,
        updatedAt: serverTimestamp(),
      });

      return { success: true, updatedPlan: plan };
    } catch (error) {
      console.error("Error updating daily progress:", error);
      return { success: false, error };
    }
  }

  /**
   * Replan based on actual progress
   */
  async replanBasedOnProgress(userId) {
    try {
      const plan = await this.loadDailyPlan(userId);
      if (!plan) {
        return { success: false, error: "No plan found" };
      }

      const today = new Date();
      const startDate = new Date(plan.startDate);
      const daysPassed = Math.floor(
        (today - startDate) / (1000 * 60 * 60 * 24)
      );

      // Calculate actual progress
      let completedQuestions = 0;
      let expectedQuestions = 0;

      for (let i = 0; i < daysPassed && i < plan.dailyPlans.length; i++) {
        const day = plan.dailyPlans[i];
        completedQuestions += day.progress?.questionsCompleted || 0;
        expectedQuestions += day.questions.length;
      }

      const progressRate = completedQuestions / expectedQuestions;
      const remainingDays = plan.totalDays - daysPassed;

      // Adjust future days based on progress
      if (progressRate < 0.8 && remainingDays > 0) {
        // Behind schedule - reduce daily load
        const analysis = await this.analyzeUserProgress(userId);
        const remainingQuestions =
          analysis.totalQuestions - analysis.totalSolved;
        const newQuestionsPerDay = Math.ceil(
          remainingQuestions / remainingDays
        );

        for (let i = daysPassed; i < plan.dailyPlans.length; i++) {
          const recommendations = await this.generateRecommendations(
            userId,
            newQuestionsPerDay
          );
          plan.dailyPlans[i].questions = recommendations.recommendations.map(
            (r) => ({
              ...r,
              completed: false,
            })
          );
        }
      }

      // Save updated plan
      await this.saveDailyPlan(userId, {
        ...plan,
        lastReplanned: new Date().toISOString(),
      });

      return {
        success: true,
        updatedPlan: plan,
        metrics: {
          progressRate,
          completedQuestions,
          expectedQuestions,
          daysPassed,
          remainingDays,
        },
      };
    } catch (error) {
      console.error("Error replanning:", error);
      return { success: false, error };
    }
  }

  /**
   * Get default analysis for new users
   */
  getDefaultAnalysis() {
    const topicAnalysis = {};
    Object.keys(PersonalDSARoadmap).forEach((topic) => {
      const total = PersonalDSARoadmap[topic].length;
      topicAnalysis[topic] = {
        total,
        solved: 0,
        starred: 0,
        unsolved: total,
        completionRate: "0.00",
        priority: this.calculateTopicPriority(topic, 0, total, 0),
      };
    });

    const totalQuestions = Object.values(topicAnalysis).reduce(
      (sum, t) => sum + t.total,
      0
    );

    return {
      totalQuestions,
      totalSolved: 0,
      totalStarred: 0,
      overallCompletion: "0.00",
      topicAnalysis,
      solvedQuestions: {},
      starredQuestions: {},
      weakAreas: this.identifyWeakAreas(topicAnalysis),
      strongAreas: [],
    };
  }

  /**
   * Get topic learning suggestions for job switch
   */
  getTopicLearningSuggestions() {
    return [
      {
        category: "System Design (Must Learn)",
        topics: [
          "Microservices Architecture Patterns",
          "API Gateway & Load Balancing",
          "Database Sharding & Replication",
          "Caching Strategies (Redis, CDN)",
          "Message Queues (Kafka, RabbitMQ)",
          "Event-Driven Architecture",
        ],
        resources: [
          "System Design Primer (GitHub)",
          "Grokking the System Design Interview",
          "Martin Fowler's Blog",
        ],
        estimatedTime: "2-3 weeks",
      },
      {
        category: "Java Advanced (Important)",
        topics: [
          "Multithreading & Concurrency",
          "Java Memory Model",
          "Garbage Collection",
          "JVM Internals",
          "Stream API & Functional Programming",
          "Design Patterns in Java",
        ],
        resources: [
          "Java Concurrency in Practice",
          "Effective Java by Joshua Bloch",
          "Baeldung Tutorials",
        ],
        estimatedTime: "2 weeks",
      },
      {
        category: "Spring Boot Advanced",
        topics: [
          "Spring Security (JWT, OAuth)",
          "Spring Cloud & Microservices",
          "Spring Data JPA Advanced",
          "Caching with Spring",
          "Testing (JUnit, Mockito, TestContainers)",
          "Spring Actuator & Monitoring",
        ],
        resources: [
          "Spring.io Guides",
          "Baeldung Spring Tutorials",
          "Spring Boot in Action",
        ],
        estimatedTime: "1-2 weeks",
      },
      {
        category: "DevOps & Cloud",
        topics: [
          "Docker & Containerization",
          "Kubernetes Basics",
          "Azure Services (App Service, Functions, Storage)",
          "CI/CD with GitHub Actions",
          "Monitoring & Logging (ELK, Prometheus)",
        ],
        resources: ["Docker Documentation", "Azure Learn", "Kubernetes.io"],
        estimatedTime: "1 week",
      },
      {
        category: "Behavioral & Soft Skills",
        topics: [
          "STAR method for answering",
          "Project explanation techniques",
          "Leadership examples",
          "Conflict resolution stories",
        ],
        resources: [
          "Cracking the Coding Interview (Behavioral section)",
          "Practice with mock interviews",
        ],
        estimatedTime: "Throughout preparation",
      },
    ];
  }
}

// Export singleton instance
const aiRecommendationService = new AIRecommendationService();
export default aiRecommendationService;
