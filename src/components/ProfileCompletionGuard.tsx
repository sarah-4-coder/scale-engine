import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const ProfileCompletionGuard = ({ children }: { children: ReactNode }) => {
  const { user, role } = useAuth();
  const [checking, setChecking] = useState(true);
  const [completed, setCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user || role !== 'influencer') {
        setChecking(false);
        return;
      }

      // 1. Session Storage Bypass (for immediate transition)
      const isMagicLinkSession = sessionStorage.getItem("invited_via") === "campaign";
      
      if (isMagicLinkSession) {
        setCompleted(true);
        setChecking(false);
        return;
      }

      // 2. Database Persistent Bypass (for refresh/return)
      const { data, error } = await supabase
        .from('influencer_profiles')
        .select('profile_completed, custom_data')
        .eq('user_id', user.id)
        .maybeSingle() as any;

      if (error) {
        console.error("Error checking profile completion:", error);
        setCompleted(false);
        setChecking(false);
        return;
      }

      // Bypass if explicitly created via magic link
      const isMagicLinkUser = data?.custom_data?.created_via === 'magic_link';

      if (isMagicLinkUser || data?.profile_completed === true) {
        setCompleted(true);
      } else {
        setCompleted(false);
      }

      setChecking(false);
    };

    checkProfile();
  }, [user, role]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (completed === false) {
    return <Navigate to="/profile-setup" replace />;
  }

  return <>{children}</>;
};

export default ProfileCompletionGuard;
