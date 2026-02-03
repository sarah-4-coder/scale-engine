/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import {
  Activity,
  BarChart3,
  DollarSign,
  TrendingUp,
  Users,
  PlusCircle,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import BrandNavbar from "@/components/BrandNavbar";
import { Alert, AlertDescription } from "@/components/ui/alert";

type ActivityItem = {
  action: string;
  details?: string;
  time: string;
  timestamp?: number;
};

const BrandDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [brandProfile, setBrandProfile] = useState<any>(null);
  const [campaignCount, setCampaignCount] = useState(0);
  const [activeCampaigns, setActiveCampaigns] = useState(0);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [acceptedInfluencers, setAcceptedInfluencers] = useState(0);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch brand profile
        const { data: profile, error: profileError } = await supabase
          .from("brand_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profileError) throw profileError;
        setBrandProfile(profile);

        // Fetch campaign stats for THIS BRAND only
        const { count: totalCampaigns } = await supabase
          .from("campaigns")
          .select("*", { count: "exact", head: true })
          .eq("brand_user_id", user.id);

        setCampaignCount(totalCampaigns || 0);

        const { count: active } = await supabase
          .from("campaigns")
          .select("*", { count: "exact", head: true })
          .eq("brand_user_id", user.id)
          .eq("status", "active");

        setActiveCampaigns(active || 0);

        // Fetch applicant stats for THIS BRAND's campaigns only
        const { data: campaigns } = await supabase
          .from("campaigns")
          .select("id")
          .eq("brand_user_id", user.id);

        if (campaigns && campaigns.length > 0) {
          //@ts-ignore
          const campaignIds = campaigns.map((c) => c.id);

          const { count: applicants } = await supabase
            .from("campaign_influencers")
            .select("*", { count: "exact", head: true })
            .in("campaign_id", campaignIds);

          setTotalApplicants(applicants || 0);

          const { count: accepted } = await supabase
            .from("campaign_influencers")
            .select("*", { count: "exact", head: true })
            .in("campaign_id", campaignIds)
            .eq("status", "accepted");

          setAcceptedInfluencers(accepted || 0);

          // Fetch recent activities
          const { data: recentCampaigns } = await supabase
            .from("campaigns")
            .select("name, created_at")
            .eq("brand_user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(3);

          const activities: ActivityItem[] = [];

          recentCampaigns?.forEach((c: any) => {
            activities.push({
              action: "Campaign created",
              details: c.name,
              time: timeAgo(c.created_at),
              timestamp: new Date(c.created_at).getTime(),
            });
          });

          const { data: recentApplicants } = await supabase
            .from("campaign_influencers")
            .select("created_at, campaigns(name)")
            .in("campaign_id", campaignIds)
            .order("created_at", { ascending: false })
            .limit(3);

          recentApplicants?.forEach((a: any) => {
            activities.push({
              action: "New applicant",
              details: a.campaigns?.name,
              time: timeAgo(a.created_at),
              timestamp: new Date(a.created_at).getTime(),
            });
          });

          activities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          setRecentActivities(activities.slice(0, 6));
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const stats = [
    {
      title: "Total Campaigns",
      value: campaignCount.toString(),
      icon: BarChart3,
      change: "All time",
      color: "text-blue-500",
    },
    {
      title: "Active Campaigns",
      value: activeCampaigns.toString(),
      icon: Activity,
      change: "Currently running",
      color: "text-green-500",
    },
    {
      title: "Total Applicants",
      value: totalApplicants.toString(),
      icon: Users,
      change: "Across all campaigns",
      color: "text-purple-500",
    },
    {
      title: "Accepted Influencers",
      value: acceptedInfluencers.toString(),
      icon: CheckCircle,
      change: "Ready to collaborate",
      color: "text-emerald-500",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  // Show pending verification message
  if (!brandProfile?.is_verified) {
    return (
      <div className="min-h-screen bg-background">
        <BrandNavbar />
        <main className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-8 w-8 text-yellow-500" />
                  <CardTitle className="text-2xl">
                    Account Pending Verification
                  </CardTitle>
                </div>
                <CardDescription>
                  Your brand account is currently under review
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Thank you for registering with DotFluence! Our team is
                  reviewing your account to ensure the quality and security of
                  our platform.
                </p>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You'll receive an email notification once your account is
                    verified. This typically takes 24-48 hours.
                  </AlertDescription>
                </Alert>
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-semibold">What happens next?</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>✅ Our team verifies your company details</li>
                    <li>✅ We validate your work email domain</li>
                    <li>✅ You get full access to create campaigns</li>
                    <li>
                      ✅ You can connect with 5,000+ verified influencers
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BrandNavbar />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Welcome */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">
              Welcome back, {brandProfile?.company_name}! 🚀
            </h2>
            <p className="text-muted-foreground mt-2">
              Manage your influencer campaigns and collaborations
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
                <Card className="bg-card/50 backdrop-blur-xl border-border/50 hover:border-primary/30 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
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

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card className="bg-card/50 backdrop-blur-xl border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Get started with your campaigns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90 h-auto py-4"
                  onClick={() => navigate("/brand/campaigns/new")}
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Create New Campaign</div>
                    <div className="text-xs opacity-80">
                      Launch your influencer marketing campaign
                    </div>
                  </div>
                </Button>

                <Button
                  className="w-full justify-start h-auto py-4"
                  variant="outline"
                  onClick={() => navigate("/brand/campaigns")}
                >
                  <BarChart3 className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">View All Campaigns</div>
                    <div className="text-xs opacity-80">
                      Monitor campaign performance
                    </div>
                  </div>
                </Button>

                <Button
                  className="w-full justify-start h-auto py-4"
                  variant="outline"
                  onClick={() => navigate("/brand/influencers")}
                >
                  <Users className="mr-2 h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">Browse Influencers</div>
                    <div className="text-xs opacity-80">
                      Discover verified creators
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card className="bg-card/50 backdrop-blur-xl border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activities
                </CardTitle>
                <CardDescription>Latest updates on your campaigns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background/80 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {activity.action}
                        </p>
                        {activity.details && (
                          <p className="text-xs text-muted-foreground">
                            {activity.details}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {activity.time}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity. Create your first campaign to get
                    started!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default BrandDashboard;

// Helper function
const timeAgo = (date: string) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
};