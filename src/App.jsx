import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "./App.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import OwnerRoute from "./components/OwnerRoute";
import AuthPrompt from "./components/AuthPrompt";
import { startCloudSync, stopCloudSync, onSyncNotice } from "./Data/cloudSync";
import { startNoteHistory, stopNoteHistory } from "./Data/noteHistory";
import { setAuthState } from "./Data/authGate";
import { trackSignIn, trackVisit } from "./Data/visitTracker";

// Every page is its own chunk, so opening one downloads only that page — not
// the notes page's markdown renderer, the planner and the rest with it.
const StackHome = lazy(() => import("./pages/Notes/StackHome"));
const TopicNotes = lazy(() => import("./pages/Notes/TopicNotes"));
const DSAPrep = lazy(() => import("./pages/DSAPrep/DSAPrep"));
const Planning = lazy(() => import("./pages/Planning/Planning"));
const Contests = lazy(() => import("./pages/Contests/Contests"));
const AuthPage = lazy(() => import("./pages/SignInUp/AuthPage"));
// The (large) company dataset is only fetched when someone opens the tracker.
const JobTracker = lazy(() => import("./pages/JobTracker/JobTracker"));

// A page view for every route the app shows (see Data/visitTracker).
function VisitTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    trackVisit("view", pathname);
  }, [pathname]);
  return null;
}

function App() {
  // Anyone can browse; a signed-in account syncs its own progress to Firestore
  // (scoped by uid). The auth state is published first, so the store knows
  // whether a write is allowed before any page can make one.
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (user) => {
      setAuthState(user ? "user" : "guest");
      trackSignIn(user);
      if (user) {
        startCloudSync(user.uid);
        startNoteHistory(user.uid);
      } else {
        stopNoteHistory();
        stopCloudSync();
      }
    });
    return unsub;
  }, []);

  // A note edited on two devices at once: say what happened to it. And warn
  // before the account's synced data outgrows its one Firestore document.
  useEffect(
    () =>
      onSyncNotice((n) => {
        if (n.type === "size") {
          toast.warn(
            `Your synced notes and progress take ${Math.round(n.bytes / 1024)} KB of the 1 MB your account can store. Very long notes count towards it.`,
            { autoClose: false }
          );
        } else if (n.type === "merged") toast.info("A note was also edited on another device. Both sets of changes were merged.");
        else toast.warn("A note changed on another device while you were editing. The newer version was kept; yours is saved in the note's History.", { autoClose: 10000 });
      }),
    []
  );

  return (
    <>
      <Router>
        <VisitTracker />
        <Header />
        {/* A page-sized placeholder while a page's chunk arrives, so the footer
            doesn't jump up and back down. */}
        <Suspense fallback={<div className="min-h-screen" />}>
        <Routes>
          {/* The home page is the planner (a guest sees a sample day). */}
          <Route path="/" element={<Navigate to="/planning" replace />} />

          {/* The old Topics page (AI / HLD / LLD / Spring Boot) is retired:
              Core Stack replaces it. src/pages/InterviewPrep and its plan data
              are kept on disk — and their progress still cloud-syncs — but
              nothing routes or links to them, so the page is unreachable. */}
          <Route path="/interview-prep" element={<Navigate to="/core-stack" replace />} />

          {/* Open to everyone. Changing anything asks a guest to sign in. */}
          <Route path="/core-stack" element={<StackHome stackKey="corestack" />} />
          {/* Owner-only, exactly like the job tracker: a non-owner hitting this
              URL lands on Core Stack, the same place any unknown URL goes. */}
          <Route path="/ai-stack" element={<OwnerRoute />}>
            <Route path="/ai-stack" element={<StackHome stackKey="aistack" />} />
          </Route>
          {/* One full page per topic's notes. The page itself turns away a
              non-owner asking for an AI Stack topic. */}
          <Route path="/notes/:source/:topicId" element={<TopicNotes />} />
          <Route path="/dsa-prep" element={<DSAPrep />} />
          <Route path="/planning" element={<Planning />} />
          <Route path="/contests" element={<Contests />} />
          {/* Pipeline and Companies are for everyone; the page itself keeps
              Contacts and Openings (and their data) to the owner. */}
          <Route path="/job-tracker" element={<JobTracker />} />
          {/* Owner-only, like AI Stack: personal projects, one chapter per topic. */}
          <Route path="/projects" element={<OwnerRoute />}>
            <Route path="/projects" element={<StackHome stackKey="projects" />} />
          </Route>
          {/* Retired pages, like the old Topics page: the Interview Kit
              (src/pages/InterviewKit) and the visitors dashboard
              (src/pages/Visitors; the numbers now come as a nightly email) are
              kept on disk, but nothing routes or links to them. Their old
              addresses land on Core Stack, like any unknown URL. */}

          <Route path="/sign-in" element={<AuthPage initialMode="signin" />} />
          <Route path="/sign-up" element={<AuthPage initialMode="signup" />} />
          <Route path="/forgot-password" element={<AuthPage initialMode="reset" />} />

          <Route path="*" element={<Navigate to="/core-stack" replace />} />
        </Routes>
        </Suspense>
        <Footer />
        <AuthPrompt />
      </Router>
      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}

export default App;
