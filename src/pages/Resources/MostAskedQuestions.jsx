import React, { useState, useEffect, useRef, useCallback } from "react";
import FAQQuestions from "../../Data/MostAskedQuestions.json";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { motion, AnimatePresence } from "framer-motion";
import useProgressSync from "../../hooks/useProgressSync";
import SyncButton from "../../components/SyncButton";

const FORTY_FIVE_DAYS_MS = 45 * 24 * 60 * 60 * 1000;

const MostAskedQuestions = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [solvedQuestions, setSolvedQuestions] = useState(
    () => JSON.parse(localStorage.getItem("FAQSolvedQuestions")) || {}
  );
  const [solvedTimestamps, setSolvedTimestamps] = useState(
    () => JSON.parse(localStorage.getItem("FAQSolvedTimestamps")) || {}
  );
  const [faqNotes, setFaqNotes] = useState(
    () => JSON.parse(localStorage.getItem("FAQNotes")) || {}
  );
  const [totalProblems, setTotalProblems] = useState(0);
  const [solvedProblems, setSolvedProblems] = useState(0);
  const [showRestartModal, setShowRestartModal] = useState(false);

  const {
    isSyncing,
    isLoading,
    syncStatus,
    hasUnsyncedChanges,
    syncToDatabase,
    loadFromDatabase,
    markAsChanged,
    isAuthenticated,
  } = useProgressSync("FAQ");

  // Load topics
  useEffect(() => {
    setTopics(Object.keys(FAQQuestions));
  }, []);

  // Calculate totals
  useEffect(() => {
    let total = 0;
    for (let topic in FAQQuestions) {
      total += FAQQuestions[topic].length;
    }
    setTotalProblems(total);
    const solved = Object.values(solvedQuestions).filter((val) => val).length;
    setSolvedProblems(solved);
  }, [solvedQuestions]);

  // 45-day auto-uncheck on mount
  useEffect(() => {
    const now = Date.now();
    let changed = false;
    const updatedSolved = { ...solvedQuestions };
    const updatedTimestamps = { ...solvedTimestamps };

    for (const [name, ts] of Object.entries(updatedTimestamps)) {
      if (now - ts > FORTY_FIVE_DAYS_MS) {
        updatedSolved[name] = false;
        delete updatedTimestamps[name];
        changed = true;
      }
    }

    if (changed) {
      setSolvedQuestions(updatedSolved);
      setSolvedTimestamps(updatedTimestamps);
      localStorage.setItem("FAQSolvedQuestions", JSON.stringify(updatedSolved));
      localStorage.setItem(
        "FAQSolvedTimestamps",
        JSON.stringify(updatedTimestamps)
      );
      markAsChanged();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to selected topic
  const selectedTopicRef = useRef(null);
  useEffect(() => {
    if (selectedTopicRef.current) {
      selectedTopicRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedTopic]);

  const handleCheckboxChange = (name, isChecked) => {
    const updatedSolved = { ...solvedQuestions, [name]: isChecked };
    const updatedTimestamps = { ...solvedTimestamps };

    if (isChecked) {
      updatedTimestamps[name] = Date.now();
    } else {
      delete updatedTimestamps[name];
    }

    setSolvedQuestions(updatedSolved);
    setSolvedTimestamps(updatedTimestamps);
    localStorage.setItem("FAQSolvedQuestions", JSON.stringify(updatedSolved));
    localStorage.setItem(
      "FAQSolvedTimestamps",
      JSON.stringify(updatedTimestamps)
    );
    markAsChanged();
  };

  const handleStarChange = () => {
    markAsChanged();
  };

  const handleNoteChange = (name, note) => {
    const updatedNotes = { ...faqNotes, [name]: note };
    setFaqNotes(updatedNotes);
    localStorage.setItem("FAQNotes", JSON.stringify(updatedNotes));
    markAsChanged();
  };

  const handleRestart = () => {
    localStorage.removeItem("FAQSolvedQuestions");
    localStorage.removeItem("FAQStarredQuestions");
    localStorage.removeItem("FAQSolvedTimestamps");
    localStorage.removeItem("FAQNotes");
    setSolvedQuestions({});
    setSolvedTimestamps({});
    setFaqNotes({});
    markAsChanged();
    setShowRestartModal(false);
  };

  // Listen for progress data loaded from database
  useEffect(() => {
    const handleProgressDataLoaded = (event) => {
      if (event.detail.sheetType === "FAQ") {
        const data = event.detail.data;
        setSolvedQuestions(data.solved || {});
        setSolvedTimestamps(data.timestamps || {});
        setFaqNotes(data.notes || {});
      }
    };

    window.addEventListener("progressDataLoaded", handleProgressDataLoaded);
    return () =>
      window.removeEventListener(
        "progressDataLoaded",
        handleProgressDataLoaded
      );
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="min-h-screen flex justify-center">
        <div className="w-full sm:w-3/4 lg:w-2/3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <div className="ml-4">
              <h1 className="text-xl mt-4 dark:text-gray-300 font-semibold mb-1">
                Most Asked DSA Questions
              </h1>
              <p className="text-xs ml-2 text-gray-500 dark:text-gray-500 mb-2">
                Top 100 interview questions with 45-day spaced repetition
              </p>
              <h2 className="text-sm ml-2 text-gray-600 font-bold">
                {solvedProblems} / {totalProblems} solved
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mr-4">
              <div className="mt-2" style={{ width: 68, height: 60 }}>
                <CircularProgressbar
                  value={solvedProblems}
                  maxValue={totalProblems || 1}
                  text={`${Math.round(
                    (solvedProblems / (totalProblems || 1)) * 100
                  )}%`}
                  styles={buildStyles({
                    pathColor: "#22c55e",
                    trailColor: "lightgray",
                    textSize: "16px",
                    textColor: "#22c55e",
                  })}
                />
              </div>

              <SyncButton
                onSyncToDatabase={syncToDatabase}
                onLoadFromDatabase={loadFromDatabase}
                isSyncing={isSyncing}
                isLoading={isLoading}
                hasUnsyncedChanges={hasUnsyncedChanges}
                syncStatus={syncStatus}
                isAuthenticated={isAuthenticated}
                className="mt-2 sm:mt-0"
              />

              <button
                onClick={() => setShowRestartModal(true)}
                className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="Restart Session"
              >
                Restart
              </button>
            </div>
          </div>

          <AnimatePresence>
            {topics.map((topic, index) => (
              <motion.div
                key={topic}
                initial={{ opacity: 0, y: -100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -100 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <FAQTopicCard
                  id={topic}
                  name={topic}
                  questions={FAQQuestions[topic]}
                  selectedTopic={selectedTopic}
                  setSelectedTopic={setSelectedTopic}
                  solvedQuestions={solvedQuestions}
                  solvedTimestamps={solvedTimestamps}
                  faqNotes={faqNotes}
                  onQuestionSolved={handleCheckboxChange}
                  onQuestionStarred={handleStarChange}
                  onNoteChange={handleNoteChange}
                  ref={topic === selectedTopic ? selectedTopicRef : null}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Restart Confirmation Modal */}
      <AnimatePresence>
        {showRestartModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
            onClick={() => setShowRestartModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-200 dark:border-slate-600"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Restart Session?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This will clear all your progress, notes, and starred questions.
                This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowRestartModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestart}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Clear All Data
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── FAQTopicCard ──────────────────────────────────────────────────────────

const FAQTopicCard = React.forwardRef((props, ref) => {
  const {
    id,
    name,
    questions,
    selectedTopic,
    setSelectedTopic,
    solvedQuestions,
    solvedTimestamps,
    faqNotes,
    onQuestionSolved,
    onQuestionStarred,
    onNoteChange,
  } = props;

  const [solvedQuestionCount, setSolvedQuestionCount] = useState(0);
  const isOpen = id === selectedTopic;

  const handleTopicClick = () => {
    setSelectedTopic(isOpen ? null : id);
  };

  useEffect(() => {
    const updateSolvedCount = () => {
      const faqSolved =
        JSON.parse(localStorage.getItem("FAQSolvedQuestions")) || {};
      const count = questions.filter((q) => faqSolved[q.Question]).length;
      setSolvedQuestionCount(count);
    };

    updateSolvedCount();
    window.addEventListener("storage", updateSolvedCount);
    return () => window.removeEventListener("storage", updateSolvedCount);
  }, [questions, selectedTopic]);

  useEffect(() => {
    const count = questions.filter((q) => solvedQuestions[q.Question]).length;
    setSolvedQuestionCount(count);
  }, [questions, selectedTopic, solvedQuestions]);

  const progressPercentage = (100 * solvedQuestionCount) / questions.length;

  return (
    <div
      ref={ref}
      className={`relative md:cursor-pointer bg-white dark:bg-slate-800 shadow-lg rounded-md overflow-hidden transition-shadow duration-300 px-2 py-0.5 my-1 border border-gray-200 dark:border-slate-600${
        isOpen ? " pb-4" : ""
      }`}
      onClick={handleTopicClick}
    >
      <div className="flex justify-between items-center sm:w-[90%]">
        <div className="flex-grow">
          <h1 className="flex md:text-md text-sm font-bold text-overflow-ellipsis whitespace-nowrap dark:text-gray-400 text-gray-700">
            {name}
          </h1>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-[12px] text-gray-600">
            {solvedQuestionCount} / {questions.length} solved
          </p>
          <div className="flex w-full flex-col gap-4">
            <FAQProgressBar progressPercentage={progressPercentage} />
          </div>
        </div>
      </div>
      {isOpen && (
        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
          <div className="items-center sm:w-[70%] md:w-[80%] lg:w-[90%] mx-auto">
            <AnimatePresence>
              {questions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 10,
                    delay: index * 0.05,
                  }}
                >
                  <FAQQuestionCard
                    name={question.Question}
                    link={question.Question_link}
                    timestamp={solvedTimestamps[question.Question]}
                    note={faqNotes[question.Question] || ""}
                    onQuestionSolved={onQuestionSolved}
                    onQuestionStarred={onQuestionStarred}
                    onNoteChange={onNoteChange}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
});

// ─── FAQQuestionCard ───────────────────────────────────────────────────────

function FAQQuestionCard({
  name,
  link,
  timestamp,
  note,
  onQuestionSolved,
  onQuestionStarred,
  onNoteChange,
}) {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [localNote, setLocalNote] = useState(note);
  const debounceRef = useRef(null);

  const truncatedName = name.length > 25 ? name.substring(0, 25) + ".." : name;
  const lesstruncatedName =
    name.length > 52 ? name.substring(0, 50) + ".." : name;
  const truncatedLink = link.length > 80 ? link.substring(0, 80) : link;
  const extratruncatedLink =
    link.length > 30 ? link.substring(0, 25) + "..." : link;

  const [isChecked, setIsChecked] = useState(() => {
    const faqSolved =
      JSON.parse(localStorage.getItem("FAQSolvedQuestions")) || {};
    return faqSolved[name] || false;
  });

  const [isStarred, setIsStarred] = useState(() => {
    const faqStarred =
      JSON.parse(localStorage.getItem("FAQStarredQuestions")) || {};
    return faqStarred[name] || false;
  });

  // Calculate days remaining
  const daysLeft = timestamp
    ? 45 - Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000))
    : null;

  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);
    onQuestionSolved(name, event.target.checked);
  };

  const handleStarToggle = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const newStarred = !isStarred;
    setIsStarred(newStarred);
    const faqStarred =
      JSON.parse(localStorage.getItem("FAQStarredQuestions")) || {};
    faqStarred[name] = newStarred;
    localStorage.setItem("FAQStarredQuestions", JSON.stringify(faqStarred));
    if (onQuestionStarred) onQuestionStarred(name, newStarred);
  };

  const handleNoteToggle = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setShowNotes(!showNotes);
  };

  const handleNoteInput = useCallback(
    (e) => {
      const val = e.target.value;
      setLocalNote(val);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onNoteChange(name, val);
      }, 500);
    },
    [name, onNoteChange]
  );

  useEffect(() => {
    setLocalNote(note);
  }, [note]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setIsSmallScreen(window.innerWidth < 1000);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="mb-1">
      <div
        className={`flex items-center rounded-lg px-2 p-[7px] shadow-md m-0.5 hover:shadow-lg transition-all ${
          isChecked
            ? "bg-green-100 dark:bg-green-900/25 border border-green-300 dark:border-green-800"
            : "bg-slate-100 dark:bg-slate-700"
        }`}
      >
        <div className="flex-grow flex flex-row items-center">
          <h3
            className={`md:text-[14px] text-[12px] dark:text-gray-400 font-semibold truncate ${
              isSmallScreen ? "w-full" : "w-3/5"
            }`}
          >
            {isSmallScreen ? truncatedName : lesstruncatedName}
          </h3>
          <div className="flex text-sm items-center justify-between w-full mt-2 sm:mt-0">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 ml-[40px] md:ml-[4px] hover:underline"
            >
              {isSmallScreen ? "link" : truncatedLink}
            </a>
            <div className="flex items-center ml-2 gap-1">
              {/* Days remaining badge */}
              {isChecked && daysLeft != null && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-200 dark:bg-green-800 text-green-700 dark:text-green-300 font-medium whitespace-nowrap">
                  {daysLeft}d
                </span>
              )}

              {/* Notes toggle */}
              <button
                onClick={handleNoteToggle}
                title="Notes"
                className={`text-gray-500 hover:text-blue-500 hover:scale-110 transition-all ${
                  localNote ? "text-blue-500" : "opacity-50"
                }`}
                style={{ fontSize: "16px", lineHeight: "16px" }}
              >
                {localNote ? "\u270E" : "\u270E"}
              </button>

              {/* Star */}
              <button
                onClick={handleStarToggle}
                aria-label={isStarred ? "Unstar question" : "Star question"}
                title={isStarred ? "Unstar" : "Star"}
                className={`text-yellow-500 hover:scale-110 transition-transform ${
                  isStarred ? "" : "opacity-40"
                }`}
                style={{ fontSize: "20px", lineHeight: "20px" }}
              >
                {isStarred ? "\u2605" : "\u2606"}
              </button>

              {/* Checkbox */}
              <input
                className="form-checkbox h-4 w-4 accent-green-500"
                type="checkbox"
                checked={isChecked}
                onChange={handleCheckboxChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Notes */}
      <AnimatePresence>
        {showNotes && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mx-2 mt-0.5 mb-1">
              <textarea
                value={localNote}
                onChange={handleNoteInput}
                placeholder="Add your notes here..."
                className="w-full p-2 text-xs rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-y min-h-[60px]"
                rows={3}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── FAQProgressBar ────────────────────────────────────────────────────────

const FAQProgressBar = ({ progressPercentage }) => {
  return (
    <div className="min-w-[90px] max-w-[90px] h-3 bg-slate-200 dark:bg-slate-600 rounded-md">
      <div
        style={{ width: `${progressPercentage}%` }}
        className={`rounded-lg bg-green-500 ${
          progressPercentage < 5
            ? "h-[60%] mt-[2.5px]"
            : progressPercentage < 12
            ? "h-[80%] mt-[1.5px]"
            : "h-[90%] mt-[0.5px]"
        }`}
      ></div>
    </div>
  );
};

export default MostAskedQuestions;
