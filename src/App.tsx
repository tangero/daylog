import { Suspense, useEffect } from "react";
import ProfilePage from "./pages/ProfilePage";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import LoginPage from "./pages/LoginPage";
import RecoveryPage from "./pages/RecoveryPage";
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
          <Route path="/recovery" element={<RecoveryPage />} />
          <Route
            path="/"
            element={
              <AuthGuard>
                <Home />
              </AuthGuard>
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
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </>
    </Suspense>
  );
}

export default App;
