import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFire,
  FaCalendarAlt,
  FaTrophy,
  FaChartLine,
  FaClock,
  FaBook,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSync,
  FaSave,
  FaEdit,
  FaChevronDown,
  FaChevronUp,
  FaBullseye,
  FaRedo,
} from "react-icons/fa";
import { toast } from "react-toastify";
import interviewPrepService from "../services/InterviewPrepService";

const InterviewPrepDashboard = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [readinessScore, setReadinessScore] = useState(null);
  const [streakData, setStreakData] = useState(null);
  const [dailyTargets, setDailyTargets] = useState(null);
  const [weaknessData, setWeaknessData] = useState(null);
  const [systemDesignTopics, setSystemDesignTopics] = useState([]);
  const [revisionList, setRevisionList] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  // Listen for progress updates from other components
  useEffect(() => {
    const handleCourseProgress = () => {
      // Refresh readiness score when course materials are completed
      setReadinessScore(interviewPrepService.calculateReadinessScore());
    };

    const handleDSAProgress = () => {
      // Refresh all data when DSA questions are solved
      loadAllData();
    };

    const handleStorageChange = () => {
      // Refresh when localStorage changes (cross-tab)
      loadAllData();
    };

    window.addEventListener("courseProgressUpdated", handleCourseProgress);
    window.addEventListener("dsaProgressUpdated", handleDSAProgress);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("courseProgressUpdated", handleCourseProgress);
      window.removeEventListener("dsaProgressUpdated", handleDSAProgress);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const loadAllData = () => {
    setReadinessScore(interviewPrepService.calculateReadinessScore());
    setStreakData(interviewPrepService.updateStreak());
    setDailyTargets(interviewPrepService.getDailyTargetsFromPlan());
    setWeaknessData(interviewPrepService.getWeaknessAnalysis());
    setSystemDesignTopics(interviewPrepService.getSystemDesignTopics());
    setRevisionList(interviewPrepService.getProblemsForRevision());
  };

  const handleSync = async () => {
    setIsSyncing(true);
    const result = await interviewPrepService.syncToFirebase();
    if (result.success) {
      toast.success("Interview prep data synced!");
    } else {
      toast.error("Failed to sync: " + result.error);
    }
    setIsSyncing(false);
  };

  const handleLoad = async () => {
    setIsSyncing(true);
    const result = await interviewPrepService.loadFromFirebase();
    if (result.success) {
      loadAllData();
      toast.success("Data loaded from cloud!");
    } else {
      toast.error(result.error || "No data found");
    }
    setIsSyncing(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FaTrophy className="text-3xl text-yellow-500 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Interview Prep Dashboard
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track your SDE2 interview preparation
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleLoad}
            disabled={isSyncing}
            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm"
          >
            <FaSync className={isSyncing ? "animate-spin mr-1" : "mr-1"} />
            Load
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 text-sm"
          >
            <FaSave className="mr-1" />
            Save
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
        {[
          { id: "overview", label: "Overview", icon: FaChartLine },
          { id: "weakness", label: "Weakness Map", icon: FaExclamationTriangle },
          { id: "systemdesign", label: "System Design", icon: FaBook },
          { id: "revision", label: "Revision", icon: FaRedo },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition ${
              activeSection === id
                ? "bg-purple-600 text-white"
                : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
            }`}
          >
            <Icon className="mr-2" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeSection === "overview" && (
          <OverviewSection
            readinessScore={readinessScore}
            streakData={streakData}
            dailyTargets={dailyTargets}
          />
        )}
        {activeSection === "weakness" && (
          <WeaknessSection weaknessData={weaknessData} />
        )}
        {activeSection === "systemdesign" && (
          <SystemDesignSection
            topics={systemDesignTopics}
            onUpdate={() => setSystemDesignTopics(interviewPrepService.getSystemDesignTopics())}
          />
        )}
        {activeSection === "revision" && (
          <RevisionSection revisionList={revisionList} />
        )}
      </AnimatePresence>
    </div>
  );
};

// ==================== OVERVIEW SECTION ====================
const OverviewSection = ({ readinessScore, streakData, dailyTargets }) => {
  const daysRemaining = dailyTargets?.daysRemaining;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Readiness Score */}
      {readinessScore && (
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold opacity-90">Interview Readiness</h3>
              <p className="text-5xl font-bold mt-2">{readinessScore.total}%</p>
              <p className="text-sm opacity-75 mt-1">
                {readinessScore.total >= 80
                  ? "Excellent! You're well prepared"
                  : readinessScore.total >= 60
                  ? "Good progress, keep going!"
                  : readinessScore.total >= 40
                  ? "Making progress, stay consistent"
                  : "Just getting started, focus on fundamentals"}
              </p>
              {readinessScore.details?.balanceMultiplier < 100 && (
                <p className="text-xs opacity-60 mt-1">
                  Score multiplier: {readinessScore.details.balanceMultiplier}% (balanced prep gives higher score)
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="space-y-1 text-sm">
                <p>DSA: {readinessScore.breakdown.dsa}/60 ({readinessScore.percentages?.dsa || 0}%)</p>
                <p>Course: {readinessScore.breakdown.course}/25 ({readinessScore.details?.materialsCompleted || 0}/{readinessScore.details?.totalMaterials || 0} done)</p>
                <p>System Design: {readinessScore.breakdown.systemDesign}/10 ({readinessScore.percentages?.systemDesign || 0}%)</p>
                <p>Consistency: {readinessScore.breakdown.consistency}/5 ({readinessScore.percentages?.consistency || 0}%)</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-orange-50 dark:bg-orange-900/30 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <FaFire className="text-orange-500 mr-2" />
            <span className="text-sm text-orange-600 dark:text-orange-400">Current Streak</span>
          </div>
          <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">
            {streakData?.currentStreak || 0}
          </p>
          <p className="text-xs text-orange-600 dark:text-orange-400">
            Best: {streakData?.longestStreak || 0} days
          </p>
        </div>

        {/* Days Remaining */}
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <FaCalendarAlt className="text-blue-500 mr-2" />
            <span className="text-sm text-blue-600 dark:text-blue-400">Days Left</span>
          </div>
          {daysRemaining !== null && daysRemaining !== undefined ? (
            <>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {daysRemaining}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {readinessScore?.details?.todayQuestions ? `${readinessScore.details.todayQuestions} problems today` : ""}
              </p>
            </>
          ) : (
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Generate a plan first
            </p>
          )}
        </div>

        {/* Problems Solved */}
        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <FaCheckCircle className="text-green-500 mr-2" />
            <span className="text-sm text-green-600 dark:text-green-400">Solved</span>
          </div>
          <p className="text-3xl font-bold text-green-700 dark:text-green-300">
            {readinessScore?.details?.problemsSolved || 0}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            of {readinessScore?.details?.totalProblems || 243}
          </p>
        </div>

        {/* Course Materials */}
        <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <FaBook className="text-purple-500 mr-2" />
            <span className="text-sm text-purple-600 dark:text-purple-400">Course</span>
          </div>
          <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
            {readinessScore?.details?.materialsCompleted || 0}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            of {readinessScore?.details?.totalMaterials || 0} materials
          </p>
        </div>
      </div>

      {/* Daily Target Alert */}
      {readinessScore?.details?.todayQuestions > 6 && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-lg">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-2" />
            <span className="text-red-700 dark:text-red-300 font-medium">
              High daily target! You have {readinessScore.details.todayQuestions} problems scheduled for today.
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// ==================== WEAKNESS SECTION ====================
const WeaknessSection = ({ weaknessData }) => {
  if (!weaknessData) return null;

  const sortedTopics = Object.entries(weaknessData).sort(
    (a, b) => a[1].percentage - b[1].percentage
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "strong":
        return "bg-green-500";
      case "medium":
        return "bg-yellow-500";
      case "weak":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case "strong":
        return "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800";
      case "medium":
        return "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800";
      case "weak":
        return "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800";
      default:
        return "bg-gray-50 dark:bg-slate-700";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold dark:text-gray-200">Topic Weakness Analysis</h4>
        <div className="flex gap-2 text-xs">
          <span className="flex items-center"><span className="w-3 h-3 rounded bg-red-500 mr-1"></span>Weak (&lt;40%)</span>
          <span className="flex items-center"><span className="w-3 h-3 rounded bg-yellow-500 mr-1"></span>Medium (40-70%)</span>
          <span className="flex items-center"><span className="w-3 h-3 rounded bg-green-500 mr-1"></span>Strong (&gt;70%)</span>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedTopics.map(([topic, data]) => (
          <div
            key={topic}
            className={`p-3 rounded-lg border ${getStatusBg(data.status)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm dark:text-gray-200">{topic}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {data.solved}/{data.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getStatusColor(data.status)}`}
                style={{ width: `${data.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ==================== SYSTEM DESIGN SECTION ====================
const SystemDesignSection = ({ topics, onUpdate }) => {
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [notes, setNotes] = useState({});

  const handleToggleComplete = (topicId) => {
    const topic = topics.find(t => t.id === topicId);
    interviewPrepService.updateSystemDesignTopic(topicId, {
      completed: !topic.completed,
    });
    onUpdate();
    toast.success(topic.completed ? "Marked as incomplete" : "Marked as complete!");
  };

  const handleConfidenceChange = (topicId, confidence) => {
    interviewPrepService.updateSystemDesignTopic(topicId, { confidence });
    onUpdate();
  };

  const handleNoteSave = (topicId) => {
    interviewPrepService.updateSystemDesignTopic(topicId, {
      notes: notes[topicId] || "",
    });
    toast.success("Notes saved!");
  };

  const completedCount = topics.filter(t => t.completed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Progress */}
      <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium dark:text-gray-200">System Design Progress</span>
          <span className="text-sm text-purple-600 dark:text-purple-400">
            {completedCount}/{topics.length} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-3">
          <div
            className="h-3 rounded-full bg-purple-600"
            style={{ width: `${(completedCount / topics.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {topics.map((topic) => (
          <div
            key={topic.id}
            className={`border rounded-lg ${
              topic.completed
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600"
            }`}
          >
            <div
              className="p-3 flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={topic.completed}
                  onChange={() => handleToggleComplete(topic.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mr-3 h-4 w-4"
                />
                <div>
                  <span className={`font-medium ${topic.completed ? "line-through text-gray-500" : "dark:text-gray-200"}`}>
                    {topic.name}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {topic.difficulty} • {topic.companies.join(", ")}
                  </div>
                </div>
              </div>
              {expandedTopic === topic.id ? <FaChevronUp /> : <FaChevronDown />}
            </div>

            {expandedTopic === topic.id && (
              <div className="px-3 pb-3 border-t border-gray-200 dark:border-slate-600 pt-3">
                {/* Confidence Level */}
                <div className="mb-3">
                  <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                    Confidence Level
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => handleConfidenceChange(topic.id, level)}
                        className={`px-3 py-1 rounded text-sm ${
                          topic.confidence >= level
                            ? "bg-purple-600 text-white"
                            : "bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1">
                    Notes
                  </label>
                  <textarea
                    value={notes[topic.id] ?? topic.notes}
                    onChange={(e) => setNotes({ ...notes, [topic.id]: e.target.value })}
                    placeholder="Key concepts, trade-offs, resources..."
                    className="w-full p-2 border rounded text-sm dark:bg-slate-600 dark:border-slate-500 dark:text-white"
                    rows={3}
                  />
                  <button
                    onClick={() => handleNoteSave(topic.id)}
                    className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ==================== REVISION SECTION ====================
const RevisionSection = ({ revisionList }) => {
  if (!revisionList || revisionList.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="text-center py-8"
      >
        <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No problems due for revision!</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
          Keep solving and they'll appear here based on spaced repetition
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
        <div className="flex items-center">
          <FaRedo className="text-yellow-500 mr-2" />
          <span className="font-medium dark:text-gray-200">
            {revisionList.length} problems due for revision
          </span>
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {revisionList.map((problem, idx) => (
          <div
            key={idx}
            className="p-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium dark:text-gray-200">{problem.Question}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{problem.topic}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  {problem.reason}
                </p>
              </div>
              {problem.Question_link && (
                <a
                  href={problem.Question_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
                >
                  Solve
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default InterviewPrepDashboard;
