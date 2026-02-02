import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// ============================================
// EAGER LOADED COMPONENTS
// ============================================
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";
import ProfileCompletionGuard from "./components/ProfileCompletionGuard";
import BrandProfileCompletionGuard from "./components/Brandprofilecompletionguard ";

// NEW: Brand Pages
import BrandLogin from "./pages/brand/BrandLogin";
import BrandSignup from "./pages/brand/BrandSignup";
import AdminManageBrands from "./pages/admin/AdminManageBrands";

// ============================================
// LAZY LOADED COMPONENTS
// ============================================
// Influencer routes
const InfluencerDashboard = lazy(() => import("./pages/InfluencerDashboard"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const AllCampaigns = lazy(() => import("./pages/influencer/AllCampaigns"));
const MyCampaigns = lazy(() => import("./pages/influencer/MyCampaigns"));
const CampaignDetail = lazy(() => import("./pages/influencer/CampaignDetail"));

// Admin routes
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CreateCampaign = lazy(() => import("./pages/admin/CreateCampaign"));
const AdminNegotiations = lazy(() => import("./pages/admin/Negotiations"));
const AdminCampaignDetails = lazy(() => import("./pages/admin/AdminCampaignDetails"));
const AdminAllCampaigns = lazy(() => import("./pages/admin/AdminAllCampaigns"));
const AdminCampaignAppliedInfluencers = lazy(() => import("./pages/admin/AdminCampaignAppliedInfluencers"));
const AdminManageInfluencers = lazy(() => import("./pages/admin/AdminManageInfluencers"));

// NEW: Brand routes (lazy loaded)
const BrandDashboard = lazy(() => import("./pages/brand/BrandDashboard"));
const BrandProfileSetup = lazy(() => import("./pages/brand/BrandProfileSetup"));
const BrandAllCampaigns = lazy(() => import("./pages/brand/BrandAllCampaigns"));
const BrandCreateCampaign = lazy(() => import("./pages/brand/BrandCreateCampaign"));
const BrandCampaignDetails = lazy(() => import("./pages/brand/Brandcampaigndetails"));
const BrandInfluencers = lazy(() => import("./pages/brand/Brandinfluencers"));

// ============================================
// OPTIMIZED QUERY CLIENT
// ============================================
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

// ============================================
// LOADING FALLBACK
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
// AUTH PAGE REDIRECT
// ============================================
const AuthPage = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (user && role) {
    return <Navigate to={
      role === "admin" ? "/admin" : 
      role === "brand" ? "/brand/dashboard" : 
      "/dashboard"
    } replace />;
  }

  return <>{children}</>;
};

// ============================================
// APP ROUTES
// ============================================
const AppRoutes = () => {
  return (
    <Routes>
      {/* Landing page */}
      <Route path="/" element={<Index />} />
      
      {/* Influencer Auth routes */}
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

      {/* NEW: Brand Auth routes */}
      <Route
        path="/brand/login"
        element={
          <AuthPage>
            <BrandLogin />
          </AuthPage>
        }
      />
      <Route
        path="/brand/signup"
        element={
          <AuthPage>
            <BrandSignup />
          </AuthPage>
        }
      />

      {/* ========================================
          INFLUENCER ROUTES
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
          ADMIN ROUTES
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
      
      <Route
        path="/admin/brands"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Suspense fallback={<PageLoader />}>
              <AdminManageBrands />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* ========================================
          NEW: BRAND ROUTES
      ======================================== */}
      <Route
        path="/brand/dashboard"
        element={
          <ProtectedRoute allowedRoles={["brand"]}>
            <BrandProfileCompletionGuard>
              <Suspense fallback={<PageLoader />}>
                <BrandDashboard />
              </Suspense>
            </BrandProfileCompletionGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/brand/profile-setup"
        element={
          <ProtectedRoute allowedRoles={["brand"]}>
            <Suspense fallback={<PageLoader />}>
              <BrandProfileSetup />
            </Suspense>
          </ProtectedRoute>
        }
      />

      <Route
        path="/brand/campaigns"
        element={
          <ProtectedRoute allowedRoles={["brand"]}>
            <BrandProfileCompletionGuard>
              <Suspense fallback={<PageLoader />}>
                <BrandAllCampaigns />
              </Suspense>
            </BrandProfileCompletionGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/brand/campaigns/new"
        element={
          <ProtectedRoute allowedRoles={["brand"]}>
            <BrandProfileCompletionGuard>
              <Suspense fallback={<PageLoader />}>
                <BrandCreateCampaign />
              </Suspense>
            </BrandProfileCompletionGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/brand/campaigns/:id"
        element={
          <ProtectedRoute allowedRoles={["brand"]}>
            <BrandProfileCompletionGuard>
              <Suspense fallback={<PageLoader />}>
                <BrandCampaignDetails />
              </Suspense>
            </BrandProfileCompletionGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/brand/influencers"
        element={
          <ProtectedRoute allowedRoles={["brand"]}>
            <BrandProfileCompletionGuard>
              <Suspense fallback={<PageLoader />}>
                <BrandInfluencers />
              </Suspense>
            </BrandProfileCompletionGuard>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// ============================================
// MAIN APP
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