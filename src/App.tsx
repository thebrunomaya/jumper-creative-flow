

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
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const Manager = lazy(() => import("./pages/Manager"));
const MyAccounts = lazy(() => import("./pages/MyAccounts"));
const CreativeSystem = lazy(() => import("@/components/CreativeSystem"));
const DashboardsMultiAccountPage = lazy(() => import("./pages/DashboardsMultiAccountPage"));
const DashboardsPage = lazy(() => import("./pages/DashboardsPage"));
const Optimization = lazy(() => import("./pages/Optimization"));
const OptimizationNew = lazy(() => import("./pages/OptimizationNew"));
const OptimizationEditor = lazy(() => import("./pages/OptimizationEditor"));
const SharedOptimization = lazy(() => import("./pages/SharedOptimization"));
const Decks = lazy(() => import("./pages/Decks"));
const DeckNew = lazy(() => import("./pages/DeckNew"));
const DeckEditor = lazy(() => import("./pages/DeckEditor"));
const DeckEditorPage = lazy(() => import("./pages/DeckEditorPage"));
const DeckPreview = lazy(() => import("./pages/DeckPreview"));
const SharedDeck = lazy(() => import("./pages/SharedDeck"));
const Templates = lazy(() => import("./pages/Templates"));
const TemplateEditor = lazy(() => import("./pages/TemplateEditor"));
const TemplateCompare = lazy(() => import("./pages/TemplateCompare"));

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
                <Route path="/admin/users" element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoading />}>
                      <AdminUsers />
                    </Suspense>
                  </AdminRoute>
                } />
                <Route path="/creatives" element={
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
                {/* Dashboards routes - /dashboards (home) must come before /dashboards/:accountName */}
                <Route path="/dashboards" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoading />}>
                      <DashboardsMultiAccountPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/dashboards/:accountName" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoading />}>
                      <DashboardsPage />
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
                <Route path="/optimization/new" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoading />}>
                      <OptimizationNew />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/optimization/editor/:recordingId" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoading />}>
                      <OptimizationEditor />
                    </Suspense>
                  </ProtectedRoute>
                } />
                {/* Public route for shared optimizations (password protected within component) */}
                <Route path="/optimization/:slug" element={
                  <Suspense fallback={<PageLoading />}>
                    <SharedOptimization />
                  </Suspense>
                } />
                <Route path="/decks" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoading />}>
                      <Decks />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/decks/new" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoading />}>
                      <DeckNew />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/decks/editor/:deckId" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoading />}>
                      <DeckEditorPage />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/decks/:deckId" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoading />}>
                      <DeckEditor />
                    </Suspense>
                  </ProtectedRoute>
                } />
                <Route path="/decks/:deckId/preview" element={
                  <ProtectedRoute>
                    <Suspense fallback={<PageLoading />}>
                      <DeckPreview />
                    </Suspense>
                  </ProtectedRoute>
                } />
                {/* Public route for shared decks (password protected within component) */}
                <Route path="/decks/share/:slug" element={
                  <Suspense fallback={<PageLoading />}>
                    <SharedDeck />
                  </Suspense>
                } />
                <Route path="/decks/templates" element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoading />}>
                      <Templates />
                    </Suspense>
                  </AdminRoute>
                } />
                <Route path="/decks/templates/:templateId/edit" element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoading />}>
                      <TemplateEditor />
                    </Suspense>
                  </AdminRoute>
                } />
                <Route path="/decks/templates/compare" element={
                  <AdminRoute>
                    <Suspense fallback={<PageLoading />}>
                      <TemplateCompare />
                    </Suspense>
                  </AdminRoute>
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
