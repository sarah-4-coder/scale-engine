/* eslint-disable @typescript-eslint/no-explicit-any */
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
  PlusCircle,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import AdminNavbar from "@/components/adminNavbar";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [pendingHandovers, setPendingHandovers] = useState<any[]>([]);

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
          .in("status", ["influencer_negotiated", "admin_negotiated"]);

        const { count: accepted } = await supabase
          .from("campaign_influencers")
          .select("*", { count: "exact", head: true })
          .eq("status", "accepted");

        // Fetch pending handovers
        const { data: handovers } = await supabase
          .from("campaigns")
          .select("*")
          .eq("transfer_request_status", "pending")
          .order("created_at", { ascending: false });

        setInfluencerCount(influencers || 0);
        setCampaignCount(campaigns || 0);
        setPendingNegotiations(negotiations || 0);
        setAcceptedDeals(accepted || 0);
        setPendingHandovers(handovers || []);

        /* =======================
           RECENT ACTIVITIES
        ======================= */

        const activities: ActivityItem[] = [];

        // Influencer registrations
        const { data: profiles } = await supabase
          .from("profiles")
          .select("full_name, created_at");

        if (profiles) {
          profiles.slice(0, 2).forEach((p: any) => {
            activities.push({
              action: "New influencer registered",
              user: p.full_name || "Unknown",
              time: timeAgo(p.created_at),
              timestamp: new Date(p.created_at).getTime(),
            });
          });
        }

        // Campaigns created
        const { data: campaignsData } = await supabase
          .from("campaigns")
          .select("name, created_at")
          .order("created_at", { ascending: false })
          .limit(2) as any;

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
          .select("status, created_at") as any;

        negotiationsData?.forEach((n: any) => {
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



  const stats = [
    {
      title: "Total Creator Network",
      value: influencerCount.toLocaleString(),
      icon: Users,
      change: "Active in database",
      color: "text-blue-500",
    },
    {
      title: "Active Campaigns",
      value: campaignCount.toString(),
      icon: Activity,
      change: "Global platform activity",
      color: "text-green-500",
    },
    {
      title: "Handover Requests",
      value: pendingHandovers.length.toString(),
      icon: Shield,
      change: "Needs Admin action",
      color: "text-orange-500",
    },
    {
      title: "Accepted Deals",
      value: acceptedDeals.toString(),
      icon: DollarSign,
      change: "Finalized revenue",
      color: "text-emerald-500",
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
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <AdminNavbar />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Welcome Section */}
          <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                Admin Station 🛡️
              </h2>
              <p className="text-muted-foreground mt-2 text-lg">
                High-level oversight of DotFluence execution
              </p>
            </div>
            <div className="flex items-center gap-3">
               <Button onClick={() => navigate("/admin/campaigns")} variant="outline" className="rounded-full px-6">
                Explore All Campaigns
               </Button>
            </div>
          </div>

          {/* Pending Handovers Alert Card */}
          {pendingHandovers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-10"
            >
              <Card className="border-orange-500/40 bg-orange-500/5 backdrop-blur-xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Shield className="h-24 w-24 text-orange-500" />
                </div>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="h-7 w-7 text-orange-500 animate-pulse" />
                    <CardTitle className="text-2xl font-bold text-orange-500">
                      Pending Handover Requests
                    </CardTitle>
                  </div>
                  <CardDescription className="text-orange-600/80">
                    Brands are reaching out for DotFluence managed execution
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingHandovers.map((campaign) => (
                    <div key={campaign.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl gap-4">
                      <div>
                        <h4 className="font-bold text-lg text-orange-700">{campaign.name}</h4>
                        <p className="text-sm text-orange-600/70">Requested takeover for professional execution</p>
                      </div>
                      <Button 
                        onClick={() => navigate("/admin/campaigns")}
                        className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 shadow-lg shadow-orange-500/20"
                      >
                        Review Request <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="bg-card/40 backdrop-blur-md border-border/40 hover:border-primary/40 transition-all hover:translate-y-[-4px] shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg bg-background/50 border border-border/30 ${stat.color}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black text-foreground">
                      {stat.value}
                    </div>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-2 font-medium">
                      {stat.change}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Utility Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activities */}
            <Card className="lg:col-span-2 bg-card/30 backdrop-blur-md border-border/30 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Activity className="h-5 w-5 text-primary" />
                    Global Stream
                  </CardTitle>
                  <CardDescription>Live platform updates</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-xs">View History</Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-background/30 border border-border/20 rounded-2xl hover:bg-background/50 transition-colors"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="h-2 w-2 rounded-full bg-primary/40" />
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.user || activity.details}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Control Console */}
            <Card className="bg-card/30 backdrop-blur-md border-border/30 shadow-none h-fit sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Shield className="h-5 w-5 text-primary" />
                  Control Console
                </CardTitle>
                <CardDescription>Mission-critical operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full justify-between h-14 rounded-2xl bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                  onClick={() => navigate("/admin/campaigns/new")}
                >
                  <div className="flex items-center">
                    <PlusCircle className="mr-3 h-5 w-5" />
                    <span className="font-bold">New Campaign</span>
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-50" />
                </Button>
                
                <div className="grid grid-cols-1 gap-3">
                  <Button
                    className="w-full justify-start h-12 rounded-xl bg-background/50 border-border/40"
                    variant="outline"
                    onClick={() => navigate("/admin/campaigns")}
                  >
                    <BarChart3 className="mr-2 h-4 w-4 text-blue-500" />
                    Campaigns
                  </Button>
                  <Button
                    className="w-full justify-start h-12 rounded-xl bg-background/50 border-border/40"
                    variant="outline"
                    onClick={() => navigate("/admin/influencers")}
                  >
                    <Users className="mr-2 h-4 w-4 text-purple-500" />
                    Creators
                  </Button>
                  <Button
                    className="w-full justify-start h-12 rounded-xl bg-background/50 border-border/40"
                    variant="outline"
                    onClick={() => navigate("/admin/brands")}
                  >
                    <User className="mr-2 h-4 w-4 text-orange-500" />
                    Partner Brands
                  </Button>
                  <Button
                    className="w-full justify-start h-12 rounded-xl bg-background/50 border-border/40"
                    variant="outline"
                    onClick={() => navigate("/admin/negotiations")}
                  >
                    <Activity className="mr-2 h-4 w-4 text-emerald-500" />
                    Negotiation Feed
                  </Button>
                </div>
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
