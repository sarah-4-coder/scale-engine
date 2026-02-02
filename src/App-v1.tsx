import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// ============================================
// EAGER LOADED COMPONENTS (Small, needed immediately)
// ============================================
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfileCompletionGuard from "./components/ProfileCompletionGuard";

// ============================================
// LAZY LOADED COMPONENTS (Code splitting)
// ============================================
const InfluencerDashboard = lazy(() => import("./pages/InfluencerDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const AllCampaigns = lazy(() => import("./pages/influencer/AllCampaigns"));
const MyCampaigns = lazy(() => import("./pages/influencer/MyCampaigns"));
const CampaignDetail = lazy(() => import("./pages/influencer/CampaignDetail"));

// Admin routes (lazy loaded)
const CreateCampaign = lazy(() => import("./pages/admin/CreateCampaign"));
const AdminNegotiations = lazy(() => import("./pages/admin/Negotiations"));
const AdminCampaignDetails = lazy(() => import("./pages/admin/AdminCampaignDetails"));
const AdminAllCampaigns = lazy(() => import("./pages/admin/AdminAllCampaigns"));
const AdminCampaignAppliedInfluencers = lazy(() => import("./pages/admin/AdminCampaignAppliedInfluencers"));
const AdminManageInfluencers = lazy(() => import("./pages/admin/AdminManageInfluencers"));

// ============================================
// OPTIMIZED QUERY CLIENT
// ============================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Cache for 10 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Do refetch on reconnect
      retry: 1, // Only retry once on failure
    },
  },
});

// ============================================
// LOADING FALLBACK COMPONENT
// ============================================
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
      <p className="text-muted-foreground text-sm">Loading...</p>
    </div>
  </div>
);

// ============================================
// AUTH PAGE REDIRECT COMPONENT
// ============================================
const AuthPage = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (user && role) {
    return <Navigate to={role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  return <>{children}</>;
};

// ============================================
// APP ROUTES
// ============================================
const AppRoutes = () => {
  return (
    <Routes>
      {/* Landing page - no lazy load */}
      <Route path="/" element={<Index />} />
      
      {/* Auth routes - redirect if already logged in */}
      <Route
        path="/login"
        element={
          <AuthPage>
            <Login />
          </AuthPage>
        }
      />
      <Route
        path="/signup"
        element={
          <AuthPage>
            <Signup />
          </AuthPage>
        }
      />

      {/* ========================================
          INFLUENCER ROUTES (Lazy Loaded)
      ======================================== */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["influencer"]}>
            <ProfileCompletionGuard>
              <Suspense fallback={<PageLoader />}>
                <InfluencerDashboard />
              </Suspense>
            </ProfileCompletionGuard>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/profile-setup"
        element={
          <ProtectedRoute allowedRoles={["influencer"]}>
            <Suspense fallback={<PageLoader />}>
              <ProfileSetup />
            </Suspense>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/campaigns/all"
        element={
          <ProtectedRoute allowedRoles={["influencer"]}>
            <ProfileCompletionGuard>
              <Suspense fallback={<PageLoader />}>
                <AllCampaigns />
              </Suspense>
            </ProfileCompletionGuard>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/campaigns/my"
        element={
          <ProtectedRoute allowedRoles={["influencer"]}>
            <ProfileCompletionGuard>
              <Suspense fallback={<PageLoader />}>
                <MyCampaigns />
              </Suspense>
            </ProfileCompletionGuard>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard/campaigns/my/:campaignId"
        element={
          <ProtectedRoute allowedRoles={["influencer"]}>
            <ProfileCompletionGuard>
              <Suspense fallback={<PageLoader />}>
                <CampaignDetail />
              </Suspense>
            </ProfileCompletionGuard>
          </ProtectedRoute>
        }
      />

      {/* ========================================
          ADMIN ROUTES (Lazy Loaded)
      ======================================== */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Suspense fallback={<PageLoader />}>
              <AdminDashboard />
            </Suspense>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/campaigns/new"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Suspense fallback={<PageLoader />}>
              <CreateCampaign />
            </Suspense>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/negotiations"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Suspense fallback={<PageLoader />}>
              <AdminNegotiations />
            </Suspense>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/campaigns"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Suspense fallback={<PageLoader />}>
              <AdminAllCampaigns />
            </Suspense>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/campaigns/:id"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Suspense fallback={<PageLoader />}>
              <AdminCampaignDetails />
            </Suspense>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/campaigns/:id/applied"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Suspense fallback={<PageLoader />}>
              <AdminCampaignAppliedInfluencers />
            </Suspense>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin/influencers"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Suspense fallback={<PageLoader />}>
              <AdminManageInfluencers />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Catch-all - no lazy load needed */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// ============================================
// MAIN APP COMPONENT
// ============================================
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;