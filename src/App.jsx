import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "./App.css";
import SignIn from "./pages/SignInUp/SignIn";
import ForgotPassword from "./pages/SignInUp/ForgotPassword";
import Header from "./components/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PrivateRoute from "./components/PrivateRoute";
import OwnerRoute from "./components/OwnerRoute";
import CoreStack from "./pages/CoreStack/CoreStack";
import AIStack from "./pages/AIStack/AIStack";
import DSAPrep from "./pages/DSAPrep/DSAPrep";
import Planning from "./pages/Planning/Planning";
import SignUp from "./pages/SignInUp/SignUp";
import { startCloudSync, stopCloudSync } from "./Data/cloudSync";

// Lazy-loaded so the (large) company dataset ships in its own chunk and is only
// fetched when the owner actually opens the tracker.
const JobTracker = lazy(() => import("./pages/JobTracker/JobTracker"));

function App() {
  // Each signed-in account syncs its own progress to Firestore (scoped by uid).
  useEffect(() => {
    const unsub = onAuthStateChanged(getAuth(), (user) => {
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

          <Route path="/core-stack" element={<PrivateRoute />}>
            <Route path="/core-stack" element={<CoreStack />} />
          </Route>
          <Route path="/ai-stack" element={<PrivateRoute />}>
            <Route path="/ai-stack" element={<AIStack />} />
          </Route>
          <Route path="/dsa-prep" element={<PrivateRoute />}>
            <Route path="/dsa-prep" element={<DSAPrep />} />
          </Route>
          <Route path="/planning" element={<PrivateRoute />}>
            <Route path="/planning" element={<Planning />} />
          </Route>
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

          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="*" element={<Navigate to="/core-stack" replace />} />
        </Routes>
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
