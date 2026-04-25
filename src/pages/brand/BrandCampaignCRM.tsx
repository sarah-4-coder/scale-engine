/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowLeft,
  Users,
  LayoutGrid,
  List,
  CheckSquare,
  Square,
  Eye,
  Instagram,
  FileText,
  MessageSquare,
  CheckCircle,
  DollarSign,
  Phone,
  Shield,
  Lock,
} from "lucide-react";
import { KanbanFilterBar } from "@/components/kanban/KanbanFilterBar";
import { BulkActionBar } from "@/components/kanban/BulkActionBar";
import { KanbanListView } from "@/components/kanban/KanbanListView";
import { useKanbanFilters } from "@/hooks/useKanbanFilters";
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
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { usePayment } from "@/hooks/usePayment";

// ─── Types ───────────────────────────────────────────────────────────────────

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
  execution_model?: string;
  transfer_request_status?: string | null;
  created_at: string;
  slug: string;
  type?: "paid" | "barter";
  platform_fee_percent?: number | null;
  brand_profiles?: { company_name: string; is_verified: boolean };
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
    gender?: string;
    profile_image_url?: string;
  };
  contracts?: {
    contract_text: string;
    status: string;
    signed_at: string | null;
    influencer_id: string;
  }[];
}

interface ViewingContract { text: string; signed_at: string | null; }

// ─── Main Component ───────────────────────────────────────────────────────────

const BrandCampaignCRM = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeBrandId, isLoading: workspaceLoading } = useWorkspace();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [viewingContract, setViewingContract] = useState<ViewingContract | null>(null);
  const [counterOfferValue, setCounterOfferValue] = useState("");

  const viewModeKey = `kanban_view_${id}`;
  const [viewMode, setViewMode] = useState<"kanban" | "list">(() =>
    (localStorage.getItem(viewModeKey) as "kanban" | "list") || "kanban"
  );
  const toggleViewMode = (mode: "kanban" | "list") => {
    setViewMode(mode);
    localStorage.setItem(viewModeKey, mode);
  };

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const toggleSelect = useCallback((cardId: string) => {
    setSelectedIds(prev => prev.includes(cardId) ? prev.filter(x => x !== cardId) : [...prev, cardId]);
  }, []);
  const selectAllInColumn = useCallback((cols: Applicant[]) => {
    setSelectedIds(prev => {
      const newIds = cols.map(a => a.id).filter(id => !prev.includes(id));
      return [...prev, ...newIds];
    });
  }, []);
  const deselectAllInColumn = useCallback((cols: Applicant[]) => {
    const colIds = new Set(cols.map(a => a.id));
    setSelectedIds(prev => prev.filter(id => !colIds.has(id)));
  }, []);

  const [columnPageSize, setColumnPageSize] = useState<Record<string, number>>({});
  const getColumnPageSize = (colId: string) => columnPageSize[colId] ?? 50;
  const loadMoreInColumn = (colId: string) =>
    setColumnPageSize(prev => ({ ...prev, [colId]: (prev[colId] ?? 50) + 50 }));

  // ── Auto-scroll refs (Fix 2) ────────────────────────────────────────────────
  const boardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const mouseXRef = useRef<number>(-1);
  const SCROLL_ZONE = 120; // px from each edge

  const stopAutoScroll = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(() => {
    const board = boardRef.current;
    if (!board) return;
    const step = () => {
      const rect = board.getBoundingClientRect();
      const x = mouseXRef.current;
      if (x !== -1) {
        const distFromLeft = x - rect.left;
        const distFromRight = rect.right - x;
        if (distFromLeft < SCROLL_ZONE) {
          const speed = ((SCROLL_ZONE - distFromLeft) / SCROLL_ZONE) * 18;
          board.scrollLeft -= speed;
        } else if (distFromRight < SCROLL_ZONE) {
          const speed = ((SCROLL_ZONE - distFromRight) / SCROLL_ZONE) * 18;
          board.scrollLeft += speed;
        }
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
  }, []);

  const onMouseMove = useCallback((e: MouseEvent | PointerEvent) => {
    mouseXRef.current = e.clientX;
  }, []);

  const onDragStart = useCallback(() => {
    mouseXRef.current = -1;
    window.addEventListener("mousemove", onMouseMove as any, { capture: true });
    window.addEventListener("pointermove", onMouseMove as any, { capture: true });
    startAutoScroll();
  }, [onMouseMove, startAutoScroll]);

  const { isProcessingPayment, handleApproveContent, handleMerchantFunding, handleBatchMerchantFunding } = usePayment(() => fetchData());

  const COLUMNS = useMemo(() => {
    if (campaign?.type === "barter") {
      return [
        { id: "applied", label: "Applied", color: "blue" },
        { id: "shortlisted", label: "Shortlisted", color: "yellow" },
        { id: "product_sent", label: "Product Sent", color: "orange" },
        { id: "product_received", label: "Product Received", color: "emerald" },
        { id: "content_posted", label: "Content Submitted", color: "rose" },
        { id: "completed", label: "Completed", color: "teal" },
      ];
    }
    return [
      { id: "applied", label: "Applied", color: "blue" },
      { id: "shortlisted", label: "Shortlisted", color: "yellow" },
      { id: "negotiation", label: "Negotiation", color: "orange" },
      { id: "approved", label: "Approved", color: "emerald" },
      { id: "content_posted", label: "Content Submitted", color: "rose" },
      { id: "completed", label: "Completed", color: "teal" },
      { id: "paid", label: "Paid", color: "indigo" },
    ];
  }, [campaign?.type]);

  const getColumnForStatus = useCallback((status: string) => {
    if (campaign?.type === "barter") {
      if (status === "accepted") return "product_sent";
      return status;
    }
    if (["influencer_negotiated", "admin_negotiated"].includes(status)) return "negotiation";
    if (status === "accepted" || status === "funded" || status === "content_rejected") return "approved";
    return status;
  }, [campaign?.type]);

  const getColumnLabelForStatus = useCallback((status: string) => {
    const col = COLUMNS.find(c => c.id === getColumnForStatus(status));
    return col?.label || status.replace(/_/g, " ");
  }, [COLUMNS, getColumnForStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted": return "bg-green-500/10 text-green-500 border-green-500/30";
      case "applied": return "bg-blue-500/10 text-blue-500 border-blue-500/30";
      case "shortlisted": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
      case "completed": return "bg-purple-500/10 text-purple-500 border-purple-500/30";
      case "content_posted": return "bg-orange-500/10 text-orange-500 border-orange-500/30";
      case "paid": return "bg-indigo-500/10 text-indigo-500 border-indigo-500/30";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/30";
    }
  };

  const allStageIds = useMemo(() => COLUMNS.map(c => c.id), [COLUMNS]);
  const {
    filters,
    filteredApplicants,
    setSearch,
    setFollowerTier,
    setNiches,
    setGender,
    setLocation,
    setVisibleStages,
    clearAllFilters,
    availableNiches,
    locationSuggestions,
    isFiltered,
  } = useKanbanFilters(applicants, allStageIds);

  const handleBulkMove = useCallback(async (targetStatus: string) => {
    if (!selectedIds.length) return;
    const dbStatus =
      targetStatus === "negotiation" ? "admin_negotiated" :
      targetStatus === "approved" ? "accepted" :
      targetStatus;
    const isApproving = targetStatus === "approved";
    const { error } = await supabase
      .from("campaign_influencers")
      .update({ status: dbStatus, ...(isApproving ? { approved_at: new Date().toISOString() } : {}) })
      .in("id", selectedIds);
    if (error) throw error;
    setApplicants(prev => prev.map(a => selectedIds.includes(a.id) ? { ...a, status: dbStatus } : a));
    setSelectedIds([]);
    toast.success(`Moved ${selectedIds.length} influencer${selectedIds.length !== 1 ? "s" : ""} to ${COLUMNS.find(c => c.id === targetStatus)?.label || targetStatus}`);
  }, [selectedIds, COLUMNS]);

  const handleBulkRemove = useCallback(async () => {
    if (!selectedIds.length) return;
    const { error } = await supabase.from("campaign_influencers").delete().in("id", selectedIds);
    if (error) throw error;
    setApplicants(prev => prev.filter(a => !selectedIds.includes(a.id)));
    setSelectedIds([]);
    toast.success(`Removed ${selectedIds.length} influencer${selectedIds.length !== 1 ? "s" : ""} from campaign`);
  }, [selectedIds]);

  const handleWhatsAppAll = useCallback((ids: string[]) => {
    const targets = applicants.filter(a => ids.includes(a.id));
    targets.forEach((a, i) => {
      setTimeout(() => {
        const phone = a.influencer_profiles.phone_number;
        if (!phone) return;
        const text = `Hi! Check out the campaign "${campaign?.name}" on DotFluence: ${window.location.origin}/i/${campaign?.slug}`;
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank");
      }, i * 1000);
    });
    toast.success(`Opening WhatsApp for ${targets.length} influencer${targets.length !== 1 ? "s" : ""}...`);
  }, [applicants, campaign]);

  // onDragEnd — stop auto-scroll then persist the move (DO NOT change DnD logic)
  const onDragEnd = async (result: any) => {
    // Fix 2: stop auto-scroll immediately
    stopAutoScroll();
    window.removeEventListener("mousemove", onMouseMove as any, { capture: true });
    window.removeEventListener("pointermove", onMouseMove as any, { capture: true });

    if (campaign?.managed_by_dotfluence || campaign?.transfer_request_status === "pending") {
      toast.error("Kanban is locked during Admin Handover.");
      return;
    }
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const newStatus = destination.droppableId;
    setApplicants(prev => prev.map(app => app.id === draggableId ? { ...app, status: newStatus } : app));
    const isApproving = newStatus === "approved";
    const { error } = await supabase
      .from("campaign_influencers")
      .update({
        status: newStatus === "negotiation" ? "admin_negotiated" : (isApproving ? "accepted" : newStatus),
        funding_status: newStatus === "completed" ? "unfunded" : undefined,
        final_payout: newStatus === "negotiation" ? null : undefined,
        ...(isApproving ? { approved_at: new Date().toISOString() } : {}),
      })
      .eq("id", draggableId);
    if (error) {
      toast.error("Failed to update status");
      fetchData();
    } else {
      toast.success(`Moved to ${COLUMNS.find(c => c.id === newStatus)?.label || newStatus}`);
    }
  };

  const handleNegotiation = async (applicant: Applicant, action: "accept" | "counter") => {
    if (campaign?.managed_by_dotfluence || campaign?.transfer_request_status === "pending") {
      toast.error("Action restricted during handover.");
      return;
    }
    try {
      let updatePayload: any = {};
      if (action === "accept") {
        updatePayload = {
          status: "accepted",
          final_payout: applicant.requested_payout || campaign?.base_payout,
          approved_at: new Date().toISOString(),
        };
      } else {
        if (!counterOfferValue) { toast.error("Please enter a counter offer amount"); return; }
        updatePayload = { status: "admin_negotiated", requested_payout: parseInt(counterOfferValue), final_payout: null };
      }
      const { error } = await supabase.from("campaign_influencers").update(updatePayload).eq("id", applicant.id);
      if (error) throw error;
      toast.success(action === "accept" ? "Offer Accepted!" : "Counter Offer Sent");
      setApplicants(prev => prev.map(a => a.id === applicant.id ? { ...a, ...updatePayload } : a));
      setShowDialog(false);
      setCounterOfferValue("");
    } catch (e: any) {
      toast.error(e.message || "Failed to submit negotiation");
    }
  };

  useEffect(() => {
    if (id && user && !workspaceLoading && activeBrandId) fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, workspaceLoading, activeBrandId]);

  const fetchData = async () => {
    if (!activeBrandId) return;
    try {
      const { data: campaignData, error: campaignError } = await supabase
        .from("campaigns")
        .select("*, brand_profiles!brand_id(company_name, is_verified)")
        .eq("id", id)
        .eq("brand_id", activeBrandId)
        .maybeSingle();
      if (campaignError) throw campaignError;
      if (!campaignData) { navigate("/company/campaigns"); return; }
      setCampaign(campaignData as any);
      setIsVerified(campaignData.brand_profiles?.is_verified || false);

      const { data: applicantsData, error: applicantsError } = await supabase
        .from("campaign_influencers")
        .select(`*, influencer_profiles(user_id, full_name, instagram_handle, phone_number, followers_count, niches, city, state, gender, profile_image_url)`)
        .eq("campaign_id", id)
        .order("created_at", { ascending: false });
      if (applicantsError) throw applicantsError;

      const { data: contractsData } = await supabase
        .from("contracts")
        .select("influencer_id, contract_text, status, signed_at")
        .eq("campaign_id", id);

      const merged = (applicantsData || []).map(row => ({
        ...row,
        contracts: (contractsData || []).filter((c: any) => c.influencer_id === row.influencer_profiles.user_id),
      }));
      setApplicants(merged as any);
    } catch (err: any) {
      toast.error("Failed to load CRM data");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectContent = async (applicant: Applicant) => {
    const { error } = await supabase
      .from("campaign_influencers")
      .update({ status: "content_rejected" })
      .eq("id", applicant.id);
    if (error) toast.error("Failed to reject content");
    else { toast.success("Content rejected. Influencer notified to resubmit."); fetchData(); }
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
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Button onClick={() => navigate("/company/campaigns")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
          </Button>
        </div>
      </div>
    );
  }

  const isLocked = !!(campaign.managed_by_dotfluence || campaign.transfer_request_status === "pending");

  return (
    <div className="min-h-screen bg-background">
      <BrandNavbar />

      <main className="w-full px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/company/campaigns/${id}`)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Campaign Overview
            </Button>
            <div>
              <h1 className="text-lg font-black">{campaign.name} — CRM Board</h1>
              <p className="text-xs text-muted-foreground">
                {viewMode === "kanban"
                  ? "Drag and drop influencers to update their status"
                  : "List view — click a row to see details"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center bg-muted/50 border border-border/30 rounded-xl p-0.5">
              <button
                onClick={() => toggleViewMode("kanban")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold",
                  viewMode === "kanban" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Kanban
              </button>
              <button
                onClick={() => toggleViewMode("list")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold",
                  viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <List className="h-3.5 w-3.5" /> List
              </button>
            </div>

            {isLocked && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 text-[10px] px-2 py-1 font-bold uppercase">
                Locked — Admin Managed
              </Badge>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="max-w-screen-2xl mx-auto mb-4">
          <KanbanFilterBar
            filters={filters}
            totalCount={applicants.length}
            filteredCount={filteredApplicants.length}
            availableNiches={availableNiches}
            locationSuggestions={locationSuggestions}
            columns={COLUMNS}
            onSearchChange={setSearch}
            onFollowerTierChange={setFollowerTier}
            onNichesChange={setNiches}
            onGenderChange={setGender}
            onLocationChange={setLocation}
            onVisibleStagesChange={setVisibleStages}
            onClearAll={clearAllFilters}
            isFiltered={isFiltered}
          />
        </div>

        {/* ── KANBAN VIEW ── */}
        {viewMode === "kanban" && (
          <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <div
              ref={boardRef}
              className="flex overflow-x-auto pb-6 gap-4 max-w-screen-2xl mx-auto"
            >
              {COLUMNS.filter(col => filters.visibleStages.includes(col.id)).map(column => {
                const allColApplicants = applicants.filter(a => getColumnForStatus(a.status) === column.id);
                const colApplicants = filteredApplicants.filter(a => getColumnForStatus(a.status) === column.id);
                const pageSize = getColumnPageSize(column.id);
                const displayedApplicants = colApplicants.slice(0, pageSize);
                const allColSelected = colApplicants.length > 0 && colApplicants.every(a => selectedIds.includes(a.id));

                return (
                  <div key={column.id} className="min-w-[300px] max-w-[300px] shrink-0 snap-center flex flex-col">
                    {/* Column Header — NOT a draggable ancestor, safe for styling */}
                    <div className="p-3 mb-2 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <button
                          className="flex items-center gap-2"
                          onClick={() => allColSelected ? deselectAllInColumn(colApplicants) : selectAllInColumn(colApplicants)}
                        >
                          {allColSelected
                            ? <CheckSquare className="h-3.5 w-3.5 text-primary" />
                            : <Square className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-muted-foreground" />
                          }
                          <h4 className="font-bold text-sm">{column.label}</h4>
                        </button>
                        {column.id === 'completed' && applicants.filter(a => a.status === 'completed' && a.funding_status === 'unfunded').length > 0 && (
                          <button
                            onClick={() => handleBatchMerchantFunding(id!, applicants.filter(a => a.status === 'completed' && a.funding_status === 'unfunded'))}
                            className="text-[10px] text-primary hover:underline font-bold uppercase ml-2"
                            disabled={!!isProcessingPayment || !isVerified}
                          >
                            {isProcessingPayment?.toString().startsWith('batch') ? "..." : "Fund All"}
                          </button>
                        )}
                      </div>
                      <Badge variant="secondary" className="bg-background/60 text-[10px] font-bold">
                        {isFiltered && colApplicants.length !== allColApplicants.length
                          ? `${colApplicants.length} of ${allColApplicants.length}`
                          : colApplicants.length}
                      </Badge>
                    </div>

                    {/* Droppable: NO fixed height, NO overflow-y-auto per spec Fix 3 */}
                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={cn(
                            "flex-1 space-y-2 rounded-xl p-1 min-h-[120px]",
                            snapshot.isDraggingOver ? "bg-primary/5 ring-2 ring-primary/20" : ""
                          )}
                        >
                          {displayedApplicants.length === 0 && !snapshot.isDraggingOver && (
                            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50 gap-2">
                              <Users className="h-7 w-7 opacity-25" />
                              <p className="text-xs font-medium text-center">
                                {isFiltered ? "No matches" : "No influencers yet"}
                              </p>
                            </div>
                          )}

                          {displayedApplicants.map((applicant, index) => (
                            <KanbanCard
                              key={applicant.id}
                              applicant={applicant}
                              index={index}
                              columnId={column.id}
                              campaign={campaign}
                              isSelected={selectedIds.includes(applicant.id)}
                              onToggleSelect={() => toggleSelect(applicant.id)}
                              onViewDetails={() => { setSelectedApplicant(applicant); setShowDialog(true); }}
                              onViewContract={(text: string, signed_at: string | null) => setViewingContract({ text, signed_at })}
                              onRejectContent={() => handleRejectContent(applicant)}
                              onApproveContent={() => handleApproveContent(applicant, campaign)}
                              onFundCreator={() => handleMerchantFunding(applicant, campaign)}
                              isProcessingPayment={isProcessingPayment === applicant.id}
                              isVerified={isVerified}
                              getColumnForStatus={getColumnForStatus}
                            />
                          ))}

                          {provided.placeholder}

                          {colApplicants.length > pageSize && (
                            <button
                              onClick={() => loadMoreInColumn(column.id)}
                              className="w-full text-xs text-primary font-bold py-2 border border-dashed border-primary/20 rounded-lg hover:bg-primary/5"
                            >
                              Load {Math.min(50, colApplicants.length - pageSize)} more
                            </button>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}

        {/* ── LIST VIEW ── */}
        {viewMode === "list" && (
          <div className="max-w-screen-2xl mx-auto">
            <KanbanListView
              applicants={filteredApplicants}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onSelectAll={() => setSelectedIds(filteredApplicants.map(a => a.id))}
              onDeselectAll={() => setSelectedIds([])}
              onViewApplicant={a => { setSelectedApplicant(a as any); setShowDialog(true); }}
              onViewContract={a => {
                const contracts = (a as any).contracts;
                if (contracts?.length) {
                  const signed = contracts.find((c: any) => c.status === "signed") || contracts[0];
                  if (signed) setViewingContract({ text: signed.contract_text, signed_at: signed.signed_at });
                }
              }}
              getColumnLabel={getColumnLabelForStatus}
              getStatusColor={getStatusColor}
              basePayout={campaign.base_payout}
            />
          </div>
        )}
      </main>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedIds={selectedIds}
        columns={COLUMNS}
        isLocked={isLocked}
        onDeselectAll={() => setSelectedIds([])}
        onBulkMove={handleBulkMove}
        onBulkRemove={handleBulkRemove}
        onWhatsAppAll={handleWhatsAppAll}
        getApplicantPhone={aid => applicants.find(a => a.id === aid)?.influencer_profiles.phone_number || null}
        getApplicantName={aid => applicants.find(a => a.id === aid)?.influencer_profiles.full_name || ""}
      />

      {/* Applicant Details Dialog — pixel-for-pixel match with BrandCampaignDetails */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Influencer Details</DialogTitle>
            <DialogDescription className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-1">
              {selectedApplicant?.status.replace("_", " ")} • ID: {selectedApplicant?.id.slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          {selectedApplicant && (
            <div className="space-y-6">
               <div className="flex flex-col md:flex-row gap-8">
                 {/* Left Column: Info */}
                 <div className="flex-1 space-y-6">
                    <div className="flex items-center justify-between pb-2 border-b border-border/10">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight">{selectedApplicant.influencer_profiles.full_name}</h2>
                        <a 
                          href={`https://instagram.com/${selectedApplicant.influencer_profiles.instagram_handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary font-bold hover:underline flex items-center gap-1.5 mt-0.5"
                        >
                          <Instagram className="h-3.5 w-3.5" />
                          @{selectedApplicant.influencer_profiles.instagram_handle}
                        </a>
                      </div>
                    </div>
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
                      <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Niches &amp; Expertise</p>
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
                               <FileText className="h-3.5 w-3.5" /> Contract Signed
                            </div>
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
                                  fetchData();
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
                        Accept &amp; Allow Content
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

      {/* Contract Dialog */}
      <Dialog open={!!viewingContract} onOpenChange={open => !open && setViewingContract(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-[#FDFBF7] p-10 border-[#E5E0D5] rounded-xl">
          <DialogHeader className="border-b border-[#E5E0D5] pb-6 mb-8 text-center">
            <DialogTitle className="text-2xl font-serif font-bold uppercase tracking-[0.2em] text-[#1A1816]">
              Influencer Partnership Agreement
            </DialogTitle>
            <DialogDescription className="text-[10px] font-sans text-muted-foreground uppercase tracking-widest mt-2">
              {viewingContract?.signed_at
                ? `Signed ${new Date(viewingContract.signed_at).toLocaleString()}`
                : "Draft Document"}
            </DialogDescription>
          </DialogHeader>
          <div className="font-serif text-[#2C2925] leading-relaxed text-sm whitespace-pre-wrap">
            {viewingContract?.text}
          </div>
          <div className="mt-12 pt-8 border-t border-[#E5E0D5] flex justify-between items-end">
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Certified Secure</span>
            </div>
            <p className="font-bold text-sm uppercase tracking-wide">
              {viewingContract?.signed_at ? "Fully Executed" : "Pending Signature"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── KanbanCard — zero transition/transform on draggable or ancestors ─────────

const KanbanCard = ({
  applicant, index, columnId, campaign, isSelected,
  onToggleSelect, onViewDetails, onViewContract, onRejectContent,
  onApproveContent, onFundCreator, isProcessingPayment, isVerified,
}: any) => (
  <Draggable draggableId={applicant.id} index={index}>
    {(provided, snapshot) => (
      // Fix 1+2: NO transition, NO transform, NO duration-* on this div or its ancestors
      <div
        ref={provided.innerRef}
        {...provided.draggableProps}
        {...provided.dragHandleProps}
      >
        <div
          className={cn(
            "bg-background border rounded-xl p-3 shadow-sm cursor-grab select-none",
            snapshot.isDragging
              ? "shadow-2xl ring-2 ring-primary border-primary"
              : isSelected
              ? "ring-1 ring-primary/60 bg-primary/5 border-primary/30"
              : "hover:border-primary/30 border-border/60"
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-start gap-2 min-w-0">
              <button
                onClick={e => { e.stopPropagation(); onToggleSelect(); }}
                className="mt-0.5 flex-shrink-0"
              >
                {isSelected
                  ? <CheckSquare className="h-4 w-4 text-primary" />
                  : <Square className="h-4 w-4 text-muted-foreground/30 hover:text-muted-foreground" />
                }
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <p className="font-semibold text-sm leading-tight truncate">{applicant.influencer_profiles.full_name}</p>
                  {applicant.negotiation_requested && (
                    <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-1.5 h-4 text-[8px] uppercase font-bold flex-shrink-0">
                      <MessageSquare className="h-2 w-2 mr-0.5" /> Nego
                    </Badge>
                  )}
                </div>
                <a
                  href={`https://instagram.com/${applicant.influencer_profiles.instagram_handle}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                  onClick={e => e.stopPropagation()}
                >
                  <Instagram className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">@{applicant.influencer_profiles.instagram_handle}</span>
                </a>
                {applicant.contracts?.some((c: any) => c.status === "signed") && (
                  <div className="flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20 text-[8px] font-bold uppercase w-fit">
                    <FileText className="h-2 w-2" /> Signed
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
              <div className="flex px-2 py-0.5 rounded-full bg-secondary text-[10px] font-medium text-muted-foreground items-center gap-1">
                <Users className="h-3 w-3" />
                {applicant.influencer_profiles.followers_count
                  ? (applicant.influencer_profiles.followers_count / 1000).toFixed(1) + "k"
                  : "N/A"}
              </div>
              {campaign?.type !== "barter" && (
                <div className={cn(
                  "flex px-2 py-0.5 rounded-full border text-[10px] font-bold items-center gap-1",
                  columnId === "negotiation" || applicant.negotiation_requested
                    ? "border-amber-500/30 text-amber-600 bg-amber-500/10"
                    : ["shortlisted", "accepted", "completed", "paid"].includes(applicant.status)
                    ? "border-green-500/30 text-green-500 bg-green-500/10"
                    : "border-blue-500/30 text-blue-500 bg-blue-500/10"
                )}>
                  <DollarSign className="h-2.5 w-2.5" />
                  {`₹${(applicant.final_payout || applicant.requested_payout || campaign?.base_payout || 0).toLocaleString()}`}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/40">
            <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs px-2" onClick={onViewDetails}>
              <Eye className="mr-1 h-3 w-3" /> Details
            </Button>
            {applicant.contracts && applicant.contracts.length > 0 && (
              <Button
                size="sm" variant="outline"
                className="flex-1 h-7 text-xs px-2 border-primary/20 hover:bg-primary/5"
                onClick={() => {
                  const signed = applicant.contracts?.find((c: any) => c.status === "signed") || applicant.contracts?.[0];
                  if (signed) onViewContract(signed.contract_text, signed.signed_at);
                }}
              >
                <FileText className="mr-1 h-3 w-3" /> Contract
              </Button>
            )}
          </div>

          {columnId === "content_posted" && (
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] border-red-500/30 text-red-500 hover:bg-red-500/10" onClick={onRejectContent}>
                Reject
              </Button>
              <Button size="sm" className="flex-1 h-7 text-[10px] bg-green-600 hover:bg-green-700 text-white" onClick={onApproveContent} disabled={isProcessingPayment}>
                {isProcessingPayment ? "..." : "Approve"}
              </Button>
            </div>
          )}

          {columnId === "completed" && applicant.funding_status === "unfunded" && (
            <Button size="sm" className="w-full h-7 text-[10px] mt-2 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/10" onClick={onFundCreator} disabled={isProcessingPayment || !isVerified}>
              {isProcessingPayment ? "Processing..." : "Fund & Settle"}
            </Button>
          )}

          {applicant.funding_status === "funded" && applicant.status === "completed" && (
            <div className="w-full mt-2 flex items-center justify-center gap-1.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <CheckCircle className="h-3 w-3 text-indigo-500" />
              <span className="text-[10px] font-bold text-indigo-500">Funded — Awaiting Payout</span>
            </div>
          )}
          {applicant.status === "paid" && (
            <div className="w-full mt-2 flex items-center justify-center gap-1.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-[10px] font-bold text-green-500 uppercase">Settled ✓</span>
            </div>
          )}
        </div>
      </div>
    )}
  </Draggable>
);

export default BrandCampaignCRM;
