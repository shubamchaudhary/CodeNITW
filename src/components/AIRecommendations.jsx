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
import aiRecommendationService from "../services/AIRecommendationService";
import { auth } from "../firebase";

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

  // Load recommendations on mount
  useEffect(() => {
    if (auth.currentUser) {
      loadRecommendations();
    }
  }, []);

  const loadRecommendations = async () => {
    if (!auth.currentUser) {
      toast.error("Please login to get personalized recommendations");
      return;
    }

    setLoading(true);
    try {
      // Load AI recommendations
      const recData = await aiRecommendationService.generateRecommendations(
        auth.currentUser.uid,
        15
      );
      setRecommendations(recData.recommendations);
      setAnalysis(recData.analysis);

      // Load external recommendations
      const extData = await aiRecommendationService.generateExternalRecommendations(
        recData.analysis,
        5
      );
      setExternalRecommendations(extData);

      // Try to load existing plan
      const existingPlan = await aiRecommendationService.loadDailyPlan(
        auth.currentUser.uid
      );
      setDailyPlan(existingPlan);

      toast.success("Recommendations loaded successfully!");
    } catch (error) {
      console.error("Error loading recommendations:", error);
      toast.error("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  const generate45DayPlan = async () => {
    if (!auth.currentUser) {
      toast.error("Please login to generate a plan");
      return;
    }

    setLoading(true);
    try {
      const plan = await aiRecommendationService.generate45DayPlan(
        auth.currentUser.uid
      );
      await aiRecommendationService.saveDailyPlan(auth.currentUser.uid, plan);
      setDailyPlan(plan);
      toast.success("45-day study plan generated successfully! 🎉");
      setActiveTab("plan");
    } catch (error) {
      console.error("Error generating plan:", error);
      toast.error("Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  const replanBasedOnProgress = async () => {
    if (!auth.currentUser || !dailyPlan) {
      return;
    }

    setLoading(true);
    try {
      const result = await aiRecommendationService.replanBasedOnProgress(
        auth.currentUser.uid
      );
      if (result.success) {
        setDailyPlan(result.updatedPlan);
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
        <span className="ml-3 text-lg">Generating AI recommendations...</span>
      </div>
    );
  }

  return (
    <div className="ai-recommendations-container p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FaBrain className="text-3xl text-purple-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              AI-Powered Study Assistant
            </h2>
            <p className="text-sm text-gray-600">
              Personalized recommendations for your interview prep
            </p>
          </div>
        </div>
        <button
          onClick={loadRecommendations}
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
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Questions</p>
                <p className="text-2xl font-bold text-gray-800">
                  {analysis.totalQuestions}
                </p>
              </div>
              <FaBook className="text-3xl text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Solved</p>
                <p className="text-2xl font-bold text-green-600">
                  {analysis.totalSolved}
                </p>
              </div>
              <FaCheckCircle className="text-3xl text-green-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Starred</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {analysis.totalStarred}
                </p>
              </div>
              <FaStar className="text-3xl text-yellow-500" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion</p>
                <p className="text-2xl font-bold text-purple-600">
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
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-600 hover:text-purple-600"
          }`}
        >
          <FaCalendarAlt className="inline mr-2" />
          45-Day Plan
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
                      <div key={priority} className="bg-white rounded-lg shadow p-4">
                        <h3 className="text-lg font-bold mb-3 flex items-center">
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
                                  <p className="font-semibold text-gray-800">
                                    {rec.Question}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {rec.topic}
                                  </p>
                                  <p className="text-sm text-purple-600 mt-1">
                                    {rec.reason}
                                  </p>
                                </div>
                                {rec.Question_link && (
                                  <a
                                    href={rec.Question_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-blue-600 hover:text-blue-800"
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
                  <div className="bg-white rounded-lg shadow p-4">
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => toggleSection("external")}
                    >
                      <h3 className="text-lg font-bold flex items-center">
                        <FaExternalLinkAlt className="mr-2 text-blue-500" />
                        External Questions ({externalRecommendations.length})
                      </h3>
                      {expandedSections.external ? (
                        <FaChevronUp />
                      ) : (
                        <FaChevronDown />
                      )}
                    </div>
                    {expandedSections.external && (
                      <div className="mt-3 space-y-2">
                        {externalRecommendations.map((rec, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border-l-4 ${getPriorityColor(
                              rec.priority
                            )} hover:shadow-md transition`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-800">
                                  {rec.Question}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {rec.topic}
                                  {rec.company && ` • ${rec.company}`}
                                </p>
                                <p className="text-sm text-purple-600 mt-1">
                                  {rec.reason}
                                </p>
                              </div>
                              {rec.searchUrl && (
                                <a
                                  href={rec.searchUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-2 text-blue-600 hover:text-blue-800"
                                >
                                  <FaExternalLinkAlt />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
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
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <FaCalendarAlt className="text-6xl text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">
                  Generate Your 45-Day Study Plan
                </h3>
                <p className="text-gray-600 mb-6">
                  Get a personalized day-by-day plan from Nov 13 to Dec 28, 2025
                </p>
                <button
                  onClick={generate45DayPlan}
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
            <TopicLearningSuggestions />
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
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold">Your 45-Day Study Plan</h3>
            <p className="text-sm text-gray-600">
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
          <div className="flex justify-between text-sm mb-1">
            <span>Overall Progress</span>
            <span>
              Day {daysPassed + 1} / {dailyPlan.totalDays}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
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
      <div className="bg-white rounded-lg shadow p-4">
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
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold">
              Day {currentDay.day} - {currentDay.date}
            </h4>
            {currentDay.completed && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                <FaCheckCircle className="inline mr-1" />
                Completed
              </span>
            )}
          </div>

          {/* Questions */}
          {currentDay.questions.length > 0 && (
            <div className="mb-4">
              <h5 className="font-semibold mb-2">
                DSA Questions ({currentDay.progress?.questionsCompleted || 0}/
                {currentDay.questions.length})
              </h5>
              <div className="space-y-2">
                {currentDay.questions.map((question, idx) => (
                  <div
                    key={idx}
                    className="flex items-start p-2 rounded-lg bg-gray-50 hover:bg-gray-100"
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
                      <p className="font-medium">{question.Question}</p>
                      <p className="text-sm text-gray-600">{question.topic}</p>
                    </div>
                    {question.Question_link && (
                      <a
                        href={question.Question_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaExternalLinkAlt />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topics */}
          {currentDay.topics.length > 0 && (
            <div>
              <h5 className="font-semibold mb-2">Topics to Study</h5>
              <div className="space-y-2">
                {currentDay.topics.map((topic, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-blue-50 border-l-4 border-blue-500"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{topic.title}</span>
                      <span className="text-sm text-gray-600">
                        {topic.estimatedTime}
                      </span>
                    </div>
                    <span className="text-sm text-blue-600">{topic.type}</span>
                    {topic.resources && (
                      <p className="text-sm text-gray-600 mt-1">
                        Resources: {topic.resources.join(", ")}
                      </p>
                    )}
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
const TopicLearningSuggestions = () => {
  const suggestions = aiRecommendationService.getTopicLearningSuggestions();

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-xl font-bold mb-2">Topics to Master for Job Switch</h3>
        <p className="text-gray-600 mb-4">
          Focus areas for Java Spring Boot Developer with 2 YoE
        </p>
      </div>

      {suggestions.map((category, idx) => (
        <div key={idx} className="bg-white rounded-lg shadow p-4">
          <h4 className="text-lg font-bold mb-2 text-purple-600">
            {category.category}
          </h4>
          <p className="text-sm text-gray-600 mb-3">
            Estimated time: {category.estimatedTime}
          </p>

          <div className="mb-3">
            <h5 className="font-semibold mb-2">Topics:</h5>
            <ul className="list-disc list-inside space-y-1">
              {category.topics.map((topic, tidx) => (
                <li key={tidx} className="text-gray-700">
                  {topic}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-semibold mb-2">Recommended Resources:</h5>
            <ul className="list-disc list-inside space-y-1">
              {category.resources.map((resource, ridx) => (
                <li key={ridx} className="text-gray-700">
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
