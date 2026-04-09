import { ReactNode, useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ("admin" | "brand" | "influencer" | "agency")[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [showTimeout, setShowTimeout] = useState(false);

  // Safety net: if auth takes longer than 5 seconds (stuck resolving role) show fallback
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading || (user && !role)) {
      timer = setTimeout(() => setShowTimeout(true), 5000);
    } else {
      setShowTimeout(false);
    }
    return () => clearTimeout(timer);
  }, [loading, user, role]);

  if (loading || (user && !role)) {
    if (showTimeout) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl text-center space-y-6">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Authentication Timeout</h2>
              <p className="text-sm text-slate-400">
                We're having trouble retrieving your profile role. This can happen if your session is incomplete or the server is busy.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={() => window.location.reload()} className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 font-semibold h-11 transition-all rounded-xl">
                Refresh Page
              </Button>
              <Button 
                onClick={async () => {
                  await signOut();
                  navigate("/login", { replace: true });
                }} 
                variant="outline" 
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white h-11 transition-all rounded-xl"
              >
                Sign Out & Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Authenticating Creator session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    if (role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    if (role === "agency") {
      return <Navigate to="/agency/dashboard" replace />;
    }
    if (role === "brand") {
      return <Navigate to="/company/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
