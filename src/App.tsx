
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import DesignSystem from "./pages/DesignSystem";
import NotFound from "./pages/NotFound";
import LogsPage from "./components/logs/LogsPage";
import ErrorBoundary from "./components/ErrorBoundary";
import { preloadCommonThumbnails } from "@/utils/thumbnailCache";

const queryClient = new QueryClient();

const App = () => {
  // Pré-carregar thumbnails comuns para melhor performance
  useEffect(() => {
    preloadCommonThumbnails();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <ErrorBoundary>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } />
                  <Route path="/log" element={
                    <ProtectedRoute>
                      <LogsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/design-system" element={<DesignSystem />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </ErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
