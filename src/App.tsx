import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import InfluencerDashboard from "./pages/InfluencerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthRedirect from "./components/AuthRedirect";
import ProfileCompletionGuard from "./components/ProfileCompletionGuard";
import ProfileSetup from "./pages/ProfileSetup";
import CreateCampaign from "./pages/admin/CreateCampaign";
import InfluencerCampaigns from "./pages/influencer/MyCampaigns";
import AdminNegotiations from "./pages/admin/Negotiations";
import AllCampaigns from "./pages/influencer/AllCampaigns";
import MyCampaigns from "./pages/influencer/MyCampaigns";
import AdminCampaignDetails from "./pages/admin/AdminCampaignDetails";
import AdminAllCampaigns from "./pages/admin/AdminAllCampaigns";
import AdminCampaignAppliedInfluencers from "./pages/admin/AdminCampaignAppliedInfluencers";
import AdminManageInfluencers from "./pages/admin/AdminManageInfluencers";

const queryClient = new QueryClient();

// Component to handle auth page redirects
const AuthPage = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user && role) {
    return <Navigate to={role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
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
      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["influencer"]}>
            <ProfileCompletionGuard>
              <InfluencerDashboard />
            </ProfileCompletionGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile-setup"
        element={
          <ProtectedRoute allowedRoles={["influencer"]}>
            <ProfileSetup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/campaigns/all"
        element={
          <ProtectedRoute allowedRoles={["influencer"]}>
            <ProfileCompletionGuard>
              <AllCampaigns />
            </ProfileCompletionGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/campaigns/my"
        element={
          <ProtectedRoute allowedRoles={["influencer"]}>
            <ProfileCompletionGuard>
              <MyCampaigns />
            </ProfileCompletionGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/campaigns/new"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <CreateCampaign />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/negotiations"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminNegotiations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/campaigns"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminAllCampaigns />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/campaigns/:id"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminCampaignDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/campaigns/:id/applied"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminCampaignAppliedInfluencers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/influencers"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminManageInfluencers />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

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
