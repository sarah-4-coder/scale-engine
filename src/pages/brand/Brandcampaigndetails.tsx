/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
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
  MessageSquare,
  FileText, Shield, Lock,
  Share2
} from "lucide-react";
import BrandNavbar from "@/components/BrandNavbar";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  niches: string[] | null;
  deliverables: string;
  timeline: string;
  base_payout: number;
  status: string | null;
  managed_by_dotfluence?: boolean;
  execution_model?: 'agency' | 'brand_self' | 'brand_managed' | 'internal';
  transfer_request_status?: string | null;
  created_at: string;
  slug: string;
  type?: 'paid' | 'barter';
  platform_fee_percent?: number | null;
  followers_count?: number;
  brand_profiles?: {
    company_name: string;
    work_email: string;
  };
}

interface Applicant {
  id: string;
  campaign_id: string;
  status: string;
  requested_payout: number | null;
  final_payout: number | null;
  platform_fee_amount: number | null;
  funding_status: string | null;
  negotiation_requested: boolean;
  posted_link: string[] | null;
  created_at: string;
  influencer_profiles: {
    user_id: string;
    full_name: string;
    instagram_handle: string;
    phone_number: string;
    followers_count: number;
    niches: string[];
    city: string;
    state: string;
  };
  contracts?: {
    contract_text: string;
    status: string;
    signed_at: string | null;
    influencer_id: string;
  }[];
}

interface viewingContract {
  text: string;
  signed_at: string | null;
}

import { useWorkspace } from "@/contexts/WorkspaceContext";
import { usePayment } from "@/hooks/usePayment";

const BrandCampaignDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeBrandId, isLoading: workspaceLoading } = useWorkspace();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [viewingContract, setViewingContract] = useState<viewingContract | null>(null);
  const [counterOfferValue, setCounterOfferValue] = useState("");
  const [localIsProcessing, setLocalIsProcessing] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(true);

  const {
    isProcessingPayment,
    handleMerchantFunding,
    handleApproveContent,
    handleBatchMerchantFunding
  } = usePayment(() => fetchCampaignDetails());

  const COLUMNS = useMemo(() => {
    if (campaign?.type === 'barter') {
      return [
        { id: "applied", label: "Applied", color: "blue" },
        { id: "shortlisted", label: "Shortlisted", color: "yellow" },
        { id: "product_sent", label: "Product Sent", color: "orange" },
        { id: "product_received", label: "Product Received", color: "emerald" },
        { id: "content_posted", label: "Content Submitted", color: "rose" },
        { id: "completed", label: "Completed", color: "teal" }
      ];
    }
    return [
      { id: "applied", label: "Applied", color: "blue" },
      { id: "shortlisted", label: "Shortlisted", color: "yellow" },
      { id: "negotiation", label: "Negotiation", color: "orange" },
      { id: "approved", label: "Approved", color: "emerald" },
      { id: "content_posted", label: "Content Submitted", color: "rose" },
      { id: "completed", label: "Completed", color: "teal" },
      { id: "paid", label: "Paid", color: "indigo" }
    ];
  }, [campaign?.type]);

  const getColumnForStatus = (status: string) => {
    if (campaign?.type === 'barter') {
      if (status === 'accepted') return 'product_sent';
      return status;
    }
    if (["influencer_negotiated", "admin_negotiated"].includes(status)) return "negotiation";
    if (status === "accepted" || status === "funded" || status === "content_rejected") return "approved";
    if (status === "paid") return "paid";
    return status;
  };

  const onDragEnd = async (result: any) => {
    if (campaign?.managed_by_dotfluence || campaign?.transfer_request_status === 'pending') {
      toast.error("Kanban is locked during Admin Handover.");
      return;
    }
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const newStatus = destination.droppableId;
    setApplicants(prev => prev.map(app =>
      app.id === draggableId ? { ...app, status: newStatus } : app
    ));
    const { error } = await supabase
      .from("campaign_influencers")
      .update({
        status: newStatus === "negotiation" ? "admin_negotiated" : (newStatus === "approved" ? "accepted" : newStatus),
        funding_status: newStatus === 'completed' ? 'unfunded' : undefined,
        final_payout: newStatus === "negotiation" ? null : undefined
      })
      .eq("id", draggableId);
    if (error) {
      toast.error("Failed to update status");
      fetchCampaignDetails();
    } else {
      toast.success(`Moved to ${COLUMNS.find(c => c.id === newStatus)?.label || newStatus}`);
    }
  };

  useEffect(() => {
    if (id && user && !workspaceLoading && activeBrandId) {
      fetchCampaignDetails();
    }
  }, [id, user, workspaceLoading, activeBrandId]);

  const fetchCampaignDetails = async () => {
    if (!activeBrandId) return;
    try {
      const { data: campaignData, error: campaignError } = await supabase
        .from("campaigns")
        .select(`
          *,
          brand_profiles!brand_id (
            company_name,
            work_email,
            is_verified,
            logo_url
          )
        `)
        .eq("id", id)
        .eq("brand_id", activeBrandId)
        .maybeSingle();

      if (campaignError) throw campaignError;
      if (!campaignData) {
        navigate("/company/campaigns");
        return;
      }
      setCampaign(campaignData as any);
      setIsVerified(campaignData.brand_profiles?.is_verified || false);
      setIsProfileComplete(!!campaignData.brand_profiles?.logo_url);
      const { data: applicantsData, error: applicantsError } = await supabase
        .from("campaign_influencers")
        .select(`
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
        `)
        .eq("campaign_id", id)
        .order("created_at", { ascending: false });

      if (applicantsError) throw applicantsError;
      const { data: contractsData } = await supabase
        .from("contracts")
        .select("influencer_id, contract_text, status, signed_at")
        .eq("campaign_id", id);

      const mergedApplicants = (applicantsData || []).map(row => ({
        ...row,
        contracts: (contractsData || []).filter(c => c.influencer_id === row.influencer_profiles.user_id)
      }));
      setApplicants(mergedApplicants as any);
    } catch (error: any) {
      console.error("Error fetching campaign:", error);
      toast.error("Failed to load campaign details");
    } finally {
      setLoading(false);
    }
  };

  const copyMagicLink = () => {
    if (!campaign?.slug) return;
    const url = `${window.location.origin}/i/${campaign.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Magic Link copied to clipboard!");
  };

  const shareWhatsApp = () => {
    if (!campaign?.slug) return;
    const url = `${window.location.origin}/i/${campaign.slug}`;
    const text = `Hey! Check out this campaign on DotFluence: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleNegotiation = async (applicant: Applicant, action: 'accept' | 'counter') => {
    if (campaign?.managed_by_dotfluence || campaign?.transfer_request_status === 'pending') {
      toast.error("Action restricted during handover.");
      return;
    }
    try {
      let updatePayload: any = {};
      if (action === 'accept') {
        updatePayload = {
          status: 'accepted',
          final_payout: applicant.requested_payout || campaign?.base_payout
        };
      } else if (action === 'counter') {
        if (!counterOfferValue) {
          toast.error("Please enter a counter offer amount");
          return;
        }
        updatePayload = {
          status: 'admin_negotiated',
          requested_payout: parseInt(counterOfferValue),
          final_payout: null
        };
      }
      const { error } = await supabase
        .from('campaign_influencers')
        .update(updatePayload)
        .eq('id', applicant.id);
      if (error) throw error;
      toast.success(action === 'accept' ? 'Offer Accepted!' : 'Counter Offer Sent');
      setApplicants(prev => prev.map(a => a.id === applicant.id ? { ...a, ...updatePayload } : a));
      setShowDialog(false);
      setCounterOfferValue("");
    } catch (e: any) {
      toast.error(e.message || "Failed to submit negotiation");
    }
  };

  const handleRequestTransfer = async () => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ transfer_request_status: 'pending' })
        .eq('id', id);
      if (error) throw error;
      setCampaign(prev => prev ? { ...prev, transfer_request_status: 'pending' } : null);
      toast.success("Transfer request submitted successfully. Our team will review it.");
      setShowTransferModal(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to submit request.");
    }
  };

  const handleRejectContent = async (applicant: Applicant) => {
    if (!campaign || !applicant.id) return;
    setLocalIsProcessing(applicant.id);
    try {
      const { error } = await supabase
        .from("campaign_influencers")
        .update({ status: "content_rejected" })
        .eq("id", applicant.id);
      if (error) throw error;
      toast.success("Content rejected. Influencer notified to resubmit.");
      fetchCampaignDetails();
    } catch (error: any) {
      toast.error("Failed to reject content");
    } finally {
      setLocalIsProcessing(null);
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
                onClick={() => navigate("/company/campaigns")}
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
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/company/campaigns")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Campaigns
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="border-primary/20 hover:bg-primary/5 text-primary font-bold" onClick={copyMagicLink}>
                <Share2 className="h-4 w-4 mr-2" /> Copy Magic Link
              </Button>
              <Button variant="outline" className="border-emerald-500/20 hover:bg-emerald-500/5 text-emerald-600 font-bold" onClick={shareWhatsApp}>
                <MessageSquare className="h-4 w-4 mr-2" /> WhatsApp Link
              </Button>
            </div>
          </div>

          {!isVerified && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm font-bold text-amber-600">Account Verification in Progress</p>
                  <p className="text-xs text-amber-500/80">You have full access to CRM, but Escrow/Payouts are disabled until verified (usually within 24h).</p>
                </div>
              </div>
            </div>
          )}

          {!isProfileComplete && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-bold text-blue-600">Complete Your Brand Profile</p>
                  <p className="text-xs text-blue-500/80">Add your logo and company details to build trust with influencers.</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-blue-500/30 text-blue-600 hover:bg-blue-500/10" onClick={() => navigate('/settings')}>
                Complete Profile
              </Button>
            </div>
          )}

          <Card className="bg-card/50 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-2xl">{campaign.name}</CardTitle>
                    <Badge variant="outline" className={getStatusColor(campaign.status || "active")}>
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
              {campaign && (
                <div className="mb-8">
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <StatCard label="Total Reach" value={formatCompact(campaign.followers_count || 0)} icon={Users} color="text-primary" />
                    <StatCard label="Live Content" value={applicants.filter(a => a.status === 'completed').length} icon={CheckCircle} color="text-emerald-500" />
                    <StatCard label="Payout Budget" value={`₹${campaign.base_payout.toLocaleString()}`} icon={DollarSign} color="text-amber-500" />
                  </div>
                  <CampaignSummary applicants={applicants} campaign={campaign} />
                  {campaign.execution_model === 'agency' && applicants.filter(a => a.status === 'completed' && a.funding_status === 'unfunded').length > 0 && (
                    <div className="p-6 bg-primary/5 rounded-2xl border-2 border-primary/20 border-dashed mb-6">
                      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                          <h3 className="text-xl font-black text-primary flex items-center gap-2">
                            <DollarSign className="h-5 w-5" /> Consolidated Platform Settlement
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                            Brand payment received? Settle influencer payouts + platform fees in one go.
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Consolidated Total</p>
                            <p className="text-3xl font-black text-primary">
                              ₹{(
                                applicants.filter(a => a.status === 'completed' && a.funding_status === 'unfunded')
                                .reduce((acc, curr) => acc + (curr.final_payout || 0) + (curr.platform_fee_amount || 0), 0)
                              ).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {applicants.filter(a => a.status === 'completed' && a.funding_status === 'unfunded').length} Influencers Verified
                            </p>
                          </div>
                          <Button 
                            size="lg" 
                            onClick={() => handleBatchMerchantFunding(id!, applicants.filter(a => a.status === 'completed' && a.funding_status === 'unfunded'))}
                            className="bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                            disabled={!!isProcessingPayment || !isVerified}
                            title={!isVerified ? "Account verification in progress — usually within 24 hours." : ""}
                          >
                            {isProcessingPayment?.toString().startsWith('batch') ? "Processing..." : "Fund All Creators"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Deliverables</p>
                  <p className="font-medium">{campaign.deliverables}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Timeline</p>
                  <p className="font-medium">{campaign.timeline}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Fixed Payout</p>
                  <p className="font-medium flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />₹
                    {campaign.base_payout.toLocaleString()}
                  </p>
                </div>
              </div>
              {campaign.niches && campaign.niches.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Target Niches</p>
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
            <Card className="bg-card/50 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-lg">Application Stats</CardTitle>              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{stats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-500">Applied</span>
                  <span className="font-semibold text-blue-500">{stats.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-500">Shortlisted</span>
                  <span className="font-semibold text-yellow-500">{stats.shortlisted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-500">Accepted</span>
                  <span className="font-semibold text-green-500">{stats.accepted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-500">Completed</span>
                  <span className="font-semibold text-purple-500">{stats.completed}</span>
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

            <div className="lg:col-span-3">
               <div className="flex items-center justify-between mb-4 flex-col sm:flex-row items-start sm:items-center">
                 <div className="mb-4 sm:mb-0">
                   <h3 className="text-xl font-semibold">CRM Dashboard</h3>
                   <p className="text-sm text-muted-foreground">Drag and drop influencers to update their status</p>
                 </div>
                 <div className="flex items-center gap-3 bg-secondary/50 p-2 rounded-lg border border-secondary/20">
                   <div className="text-sm text-right">
                     <p className="font-medium leading-none">Management Status</p>
                     <p className="text-[10px] text-muted-foreground mt-1">Let admins handle execution</p>
                   </div>
                   {campaign?.managed_by_dotfluence ? (
                     <Button variant="default" size="sm" disabled>DotFluence Managed</Button>
                   ) : campaign?.transfer_request_status === 'pending' ? (
                     <Button variant="outline" size="sm" disabled className="text-yellow-500 border-yellow-500/50">Transfer Pending Review</Button>
                   ) : (
                     <Button variant="outline" size="sm" onClick={() => setShowTransferModal(true)}>Request Admin Transfer</Button>
                   )}
                 </div>
               </div>

               <DragDropContext onDragEnd={onDragEnd}>
                 <div className="flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory">
                   {COLUMNS.map((column) => (
                     <div key={column.id} className="min-w-[320px] max-w-[320px] shrink-0 snap-center">
                       <Card className="h-full bg-card/40 backdrop-blur-md border-muted/50 rounded-xl overflow-hidden flex flex-col">
                         <div className={`p-3 border-b flex justify-between items-center bg-muted/30`}>
                           <div className="flex flex-col">
                             <h4 className={`font-semibold flex items-center gap-2`}>{column.label}</h4>
                           </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-background/50">
                                {applicants.filter(a => getColumnForStatus(a.status) === column.id).length}
                              </Badge>
                              {column.id === 'completed' && applicants.filter(a => a.status === 'completed' && a.funding_status === 'unfunded').length > 0 && (
                                <button
                                  onClick={() => handleBatchMerchantFunding(id!, applicants.filter(a => a.status === 'completed' && a.funding_status === 'unfunded'))}
                                  className="text-[10px] text-primary hover:underline font-bold uppercase transition-all"
                                  disabled={!!isProcessingPayment || !isVerified}
                                  title={!isVerified ? "Account verification in progress" : ""}
                                >
                                  {isProcessingPayment?.toString().startsWith('batch') ? "Processing..." : "Fund All"}
                                </button>
                              )}
                            </div>
                         </div>

                         <Droppable droppableId={column.id}>
                           {(provided, snapshot) => (
                             <div
                               ref={provided.innerRef}
                               {...provided.droppableProps}
                               className={`flex-1 p-3 space-y-3 min-h-[500px] transition-colors ${snapshot.isDraggingOver ? 'bg-muted/50' : ''}`}
                             >
                               {applicants
                                 .filter(a => getColumnForStatus(a.status) === column.id)
                                 .map((applicant, index) => (
                                   <Draggable key={applicant.id} draggableId={applicant.id} index={index}>
                                     {(provided, snapshot) => (
                                       <div
                                         ref={provided.innerRef}
                                         {...provided.draggableProps}
                                         {...provided.dragHandleProps}
                                         className={`bg-background border rounded-lg p-3 shadow-sm transition-all ${snapshot.isDragging ? 'shadow-md scale-[1.02] rotate-1 ring-1 ring-primary' : 'hover:border-primary/30'}`}
                                       >
                                         <div className="flex items-start justify-between mb-2">
                                            <div>
                                              <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm leading-tight">{applicant.influencer_profiles.full_name}</p>
                                                {applicant.negotiation_requested && (
                                                  <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-1.5 h-4 text-[8px] uppercase font-bold flex items-center gap-0.5">
                                                    <MessageSquare className="h-2 w-2" />
                                                    Negotiation Requested
                                                  </Badge>
                                                )}
                                              </div>
                                              <a href={`https://instagram.com/${applicant.influencer_profiles.instagram_handle}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                                                <Instagram className="h-3 w-3" />
                                                @{applicant.influencer_profiles.instagram_handle}
                                              </a>
                                              {applicant.contracts?.some(c => c.status === 'signed') && (
                                                <div className="flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20 text-[8px] font-bold uppercase w-fit">                                                  <FileText className="h-2 w-2" />
                                                  Contract Signed
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                              <div className="flex px-2 py-0.5 rounded-full bg-secondary text-[10px] font-medium text-muted-foreground items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {applicant.influencer_profiles.followers_count ? (applicant.influencer_profiles.followers_count / 1000).toFixed(1) + 'k' : 'N/A'}
                                              </div>
                                              <div className={cn(
                                                "flex px-2 py-0.5 rounded-full border text-[10px] font-bold items-center gap-1",
                                                (applicant.negotiation_requested || column.id === 'negotiation')
                                                  ? "border-amber-500/30 text-amber-600 bg-amber-500/10"
                                                  : (['shortlisted', 'accepted', 'completed', 'paid'].includes(applicant.status))
                                                    ? "border-green-500/30 text-green-500 bg-green-500/10"
                                                    : "border-blue-500/30 text-blue-500 bg-blue-500/10"
                                              )}>
                                                {(() => {
                                                  if (campaign?.type === 'barter') return "Barter Collaboration";
                                                  const currentColumn = getColumnForStatus(applicant.status);
                                                  const isNegotiated = applicant.final_payout !== null && applicant.final_payout !== undefined && applicant.final_payout !== campaign?.base_payout;
                                                  
                                                  if (currentColumn === 'negotiation') return "Negotiating: ";
                                                  if (isNegotiated) return "Negotiated: ";
                                                  if (currentColumn === 'applied') return "Requested: ";
                                                  if (['shortlisted', 'accepted', 'completed', 'paid'].includes(applicant.status)) return "Agreed: ";
                                                  return "Payout: ";
                                                })()}
                                                {campaign?.type !== 'barter' && `₹${(applicant.final_payout || applicant.requested_payout || campaign?.base_payout || 0).toLocaleString()}`}
                                              </div>
                                            </div>
                                         </div>
                                         <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                                           <Button
                                             size="sm"
                                             variant="ghost"                                             className="flex-1 h-8 text-xs px-2"
                                             onClick={() => {
                                               setSelectedApplicant(applicant);
                                               setShowDialog(true);
                                             }}
                                           >
                                             <Eye className="mr-1.5 h-3 w-3" /> Details
                                           </Button>
                                           {applicant.contracts && applicant.contracts.length > 0 && (
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 h-8 text-xs px-2 border-primary/20 hover:bg-primary/5"
                                                onClick={() => {
                                                  const signed = applicant.contracts?.find(c => c.status === 'signed') || applicant.contracts?.[0];
                                                  if (signed) setViewingContract({ text: signed.contract_text, signed_at: signed.signed_at });
                                                }}
                                              >
                                                <FileText className="mr-1.5 h-3 w-3" /> Contract
                                              </Button>
                                           )}
                                           {column.id === "content_posted" && (
                                                <div className="flex flex-col gap-2 w-full mt-2">
                                                  <div className="flex gap-2">
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      className="flex-1 h-8 text-[10px] border-orange-500/30 text-orange-500 hover:bg-orange-500/10 px-1"
                                                      onClick={() => {
                                                        const link = applicant.posted_link?.[0];
                                                        if (link) window.open(link.split(" | ")[1] || link, '_blank');
                                                      }}
                                                    >View Post</Button>
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      className="flex-1 h-8 text-[10px] border-red-500/30 text-red-500 hover:bg-red-500/10 px-1"
                                                      onClick={() => handleRejectContent(applicant)}
                                                      disabled={isProcessingPayment === applicant.id}
                                                    >Reject</Button>
                                                  </div>
                                                  <Button 
                                                     size="sm" 
                                                     className="w-full h-8 text-[10px] bg-green-600 hover:bg-green-700 text-white px-1" 
                                                     onClick={() => campaign && handleApproveContent(applicant as any, campaign as any)} 
                                                     disabled={isProcessingPayment === applicant.id}
                                                   >
                                                     {isProcessingPayment === applicant.id ? "Processing..." : "Approve Deliverable"}
                                                   </Button>
                                                </div>
                                              )}
                                              {column.id === "completed" && applicant.funding_status === 'unfunded' && (
                                                <div className="w-full mt-2">
                                                  <Button 
                                                     size="sm" 
                                                     className="w-full h-8 text-[10px] bg-purple-600 hover:bg-purple-700 text-white px-1 shadow-lg shadow-purple-500/10" 
                                                     onClick={() => campaign && handleMerchantFunding(applicant as any, campaign as any)} 
                                                     disabled={isProcessingPayment === applicant.id}
                                                   >
                                                     {isProcessingPayment === applicant.id ? "Processing..." : "Fund & Settle"}
                                                   </Button>
                                                </div>
                                              )}
                                              {applicant.funding_status === 'funded' && (
                                                <div className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                                  <CheckCircle className="h-3 w-3 text-indigo-500" />
                                                  <span className="text-[10px] font-bold text-indigo-500">Funded - Awaiting Admin Payout</span>
                                                </div>
                                              )}
                                              {applicant.status === 'paid' && (
                                                <div className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                                  <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Settled Successfully</span>
                                                </div>
                                              )}
                                         </div>
                                       </div>
                                     )}
                                   </Draggable>
                                 ))}
                               {provided.placeholder}
                             </div>
                           )}
                         </Droppable>
                       </Card>
                     </div>
                   ))}
                 </div>
               </DragDropContext>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Applicant Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Influencer Details</DialogTitle>
            <DialogDescription className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-1">
              {selectedApplicant?.status.replace("_", " ")} • ID: {selectedApplicant?.id.slice(0,8)}
            </DialogDescription>
          </DialogHeader>
          {selectedApplicant && (
            <div className="space-y-6">
               <div className="flex flex-col md:flex-row gap-8">
                 {/* Left Column: Info */}
                 <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col p-3 rounded-xl bg-secondary/30 border border-border/40">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Followers</p>
                        <p className="font-bold flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-primary" />
                          {selectedApplicant.influencer_profiles.followers_count?.toLocaleString() || "N/A"}
                        </p>
                      </div>
                      <div className="flex flex-col p-3 rounded-xl bg-secondary/30 border border-border/40">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Location</p>
                        <p className="font-bold flex items-center gap-1.5 truncate text-xs">
                          {selectedApplicant.influencer_profiles.city}, {selectedApplicant.influencer_profiles.state}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col p-3 rounded-xl bg-secondary/30 border border-border/40">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Contact Phone</p>
                        <p className="font-bold flex items-center gap-1.5 text-xs">
                          <Phone className="h-3 w-3 text-primary" />
                          {selectedApplicant.influencer_profiles.phone_number || "N/A"}
                        </p>
                      </div>
                      <div className="flex flex-col p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">WhatsApp Invite</p>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 text-[10px] text-emerald-600 hover:bg-emerald-500/10 p-0 font-black flex items-center gap-1"
                          onClick={() => {
                            const phone = selectedApplicant.influencer_profiles.phone_number;
                            const campaignName = campaign?.name;
                            const url = `${window.location.origin}/i/${campaign?.slug}`;
                            const text = `Hi! ${campaign?.brand_profiles?.company_name || 'A brand'} has a new campaign "${campaignName}" for you on DotFluence. Check it out here: ${url}`;
                            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
                          }}
                        >
                          <MessageSquare className="h-3 w-3" /> INVITE VIA WA
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Niches & Expertise</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedApplicant.influencer_profiles.niches?.map((niche) => (
                          <Badge key={niche} variant="secondary" className="bg-muted hover:bg-muted text-[10px]">
                            {niche}
                          </Badge>
                        )) || "No niches listed"}
                      </div>
                    </div>
                    {selectedApplicant.posted_link && selectedApplicant.posted_link.length > 0 && (
                      <div className="p-4 rounded-xl border border-rose-500/10 bg-rose-500/5">
                        <p className="text-[10px] uppercase font-bold text-rose-500 mb-2 flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5" /> Published Deliverables
                        </p>
                        <div className="space-y-2">
                          {selectedApplicant.posted_link.map((link, i) => (
                            <a
                              key={i}
                              href={link.split(" | ")[1] || link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs font-bold text-primary hover:underline bg-background/50 p-2 rounded-lg border border-border/20"
                            >
                              <Instagram className="h-3.5 w-3.5" />
                              {link.split(" | ")[0] || "View Link"}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                 </div>
                 {/* Right Column: Status & Action */}
                 <div className="w-full md:w-[260px] space-y-4">
                    <div className="p-5 rounded-2xl bg-card border-2 border-primary/10 shadow-sm relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-2 opacity-5">
                          <DollarSign className="h-16 w-16" />
                       </div>
                       <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3 tracking-widest">Financial Summary</p>
                       <div className="space-y-4">
                          <div>
                            <p className="text-[10px] text-muted-foreground font-medium">Current Status</p>
                            <Badge className={cn("mt-1 uppercase text-[10px] font-black tracking-wider", getStatusColor(selectedApplicant.status))}>
                               {selectedApplicant.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className={cn(
                             "p-3 rounded-xl border-2",
                             (getColumnForStatus(selectedApplicant.status) === 'negotiation')
                               ? "bg-amber-500/5 border-amber-500/20 text-amber-600"
                               : (['shortlisted', 'accepted', 'completed', 'paid'].includes(selectedApplicant.status))
                                 ? "bg-green-500/5 border-green-500/20 text-green-600"
                                 : "bg-blue-500/5 border-blue-500/20 text-blue-600"
                          )}>
                             <p className="text-[9px] uppercase font-bold opacity-70 mb-1">
                                {(() => {
                                   const currentColumn = getColumnForStatus(selectedApplicant.status);
                                   const isNegotiated = selectedApplicant.final_payout !== null && selectedApplicant.final_payout !== undefined && selectedApplicant.final_payout !== campaign?.base_payout;
                                   
                                   if (currentColumn === 'negotiation') return "Negotiating Payout";
                                   if (isNegotiated) return "Negotiated Payout";
                                   if (currentColumn === 'applied') return "Requested Payout";
                                   if (['shortlisted', 'accepted', 'completed', 'paid'].includes(selectedApplicant.status)) return "Agreed Payout";
                                   return "Payout Amount";
                                })()}
                             </p>
                             <p className="text-xl font-black">
                                ₹{(selectedApplicant.final_payout || selectedApplicant.requested_payout || campaign?.base_payout || 0).toLocaleString()}
                             </p>
                          </div>
                          {selectedApplicant.contracts?.some(c => c.status === 'signed') && (
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500 text-white text-[10px] font-black uppercase shadow-lg shadow-emerald-500/20">
                               <FileText className="h-3.5 w-3.5" /> Contract Signed                            </div>
                          )}
                       </div>
                    </div>
                    {selectedApplicant.status === 'content_posted' && (
                       <div className="flex flex-col gap-2">
                          <Button 
                             className="bg-green-600 hover:bg-green-700 text-white font-bold h-10 shadow-lg shadow-green-500/10"
                            onClick={async () => {
                              if (campaign) {
                                const { error } = await supabase
                                  .from('campaign_influencers')
                                  .update({ status: 'completed', funding_status: 'unfunded' })
                                  .eq('id', selectedApplicant.id);
                                if (error) toast.error("Failed to approve content");
                                else {
                                  toast.success("Content Approved! Proceed to settlement.");
                                  fetchCampaignDetails();
                                  setShowDialog(false);
                                }
                              }
                            }}
                          >Approve Deliverables</Button>
                          <Button 
                             variant="outline" 
                             className="text-rose-500 border-rose-200 font-bold h-10"
                            onClick={() => handleRejectContent(selectedApplicant)}
                          >Reject Content</Button>
                       </div>
                    )}
                 </div>
               </div>

              {/* NEGOTIATION PANEL */}
              {selectedApplicant && ["applied", "shortlisted", "influencer_negotiated"].includes(selectedApplicant.status) && selectedApplicant.requested_payout && selectedApplicant.requested_payout !== campaign?.base_payout && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-yellow-500">Negotiate Payout</h4>
                      <p className="text-sm text-yellow-500/80">
                        {selectedApplicant.requested_payout ? 
                          `Influencer requested a custom payout of ₹${selectedApplicant.requested_payout}.` : 
                          `Campaign base payout is ₹${campaign?.base_payout}.`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    {!campaign?.managed_by_dotfluence && campaign?.transfer_request_status !== 'pending' ? (
                      <Button 
                         className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold" 
                         onClick={() => handleNegotiation(selectedApplicant, 'accept')}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept & Allow Content
                      </Button>
                    ) : (
                      <Button className="flex-1 bg-muted text-muted-foreground" disabled>
                        <Lock className="w-4 h-4 mr-2" />
                        Locked for Admin Handover
                      </Button>
                    )}
                  </div>
                  <div className="pt-4 border-t border-yellow-500/20">
                    <p className="text-xs text-yellow-500/80 mb-2 font-bold uppercase">Propose a counter-offer:</p>
                    <div className="flex gap-2">
                      <Input 
                         placeholder="e.g. 1500" 
                         type="number"
                        className="bg-background border-yellow-500/30"
                        value={counterOfferValue}
                        onChange={(e) => setCounterOfferValue(e.target.value)}
                        disabled={!!campaign?.managed_by_dotfluence || campaign?.transfer_request_status === 'pending'}
                      />
                      <Button 
                         variant="outline" 
                         className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20 font-bold"
                        onClick={() => handleNegotiation(selectedApplicant, 'counter')}
                        disabled={!!campaign?.managed_by_dotfluence || campaign?.transfer_request_status === 'pending'}
                      >Send Counter Offer</Button>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-blue-500/5 border border-blue-500/30 rounded-lg p-4 mt-6">
                <p className="text-xs text-muted-foreground italic flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" /> Note: You are managing this campaign directly as the Brand. For disputes or managed services, contact support.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ADMIN HANDOVER REQUEST DIALOG */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Admin Handover</DialogTitle>
            <DialogDescription>
              This action delegates control of the campaign and its pending influencers to DotFluence staff.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg text-sm">
              <span className="font-semibold text-orange-500 mb-2 block">Important Note:</span>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-xs">
                <li>You will no longer be able to move influencers or negotiate payouts.</li>
                <li>DotFluence's 17% Agency fee will apply strictly to all newly negotiated payouts.</li>
                <li>This is an irreversible handover once the Admin approves the request.</li>
              </ul>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <Button variant="ghost" onClick={() => setShowTransferModal(false)}>Cancel</Button>
              <Button onClick={handleRequestTransfer} className="bg-orange-500 hover:bg-orange-600 text-white">
                Submit Transfer Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contract View Dialog */}
      <Dialog open={!!viewingContract} onOpenChange={(open) => !open && setViewingContract(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-[#FDFBF7] p-10 border-[#E5E0D5] rounded-xl shadow-2xl">
          <DialogHeader className="border-b border-[#E5E0D5] pb-6 mb-8 text-center">
            <DialogTitle className="text-2xl font-serif font-bold uppercase tracking-[0.2em] text-[#1A1816]">Influencer Partnership Agreement</DialogTitle>
            <DialogDescription className="text-[10px] font-sans text-muted-foreground uppercase tracking-widest mt-2">
              Digital Evidence Record • {viewingContract?.signed_at ? `Signed ${new Date(viewingContract.signed_at).toLocaleString()}` : "Draft Document"}
            </DialogDescription>
          </DialogHeader>
          <div className="font-serif text-[#2C2925] leading-relaxed text-sm md:text-base whitespace-pre-wrap">
            {viewingContract?.text}
          </div>
          <div className="mt-12 pt-8 border-t border-[#E5E0D5] flex justify-between items-end">
             <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs font-sans font-bold uppercase tracking-wider">Certified Secure</span>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-sans text-muted-foreground uppercase mb-1">Status</p>
                <p className="font-sans font-bold text-sm uppercase tracking-wide">
                  {viewingContract?.signed_at ? "Fully Executed" : "Pending Signature"}
                </p>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const CampaignSummary = ({ applicants, campaign }: { applicants: any[], campaign: Campaign }) => {
  const stats = useMemo(() => {
    const influencers = applicants.length;
    const payout = applicants.reduce((acc, curr) => acc + (curr.final_payout || 0), 0);
    const fees = applicants.reduce((acc, curr) => {
      if (curr.platform_fee_amount !== null && curr.platform_fee_amount !== undefined) {
        return acc + curr.platform_fee_amount;
      }
      const feePercent = (campaign.platform_fee_percent !== null && campaign.platform_fee_percent !== undefined)
        ? (campaign.platform_fee_percent / 100)
        : (campaign.execution_model === 'brand_managed' ? 0.17 : 0.07);
      return acc + (curr.final_payout || 0) * feePercent;
    }, 0);
    return { influencers, payout, fees, total: payout + fees };  }, [applicants, campaign]);
  return (
    <Card className="bg-primary/5 border-primary/20 mb-8 border-2 border-dashed">
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Total Influencers</p>
            <p className="text-2xl font-black">{stats.influencers}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Total Payout</p>
            <p className="text-2xl font-black">₹{stats.payout.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Platform Fees</p>
            <p className="text-2xl font-black">₹{stats.fees.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-primary mb-1">Final Payable (est.)</p>
            <p className="text-2xl font-black text-primary">₹{stats.total.toLocaleString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <Card className="flex-1 bg-card/40 backdrop-blur-md border-border/40 hover:border-primary/20 transition-all shadow-sm">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <p className={cn("text-2xl font-black", color)}>{value}</p>
    </CardContent>
  </Card>
);

const formatCompact = (val: number) => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toString();
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-emerald-500/10 text-emerald-500';
    case 'completed': return 'bg-blue-500/10 text-blue-500';
    default: return 'bg-muted text-muted-foreground';
  }
};

export default BrandCampaignDetails;
