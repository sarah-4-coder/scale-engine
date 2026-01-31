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

      const { data, error } = await supabase
        .from('influencer_profiles')
        .select('profile_completed')
        .eq('user_id', user.id)
        .maybeSingle<{ profile_completed: boolean }>();

      if (error || !data || data.profile_completed !== true) {
        setCompleted(false);
      } else {
        setCompleted(true);
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
