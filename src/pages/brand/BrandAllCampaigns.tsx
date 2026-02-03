/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BarChart3,
  Eye,
  Users,
  Calendar,
  DollarSign,
  PlusCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import BrandNavbar from "@/components/BrandNavbar";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  niches: string[] | null;
  deliverables: string;
  timeline: string;
  base_payout: number;
  status: string | null;
  created_at: string;
  _count?: {
    applicants: number;
    accepted: number;
    completed: number;
  };
}

const BrandAllCampaigns = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!user) return;

      try {
        // Fetch campaigns created by THIS brand only
        const { data: campaignsData, error } = await supabase
          .from("campaigns")
          .select("*")
          .eq("brand_user_id", user.id)
          .order("created_at", { ascending: false })
          .returns<Campaign[]>();

        if (error) throw error;

        // Fetch applicant counts for each campaign
        const campaignsWithCounts = await Promise.all(
          (campaignsData || []).map(async (campaign) => {
            // Total applicants
            const { count: applicantCount } = await supabase
              .from("campaign_influencers")
              .select("*", { count: "exact", head: true })
              .eq("campaign_id", campaign.id);

            // Accepted influencers
            const { count: acceptedCount } = await supabase
              .from("campaign_influencers")
              .select("*", { count: "exact", head: true })
              .eq("campaign_id", campaign.id)
              .eq("status", "accepted");

            // Completed influencers
            const { count: completedCount } = await supabase
              .from("campaign_influencers")
              .select("*", { count: "exact", head: true })
              .eq("campaign_id", campaign.id)
              .eq("status", "completed");

            return {
              ...campaign,
              _count: {
                applicants: applicantCount || 0,
                accepted: acceptedCount || 0,
                completed: completedCount || 0,
              },
            };
          })
        );

        setCampaigns(campaignsWithCounts);
      } catch (error: any) {
        console.error("Error fetching campaigns:", error);
        toast.error("Failed to load campaigns");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [user]);

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 border-green-500/30";
      case "completed":
        return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "draft":
        return "bg-gray-500/10 text-gray-500 border-gray-500/30";
      default:
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <BrandNavbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
        </div>
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
        >
          {/* Header */}
          <div className="flex flex-col items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-primary" />
                My Campaigns
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage and monitor your influencer campaigns
              </p>
            </div>
            {/* <Button
              onClick={() => navigate("/brand/campaigns/new")}
              className="bg-primary hover:bg-primary/90"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Campaign
            </Button> */}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card/50 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{campaigns.length}</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {campaigns.filter((c) => c.status === "active").length}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Applicants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {campaigns.reduce(
                    (sum, c) => sum + (c._count?.applicants || 0),
                    0
                  )}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Accepted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {campaigns.reduce(
                    (sum, c) => sum + (c._count?.accepted || 0),
                    0
                  )}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns List */}
          {campaigns.length === 0 ? (
            <Card className="glass">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  No campaigns yet
                </h3>
                <p className="text-muted-foreground mb-6 text-center">
                  Create your first campaign to start collaborating with
                  influencers
                </p>
                <Button
                  onClick={() => navigate("/brand/campaigns/new")}
                  className="bg-primary hover:bg-primary/90"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign, index) => (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="glass hover:border-primary/30 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-xl">
                              {campaign.name}
                            </CardTitle>
                            <Badge
                              variant="outline"
                              className={getStatusColor(campaign.status)}
                            >
                              {campaign.status || "draft"}
                            </Badge>
                          </div>
                          <CardDescription className="line-clamp-2">
                            {campaign.description || "No description"}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {campaign._count?.applicants || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Applicants
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-sm font-medium">
                              {campaign._count?.accepted || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Accepted
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium">
                              {campaign._count?.completed || 0}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Completed
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              ₹{campaign.base_payout.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Payout
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {new Date(campaign.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Created
                            </p>
                          </div>
                        </div>
                      </div>

                      {campaign.niches && campaign.niches.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {campaign.niches.slice(0, 5).map((niche) => (
                            <Badge
                              key={niche}
                              variant="secondary"
                              className="text-xs"
                            >
                              {niche}
                            </Badge>
                          ))}
                          {campaign.niches.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              +{campaign.niches.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}

                      <Button
                        onClick={() =>
                          navigate(`/brand/campaigns/${campaign.id}`)
                        }
                        variant="outline"
                        className="w-full"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Campaign Details
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default BrandAllCampaigns;