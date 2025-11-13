import PersonalDSARoadmap from "../Data/PersonalDSARoadmap.json";
import CompanySpecificQuestions from "../Data/CompanySpecificQuestions.json";
import UdemySpringBootCourse from "../Data/UdemySpringBootCourse.json";
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
      targetCompanies: ["Amazon", "Google", "Microsoft", "Uber", "Netflix", "Meta", "Apple", "LinkedIn"],
      switchTimeline: 40, // days (updated from 45)
      startDate: new Date("2025-11-13"),
    };

    // Load all existing questions from PersonalDSARoadmap for duplicate checking
    this.existingQuestions = new Set();
    Object.values(PersonalDSARoadmap).forEach((questions) => {
      questions.forEach((q) => {
        this.existingQuestions.add(q.Question.toLowerCase().trim());
      });
    });

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
   * Ensures diversity by limiting max 2 questions per topic
   */
  getStarredRecommendations(analysis, count) {
    const recommendations = [];
    const { starredQuestions, solvedQuestions } = analysis;
    const topicQuestionCount = {}; // Track questions per topic

    // Group starred questions by topic
    const starredByTopic = {};
    for (const topic in PersonalDSARoadmap) {
      const questions = PersonalDSARoadmap[topic];
      for (const question of questions) {
        if (
          starredQuestions[question.Question] &&
          !solvedQuestions[question.Question]
        ) {
          if (!starredByTopic[topic]) {
            starredByTopic[topic] = [];
          }
          starredByTopic[topic].push({
            ...question,
            topic,
            reason: "⭐ Starred by you - High Priority",
            priority: "CRITICAL",
            source: "personal",
          });
        }
      }
    }

    // Round-robin selection to ensure diversity (max 2 per topic)
    const topics = Object.keys(starredByTopic);
    let currentIndex = 0;
    const maxPerTopic = 2;

    while (recommendations.length < count && topics.length > 0) {
      const topic = topics[currentIndex % topics.length];
      const topicCount = topicQuestionCount[topic] || 0;

      if (topicCount < maxPerTopic && starredByTopic[topic].length > topicCount) {
        recommendations.push(starredByTopic[topic][topicCount]);
        topicQuestionCount[topic] = topicCount + 1;
      } else if (starredByTopic[topic].length <= topicCount) {
        // This topic is exhausted, remove it
        topics.splice(currentIndex % topics.length, 1);
        if (topics.length === 0) break;
        continue;
      }

      currentIndex++;
      if (currentIndex >= count * 10) break; // Safety limit
    }

    return recommendations.slice(0, count);
  }

  /**
   * Get recommendations from weak areas
   * Ensures diversity by limiting max 2-3 questions per topic
   */
  getWeakAreaRecommendations(analysis, count) {
    const recommendations = [];
    const { weakAreas, solvedQuestions, starredQuestions } = analysis;
    const topicQuestionCount = {};
    const maxPerTopic = 3; // Allow up to 3 questions from a weak area

    // Prepare questions from each weak area
    const weakAreaQuestions = weakAreas.map((weakArea) => {
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

      return {
        topic: weakArea.topic,
        completionRate: weakArea.completionRate,
        questions: questionsToAdd,
      };
    }).filter(wa => wa.questions.length > 0);

    // Round-robin selection to ensure diversity
    let currentIndex = 0;
    while (recommendations.length < count && weakAreaQuestions.length > 0) {
      const weakArea = weakAreaQuestions[currentIndex % weakAreaQuestions.length];
      const topicCount = topicQuestionCount[weakArea.topic] || 0;

      if (topicCount < maxPerTopic && weakArea.questions.length > topicCount) {
        recommendations.push({
          ...weakArea.questions[topicCount],
          topic: weakArea.topic,
          reason: `📊 Weak area (${weakArea.completionRate}% complete)`,
          priority: "HIGH",
          source: "personal",
        });
        topicQuestionCount[weakArea.topic] = topicCount + 1;
      } else if (weakArea.questions.length <= topicCount) {
        // This weak area is exhausted
        weakAreaQuestions.splice(currentIndex % weakAreaQuestions.length, 1);
        if (weakAreaQuestions.length === 0) break;
        continue;
      }

      currentIndex++;
      if (currentIndex >= count * 10) break; // Safety limit
    }

    return recommendations.slice(0, count);
  }

  /**
   * Get recommendations based on trending topics
   * Limits to 1-2 questions per topic for diversity
   */
  getTrendingRecommendations(analysis, count) {
    const recommendations = [];
    const { solvedQuestions, starredQuestions } = analysis;
    const topicsSeen = new Set();
    const maxPerTopic = 1; // Only 1 question per topic for trending

    for (const trendingTopic of this.trendingTopics) {
      if (recommendations.length >= count) break;

      for (const topic in PersonalDSARoadmap) {
        if (recommendations.length >= count) break;
        if (topicsSeen.has(topic)) continue; // Skip if already used

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
            topicsSeen.add(topic);
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
   * Generate external question recommendations from company-specific lists
   * Filters out questions already in PersonalDSARoadmap to avoid duplicates
   */
  async generateExternalRecommendations(analysis, count = 10) {
    const externalRecommendations = [];
    const focusAreas = analysis.weakAreas.map((w) => w.topic);

    // Get company-specific questions that are NOT in personal list
    for (const company of this.userProfile.targetCompanies) {
      const companyQuestions = CompanySpecificQuestions[company] || [];

      for (const question of companyQuestions) {
        // Check if question already exists in personal roadmap
        const isDuplicate = this.existingQuestions.has(
          question.Question.toLowerCase().trim()
        );

        if (!isDuplicate) {
          externalRecommendations.push({
            ...question,
            company,
            reason: `💼 ${company} frequently asks this - ${question.Frequency} frequency`,
            priority: question.Difficulty === "Hard" ? "HIGH" : "MEDIUM",
            source: "external",
          });
        }
      }

      // Limit questions per company
      if (externalRecommendations.length >= count * 2) break;
    }

    // Sort by frequency and difficulty
    externalRecommendations.sort((a, b) => {
      const freqOrder = { "Very High": 3, "High": 2, "Medium": 1, "Low": 0 };
      return (freqOrder[b.Frequency] || 0) - (freqOrder[a.Frequency] || 0);
    });

    return externalRecommendations.slice(0, count);
  }

  /**
   * Generate a 40-day study plan with weekday/weekend structure
   * Weekdays: 3 questions (1 hard, 2 medium) + 2 hours learning
   * Weekends: 6 questions (2 hard, 3 medium, 1 easy) + 4 hours learning
   */
  async generate40DayPlan(userId) {
    const analysis = await this.analyzeUserProgress(userId);
    const startDate = new Date(this.userProfile.startDate);
    const dailyPlans = [];
    const totalDays = 40; // Updated from 45

    // Get all unsolved questions grouped by difficulty
    const questionsByDifficulty = this.groupQuestionsByDifficulty(analysis);
    const udemyCourse = UdemySpringBootCourse;
    const uncompletedSections = udemyCourse.sections.filter(s => !s.completed);
    let sectionIndex = 0;

    for (let day = 0; day < totalDays; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const dayPlan = {
        day: day + 1,
        date: currentDate.toISOString().split("T")[0],
        dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayOfWeek],
        isWeekend,
        questions: [],
        learningMaterials: [],
        completed: false,
        progress: {
          questionsCompleted: 0,
          materialsCompleted: 0,
        },
      };

      // Determine question count based on weekday/weekend
      let hardCount, mediumCount, easyCount;
      let learningHours;

      if (isWeekend) {
        // Weekend: 6 questions (2 hard, 3 medium, 1 easy) + 4 hours learning
        hardCount = 2;
        mediumCount = 3;
        easyCount = 1;
        learningHours = 4;
      } else {
        // Weekday: 3 questions (1 hard, 2 medium) + 2 hours learning
        hardCount = 1;
        mediumCount = 2;
        easyCount = 0;
        learningHours = 2;
      }

      // Get diverse questions from different topics
      const selectedQuestions = this.selectDiverseQuestions(
        questionsByDifficulty,
        hardCount,
        mediumCount,
        easyCount,
        analysis
      );

      dayPlan.questions = selectedQuestions.map((q) => ({
        ...q,
        completed: false,
      }));

      // Add learning materials
      // 1. Udemy Course Content (Sequential)
      if (sectionIndex < uncompletedSections.length) {
        const currentSection = uncompletedSections[sectionIndex];
        const sectionHours = currentSection.estimatedHours || 2;

        if (sectionHours <= learningHours) {
          dayPlan.learningMaterials.push({
            type: "Udemy Course",
            title: `Section ${currentSection.sectionNumber}: ${currentSection.title}`,
            url: udemyCourse.courseUrl,
            estimatedHours: sectionHours,
            topics: currentSection.topics,
            completed: false,
            skipped: false,
            source: "udemy",
            sectionNumber: currentSection.sectionNumber,
          });
          learningHours -= sectionHours;
          sectionIndex++;
        }
      }

      // 2. Add complementary learning materials
      if (learningHours > 0) {
        const complementaryMaterial = this.getComplementaryLearning(day, learningHours, analysis);
        if (complementaryMaterial) {
          dayPlan.learningMaterials.push(complementaryMaterial);
        }
      }

      // 3. Special day activities
      if (day % 7 === 0 && day > 0) {
        // Weekly revision
        dayPlan.learningMaterials.push({
          type: "Revision",
          title: "Review previous week's questions and concepts",
          estimatedHours: 1,
          completed: false,
          skipped: false,
        });
      }

      if (day % 5 === 4) {
        // Mock interview every 5 days
        dayPlan.learningMaterials.push({
          type: "Mock Interview",
          title: "Practice interview with peer or platform",
          estimatedHours: 1.5,
          platform: "Pramp / Interviewing.io / Peers",
          completed: false,
          skipped: false,
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
        totalQuestions: analysis.totalQuestions - analysis.totalSolved,
        weekdayQuestions: 3,
        weekendQuestions: 6,
        targetCompletion: 100,
      },
      udemyCourseProgress: {
        courseName: udemyCourse.courseTitle,
        completedSections: udemyCourse.userProgress.completedSections,
        totalSections: udemyCourse.totalSections,
      },
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Group questions by difficulty for diverse selection
   */
  groupQuestionsByDifficulty(analysis) {
    const grouped = {
      hard: [],
      medium: [],
      easy: [],
    };

    const { solvedQuestions, starredQuestions } = analysis;

    for (const topic in PersonalDSARoadmap) {
      const questions = PersonalDSARoadmap[topic];

      for (const question of questions) {
        // Skip already solved questions
        if (solvedQuestions[question.Question]) continue;

        const enrichedQuestion = {
          ...question,
          topic,
          completed: false,
          isStarred: starredQuestions[question.Question] || false,
        };

        // Determine difficulty based on Priority or pattern
        if (question.Priority === "Must Solve" || question.Question_link?.includes("hard")) {
          grouped.hard.push(enrichedQuestion);
        } else if (question.Question_link?.includes("easy")) {
          grouped.easy.push(enrichedQuestion);
        } else {
          grouped.medium.push(enrichedQuestion);
        }
      }
    }

    return grouped;
  }

  /**
   * Select diverse questions from different topics
   */
  selectDiverseQuestions(questionsByDifficulty, hardCount, mediumCount, easyCount, analysis) {
    const selectedQuestions = [];
    const usedTopics = new Set();

    // Helper to get question from a topic not yet used today
    const getQuestionFromUnusedTopic = (difficultyList) => {
      // Prioritize starred questions first
      const starredUnused = difficultyList.filter(
        (q) => q.isStarred && !usedTopics.has(q.topic)
      );
      if (starredUnused.length > 0) {
        return starredUnused[0];
      }

      // Then weak area questions
      const weakTopics = analysis.weakAreas.map((w) => w.topic);
      const weakUnused = difficultyList.filter(
        (q) => weakTopics.includes(q.topic) && !usedTopics.has(q.topic)
      );
      if (weakUnused.length > 0) {
        return weakUnused[0];
      }

      // Finally, any unused topic
      const unused = difficultyList.filter((q) => !usedTopics.has(q.topic));
      return unused.length > 0 ? unused[0] : difficultyList[0];
    };

    // Select hard questions
    for (let i = 0; i < hardCount && questionsByDifficulty.hard.length > 0; i++) {
      const question = getQuestionFromUnusedTopic(questionsByDifficulty.hard);
      if (question) {
        selectedQuestions.push({ ...question, difficulty: "Hard" });
        usedTopics.add(question.topic);
        // Remove from pool
        const index = questionsByDifficulty.hard.indexOf(question);
        questionsByDifficulty.hard.splice(index, 1);
      }
    }

    // Select medium questions
    for (let i = 0; i < mediumCount && questionsByDifficulty.medium.length > 0; i++) {
      const question = getQuestionFromUnusedTopic(questionsByDifficulty.medium);
      if (question) {
        selectedQuestions.push({ ...question, difficulty: "Medium" });
        usedTopics.add(question.topic);
        const index = questionsByDifficulty.medium.indexOf(question);
        questionsByDifficulty.medium.splice(index, 1);
      }
    }

    // Select easy questions
    for (let i = 0; i < easyCount && questionsByDifficulty.easy.length > 0; i++) {
      const question = getQuestionFromUnusedTopic(questionsByDifficulty.easy);
      if (question) {
        selectedQuestions.push({ ...question, difficulty: "Easy" });
        usedTopics.add(question.topic);
        const index = questionsByDifficulty.easy.indexOf(question);
        questionsByDifficulty.easy.splice(index, 1);
      }
    }

    return selectedQuestions;
  }

  /**
   * Get complementary learning material for the day
   */
  getComplementaryLearning(day, remainingHours, analysis) {
    const learningTopics = [
      {
        title: "Java Multithreading and Concurrency",
        url: "https://www.baeldung.com/java-concurrency",
        estimatedHours: 2,
        topics: ["Thread pools", "Executor framework", "CompletableFuture"],
      },
      {
        title: "Spring Boot Microservices Patterns",
        url: "https://microservices.io/patterns/index.html",
        estimatedHours: 2,
        topics: ["Service Discovery", "API Gateway", "Circuit Breaker"],
      },
      {
        title: "System Design - Caching Strategies",
        url: "https://www.youtube.com/watch?v=U3RkDLtS7uY",
        estimatedHours: 1.5,
        topics: ["Redis", "CDN", "Cache invalidation"],
      },
      {
        title: "Docker and Kubernetes Basics",
        url: "https://kubernetes.io/docs/tutorials/",
        estimatedHours: 2,
        topics: ["Containers", "Pods", "Deployments"],
      },
      {
        title: "Database Optimization Techniques",
        url: "https://use-the-index-luke.com/",
        estimatedHours: 2,
        topics: ["Indexing", "Query optimization", "Sharding"],
      },
      {
        title: "REST API Best Practices",
        url: "https://restfulapi.net/",
        estimatedHours: 1.5,
        topics: ["Versioning", "HATEOAS", "Error handling"],
      },
      {
        title: "Message Queues - Kafka Fundamentals",
        url: "https://kafka.apache.org/documentation/",
        estimatedHours: 2,
        topics: ["Producers", "Consumers", "Topics", "Partitions"],
      },
    ];

    const material = learningTopics[day % learningTopics.length];
    return {
      type: "Technical Topic",
      title: material.title,
      url: material.url,
      estimatedHours: Math.min(material.estimatedHours, remainingHours),
      topics: material.topics,
      completed: false,
      skipped: false,
      source: "external",
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
