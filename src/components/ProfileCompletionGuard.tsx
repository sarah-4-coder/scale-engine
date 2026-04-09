import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

const ProfileCompletionGuard = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const { user, role, loading: authLoading } = useAuth();

  const { data: profileStatus, isLoading: checking } = useQuery({
    queryKey: ['profileStatus', user?.id],
    enabled: !authLoading && !!user && role === 'influencer',
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes to prevent lag on every page switch
    queryFn: async () => {
      const { data, error } = await supabase
        .from('influencer_profiles')
        .select('profile_completed, custom_data')
        .eq('user_id', user?.id)
        .maybeSingle() as any;

      if (error || !data) {
        return { completed: false, isMagicLink: false };
      }

      const isMagicLink = data?.custom_data?.created_via === 'magic_link' || !!sessionStorage.getItem("invited_via");
      const isCompleted = data?.profile_completed === true;

      return { completed: isCompleted, isMagicLink };
    }
  });

  if (authLoading || (checking && role === 'influencer')) {
    return (
      <div className="min-h-screen bg-slate-900/5 flex items-center justify-center backdrop-blur-sm">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // If not an influencer, let it through (other guards handle those) or if something failed
  if (role !== 'influencer') {
    return <>{children}</>;
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
