import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const ProfileCompletionGuard = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const { user, role, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [profileStatus, setProfileStatus] = useState<{
    completed: boolean;
    isMagicLink: boolean;
  } | null>(null);

  useEffect(() => {
    const checkProfile = async () => {
      // Wait for auth to be ready
      if (authLoading) return;

      if (!user || role !== 'influencer') {
        setChecking(false);
        return;
      }

      const { data, error } = await supabase
        .from('influencer_profiles')
        .select('profile_completed, custom_data')
        .eq('user_id', user.id)
        .maybeSingle() as any;

      if (error) {
        console.error("Guard error:", error);
        setChecking(false);
        return;
      }

      // If no profile exists, they definitely aren't complete
      if (!data) {
        setProfileStatus({ completed: false, isMagicLink: false });
        setChecking(false);
        return;
      }

      const isMagicLink = data?.custom_data?.created_via === 'magic_link' || !!sessionStorage.getItem("invited_via");
      const isCompleted = data?.profile_completed === true;

      setProfileStatus({
        completed: isCompleted,
        isMagicLink: isMagicLink
      });

      setChecking(false);
    };

    checkProfile();
  }, [location.pathname, user?.id, role, authLoading]);

  if (checking || authLoading) {
    return (
      <div className="min-h-screen bg-slate-900/5 flex items-center justify-center backdrop-blur-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // 1. If completed, always allow
  if (profileStatus?.completed) {
    return <>{children}</>;
  }

  // 2. Magic Link Gating (New Creators)
  if (profileStatus?.isMagicLink) {
    const allowedPaths = ['/dashboard', '/account-setup'];
    if (allowedPaths.includes(location.pathname)) {
      return <>{children}</>;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Normal Creators (Organic Signups)
  const isProfilePage = location.pathname === '/profile-setup' || location.pathname === '/dashboard';
  if (isProfilePage) {
    return <>{children}</>;
  }
  
  return <Navigate to="/profile-setup" replace />;
};

export default ProfileCompletionGuard;
