/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { sendNotification } from "@/lib/notifications";
import AdminNavbar from "@/components/adminNavbar";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Download, 
  MessageSquare, 
  ChevronRight, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Shield, 
  Briefcase,
  Users,
  Instagram,
  Mail,
  Phone,
  LayoutGrid
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePayment } from "@/hooks/usePayment";
import { ManualDistributionDialog } from "@/components/admin/ManualDistributionDialog";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  managed_by_dotfluence: boolean;
  execution_model: 'agency' | 'brand_self' | 'brand_managed' | 'internal';
  brand_user_id: string;
  base_payout: number;
  platform_fee_percent?: number | null;
}

interface Row {
  id: string;
  status: string;
  final_payout: number | null;
  platform_fee_amount: number | null;
  tds_amount: number | null;
  net_payout: number | null;
  funding_status: 'unfunded' | 'funded' | 'settled';
  posted_link: string[] | null;
  negotiation_requested: boolean;
  influencer_profiles: {
    user_id: string;
    full_name: string;
    phone_number: string;
    instagram_handle: string;
    followers_count?: number;
    city?: string;
    state?: string;
    niches?: string[];
  };
  contracts?: {
    contract_text: string;
    status: string;
    signed_at: string | null;
  }[];
}

const COLUMNS = [
  { id: "applied", label: "Applied", color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: "shortlisted", label: "Shortlisted", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { id: "negotiation", label: "Negotiation", color: "text-orange-400", bg: "bg-orange-500/10" },
  { id: "approved", label: "Approved", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { id: "content_posted", label: "Content Submitted", color: "text-rose-400", bg: "bg-rose-500/10" },
  { id: "completed", label: "Completed", color: "text-teal-400", bg: "bg-teal-500/10" },
  { id: "paid", label: "Paid", color: "text-indigo-400", bg: "bg-indigo-500/10" }
];

const getColumnForStatus = (status: string) => {
  if (["influencer_negotiated", "admin_negotiated"].includes(status)) return "negotiation";
  if (status === "shortlisted") return "shortlisted";
  if (status === "accepted" || status === "funded" || status === "content_rejected") return "approved";
  if (status === "paid") return "paid";
  return status;
};

const AdminCampaignDetails = () => {
  const { id: campaignId } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingContract, setViewingContract] = useState<{ text: string; signed_at: string | null } | null>(null);
  const [selectedApplicant, setSelectedApplicant] = useState<Row | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isManualPayoutOpen, setIsManualPayoutOpen] = useState(false);

  const { 
    isProcessingPayment, 
    handleMerchantFunding, 
    handleApproveContent,
    handlePayoutDistribution,
    handleBatchMerchantFunding,
    handleBatchPayoutDistribution,
    handleManualPayout
  } = usePayment(() => {
    fetchData();
  });

  const fetchData = async () => {
    if (!campaignId) return;

    const { data: campaignData } = await supabase
      .from("campaigns")
      .select("id, name, description, managed_by_dotfluence, execution_model, brand_user_id, platform_fee_percent")
      .eq("id", campaignId)
      .single();

    if (campaignData) {
      setCampaign(campaignData as any);
    }

    const { data: applicantsData } = await supabase
      .from("campaign_influencers")
      .select(`
        id,
        status,
        final_payout,
        platform_fee_amount,
        tds_amount,
        net_payout,
        funding_status,
        posted_link,
        influencer_profiles (
          user_id,
          full_name,
          phone_number,
          instagram_handle,
          followers_count,
          niches,
          city,
          state,
          upi_id,
          bank_name,
          account_number,
          ifsc_code,
          bank_account_number,
          bank_ifsc_code,
          bank_account_name
        )
      `)
      .eq("campaign_id", campaignId)
      .not("status", "eq", "not_shortlisted");

    const { data: contractsData } = await supabase
      .from("contracts")
      .select("influencer_id, contract_text, status, signed_at")
      .eq("campaign_id", campaignId);

    const mergedRows = (applicantsData || []).map(row => ({
      ...row,
      contracts: (contractsData || []).filter(c => c.influencer_id === row.influencer_profiles.user_id)
    }));

    setRows(mergedRows as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // --- REAL-TIME SUBSCRIPTION ---
    const channel = supabase
      .channel(`campaign-execution-${campaignId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaign_influencers',
          filter: `campaign_id=eq.${campaignId}`
        },
        () => {
          console.log("Real-time update received!");
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const metrics = useMemo(() => ({
    total: rows.length,
    active: rows.filter(r => r.status === 'accepted' || r.status === 'content_posted').length,
    completed: rows.filter(r => r.status === 'completed').length,
    funds: rows.reduce((acc, curr) => acc + (curr.final_payout || 0), 0)
  }), [rows]);

  const onDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId;
    updateStatus(draggableId, newStatus);
  };

  const updateStatus = async (rowId: string, newStatus: string) => {
    const item = rows.find(r => r.id === rowId);
    if (!item) return;

    // Optimistic Update
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, status: newStatus } : r));

    try {
      const updatePayload: any = { 
        status: newStatus 
      };
      
      if (newStatus === 'negotiation') {
        updatePayload.status = 'admin_negotiated';
        updatePayload.final_payout = null;
      }
      
      if (newStatus === 'approved') {
        updatePayload.status = 'accepted';
      }

      if (newStatus === 'completed') {
        // Task 2: Approval system (NO PAYMENT)
        // Set status to completed and funding_status to unfunded (Pending)
        await supabase
          .from("campaign_influencers")
          .update({ 
            status: 'completed',
            funding_status: 'unfunded'
          })
          .eq("id", rowId);
        
        toast.success("Content Approved! Payout is now pending.");
      } else if (newStatus === 'content_rejected') {
        await supabase
          .from("campaign_influencers")
          .update(updatePayload as any)
          .eq("id", rowId);

        sendNotification({
          user_id: item.influencer_profiles.user_id,
          role: "influencer",
          type: "content_rejected",
          title: "Content needs changes",
          message: "Your content was rejected. Please resubmit.",
          metadata: { campaign_id: campaignId },
        }).catch(console.error);
      } else {
        await supabase
          .from("campaign_influencers")
          .update(updatePayload as any)
          .eq("id", rowId);
      }
    } catch (error) {
      toast.error("Failed to update status");
      fetchData(); // Rollback
    }
  };

  // usePayment hook handled above

  const exportCSV = () => {
    if (!campaign) return;
    const headers = ["Influencer Name", "Instagram Profile", "Status", "Payout"];
    const rowsData = rows.map((row) => [
      row.influencer_profiles.full_name,
      `https://instagram.com/${row.influencer_profiles.instagram_handle}`,
      row.status,
      row.final_payout || 0
    ]);
    const csvContent = [headers, ...rowsData]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${campaign.name.replace(/\s+/g, "_")}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
             <button onClick={() => navigate("/admin/campaigns")} className="flex items-center hover:text-primary transition-colors">
                <Briefcase className="h-4 w-4 mr-1" /> Campaigns
             </button>
             <ChevronRight className="h-3 w-3" />
             <span className="font-medium text-foreground">{campaign.name}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
            <div className="max-w-4xl">
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                    <Shield className="h-6 w-6 text-primary" />
                 </div>
                 <h1 className="text-4xl font-extrabold tracking-tight">{campaign.name}</h1>
              </div>
              <p className="text-lg text-muted-foreground/80 leading-relaxed max-w-3xl">
                {campaign.description || "Review and manage execution for this campaign across all creators."}
              </p>
            </div>
            
            <div className="flex gap-3">
               <Button onClick={exportCSV} variant="outline" className="rounded-full px-6 bg-card/50">
                  <Download className="mr-2 h-4 w-4" /> Export
               </Button>
               <Button className="rounded-full px-6 shadow-lg shadow-primary/20">
                  Broadcast Update
               </Button>
            </div>
          </div>

          <CampaignSummary rows={rows} campaign={campaign} />

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
             <StatCard label="Total Creators" value={metrics.total} icon={Users} color="text-blue-400" />
             <StatCard label="Contracted" value={metrics.active} icon={CheckCircle2} color="text-emerald-400" />
             <StatCard label="Live/Completed" value={metrics.completed} icon={TrendingUp} color="text-teal-400" />
             <StatCard label="Managed Payouts" value={`₹${metrics.funds.toLocaleString()}`} icon={DollarSign} color="text-amber-400" />
          </div>

          {/* Kanban Section */}
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <LayoutGrid className="h-6 w-6 text-primary" />
                  Execution Kanban
                </h2>
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border border-border/20">
                   <Clock className="h-3.5 w-3.5" /> Drag and drop to update lifecycle
                </div>
             </div>

             <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex overflow-x-auto pb-6 gap-6 -mx-4 px-4 scrollbar-hide">
                  {COLUMNS.map((column) => (
                    <div key={column.id} className="min-w-[320px] max-w-[320px] shrink-0">
                      <div className="mb-4 flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                           <div className={cn("w-2 h-2 rounded-full", column.bg.replace("bg-", "bg-").replace("/10", ""))} />
                           <h3 className="font-bold text-sm uppercase tracking-widest opacity-80">{column.label}</h3>
                           <Badge variant="secondary" className="bg-muted/50 rounded-md">
                              {rows.filter(r => getColumnForStatus(r.status) === column.id).length}
                           </Badge>
                        </div>
                        {column.id === 'completed' && rows.filter(r => r.status === 'completed' && r.funding_status === 'unfunded').length > 0 && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleBatchMerchantFunding(campaignId!, rows.filter(r => r.status === 'completed' && r.funding_status === 'unfunded'))}
                            className="h-6 text-[9px] font-bold px-2 border-amber-500/50 text-amber-600 hover:bg-amber-50"
                          >
                            Batch Fund
                          </Button>
                        )}
                        {column.id === 'completed' && rows.filter(r => r.status === 'completed' && r.funding_status === 'funded').length > 0 && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setIsManualPayoutOpen(true)}
                            className="h-6 text-[9px] font-bold px-2 border-purple-500/50 text-purple-600 hover:bg-purple-50"
                          >
                            Manual Batch Payout
                          </Button>
                        )}
                      </div>

                      <Droppable droppableId={column.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              "flex flex-col gap-4 min-h-[600px] p-2 rounded-2xl transition-all duration-200 border border-transparent",
                              snapshot.isDraggingOver ? "bg-primary/5 border-primary/20 scale-[1.01]" : "bg-card/20"
                            )}
                          >
                             <AnimatePresence>
                               {rows
                                 .filter(r => getColumnForStatus(r.status) === column.id)
                                 .map((row, index) => (
                                   <InfluencerCard
                                key={row.id}
                                row={row}
                                index={index}
                                columnId={column.id}
                                executionModel={campaign?.execution_model} basePayout={campaign?.base_payout}
                                onApproveContent={() => handleApproveContent(row as any, campaign as any)}
                                onReject={() => updateStatus(row.id, 'content_rejected')}
                                onFund={() => handleMerchantFunding(row as any, campaign as any)}
                                onDistribute={() => setIsManualPayoutOpen(true)}
                                onOpenDetails={() => {
                                  setSelectedApplicant(row);
                                  setShowDialog(true);
                                }}
                                isProcessing={isProcessingPayment === row.id}
                            />
                                 ))}
                             </AnimatePresence>
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}
                </div>
             </DragDropContext>
          </div>
        </motion.div>
      </main>

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
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-sans font-bold uppercase tracking-wider">Certified Secure</span>
             </div>
             <div className="text-right">
                <p className="text-[10px] font-sans text-muted-foreground uppercase mb-1">Status</p>
                <p className="font-sans font-bold text-sm uppercase tracking-wide">
                  {viewingContract?.signed_at ? "Fully Executed" : "Pending Signature"}
                </p>
              </div>

              {campaign?.execution_model === 'agency' && rows.filter(r => r.status === 'completed' && r.funding_status === 'unfunded').length > 0 && (
                <div className="mt-8 p-6 bg-primary/5 rounded-2xl border-2 border-primary/20 border-dashed">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                      <h3 className="text-xl font-black text-primary flex items-center gap-2">
                        <Shield className="h-5 w-5" /> Consolidated Agency Settlement
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                        The brand has paid the agency. Now settle influencer payouts + platform fees in a single batch payment.
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Consolidated Amount</p>
                        <p className="text-3xl font-black text-primary">
                          ₹{(
                            rows.filter(r => r.status === 'completed' && r.funding_status === 'unfunded')
                            .reduce((acc, curr) => acc + (curr.final_payout || 0) + (curr.platform_fee_amount || 0), 0)
                          ).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {rows.filter(r => r.status === 'completed' && r.funding_status === 'unfunded').length} Influencers + Platform Fees
                        </p>
                      </div>
                      <Button 
                        size="lg" 
                        onClick={() => handleBatchMerchantFunding(campaignId!, rows.filter(r => r.status === 'completed' && r.funding_status === 'unfunded'))}
                        className="bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                        disabled={!!isProcessingPayment}
                      >
                        {isProcessingPayment?.toString().startsWith('batch') ? "Processing Batch..." : "Settle All Deliverables"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
           </div>
        </DialogContent>
      </Dialog>

      <ManualDistributionDialog 
        isOpen={isManualPayoutOpen}
        onClose={() => setIsManualPayoutOpen(false)}
        influencers={rows}
        campaign={campaign}
        onMarkPaid={(inf) => handleManualPayout(inf, campaign)}
        isProcessing={isProcessingPayment}
      />

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
                          <Clock className="h-4 w-4 text-primary" />
                          {selectedApplicant.influencer_profiles.city || "N/A"}, {selectedApplicant.influencer_profiles.state || "N/A"}
                        </p>
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
                          <TrendingUp className="h-3.5 w-3.5" /> Published Deliverables
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
                            <Badge className={cn("mt-1 uppercase text-[10px] font-black tracking-wider", 
                              selectedApplicant.status === 'paid' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-muted text-muted-foreground')}>
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
                                ₹{(selectedApplicant.final_payout || basePayout || 0).toLocaleString()}
                             </p>
                          </div>
                       </div>
                    </div>
                 </div>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Sub-components
const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <Card className="bg-card/40 backdrop-blur-md border-border/40 hover:border-primary/20 transition-all shadow-sm">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <p className={cn("text-3xl font-black", color)}>{value}</p>
    </CardContent>
  </Card>
);

// Task 5: Campaign level summary
const CampaignSummary = ({ rows, campaign }: { rows: any[], campaign: Campaign }) => {
  const stats = useMemo(() => {
    const influencers = rows.length;
    const payout = rows.reduce((acc, curr) => acc + (curr.final_payout || 0), 0);
    
    // Use actual fees if available, otherwise estimate based on platform_fee_percent
    const fees = rows.reduce((acc, curr) => {
      if (curr.platform_fee_amount !== null && curr.platform_fee_amount !== undefined) {
        return acc + curr.platform_fee_amount;
      }
      // Estimate fallback
      const feePercent = (campaign.platform_fee_percent !== null && campaign.platform_fee_percent !== undefined)
        ? (campaign.platform_fee_percent / 100)
        : (campaign.execution_model === 'brand_managed' ? 0.17 : 0.07);
      
      return acc + (curr.final_payout || 0) * feePercent;
    }, 0);
    
    return { influencers, payout, fees, total: payout + fees };
  }, [rows, campaign]);

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

const InfluencerCard = ({ 
  row, 
  index, 
  onApproveContent, 
  onReject, 
  onFund, 
  onDistribute, 
  onOpenDetails,
  columnId, 
  executionModel,
  basePayout,
  isProcessing 
}: any) => {
  // Task 3: Payment status field mapping
  const getFundingStatusLabel = (status: string, campaignStatus: string) => {
    if (campaignStatus === 'paid') return { label: 'Settled', color: 'text-indigo-500 bg-indigo-500/10' };
    
    switch (status) {
      case 'unfunded': return { label: 'Awaiting Funding', color: 'text-amber-500 bg-amber-500/10' };
      case 'funded': return { label: 'Ready for Payout', color: 'text-blue-500 bg-blue-500/10' };
      case 'settled': return { label: 'Paid', color: 'text-emerald-500 bg-emerald-500/10' };
      default: return { label: 'Pending', color: 'text-muted-foreground bg-muted/10' };
    }
  };
  const fundStatus = getFundingStatusLabel(row.funding_status, row.status);

  return (
    <Draggable draggableId={row.id} index={index}>
    {(provided, snapshot) => (
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
        className={cn(
          "group transition-all duration-200",
          snapshot.isDragging ? "z-50" : ""
        )}
      >
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 0.95 }}
           className={cn(
             "bg-card/80 backdrop-blur-sm border border-border/40 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all group-active:scale-[0.98]",
             snapshot.isDragging ? "shadow-2xl ring-2 ring-primary/20 border-primary" : ""
           )}
        >
          <div className="flex items-start justify-between mb-3">
             <div className="flex-1">
                <h4 className="font-bold text-base group-hover:text-primary transition-colors truncate max-w-[180px]">{row.influencer_profiles.full_name}</h4>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                   <Instagram className="h-3 w-3" /> @{row.influencer_profiles.instagram_handle}
                </div>
             </div>
             <div className="flex flex-col items-end gap-1">
                <Badge className={cn("px-1.5 h-4 text-[8px] uppercase font-bold border-none", fundStatus.color)}>
                  {fundStatus.label}
                </Badge>
                {row.negotiation_requested && (
                  <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-1.5 h-4 text-[8px] uppercase font-bold flex items-center gap-0.5">
                    <MessageSquare className="h-2 w-2" />
                    Wants Negotiation
                  </Badge>
                )}
                {row.posted_link && (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-2 h-5 text-[9px] uppercase font-bold">
                    Proof Ready
                  </Badge>
                )}
             </div>
          </div>

          <div className="space-y-3">
             <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Payout</span>
                <span className={cn("font-bold italic")}>
                  {(() => {
                    const isNegotiated = row.final_payout !== null && row.final_payout !== undefined && row.final_payout !== basePayout;
                    if (columnId === 'negotiation') return "Negotiating: ";
                    if (isNegotiated) return "Negotiated: ";
                    if (columnId === 'applied') return "Requested: ";
                    if (['shortlisted', 'accepted', 'completed', 'paid'].includes(row.status)) return "Agreed: ";
                    return "Payout: ";
                  })()}
                  ₹{(row.final_payout || basePayout || 0).toLocaleString()}
                </span>
             </div>

             {row.posted_link && (
               <div className="flex flex-wrap gap-1.5 border-t border-border/20 pt-3">
                  {row.posted_link.map((l: string, i: number) => {
                    const [label, url] = l.split(" | ");
                    return (
                      <a 
                        key={i} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1 px-2 rounded bg-muted/50 hover:bg-muted text-[10px] font-bold flex items-center gap-1 transition-colors"
                      >
                         <ExternalLink className="h-2.5 w-2.5" /> {label}
                      </a>
                    );
                  })}
               </div>
             )}
          </div>
          
          <div className="mt-4 flex flex-col gap-2">
             {columnId === 'content_posted' && (
               <div className="flex gap-2">
                   <Button 
                    size="sm" 
                    onClick={onApproveContent} 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/10 h-8 text-[11px] font-bold rounded-lg"
                    disabled={row.status === 'completed'}
                  >
                     Approve Deliverables
                  </Button>
                  <Button size="sm" variant="outline" onClick={onReject} className="flex-1 text-rose-500 hover:bg-rose-500/10 h-8 text-[11px] font-bold rounded-lg border border-rose-500/10">
                     Reject
                  </Button>
               </div>
             )}

             {columnId === 'completed' && (
               <div className="flex flex-col gap-2">
                 {row.funding_status === 'unfunded' ? (
                   <Button 
                    size="sm" 
                    onClick={onFund} 
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white shadow-lg h-8 text-[11px] font-bold rounded-lg"
                    disabled={isProcessing}
                  >
                     Fund Campaign Total
                  </Button>
                 ) : row.funding_status === 'funded' ? (
                   <Button 
                    size="sm" 
                    onClick={onDistribute} 
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white shadow-lg h-8 text-[11px] font-bold rounded-lg"
                    disabled={isProcessing}
                  >
                     Distribute Payout
                  </Button>
                 ) : null}
               </div>
             )}

             {row.status === 'paid' && (
               <div className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 w-full">
                  <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Payment Successful</span>
               </div>
             )}
              <div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-border/10">
                 <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 h-8 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors"
                    onClick={onOpenDetails}
                 >
                    <LayoutGrid className="h-3 w-3 mr-1.5" /> Details
                 </Button>
                 <div className="flex gap-1.5">
                    <a href={`mailto:${row.email || ""}`} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><Mail className="h-3.5 w-3.5" /></a>
                    <a href={`tel:${row.influencer_profiles.phone_number}`} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><Phone className="h-3.5 w-3.5" /></a>
                 </div>
              </div>
          </div>
        </motion.div>
      </div>
    )}
  </Draggable>
    );
};

export default AdminCampaignDetails;
