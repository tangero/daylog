import { Suspense, useEffect } from "react";
import ProfilePage from "./pages/ProfilePage";
import ChangelogPage from "./pages/ChangelogPage";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import LoginPage from "./pages/LoginPage";
import RecoveryPage from "./pages/RecoveryPage";
import RegisterPage from "./pages/RegisterPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerificationPendingPage from "./pages/VerificationPendingPage";
import LandingPage from "./pages/LandingPage";
import AuthGuard from "./components/auth/AuthGuard";
import { initializeAuth } from "./lib/auth";
import routes from "tempo-routes";

function App() {
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/verification-pending"
            element={<VerificationPendingPage />}
          />
          <Route path="/recovery" element={<RecoveryPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<EmailVerificationPage />} />
          <Route
            path="/"
            element={
              localStorage.getItem("user") ? (
                <AuthGuard>
                  <Home />
                </AuthGuard>
              ) : (
                <LandingPage />
              )
            }
          />
          <Route
            path="/profile"
            element={
              <AuthGuard>
                <ProfilePage />
              </AuthGuard>
            }
          />
          <Route path="/changelog" element={<ChangelogPage />} />
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </>
    </Suspense>
  );
}

export default App;
