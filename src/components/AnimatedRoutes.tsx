import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PageTransition, FadeTransition } from "@/components/PageTransition";
import Auth from "@/pages/Auth";
import Reports from "@/pages/Reports";
import Dashboard from "@/pages/Dashboard";
import Benefits from "@/pages/Benefits";
import Integrations from "@/pages/Integrations";
import Employees from "@/pages/Employees";
import Companies from "@/pages/Companies";
import Wallet from "@/pages/Wallet";
import Financial from "@/pages/Financial";
import Audit from "@/pages/Audit";
import NotFound from "@/pages/NotFound";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        
        <Route
          path="/auth"
          element={
            <FadeTransition>
              <Auth />
            </FadeTransition>
          }
        />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Dashboard />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/benefits"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Benefits />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Wallet />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Employees />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/companies"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Companies />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/integrations"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Integrations />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Reports />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/audit"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Audit />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/financial"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Financial />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/chatbot"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Dashboard />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Dashboard />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/security"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Dashboard />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <PageTransition>
                <Dashboard />
              </PageTransition>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="*"
          element={
            <FadeTransition>
              <NotFound />
            </FadeTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

export default AnimatedRoutes;
