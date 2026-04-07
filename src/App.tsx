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
import BrandProfileCompletionGuard from "./components/BrandProfileCompletionGuard";
import AgencyProfileCompletionGuard from "./components/AgencyProfileCompletionGuard";

// NEW: Brand Theme Layout
import BrandLayout from "./layouts/BrandLayout";

// NEW: Brand Pages
import BrandLogin from "./pages/brand/BrandLogin";
import BrandSignup from "./pages/brand/BrandSignup";
import AdminManageBrands from "./pages/admin/AdminManageBrands";
import LiveMediaKit from "./pages/influencer/LiveMediaKit";
import AdminBlockedInfluencers from "./pages/admin/AdminBlockedInfluencers";
import MediaKitSetup from "./pages/influencer/Mediakitsetup";
import { RosterSessionBanner } from "./components/RosterSessionBanner";
import { useMagicLinkApplication } from "./hooks/useMagicLinkApplication";

// ============================================
// LAZY LOADED COMPONENTS
// ============================================
// Influencer routes
const InfluencerDashboard = lazy(() => import("./pages/InfluencerDashboard"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const AccountSetup = lazy(() => import("./pages/influencer/AccountSetup"));
const AllCampaigns = lazy(() => import("./pages/influencer/AllCampaigns"));
const MyCampaigns = lazy(() => import("./pages/influencer/MyCampaigns"));
const CampaignDetail = lazy(() => import("./pages/influencer/CampaignDetail"));
const PaymentSettings = lazy(() => import("./pages/influencer/PaymentSettings"));
const PublicCampaignPreview = lazy(() => import("./pages/influencer/PublicCampaignPreview"));
const MagicLinkEntry = lazy(() => import("./pages/influencer/MagicLinkEntry"));
const CampaignApply = lazy(() => import("./pages/influencer/CampaignApply"));
const InfluencerLogin = lazy(() => import("./pages/influencer/InfluencerLogin"));

// Admin routes
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CreateCampaign = lazy(() => import("./pages/admin/CreateCampaign"));
const AdminNegotiations = lazy(() => import("./pages/admin/Negotiations"));
const AdminCampaignDetails = lazy(
  () => import("./pages/admin/AdminCampaignDetails"),
);
const AdminAllCampaigns = lazy(() => import("./pages/admin/AdminAllCampaigns"));
const AdminCampaignAppliedInfluencers = lazy(
  () => import("./pages/admin/AdminCampaignAppliedInfluencers"),
);
const AdminManageInfluencers = lazy(
  () => import("./pages/admin/AdminManageInfluencers"),
);
const AdminFinancials = lazy(() => import("./pages/admin/AdminFinancials"));

const BrandDashboard = lazy(() => import("./pages/brand/BrandDashboard"));
const BrandProfileSetup = lazy(() => import("./pages/brand/BrandProfileSetup"));
const BrandAllCampaigns = lazy(() => import("./pages/brand/BrandAllCampaigns"));
const BrandCreateCampaign = lazy(
  () => import("./pages/brand/BrandCreateCampaign"),
);
const BrandCampaignDetails = lazy(
  () => import("./pages/brand/Brandcampaigndetails"),
);
const BrandInfluencers = lazy(() => import("./pages/brand/Brandinfluencers"));
const BrandProfile = lazy(() => import("./pages/brand/BrandProfile"));

// NEW: Agency routes (lazy loaded)
const AgencyDashboard = lazy(() => import("./pages/agency/AgencyDashboard"));
const AgencyProfileSetup = lazy(() => import("./pages/agency/AgencyProfileSetup"));
const AgencyProfile = lazy(() => import("./pages/agency/AgencyProfile"));
const AgencySignup = lazy(() => import("./pages/agency/AgencySignup"));
const AgencyRoster = lazy(() => import("./pages/agency/RosterManagement"));

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
    return (
      <Navigate
        to={
          role === "admin"
            ? "/admin"
            : role === "agency"
              ? "/agency/dashboard"
              : role === "brand"
                ? "/company/dashboard"
                : "/dashboard"
        }
        replace
      />
    );
  }

  return <>{children}</>;
};

// ============================================
// APP ROUTES
// ============================================
const AppRoutes = () => {
  useMagicLinkApplication();
  return (
    <Routes>
      {/* Landing page */}
      <Route path="/" element={<Index />} />
      <Route path="/creators/:handle" element={<LiveMediaKit />} />
      <Route path="/i/:slug" element={<Suspense fallback={<PageLoader />}><PublicCampaignPreview /></Suspense>} />
      <Route path="/join/:hash" element={<Suspense fallback={<PageLoader />}><MagicLinkEntry /></Suspense>} />
      <Route path="/apply/:id" element={<Suspense fallback={<PageLoader />}><CampaignApply /></Suspense>} />
      <Route path="/influencer-login" element={<Suspense fallback={<PageLoader />}><InfluencerLogin /></Suspense>} />

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
        path="/company/login"
        element={
          <AuthPage>
            <BrandLogin />
          </AuthPage>
        }
      />
      <Route
        path="/company/signup"
        element={
          <AuthPage>
            <BrandSignup />
          </AuthPage>
        }
      />

      {/* NEW: Agency Auth routes */}
      <Route
        path="/agency/signup"
        element={
          <AuthPage>
            <AgencySignup />
          </AuthPage>
        }
      />

      {/* ========================================
          NEW: BRAND ROUTES - WRAPPED WITH BRANDLAYOUT
      ======================================== */}
      <Route
        path="/company/dashboard"
        element={
          <ProtectedRoute allowedRoles={["brand", "agency"]}>
            <BrandProfileCompletionGuard>
              <BrandLayout>
                <Suspense fallback={<PageLoader />}>
                  <BrandDashboard />
                </Suspense>
              </BrandLayout>
            </BrandProfileCompletionGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/profile-setup"
        element={
          <ProtectedRoute allowedRoles={["brand", "agency"]}>
            <BrandLayout>
              <Suspense fallback={<PageLoader />}>
                <BrandProfileSetup />
              </Suspense>
            </BrandLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/campaigns"
        element={
          <ProtectedRoute allowedRoles={["brand", "agency"]}>
            <BrandProfileCompletionGuard>
              <BrandLayout>
                <Suspense fallback={<PageLoader />}>
                  <BrandAllCampaigns />
                </Suspense>
              </BrandLayout>
            </BrandProfileCompletionGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/campaigns/new"
        element={
          <ProtectedRoute allowedRoles={["brand", "agency"]}>
            <BrandProfileCompletionGuard>
              <BrandLayout>
                <Suspense fallback={<PageLoader />}>
                  <BrandCreateCampaign />
                </Suspense>
              </BrandLayout>
            </BrandProfileCompletionGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/campaigns/:id"
        element={
          <ProtectedRoute allowedRoles={["brand", "agency"]}>
            <BrandProfileCompletionGuard>
              <BrandLayout>
                <Suspense fallback={<PageLoader />}>
                  <BrandCampaignDetails />
                </Suspense>
              </BrandLayout>
            </BrandProfileCompletionGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/profile"
        element={
          <ProtectedRoute allowedRoles={["brand", "agency"]}>
            <BrandProfileCompletionGuard>
              <BrandLayout>
                <Suspense fallback={<PageLoader />}>
                  <BrandProfile />
                </Suspense>
              </BrandLayout>
            </BrandProfileCompletionGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/influencers"
        element={
          <ProtectedRoute allowedRoles={["brand", "agency"]}>
            <BrandProfileCompletionGuard>
              <BrandLayout>
                <Suspense fallback={<PageLoader />}>
                  <BrandInfluencers />
                </Suspense>
              </BrandLayout>
            </BrandProfileCompletionGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/company/roster"
        element={
          <ProtectedRoute allowedRoles={["brand", "agency"]}>
            <BrandProfileCompletionGuard>
              <BrandLayout>
                <Suspense fallback={<PageLoader />}>
                  <AgencyRoster />
                </Suspense>
              </BrandLayout>
            </BrandProfileCompletionGuard>
          </ProtectedRoute>
        }
      />

      {/* ========================================
          NEW: AGENCY ROUTES
      ======================================== */}
      <Route
        path="/agency/dashboard"
        element={
          <ProtectedRoute allowedRoles={["agency"]}>
            <AgencyProfileCompletionGuard>
              <Suspense fallback={<PageLoader />}>
                <AgencyDashboard />
              </Suspense>
            </AgencyProfileCompletionGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/agency/profile"
        element={
          <ProtectedRoute allowedRoles={["agency"]}>
            <Suspense fallback={<PageLoader />}>
              <AgencyProfile />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/agency/onboarding"
        element={
          <ProtectedRoute allowedRoles={["agency"]}>
            <Suspense fallback={<PageLoader />}>
              <AgencyProfileSetup />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/agency/roster"
        element={
          <ProtectedRoute allowedRoles={["agency"]}>
            <AgencyProfileCompletionGuard>
              <Suspense fallback={<PageLoader />}>
                <AgencyRoster />
              </Suspense>
            </AgencyProfileCompletionGuard>
          </ProtectedRoute>
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
        path="/account-setup"
        element={
          <ProtectedRoute allowedRoles={["influencer"]}>
            <Suspense fallback={<PageLoader />}>
              <AccountSetup />
            </Suspense>
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
        path="/dashboard/media-kit/setup"
        element={
          <ProtectedRoute allowedRoles={["influencer"]}>
            <ProfileCompletionGuard>
              <Suspense fallback={<PageLoader />}>
                <MediaKitSetup/>
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

      <Route
        path="/dashboard/settings/payment"
        element={
          <ProtectedRoute allowedRoles={["influencer"]}>
            <ProfileCompletionGuard>
              <Suspense fallback={<PageLoader />}>
                <PaymentSettings />
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
      <Route
        path="/admin/financials"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Suspense fallback={<PageLoader />}>
              <AdminFinancials />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/blocked-influencers"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Suspense fallback={<PageLoader />}>
              <AdminBlockedInfluencers/>
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

import { WorkspaceProvider } from "./contexts/WorkspaceContext";

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
          <WorkspaceProvider>
            <RosterSessionBanner />
            <AppRoutes />
          </WorkspaceProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
