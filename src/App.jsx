import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "./App.css";
import SignIn from "./pages/SignInUp/SignIn";
import ForgotPassword from "./pages/SignInUp/ForgotPassword";
import Header from "./components/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PrivateRoute from "./components/PrivateRoute";
import InterviewPrep from "./pages/InterviewPrep/InterviewPrep";
import DSAPrep from "./pages/DSAPrep/DSAPrep";
import MostAskedDSA from "./pages/MostAskedDSA/MostAskedDSA";
import Planning from "./pages/Planning/Planning";
import SignUp from "./pages/SignInUp/SignUp";
import { startCloudSync, stopCloudSync } from "./Data/cloudSync";

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
          <Route path="/" element={<Navigate to="/interview-prep" replace />} />

          <Route path="/interview-prep" element={<PrivateRoute />}>
            <Route path="/interview-prep" element={<InterviewPrep />} />
          </Route>
          <Route path="/dsa-prep" element={<PrivateRoute />}>
            <Route path="/dsa-prep" element={<DSAPrep />} />
          </Route>
          <Route path="/most-asked-dsa" element={<PrivateRoute />}>
            <Route path="/most-asked-dsa" element={<MostAskedDSA />} />
          </Route>
          <Route path="/planning" element={<PrivateRoute />}>
            <Route path="/planning" element={<Planning />} />
          </Route>

          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route path="*" element={<Navigate to="/interview-prep" replace />} />
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
