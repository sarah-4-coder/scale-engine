import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar,
  TrendingUp,
  DollarSign,
  BarChart3,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import InfluencerNavbar from "@/components/influencer/InfluencerNavbar";
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AmbientLayer from "@/components/ambient/AmbientLayer";

/* --------------------------------
   TYPES
-------------------------------- */
type RecentCampaign = {
  name: string;
  status: "Active" | "Pending" | "Completed";
};

const InfluencerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  /* -------------------------------
     THEME
  ------------------------------- */
  const {
    theme,
    themeKey,
    setTheme,
    loading: themeLoading,
  } = useInfluencerTheme();

  /* -------------------------------
     STATE
  ------------------------------- */
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("Creator");
  const [followers, setFollowers] = useState<number | null>(null);
  const [activeCampaigns, setActiveCampaigns] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>([]);

  /* -------------------------------
     FETCH DASHBOARD DATA
  ------------------------------- */
  useEffect(() => {
    const fetchDashboard = async () => {
      if (!user) return;

      try {
        setLoading(true);

        /* ===== USER PROFILE ===== */
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single<{ full_name: string }>();

        setFullName(profile ? profile.full_name || "Creator" : "Creator");

        /* ===== INFLUENCER PROFILE ===== */
        const { data: influencer } = await supabase
          .from("influencer_profiles")
          .select("id, followers_count")
          .eq("user_id", user.id)
          .single<{ id: string; followers_count: number }>();

        if (!influencer) {
          toast.error("Please complete your profile to unlock campaigns");
          navigate("/profile-setup");
          return;
        }

        setFollowers(influencer.followers_count ?? null);

        /* ===== CAMPAIGN RELATIONS ===== */
        const { data: relations } = (await supabase
          .from("campaign_influencers")
          .select("campaign_id, status, final_payout, created_at")
          .eq("influencer_id", influencer.id)
          .order("created_at", { ascending: false })) as {
          data: Array<{
            campaign_id: string;
            status: string;
            final_payout: number | null;
            created_at: string;
          }> | null;
        };

        if (!relations || relations.length === 0) {
          setLoading(false);
          return;
        }

        const campaignIds = relations.map((r) => r.campaign_id);

        const { data: campaigns } = (await supabase
          .from("campaigns")
          .select("id, name")
          .in("id", campaignIds)) as {
          data: Array<{ id: string; name: string }> | null;
        };

        /* ===== STATS ===== */
        setActiveCampaigns(
          relations.filter((r) => r.status === "accepted").length,
        );

        setEarnings(
          relations.reduce((sum, r) => sum + (r.final_payout || 0), 0),
        );

        /* ===== RECENT CAMPAIGNS ===== */
        const recent = relations.slice(0, 3).map((r) => {
          const campaign = campaigns?.find((c) => c.id === r.campaign_id);
          const status: "Active" | "Completed" | "Pending" =
            r.status === "accepted"
              ? "Active"
              : r.status === "completed"
                ? "Completed"
                : "Pending";
          return {
            name: campaign?.name || "Campaign",
            status,
          };
        });

        setRecentCampaigns(recent);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [user, navigate]);

  /* -------------------------------
     LOADING STATE
  ------------------------------- */
  if (loading || themeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  /* -------------------------------
     STATS CONFIG
  ------------------------------- */
  const stats = [
    {
      title: "Active Campaigns",
      value: activeCampaigns,
      icon: Calendar,
      note: "Currently running",
    },
    {
      title: "Total Reach",
      value: followers ? followers.toLocaleString() : "—",
      icon: TrendingUp,
      note: "Instagram followers",
    },
    {
      title: "Engagement",
      value: "Coming soon",
      icon: BarChart3,
      note: "Auto-calculated",
    },
    {
      title: "Earnings",
      value: `₹${earnings}`,
      icon: DollarSign,
      note: "Lifetime earnings",
    },
  ];

  /* -------------------------------
     RENDER
  ------------------------------- */
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Theme Background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ background: theme.background }}
      />
      {/* Ambient Background */}
      <AmbientLayer themeKey={themeKey} />

      {/* Navbar */}
      <InfluencerNavbar currentTheme={themeKey} onThemeChange={setTheme} />

      {/* CONTENT */}
      <main className="relative z-10 px-6 py-10 max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-10">
          <h2 className={`text-3xl font-bold ${theme.text}`}>
            Welcome {fullName} 👋
          </h2>
          <p className={theme.muted}>Your personalized creator dashboard</p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`${theme.card} ${theme.radius}`}>
                <CardHeader className="flex flex-row justify-between items-center pb-2">
                  <CardTitle className="text-sm opacity-70">
                    {s.title}
                  </CardTitle>
                  <s.icon className="h-4 w-4 opacity-70" />
                </CardHeader>

                <CardContent>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <p className="text-xs opacity-60 mt-1">{s.note}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* RECENT + ACTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RECENT CAMPAIGNS */}
          <Card className={`${theme.card} ${theme.radius}`}>
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
              <CardDescription>Your latest activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentCampaigns.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No campaigns yet — explore new opportunities 🚀
                </p>
              )}

              {recentCampaigns.map((c, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-4 rounded-lg bg-white/10"
                >
                  <span className={theme.text}>{c.name}</span>
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
                </div>
              ))}
            </CardContent>
          </Card>

          {/* QUICK ACTIONS */}
          <Card className={`${theme.card} ${theme.radius}`}>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Move faster</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                className="w-full"
                onClick={() => navigate("/dashboard/campaigns/all")}
              >
                Browse Campaigns
              </Button>
              <Button
                variant="outline"
                className="w-full text-foreground"
                onClick={() => navigate("/dashboard/campaigns/my")}
              >
                My Campaigns
              </Button>
              <Button variant="outline" className="w-full text-foreground" disabled>
                Analytics (Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default InfluencerDashboard;
