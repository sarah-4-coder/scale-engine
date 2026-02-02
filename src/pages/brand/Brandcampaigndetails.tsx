/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  ArrowLeft,
  Users,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
  Download,
  Eye,
  Instagram,
  Phone,
  Mail,
} from "lucide-react";
import BrandNavbar from "@/components/BrandNavbar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
}

interface Applicant {
  id: string;
  status: string;
  requested_payout: number | null;
  final_payout: number | null;
  posted_link: string[] | null;
  created_at: string;
  influencer_profiles: {
    user_id: string;
    full_name: string;
    instagram_handle: string;
    phone_number: string;
    followers_count: number | null;
    niches: string[] | null;
    city: string | null;
    state: string | null;
  };
}

const BrandCampaignDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(
    null
  );
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchCampaignDetails();
    }
  }, [id, user]);

  const fetchCampaignDetails = async () => {
    try {
      // Fetch campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .eq("brand_user_id", user!.id)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      // Fetch applicants for THIS campaign
      const { data: applicantsData, error: applicantsError } = await supabase
        .from("campaign_influencers")
        .select(
          `
          *,
          influencer_profiles (
            user_id,
            full_name,
            instagram_handle,
            phone_number,
            followers_count,
            niches,
            city,
            state
          )
        `
        )
        .eq("campaign_id", id)
        .order("created_at", { ascending: false });

      if (applicantsError) throw applicantsError;
      setApplicants(applicantsData || []);
    } catch (error: any) {
      console.error("Error fetching campaign:", error);
      toast.error("Failed to load campaign details");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!campaign || applicants.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Influencer Name",
      "Instagram Handle",
      "Followers",
      "Status",
      "Payout",
      "Posted Links",
      "Application Date",
    ];

    const rows = applicants.map((a) => [
      a.influencer_profiles.full_name,
      `@${a.influencer_profiles.instagram_handle}`,
      a.influencer_profiles.followers_count || "N/A",
      a.status,
      `₹${a.final_payout || campaign.base_payout}`,
      a.posted_link ? a.posted_link.join(" | ") : "Not posted",
      new Date(a.created_at).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${campaign.name.replace(/\s+/g, "_")}_applicants.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV exported successfully!");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-500/10 text-green-500 border-green-500/30";
      case "applied":
        return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "shortlisted":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
      case "rejected":
      case "not_shortlisted":
        return "bg-red-500/10 text-red-500 border-red-500/30";
      case "completed":
        return "bg-purple-500/10 text-purple-500 border-purple-500/30";
      case "content_posted":
        return "bg-orange-500/10 text-orange-500 border-orange-500/30";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/30";
    }
  };

  const stats = {
    total: applicants.length,
    pending: applicants.filter((a) => a.status === "applied").length,
    shortlisted: applicants.filter((a) => a.status === "shortlisted").length,
    accepted: applicants.filter((a) => a.status === "accepted").length,
    completed: applicants.filter((a) => a.status === "completed").length,
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

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background">
        <BrandNavbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Campaign not found</p>
              <Button
                onClick={() => navigate("/brand/campaigns")}
                className="mt-4"
              >
                Back to Campaigns
              </Button>
            </CardContent>
          </Card>
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
          className="space-y-6"
        >
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/brand/campaigns")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>

          {/* Campaign Header */}
          <Card className="bg-card/50 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-2xl">{campaign.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className={getStatusColor(campaign.status || "active")}
                    >
                      {campaign.status || "active"}
                    </Badge>
                  </div>
                  <CardDescription className="text-base">
                    {campaign.description || "No description"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Deliverables
                  </p>
                  <p className="font-medium">{campaign.deliverables}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Timeline</p>
                  <p className="font-medium">{campaign.timeline}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Fixed Payout
                  </p>
                  <p className="font-medium flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />₹
                    {campaign.base_payout.toLocaleString()}
                  </p>
                </div>
              </div>

              {campaign.niches && campaign.niches.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    Target Niches
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {campaign.niches.map((niche) => (
                      <Badge key={niche} variant="secondary">
                        {niche}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stats */}
            <Card className="bg-card/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg">Application Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{stats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-500">Applied</span>
                  <span className="font-semibold text-blue-500">
                    {stats.pending}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-500">Shortlisted</span>
                  <span className="font-semibold text-yellow-500">
                    {stats.shortlisted}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-500">Accepted</span>
                  <span className="font-semibold text-green-500">
                    {stats.accepted}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-500">Completed</span>
                  <span className="font-semibold text-purple-500">
                    {stats.completed}
                  </span>
                </div>
                <Button
                  onClick={exportToCSV}
                  className="w-full mt-4"
                  variant="outline"
                  disabled={applicants.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
              </CardContent>
            </Card>

            {/* Applicants List */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Applicants ({applicants.length})</CardTitle>
                <CardDescription>
                  Influencers who have applied to this campaign
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applicants.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No applicants yet. Share your campaign to get applications!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applicants.map((applicant) => (
                      <div
                        key={applicant.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold">
                              {applicant.influencer_profiles.full_name}
                            </h4>
                            <Badge
                              variant="outline"
                              className={getStatusColor(applicant.status)}
                            >
                              {applicant.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Instagram className="h-3 w-3" />@
                              {applicant.influencer_profiles.instagram_handle}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {applicant.influencer_profiles.followers_count?.toLocaleString() ||
                                "N/A"}{" "}
                              followers
                            </span>
                            <span>
                              Applied:{" "}
                              {new Date(applicant.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedApplicant(applicant);
                            setShowDialog(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>

      {/* Applicant Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Influencer Details</DialogTitle>
            <DialogDescription>
              Complete profile and application information
            </DialogDescription>
          </DialogHeader>

          {selectedApplicant && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-4">
                  {selectedApplicant.influencer_profiles.full_name}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Instagram
                    </p>
                    <a
                      href={`https://instagram.com/${selectedApplicant.influencer_profiles.instagram_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:underline"
                    >
                      <Instagram className="h-4 w-4" />@
                      {selectedApplicant.influencer_profiles.instagram_handle}
                    </a>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Followers
                    </p>
                    <p className="font-semibold">
                      {selectedApplicant.influencer_profiles.followers_count?.toLocaleString() ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Location
                    </p>
                    <p>
                      {selectedApplicant.influencer_profiles.city},{" "}
                      {selectedApplicant.influencer_profiles.state}
                    </p>
                  </div>
                </div>
              </div>

              {selectedApplicant.influencer_profiles.niches &&
                selectedApplicant.influencer_profiles.niches.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Niches
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplicant.influencer_profiles.niches.map(
                        (niche) => (
                          <Badge key={niche} variant="secondary">
                            {niche}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Application Status
                </p>
                <Badge
                  variant="outline"
                  className={getStatusColor(selectedApplicant.status)}
                >
                  {selectedApplicant.status.replace("_", " ")}
                </Badge>
              </div>

              {selectedApplicant.posted_link &&
                selectedApplicant.posted_link.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Posted Content
                    </p>
                    <div className="space-y-1">
                      {selectedApplicant.posted_link.map((link, i) => (
                        <a
                          key={i}
                          href={link.split(" | ")[1] || link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-primary hover:underline"
                        >
                          {link.split(" | ")[0] || link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

              <div className="bg-blue-500/5 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm">
                  <strong>Note:</strong> All application management (approval,
                  tracking, payments) is handled by DotFluence admin team. You'll
                  receive updates on campaign progress. For contact details,
                  please reach out to admin.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BrandCampaignDetails;