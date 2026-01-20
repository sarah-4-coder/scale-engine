import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, LayoutDashboard } from 'lucide-react';

const Navigation = () => {
  const { user, role } = useAuth();

  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  const getDashboardLink = () => {
    if (role === 'admin') return '/admin';
    return '/dashboard';
  };

  return (
    <nav className="fixed w-full z-50 glass py-4 px-6 md:px-12 flex justify-between items-center border-b border-border/50">
      <Link to="/" className="text-2xl font-extrabold tracking-tighter">
        DOT<span className="text-primary">FLUENCE</span>
      </Link>
      <div className="hidden md:flex space-x-10 text-[11px] uppercase tracking-wide-custom font-bold text-muted-foreground">
        <a href="#work" className="hover:text-foreground transition">
          Portfolio
        </a>
        <a href="#expertise" className="hover:text-foreground transition">
          Expertise
        </a>
        <a href="#ai-lab" className="hover:text-primary transition">
          AI Lab ✨
        </a>
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <Link
            to={getDashboardLink()}
            className="btn-primary px-7 py-2.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2"
          >
            <LayoutDashboard size={14} />
            Dashboard
          </Link>
        ) : (
          <>
            <Link
              to="/login"
              className="hidden md:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition"
            >
              <LogIn size={14} />
              Login
            </Link>
            <button
              onClick={scrollToContact}
              className="btn-primary px-7 py-2.5 rounded-full text-xs font-black uppercase tracking-widest"
            >
              Connect
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
