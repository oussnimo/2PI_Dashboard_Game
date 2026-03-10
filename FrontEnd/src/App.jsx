import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./context/ThemeContext";
import { LoadingProvider } from "./context/LoadingContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import {
  LanguageProvider,
  useLanguageContext,
} from "./context/LanguageContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import Navbar from "./components/Navbar";

// ======
import InitialForm from "./components/InitialForm";
import LevelForm from "./components/LevelForm";
import Preview from "./components/Preview";
// ======

import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import PageTransition from "./components/PageTransition";

// ======
import Login from "./pages/Login";
import Signup from "./pages/Signup";
// ======

import AuthRoute from "./components/AuthRoute";
import Games from "./components/Games";
import Game from "./components/Game";
import ResetPassword from "./pages/ResetPassword"; // Added import for ResetPassword component
import TermsOfService from "./pages/TermsOfService"; // Added import for TermsOfService component
import PrivacyPolicy from "./pages/PrivacyPolicy"; // Added import for PrivacyPolicy component
import { useLanguage } from "./hooks/useLanguage"; // Add import for useLanguage

const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

function AppContent({ userLoading }) {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage(); // t function for translations
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { setAllQuizzes } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL;

  // Set authentication state based on token and user existence
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token && !!user);
  }, [user]);

  useEffect(() => {
    const fetchAllQuizzes = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user || location.pathname !== "/") return;
        const userId = user?.id;
        const response = await axios.get(`${apiUrl}select`, {
          params: { user_id: userId },
        });
        if (response.status === 200) {
          setAllQuizzes(response.data.data);
        } else {
          console.error("Failed to fetch all quizzes");
        }
      } catch (error) {
        console.error("Error fetching all quizzes:", error);
      }
    };

    fetchAllQuizzes();
  }, [location.pathname]);

  const [quizData, setQuizData] = useState(() => {
    const savedData = localStorage.getItem("quizFormData");
    return savedData
      ? JSON.parse(savedData)
      : {
        course: "",
        topic: "",
        gameNumber: "",
        numLevels: "2",
        levels: [],
        player_info: {
          current_level: 1,
          lives: 3,
          score: 0,
        },
      };
  });

  const [currentStep, setCurrentStep] = useState(0);
  // Step 2 — manual level editor state
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);

  useEffect(() => {
    // Save form data to localStorage whenever it changes
    localStorage.setItem("quizFormData", JSON.stringify(quizData));
  }, [quizData]);

  const handleQuizDataChange = (newData) => {
    setQuizData(newData);
  };

  const resetQuizForm = () => {
    setQuizData({
      course: "",
      topic: "",
      gameNumber: "",
      numLevels: "2",
      levels: [],
      player_info: {
        current_level: 1,
        lives: 3,
        score: 0,
      },
    });
    setCurrentStep(0);
    setCurrentLevelIndex(0);
    localStorage.removeItem("quizFormData");
  };

  const handleGoToPreview = () => {
    setCurrentStep(1);
  };

  const handleBackToInitial = () => {
    setCurrentStep(0);
    setCurrentLevelIndex(0);
  };

  // Called by InitialForm when user clicks "Start Creating" (manual mode)
  const handleGoToLevelForm = (updatedData) => {
    setQuizData(updatedData);
    setCurrentLevelIndex(0);
    setCurrentStep(2);
  };

  // Level editor: update current level
  const handleLevelChange = (updatedLevel) => {
    setQuizData((prev) => {
      const newLevels = [...prev.levels];
      newLevels[currentLevelIndex] = updatedLevel;
      const updated = { ...prev, levels: newLevels };
      localStorage.setItem("quizFormData", JSON.stringify(updated));
      return updated;
    });
  };

  // Level editor: go to next level or finish
  const handleLevelNext = () => {
    const numLevels = parseInt(quizData.numLevels, 10);
    if (currentLevelIndex < numLevels - 1) {
      setCurrentLevelIndex((i) => i + 1);
    } else {
      setCurrentStep(1); // go to Preview
    }
  };

  const handleLevelPrev = () => {
    if (currentLevelIndex > 0) {
      setCurrentLevelIndex((i) => i - 1);
    }
  };

  const numLevels = parseInt(quizData.numLevels || 2, 10);
  const isLastLevel = currentLevelIndex === numLevels - 1;
  const currentLevel = quizData.levels?.[currentLevelIndex];

  const renderCurrentStep = () => {
    // ── Step 0: Initial form ──────────────────────────────────────
    if (currentStep === 0) {
      return (
        <InitialForm
          onDataChange={handleQuizDataChange}
          onGoToPreview={handleGoToPreview}
          onGoToLevelForm={handleGoToLevelForm}
        />
      );
    }

    // ── Step 1: Preview ───────────────────────────────────────────
    if (currentStep === 1) {
      return (
        <div className="space-y-4">
          <Preview
            data={quizData}
            onDataChange={handleQuizDataChange}
            onCreateNew={resetQuizForm}
          />
          <div className="flex justify-start items-center mt-6">
            <motion.button
              onClick={handleBackToInitial}
              className="btn-secondary flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowLeft size={18} /> {t("back_to_levels")}
            </motion.button>
          </div>
        </div>
      );
    }

    // ── Step 2: Manual Level Editor ───────────────────────────────
    return (
      <div className="max-w-2xl mx-auto w-full space-y-4">
        {/* Level progress bar */}
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {t("level") || "Level"} {currentLevelIndex + 1} / {numLevels}
          </span>
          <div className="flex gap-1.5">
            {Array.from({ length: numLevels }, (_, i) => (
              <div
                key={i}
                className={`h-2 w-6 rounded-full transition-all duration-300 ${i === currentLevelIndex
                    ? "bg-purple-main"
                    : i < currentLevelIndex
                      ? "bg-purple-main/40"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
              />
            ))}
          </div>
          <motion.button
            type="button"
            onClick={handleBackToInitial}
            className="btn-secondary flex items-center gap-1.5 text-sm py-1.5 px-3"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft size={14} /> {t("back") || "Back"}
          </motion.button>
        </div>

        {/* LevelForm */}
        {currentLevel && (
          <LevelForm
            key={currentLevelIndex}
            levelNumber={currentLevelIndex + 1}
            level={currentLevel}
            onChange={handleLevelChange}
          />
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3">
          <motion.button
            type="button"
            onClick={handleLevelPrev}
            disabled={currentLevelIndex === 0}
            className="flex-1 btn-secondary py-3 disabled:opacity-40 disabled:cursor-not-allowed"
            whileHover={{ scale: currentLevelIndex === 0 ? 1 : 1.02 }}
            whileTap={{ scale: currentLevelIndex === 0 ? 1 : 0.98 }}
          >
            ← {t("previous") || "Previous"}
          </motion.button>
          <motion.button
            type="button"
            onClick={handleLevelNext}
            className="flex-1 btn-primary py-3"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLastLevel
              ? `✓ ${t("finish") || "Finish"}`
              : `${t("next") || "Next"} →`}
          </motion.button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-deep/10 via-purple-main/5 to-cyan-main/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 transition-colors duration-200 overflow-auto">
      {isAuthenticated &&
        location.pathname !== "/login" &&
        location.pathname !== "/signup" && (
          <Navbar onCreateNew={resetQuizForm} />
        )}
      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/login"
              element={
                <Login
                  setIsAuthenticated={setIsAuthenticated}
                  userLoading={userLoading}
                />
              }
            />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/reset-password"
              element={<ResetPassword />} // Added route for ResetPassword component
            />
            <Route
              path="/"
              element={
                <AuthRoute isAuthenticated={isAuthenticated}>
                  {/* Pass resetQuizForm to Dashboard so its "Create New Quiz" button works like Preview */}
                  <PageTransition>
                    <Dashboard onCreateNew={resetQuizForm} />
                  </PageTransition>
                </AuthRoute>
              }
            />
            <Route
              path="/create"
              element={
                <AuthRoute isAuthenticated={isAuthenticated}>
                  <motion.div
                    key={currentStep}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageVariants}
                    transition={{ duration: 0.3 }}
                    className="max-w-4xl mx-auto"
                  >
                    {renderCurrentStep()}
                  </motion.div>
                </AuthRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <AuthRoute isAuthenticated={isAuthenticated}>
                  <PageTransition>
                    <Settings />
                  </PageTransition>
                </AuthRoute>
              }
            />
            <Route
              path="/games"
              element={
                <AuthRoute isAuthenticated={isAuthenticated}>
                  <PageTransition>
                    <Games />
                  </PageTransition>
                </AuthRoute>
              }
            />
            <Route
              path="/game/:game_id"
              element={
                <AuthRoute isAuthenticated={isAuthenticated}>
                  <PageTransition>
                    <Game />
                  </PageTransition>
                </AuthRoute>
              }
            />
            <Route
              path="/terms-of-service"
              element={
                <PageTransition>
                  <TermsOfService />
                </PageTransition>
              }
            />
            <Route
              path="/privacy-policy"
              element={
                <PageTransition>
                  <PrivacyPolicy />
                </PageTransition>
              }
            />
            <Route
              path="*"
              element={<Navigate to={isAuthenticated ? "/" : "/login"} />}
            />
          </Routes>
        </AnimatePresence>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#fff",
            color: "#333",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            padding: "16px",
            border: "1px solid #eee",
          },
          success: {
            iconTheme: {
              primary: "#00C4CC",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#990099",
              secondary: "#fff",
            },
          },
        }}
      />
    </div>
  );
}

function App() {
  const { userLoading } = useAuth(); // Remove loading from the destructuring
  return (
    <NotificationProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {/* Always render AppContent without the loading condition */}
        <AppContent userLoading={userLoading} />
      </Router>
    </NotificationProvider>
  );
}

export default App;
