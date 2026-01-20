import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const AuthRedirect = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && user && role) {
      // If user is logged in and on auth pages, redirect to appropriate dashboard
      const authPages = ['/login', '/signup'];
      if (authPages.includes(location.pathname)) {
        if (role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    }
  }, [user, role, loading, navigate, location.pathname]);

  return <>{children}</>;
};

export default AuthRedirect;
