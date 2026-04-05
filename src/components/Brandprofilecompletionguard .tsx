import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

import { useWorkspace } from '@/contexts/WorkspaceContext';

const BrandProfileCompletionGuard = ({ children }: { children: ReactNode }) => {
  const { user, role } = useAuth();
  const { brands, activeBrandId, isLoading: workspaceLoading } = useWorkspace();
  const [checking, setChecking] = useState(true);
  const [completed, setCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    if (!workspaceLoading) {
      if (!user || role !== 'brand') {
        setCompleted(true);
      } else if (brands.length === 0) {
        setCompleted(false);
      } else if (activeBrandId) {
        const activeBrand = brands.find(b => b.id === activeBrandId);
        setCompleted(activeBrand?.profile_completed === true);
      } else {
        // Brands exist but none active? Usually initializeWorkspace handles this, 
        // but let's be safe.
        setCompleted(true);
      }
      setChecking(false);
    }
  }, [user, role, brands, activeBrandId, workspaceLoading]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (completed === false) {
    return <Navigate to="/company/profile-setup" replace />;
  }

  return <>{children}</>;
};

export default BrandProfileCompletionGuard;