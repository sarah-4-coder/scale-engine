import { Link, useNavigate } from "react-router-dom";
import { NotificationBell } from "./notifications/NotificationBell";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const AdminNavbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };
  return (
    <>
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50 w-full px-10 py-2">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary">DotFluence</h1>
            <span className="text-sm text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
              Influencer
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to={"/dashboard"}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <NotificationBell />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User size={16} />
              <span>{user?.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>
    </>
  );
};

export default AdminNavbar;
