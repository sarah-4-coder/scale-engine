import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  LogOut,
  User,
  Users,
  BarChart3,
  Settings,
  Shield,
  TrendingUp,
  DollarSign,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

type ActivityItem = {
  action: string;
  user?: string;
  details?: string;
  time: string;
  timestamp?: number;
};

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [influencerCount, setInfluencerCount] = useState(0);
  const [campaignCount, setCampaignCount] = useState(0);
  const [pendingNegotiations, setPendingNegotiations] = useState(0);
  const [acceptedDeals, setAcceptedDeals] = useState(0);

  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        /* =======================
           STATS
        ======================= */

        const { count: influencers } = await supabase
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", "influencer");

        const { count: campaigns } = await supabase
          .from("campaigns")
          .select("*", { count: "exact", head: true });

        const { count: negotiations } = await supabase
          .from("campaign_influencers")
          .select("*", { count: "exact", head: true })
          .in("status", ["influencer_negotiated", "applied"]);

        const { count: accepted } = await supabase
          .from("campaign_influencers")
          .select("*", { count: "exact", head: true })
          .eq("status", "accepted");

        setInfluencerCount(influencers || 0);
        setCampaignCount(campaigns || 0);
        setPendingNegotiations(negotiations || 0);
        setAcceptedDeals(accepted || 0);

        /* =======================
           RECENT ACTIVITIES
        ======================= */

        const activities: ActivityItem[] = [];

        // Influencer registrations
        const { data: profiles } = await supabase
          .from("profiles")
          .select("full_name, created_at")
          .order("created_at", { ascending: false })
          .limit(2);

        profiles?.forEach((p) => {
          activities.push({
            action: "New influencer registered",
            user: p.full_name || "Unknown",
            time: timeAgo(p.created_at),
            timestamp: new Date(p.created_at).getTime(),
          });
        });

        // Campaigns created
        const { data: campaignsData } = await supabase
          .from("campaigns")
          .select("name, created_at")
          .order("created_at", { ascending: false })
          .limit(2);

        campaignsData?.forEach((c) => {
          activities.push({
            action: "Campaign created",
            details: c.name,
            time: timeAgo(c.created_at),
            timestamp: new Date(c.created_at).getTime(),
          });
        });

        // Negotiations / applications
        const { data: negotiationsData } = await supabase
          .from("campaign_influencers")
          .select("status, created_at")
          .order("created_at", { ascending: false })
          .limit(2);

        negotiationsData?.forEach((n) => {
          activities.push({
            action:
              n.status === "influencer_negotiated"
                ? "Negotiation requested"
                : n.status === "admin_negotiated"
                  ? "Admin countered offer"
                  : n.status === "accepted"
                    ? "Negotiation accepted"
                    : "Campaign interaction",
            time: timeAgo(n.created_at),
            timestamp: new Date(n.created_at).getTime(),
          });
        });

        activities.sort((a, b) => b.timestamp - a.timestamp);

        setRecentActivities(activities.slice(0, 6));
      } catch (error) {
        console.error(error);
        toast.error("Failed to load admin dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const stats = [
    {
      title: "Total Influencers",
      value: influencerCount.toString(),
      icon: Users,
      change: "Registered users",
    },
    {
      title: "Active Campaigns",
      value: campaignCount.toString(),
      icon: Activity,
      change: "Live campaigns",
    },
    {
      title: "Pending Negotiations",
      value: pendingNegotiations.toString(),
      icon: TrendingUp,
      change: "Needs admin action",
    },
    {
      title: "Accepted Deals",
      value: acceptedDeals.toString(),
      icon: DollarSign,
      change: "Finalized payouts",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary">DotFluence</h1>
            <span className="text-sm text-foreground bg-destructive/20 px-3 py-1 rounded-full flex items-center gap-1">
              <Shield size={14} />
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
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

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">
              Admin Dashboard 🛡️
            </h2>
            <p className="text-muted-foreground mt-2">
              Manage your influencer marketing platform
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-card/50 backdrop-blur-xl border-border/50">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.change}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <Card className="bg-card/50 backdrop-blur-xl border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activities
                </CardTitle>
                <CardDescription>Latest platform activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-background/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {activity.action}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activity.user || activity.details}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Admin Actions */}
            <Card className="bg-card/50 backdrop-blur-xl border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Admin Actions
                </CardTitle>
                <CardDescription>Platform management tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => navigate("/admin/campaigns/new")}
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Create New Campaign
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate("/admin/campaigns")}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Campaign Management
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate("/admin/influencers")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Influencers
                </Button>

                

                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={()=>navigate("/admin/negotiations")}
                >
                  Negotiations
                </Button>

                
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminDashboard;

/* =======================
   Helper
======================= */
const timeAgo = (date: string) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
};
