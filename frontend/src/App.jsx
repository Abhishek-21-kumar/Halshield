/**
 * HalShield — App Root Component.
 * Route controller with animated page transitions and auth guard.
 */
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';
import ResultPage from './pages/ResultPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import ReportsPage from './pages/ReportsPage';
import DocumentsPage from './pages/DocumentsPage';
import ModelsPage from './pages/ModelsPage';
import SettingsPage from './pages/SettingsPage';
import { isAuthenticated } from './services/auth';

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/" element={<ProtectedRoute><PageTransition><MainPage /></PageTransition></ProtectedRoute>} />
        <Route path="/results" element={<ProtectedRoute><PageTransition><ResultPage /></PageTransition></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><PageTransition><DashboardPage /></PageTransition></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><PageTransition><HistoryPage /></PageTransition></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><PageTransition><ReportsPage /></PageTransition></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><PageTransition><DocumentsPage /></PageTransition></ProtectedRoute>} />
        <Route path="/models" element={<ProtectedRoute><PageTransition><ModelsPage /></PageTransition></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><PageTransition><SettingsPage /></PageTransition></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
