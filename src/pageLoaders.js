// The page chunks, in one place: App.jsx lazy-loads them, and the site tour
// calls them early so each page is already downloaded when the tour opens it.
export const loadStackHome = () => import("./pages/Notes/StackHome");
export const loadTopicNotes = () => import("./pages/Notes/TopicNotes");
export const loadDSAPrep = () => import("./pages/DSAPrep/DSAPrep");
export const loadPlanning = () => import("./pages/Planning/Planning");
export const loadContests = () => import("./pages/Contests/Contests");
export const loadAuthPage = () => import("./pages/SignInUp/AuthPage");
// The (large) company dataset is only fetched when someone opens the tracker.
export const loadJobTracker = () => import("./pages/JobTracker/JobTracker");
