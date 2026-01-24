import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LogOut,
  User,
  BarChart3,
  Calendar,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RecentCampaign = {
  name: string;
  status: "Active" | "Pending" | "Completed";
  deadline: string;
};

const InfluencerDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("Creator");

  const [activeCampaigns, setActiveCampaigns] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (!user) return;

        /* ================= PROFILE ================= */
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single();

        setFullName(profile?.full_name || "Creator");

        /* ========== INFLUENCER PROFILE ========== */
        const { data: influencer } = await supabase
          .from("influencer_profiles")
          .select("id, followers_count")
          .eq("user_id", user.id)
          .single();

        if (!influencer) {
          toast.error("Influencer profile not found");
          return;
        }

        /* ========== CAMPAIGN RELATIONS ========== */
        const { data: relations } = await supabase
          .from("campaign_influencers")
          .select("campaign_id, status, final_payout, created_at")
          .eq("influencer_id", influencer.id)
          .order("created_at", { ascending: false });

        if (!relations || relations.length === 0) {
          setLoading(false);
          return;
        }

        /* ========== CAMPAIGNS ========== */
        const campaignIds = relations.map((r) => r.campaign_id);

        const { data: campaigns, error: campaignsError } = await supabase
          .from("campaigns")
          .select("id, name") // Removed 'deadline'
          .in("id", campaignIds);

        if (campaignsError) {
          toast.error("Failed to fetch campaigns: " + campaignsError.message);
          setLoading(false);
          return;
        }

        /* ========== STATS ========== */
        const active = relations.filter((r) => r.status === "accepted").length;

        const totalEarnings = relations.reduce(
          (sum, r) => sum + (r.final_payout || 0),
          0,
        );

        /* ========== RECENT CAMPAIGNS ========== */
        let recent: RecentCampaign[] = [];
        if (Array.isArray(campaigns)) {
          recent = relations.slice(0, 3).map((r) => {
            const campaign = campaigns.find((c) => c.id === r.campaign_id);

            return {
              name: campaign?.name || "Campaign",
              status:
                r.status === "shortlisted" || r.status === "accepted"
                  ? "Active"
                  : r.status === "completed"
                    ? "Completed"
                    : "Pending",
              deadline: "—", // No deadline column, so use placeholder
            };
          });
        }

        setActiveCampaigns(active);
        setEarnings(totalEarnings);
        setRecentCampaigns(recent);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load influencer dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const influencer: { followers_count?: number } | null = null; // Declare influencer here

  const stats = [
    {
      title: "Active Campaigns",
      value: activeCampaigns.toString(),
      icon: Calendar,
      change: "Currently running",
    },
    {
      title: "Total Reach",
      value: influencer?.followers_count?.toString() || "Fetching soon",
      icon: TrendingUp,
      change: "Instagram data pending",
    },
    {
      title: "Engagement Rate",
      value: "Fetching soon",
      icon: BarChart3,
      change: "Instagram data pending",
    },
    {
      title: "Earnings",
      value: `₹${earnings}`,
      icon: DollarSign,
      change: "Lifetime earnings",
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
            <span className="text-sm text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
              Influencer
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
              Welcome {fullName} 👋
            </h2>
            <p className="text-muted-foreground mt-2">
              Here's what's happening with your campaigns
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

          {/* Recent Campaigns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur-xl border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Recent Campaigns
                </CardTitle>
                <CardDescription>
                  Your latest campaign activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCampaigns.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-background/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-foreground">{c.name}</p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            c.status === "Active"
                              ? "bg-green-500/20 text-green-400"
                              : c.status === "Pending"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {c.status}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">
                          {c.deadline}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card/50 backdrop-blur-xl border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Manage your influencer activity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => navigate("/dashboard/campaigns/all")}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Browse All Campaigns
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate("/dashboard/campaigns/my")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  My Campaigns
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  disabled
                >
                  <User className="mr-2 h-4 w-4" />
                  Update Profile (Locked)
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  disabled
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default InfluencerDashboard;
