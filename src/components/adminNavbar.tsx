import { Link, useNavigate } from "react-router-dom";
import { NotificationBell } from "./notifications/NotificationBell";
import { LogOut, User, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const AdminNavbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  //extract the role from user_roles table from supabase
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) return;
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single() as { data: { role: string } | null; error: Error | null };
      
      if (error) console.error("Error fetching role:", error);
      else setRole(data ? data.role : null);
    };
    
    fetchUserRole();
  }, [user?.id]);

  

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/dotfluence.in";
  };

  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50 w-full">
      <div className="px-4 md:px-10 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 md:gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-primary">DotFluence</h1>
            <span className="hidden sm:inline-block text-xs md:text-sm text-muted-foreground bg-primary/10 px-2 md:px-3 py-1 rounded-full">
              {role === "admin" ? "Admin" : "Influencer"}
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to={"/dashboard"}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <NotificationBell />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User size={16} />
              <span className="truncate">{user?.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3 border-t border-border/50 pt-4">
            <Link
              to={"/dashboard"}
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-2 py-2">
              <User size={16} />
              <span className="truncate">{user?.email}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start"
            >
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminNavbar;
