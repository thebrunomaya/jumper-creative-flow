

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ResetPasswordPage from "@/components/ResetPasswordPage";
import { Suspense, lazy } from "react";

// Lazy load das páginas principais para reduzir bundle inicial
const DesignSystem = lazy(() => import("./pages/DesignSystem"));
const Admin = lazy(() => import("./pages/Admin"));
const Manager = lazy(() => import("./pages/Manager"));
const MyAccounts = lazy(() => import("./pages/MyAccounts"));
const CreativeSystem = lazy(() => import("@/components/CreativeSystem"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const Optimization = lazy(() => import("./pages/Optimization"));

// Loading component reutilizável com acessibilidade
const PageLoading = () => (
  <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jumper-orange" aria-hidden="true"></div>
    <span className="sr-only">Carregando página...</span>
  </div>
);

const queryClient = new QueryClient();

const App = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                <Route path="/create" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoading />}>
                      <CreativeSystem />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/create/:id" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoading />}>
                      <CreativeSystem />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/design-system" element={
                  <Suspense fallback={<PageLoading />}>
                    <DesignSystem />
                  </Suspense>
                } />
                <Route path="/admin" element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoading />}>
                      <Admin />
                    </Suspense>
                  </AdminRoute>
                } />
                <Route path="/manager" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoading />}>
                      <Manager />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/my-accounts" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoading />}>
                      <MyAccounts />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/reports/:accountName" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoading />}>
                      <ReportsPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/optimization" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoading />}>
                      <Optimization />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
