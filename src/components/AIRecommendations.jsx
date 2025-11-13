import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBrain,
  FaLightbulb,
  FaCalendarAlt,
  FaChartLine,
  FaRocket,
  FaStar,
  FaExternalLinkAlt,
  FaCheckCircle,
  FaSpinner,
  FaSync,
  FaBook,
  FaTrophy,
  FaFire,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { getAuth } from "firebase/auth";
import aiRecommendationService from "../services/AIRecommendationService";
import cacheService from "../services/CacheService";

const AIRecommendations = ({ onQuestionSelect }) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [externalRecommendations, setExternalRecommendations] = useState([]);
  const [dailyPlan, setDailyPlan] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState("recommendations");
  const [expandedSections, setExpandedSections] = useState({
    starred: true,
    weak: true,
    trending: true,
    external: true,
    topics: false,
  });
  const [externalQuestionsProgress, setExternalQuestionsProgress] = useState(() => {
    const saved = localStorage.getItem("ExternalQuestionsProgress");
    return saved ? JSON.parse(saved) : { solved: {}, lastUpdated: Date.now() };
  });

  // Load recommendations on mount
  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser) {
      loadRecommendations();
    }
  }, []);

  const loadRecommendations = async (forceRefresh = false) => {
    const auth = getAuth();
    if (!auth.currentUser) {
      toast.error("Please login to get personalized recommendations");
      return;
    }

    setLoading(true);
    try {
      // Check cache first for recommendations (unless force refresh)
      if (!forceRefresh) {
        const cachedRec = cacheService.getCachedRecommendations(auth.currentUser.uid);
        if (cachedRec) {
          setRecommendations(cachedRec.recommendations);
          setAnalysis(cachedRec.analysis);

          // Filter external recommendations based on current progress
          const filteredExtData = cachedRec.externalRecommendations.filter(
            (rec) => !externalQuestionsProgress.solved[rec.Question]
          );
          setExternalRecommendations(filteredExtData.slice(0, 5));

          toast.info("Loaded from cache (refreshes every 24 hours)");
        }
      }

      // Generate fresh recommendations if no cache or force refresh
      if (forceRefresh || !cacheService.getCachedRecommendations(auth.currentUser.uid)) {
        const recData = await aiRecommendationService.generateRecommendations(
          auth.currentUser.uid,
          15
        );
        setRecommendations(recData.recommendations);
        setAnalysis(recData.analysis);

        // Load external recommendations
        const extData = await aiRecommendationService.generateExternalRecommendations(
          recData.analysis,
          10
        );

        // Filter out already solved external questions
        const filteredExtData = extData.filter(
          (rec) => !externalQuestionsProgress.solved[rec.Question]
        );
        setExternalRecommendations(filteredExtData.slice(0, 5));

        // Cache the recommendations
        cacheService.cacheRecommendations(auth.currentUser.uid, {
          recommendations: recData.recommendations,
          analysis: recData.analysis,
          externalRecommendations: extData,
        });

        toast.success("Recommendations loaded successfully!");
      }

      // Load 40-day plan with cache
      const cachedPlan = cacheService.getCached40DayPlan(auth.currentUser.uid);
      if (cachedPlan && !forceRefresh) {
        setDailyPlan(cachedPlan);
      } else {
        const existingPlan = await aiRecommendationService.loadDailyPlan(
          auth.currentUser.uid
        );
        if (existingPlan) {
          setDailyPlan(existingPlan);
          cacheService.cache40DayPlan(auth.currentUser.uid, existingPlan);
        }
      }
    } catch (error) {
      console.error("Error loading recommendations:", error);
      toast.error("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  const generate40DayPlan = async () => {
    const auth = getAuth();
    if (!auth.currentUser) {
      toast.error("Please login to generate a plan");
      return;
    }

    setLoading(true);
    try {
      const plan = await aiRecommendationService.generate40DayPlan(
        auth.currentUser.uid
      );
      await aiRecommendationService.saveDailyPlan(auth.currentUser.uid, plan);
      setDailyPlan(plan);

      // Cache the plan for 7 days
      cacheService.cache40DayPlan(auth.currentUser.uid, plan);

      toast.success("40-day study plan generated successfully! 🎉");
      setActiveTab("plan");
    } catch (error) {
      console.error("Error generating plan:", error);
      toast.error("Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  const replanBasedOnProgress = async () => {
    const auth = getAuth();
    if (!auth.currentUser || !dailyPlan) {
      return;
    }

    setLoading(true);
    try {
      // Invalidate old cache
      cacheService.invalidate40DayPlan(auth.currentUser.uid);

      const result = await aiRecommendationService.replanBasedOnProgress(
        auth.currentUser.uid
      );
      if (result.success) {
        setDailyPlan(result.updatedPlan);

        // Cache the updated plan
        cacheService.cache40DayPlan(auth.currentUser.uid, result.updatedPlan);

        toast.success(
          `Plan adjusted! Progress rate: ${(result.metrics.progressRate * 100).toFixed(1)}%`
        );
      }
    } catch (error) {
      console.error("Error replanning:", error);
      toast.error("Failed to replan");
    } finally {
      setLoading(false);
    }
  };

  const handleExternalQuestionToggle = (questionName) => {
    const newProgress = {
      ...externalQuestionsProgress,
      solved: {
        ...externalQuestionsProgress.solved,
        [questionName]: !externalQuestionsProgress.solved[questionName],
      },
      lastUpdated: Date.now(),
    };
    setExternalQuestionsProgress(newProgress);
    localStorage.setItem("ExternalQuestionsProgress", JSON.stringify(newProgress));
    toast.success(newProgress.solved[questionName] ? "Question marked as solved! ✅" : "Marked as unsolved");
  };

  const syncExternalQuestionsToCloud = async () => {
    const auth = getAuth();
    if (!auth.currentUser) {
      toast.error("Please login to sync progress");
      return;
    }

    try {
      await aiRecommendationService.saveExternalQuestionsProgress(
        auth.currentUser.uid,
        externalQuestionsProgress
      );
      toast.success("External questions progress synced to cloud! ☁️");
    } catch (error) {
      console.error("Error syncing external questions:", error);
      toast.error("Failed to sync progress");
    }
  };

  const syncTopicsToMasterToCloud = async (topicsProgress) => {
    const auth = getAuth();
    if (!auth.currentUser) {
      toast.error("Please login to sync progress");
      return;
    }

    try {
      await aiRecommendationService.saveTopicsToMasterProgress(
        auth.currentUser.uid,
        topicsProgress
      );
      toast.success("Topics to Master progress synced to cloud! ☁️");
    } catch (error) {
      console.error("Error syncing topics to master:", error);
      toast.error("Failed to sync progress");
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const groupRecommendationsByPriority = () => {
    if (!recommendations) return {};

    const grouped = {
      CRITICAL: [],
      HIGH: [],
      MEDIUM: [],
      LOW: [],
    };

    recommendations.forEach((rec) => {
      if (grouped[rec.priority]) {
        grouped[rec.priority].push(rec);
      }
    });

    return grouped;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-100 text-red-800 border-red-300";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "LOW":
        return "bg-green-100 text-green-800 border-green-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getCurrentDayInfo = () => {
    if (!dailyPlan) return null;

    const today = new Date();
    const startDate = new Date(dailyPlan.startDate);
    const daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

    if (daysPassed < 0 || daysPassed >= dailyPlan.totalDays) {
      return null;
    }

    return {
      dayNumber: daysPassed + 1,
      plan: dailyPlan.dailyPlans[daysPassed],
    };
  };

  if (loading && !recommendations) {
    return (
      <div className="flex items-center justify-center p-12">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
        <span className="ml-3 text-lg">Generating smart recommendations...</span>
      </div>
    );
  }

  return (
    <div className="ai-recommendations-container p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FaBrain className="text-3xl text-purple-600 dark:text-purple-400 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Smart Recommendation System
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Personalized recommendations for your interview prep
            </p>
          </div>
        </div>
        <button
          onClick={() => loadRecommendations(true)}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
        >
          <FaSync className={loading ? "animate-spin mr-2" : "mr-2"} />
          Refresh
        </button>
      </div>

      {/* Analysis Overview */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Questions</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {analysis.totalQuestions}
                </p>
              </div>
              <FaBook className="text-3xl text-blue-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Solved</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {analysis.totalSolved}
                </p>
              </div>
              <FaCheckCircle className="text-3xl text-green-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Starred</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {analysis.totalStarred}
                </p>
              </div>
              <FaStar className="text-3xl text-yellow-500" />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completion</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {analysis.overallCompletion}%
                </p>
              </div>
              <FaChartLine className="text-3xl text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-300">
        <button
          onClick={() => setActiveTab("recommendations")}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === "recommendations"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-600 hover:text-purple-600"
          }`}
        >
          <FaLightbulb className="inline mr-2" />
          Recommendations
        </button>
        <button
          onClick={() => setActiveTab("plan")}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === "plan"
              ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400"
              : "text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
          }`}
        >
          <FaCalendarAlt className="inline mr-2" />
          40-Day Plan
        </button>
        <button
          onClick={() => setActiveTab("topics")}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === "topics"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-600 hover:text-purple-600"
          }`}
        >
          <FaRocket className="inline mr-2" />
          Topics to Learn
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "recommendations" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {recommendations && recommendations.length > 0 ? (
              <div className="space-y-4">
                {/* Grouped Recommendations */}
                {Object.entries(groupRecommendationsByPriority()).map(
                  ([priority, questions]) =>
                    questions.length > 0 && (
                      <div key={priority} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
                        <h3 className="text-lg font-bold mb-3 flex items-center dark:text-gray-100">
                          {priority === "CRITICAL" && <FaFire className="mr-2 text-red-500" />}
                          {priority === "HIGH" && <FaTrophy className="mr-2 text-orange-500" />}
                          {priority} Priority ({questions.length})
                        </h3>
                        <div className="space-y-2">
                          {questions.map((rec, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border-l-4 ${getPriorityColor(
                                rec.priority
                              )} hover:shadow-md transition cursor-pointer`}
                              onClick={() => onQuestionSelect && onQuestionSelect(rec)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                                    {rec.Question}
                                  </p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {rec.topic}
                                  </p>
                                  <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                                    {rec.reason}
                                  </p>
                                </div>
                                {rec.Question_link && (
                                  <a
                                    href={rec.Question_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <FaExternalLinkAlt />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                )}

                {/* External Recommendations */}
                {externalRecommendations.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className="flex items-center cursor-pointer flex-1"
                        onClick={() => toggleSection("external")}
                      >
                        <h3 className="text-lg font-bold flex items-center dark:text-gray-100">
                          <FaExternalLinkAlt className="mr-2 text-blue-500" />
                          External Questions ({externalRecommendations.length})
                        </h3>
                        <span className="ml-2">
                          {expandedSections.external ? (
                            <FaChevronUp className="dark:text-gray-300" />
                          ) : (
                            <FaChevronDown className="dark:text-gray-300" />
                          )}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          syncExternalQuestionsToCloud();
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm flex items-center"
                      >
                        <FaSync className="mr-1" />
                        Sync to Cloud
                      </button>
                    </div>
                    {expandedSections.external && (
                      <div className="mt-3 space-y-2">
                        {externalRecommendations.map((rec, idx) => {
                          const isSolved = externalQuestionsProgress.solved[rec.Question] || false;
                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border-l-4 ${getPriorityColor(
                                rec.priority
                              )} hover:shadow-md transition ${isSolved ? 'opacity-60' : ''}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-2 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={isSolved}
                                    onChange={() => handleExternalQuestionToggle(rec.Question)}
                                    className="mt-1 h-4 w-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                                  />
                                  <div className="flex-1">
                                    <p className={`font-semibold text-gray-800 dark:text-gray-100 ${isSolved ? 'line-through' : ''}`}>
                                      {rec.Question}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {rec.Topic} • {rec.Difficulty}
                                      {rec.company && ` • ${rec.company}`}
                                    </p>
                                    <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                                      {rec.reason}
                                    </p>
                                  </div>
                                </div>
                                {rec.Question_link && (
                                  <a
                                    href={rec.Question_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800"
                                  >
                                    <FaExternalLinkAlt />
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <FaLightbulb className="text-6xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Click "Refresh" to get personalized recommendations
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "plan" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {!dailyPlan ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow">
                <FaCalendarAlt className="text-6xl text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2 dark:text-gray-100">
                  Generate Your 40-Day Study Plan
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Get a personalized day-by-day plan from Nov 13 to Dec 23, 2025
                  <br />
                  <span className="text-sm">Weekdays: 3 questions + 2 hrs learning | Weekends: 6 questions + 4 hrs learning</span>
                </p>
                <button
                  onClick={generate40DayPlan}
                  disabled={loading}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 font-semibold"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="inline animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FaRocket className="inline mr-2" />
                      Generate Plan
                    </>
                  )}
                </button>
              </div>
            ) : (
              <DailyPlanView
                dailyPlan={dailyPlan}
                onReplan={replanBasedOnProgress}
                loading={loading}
              />
            )}
          </motion.div>
        )}

        {activeTab === "topics" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <TopicLearningSuggestions onSyncToCloud={syncTopicsToMasterToCloud} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Daily Plan View Component
const DailyPlanView = ({ dailyPlan, onReplan, loading }) => {
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    // Auto-select current day
    const today = new Date();
    const startDate = new Date(dailyPlan.startDate);
    const daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

    if (daysPassed >= 0 && daysPassed < dailyPlan.totalDays) {
      setSelectedDay(daysPassed);
    }
  }, [dailyPlan]);

  const updateDayProgress = async (dayNumber, questionIndex, completed) => {
    const auth = getAuth();
    if (!auth.currentUser) return;

    try {
      const day = dailyPlan.dailyPlans[dayNumber];
      day.questions[questionIndex].completed = completed;

      const completedCount = day.questions.filter((q) => q.completed).length;
      day.progress.questionsCompleted = completedCount;

      if (completedCount === day.questions.length && day.topics.length === 0) {
        day.completed = true;
      }

      await aiRecommendationService.updateDailyProgress(
        auth.currentUser.uid,
        dayNumber + 1,
        day
      );

      toast.success("Progress updated!");
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
    }
  };

  const currentDay = dailyPlan.dailyPlans[selectedDay];
  const today = new Date();
  const startDate = new Date(dailyPlan.startDate);
  const daysPassed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-4">
      {/* Plan Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold dark:text-gray-100">Your 40-Day Study Plan</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(dailyPlan.startDate).toLocaleDateString()} -{" "}
              {new Date(dailyPlan.endDate).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onReplan}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <FaSync className={loading ? "animate-spin inline mr-2" : "inline mr-2"} />
            Replan
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1 dark:text-gray-300">
            <span>Overall Progress</span>
            <span>
              Day {daysPassed + 1} / {dailyPlan.totalDays}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
            <div
              className="bg-purple-600 h-3 rounded-full transition-all"
              style={{
                width: `${((daysPassed + 1) / dailyPlan.totalDays) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Day Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <h4 className="font-semibold mb-3">Select Day</h4>
        <div className="grid grid-cols-7 gap-2 max-h-64 overflow-y-auto">
          {dailyPlan.dailyPlans.map((day, idx) => {
            const isToday = idx === daysPassed;
            const isPast = idx < daysPassed;
            const isFuture = idx > daysPassed;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDay(idx)}
                className={`p-2 rounded-lg text-sm font-semibold transition ${
                  selectedDay === idx
                    ? "bg-purple-600 text-white"
                    : day.completed
                    ? "bg-green-100 text-green-800"
                    : isToday
                    ? "bg-blue-100 text-blue-800"
                    : isPast
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                } hover:shadow`}
              >
                Day {day.day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {currentDay && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-bold dark:text-gray-100">
                Day {currentDay.day} - {currentDay.dayOfWeek}, {currentDay.date}
              </h4>
              {currentDay.isWeekend && (
                <span className="text-sm text-blue-600 dark:text-blue-400">
                  🎯 Weekend Plan: 6 questions + 4 hrs learning
                </span>
              )}
              {!currentDay.isWeekend && (
                <span className="text-sm text-purple-600 dark:text-purple-400">
                  📚 Weekday Plan: 3 questions + 2 hrs learning
                </span>
              )}
            </div>
            {currentDay.completed && (
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full text-sm font-semibold">
                <FaCheckCircle className="inline mr-1" />
                Completed
              </span>
            )}
          </div>

          {/* Questions */}
          {currentDay.questions.length > 0 && (
            <div className="mb-4">
              <h5 className="font-semibold mb-2 dark:text-gray-200">
                DSA Questions ({currentDay.progress?.questionsCompleted || 0}/
                {currentDay.questions.length})
              </h5>
              <div className="space-y-2">
                {currentDay.questions.map((question, idx) => (
                  <div
                    key={idx}
                    className="flex items-start p-2 rounded-lg bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600"
                  >
                    <input
                      type="checkbox"
                      checked={question.completed || false}
                      onChange={(e) =>
                        updateDayProgress(selectedDay, idx, e.target.checked)
                      }
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <p className="font-medium dark:text-gray-200">{question.Question}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {question.topic} • {question.difficulty || "Medium"}
                        {question.isStarred && " ⭐"}
                      </p>
                    </div>
                    {question.Question_link && (
                      <a
                        href={question.Question_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800"
                      >
                        <FaExternalLinkAlt />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning Materials */}
          {currentDay.learningMaterials && currentDay.learningMaterials.length > 0 && (
            <div>
              <h5 className="font-semibold mb-2 dark:text-gray-200">
                Learning Materials ({currentDay.progress?.materialsCompleted || 0}/{currentDay.learningMaterials.length})
              </h5>
              <div className="space-y-2">
                {currentDay.learningMaterials.map((material, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border-l-4 ${
                      material.skipped
                        ? "bg-gray-100 dark:bg-slate-700 border-gray-400 opacity-60"
                        : material.source === "udemy"
                        ? "bg-purple-50 dark:bg-purple-900/20 border-purple-500"
                        : "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start flex-1">
                        <input
                          type="checkbox"
                          checked={material.completed || false}
                          disabled={material.skipped}
                          onChange={(e) => {
                            // Update material completion
                            material.completed = e.target.checked;
                            const completedCount = currentDay.learningMaterials.filter(m => m.completed).length;
                            currentDay.progress.materialsCompleted = completedCount;
                            toast.success(e.target.checked ? "Material completed! ✅" : "Marked as incomplete");
                          }}
                          className="mt-1 mr-3"
                        />
                        <div className="flex-1">
                          <span className="font-medium dark:text-gray-200">{material.title}</span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {material.type} • {material.estimatedHours} hrs
                            {material.source === "udemy" && " • Udemy Course"}
                          </p>
                          {material.topics && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Topics: {material.topics.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        {material.url && !material.skipped && (
                          <a
                            href={material.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800"
                            title="Open resource"
                          >
                            <FaExternalLinkAlt />
                          </a>
                        )}
                        {!material.completed && !material.skipped && (
                          <button
                            onClick={() => {
                              material.skipped = true;
                              toast.info("Material skipped. It may be reassigned later.");
                            }}
                            className="text-xs px-2 py-1 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300"
                            title="Skip this topic"
                          >
                            Skip
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Topic Learning Suggestions Component
const TopicLearningSuggestions = ({ onSyncToCloud }) => {
  const suggestions = aiRecommendationService.getTopicLearningSuggestions();
  const [topicsProgress, setTopicsProgress] = useState(() => {
    const saved = localStorage.getItem("TopicsToMasterProgress");
    return saved ? JSON.parse(saved) : {};
  });

  const handleTopicToggle = (categoryIndex, topicIndex) => {
    const key = `${categoryIndex}-${topicIndex}`;
    const newProgress = {
      ...topicsProgress,
      [key]: !topicsProgress[key],
    };
    setTopicsProgress(newProgress);
    localStorage.setItem("TopicsToMasterProgress", JSON.stringify(newProgress));
    toast.success(newProgress[key] ? "Topic completed! ✅" : "Marked as incomplete");
  };

  const handleSyncClick = () => {
    if (onSyncToCloud) {
      onSyncToCloud(topicsProgress);
    }
  };

  const generateChatGPTLink = (category, topic) => {
    let prompt = "";
    if (category === "System Design (Must Learn)") {
      prompt = `I'm preparing for Java Spring Boot interviews with 2 years of experience. Teach me about ${topic} in detail with real-world examples. Then give me 5 practice questions to test my understanding.`;
    } else if (category === "Java Advanced (Important)") {
      prompt = `Explain ${topic} for a Java developer with 2 YoE. Use real-world examples from production systems. Then quiz me with 5 challenging questions to verify my understanding.`;
    } else if (category === "Spring Boot Advanced") {
      prompt = `I'm a Spring Boot developer with 2 years experience. Teach me ${topic} in depth with code examples. Then test me with 5 practical scenario-based questions.`;
    } else if (category === "DevOps & Cloud") {
      prompt = `Explain ${topic} for a Java Spring Boot developer. Focus on practical usage and best practices. Then give me 5 questions to test my knowledge.`;
    } else {
      prompt = `I'm preparing for Java interviews. Explain ${topic} with examples and then test me with 5 questions.`;
    }

    return `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-xl font-bold dark:text-gray-100">Topics to Master for Job Switch</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Focus areas for Java Spring Boot Developer with 2 YoE
            </p>
          </div>
          <button
            onClick={handleSyncClick}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm flex items-center"
          >
            <FaSync className="mr-1" />
            Sync to Cloud
          </button>
        </div>
      </div>

      {suggestions.map((category, idx) => (
        <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
          <h4 className="text-lg font-bold mb-2 text-purple-600 dark:text-purple-400">
            {category.category}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Estimated time: {category.estimatedTime}
          </p>

          <div className="mb-3">
            <h5 className="font-semibold mb-2 dark:text-gray-200">Topics:</h5>
            <ul className="space-y-2">
              {category.topics.map((topic, tidx) => {
                const key = `${idx}-${tidx}`;
                const isCompleted = topicsProgress[key] || false;
                return (
                  <li key={tidx} className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => handleTopicToggle(idx, tidx)}
                      className="mt-1"
                    />
                    <span className={`flex-1 ${isCompleted ? 'line-through text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                      {topic}
                    </span>
                    <a
                      href={generateChatGPTLink(category.category, topic)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50 flex items-center"
                      title="Learn with ChatGPT"
                    >
                      🤖 ChatGPT
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h5 className="font-semibold mb-2 dark:text-gray-200">Recommended Resources:</h5>
            <ul className="list-disc list-inside space-y-1">
              {category.resources.map((resource, ridx) => (
                <li key={ridx} className="text-gray-700 dark:text-gray-300">
                  {resource}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AIRecommendations;
