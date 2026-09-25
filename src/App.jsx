import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "./App.css";
import Header from "./components/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import OwnerRoute from "./components/OwnerRoute";
import CoreStack from "./pages/CoreStack/CoreStack";
import AIStack from "./pages/AIStack/AIStack";
import TopicNotes from "./pages/Notes/TopicNotes";
import DSAPrep from "./pages/DSAPrep/DSAPrep";
import Planning from "./pages/Planning/Planning";
import AuthPage from "./pages/SignInUp/AuthPage";
import AuthPrompt from "./components/AuthPrompt";
import { startCloudSync, stopCloudSync } from "./Data/cloudSync";
import { setAuthState } from "./Data/authGate";

// Lazy-loaded so the (large) company dataset ships in its own chunk and is only
// fetched when the owner actually opens the tracker.
const JobTracker = lazy(() => import("./pages/JobTracker/JobTracker"));
// Same for the Interview Kit: its content only downloads for the owner.
const InterviewKit = lazy(() => import("./pages/InterviewKit/InterviewKit"));

function App() {
  // Anyone can browse; a signed-in account syncs its own progress to Firestore
  // (scoped by uid). The auth state is published first, so the store knows
  // whether a write is allowed before any page can make one.
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (user) => {
      setAuthState(user ? "user" : "guest");
      if (user) startCloudSync(user.uid);
      else stopCloudSync();
    });
    return unsub;
  }, []);

  return (
    <>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Navigate to="/core-stack" replace />} />

          {/* The old Topics page (AI / HLD / LLD / Spring Boot) is retired:
              Core Stack replaces it. src/pages/InterviewPrep and its plan data
              are kept on disk — and their progress still cloud-syncs — but
              nothing routes or links to them, so the page is unreachable. */}
          <Route path="/interview-prep" element={<Navigate to="/core-stack" replace />} />

          {/* Open to everyone. Changing anything asks a guest to sign in. */}
          <Route path="/core-stack" element={<CoreStack />} />
          {/* Owner-only, exactly like the job tracker: a non-owner hitting this
              URL lands on Core Stack, the same place any unknown URL goes. */}
          <Route path="/ai-stack" element={<OwnerRoute />}>
            <Route path="/ai-stack" element={<AIStack />} />
          </Route>
          {/* One full page per topic's notes. The page itself turns away a
              non-owner asking for an AI Stack topic. */}
          <Route path="/notes/:source/:topicId" element={<TopicNotes />} />
          <Route path="/dsa-prep" element={<DSAPrep />} />
          <Route path="/planning" element={<Planning />} />
          <Route path="/job-tracker" element={<OwnerRoute />}>
            <Route
              path="/job-tracker"
              element={
                <Suspense fallback={null}>
                  <JobTracker />
                </Suspense>
              }
            />
          </Route>
          <Route path="/interview-kit" element={<OwnerRoute />}>
            <Route
              path="/interview-kit"
              element={
                <Suspense fallback={null}>
                  <InterviewKit />
                </Suspense>
              }
            />
          </Route>

          <Route path="/sign-in" element={<AuthPage initialMode="signin" />} />
          <Route path="/sign-up" element={<AuthPage initialMode="signup" />} />
          <Route path="/forgot-password" element={<AuthPage initialMode="reset" />} />

          <Route path="*" element={<Navigate to="/core-stack" replace />} />
        </Routes>
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
