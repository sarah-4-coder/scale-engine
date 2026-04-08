/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";
import { useLeads, MediaKitLead } from "@/hooks/useLeads";
import { useDashboardStats } from "@/hooks/useCampaigns";
import InfluencerNavbar from "@/components/influencer/InfluencerNavbar";
import MobileBottomNav from "@/components/influencer/MobileBottomNav";
import ThemedStudioBackground from "@/components/influencer/ThemedStudioBackground";
import {
  Inbox,
  Briefcase,
  Mail,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  responded: { label: "Responded", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  closed: { label: "Closed", color: "text-white/30 bg-white/5 border-white/10" },
  rejected: { label: "Rejected", color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
};

const LeadCard = ({
  lead,
  themeKey,
  theme,
  onUpdate,
}: {
  lead: MediaKitLead;
  themeKey: string;
  theme: any;
  onUpdate: (id: string, status: "responded" | "closed" | "rejected") => Promise<void>;
}) => {
  const [expanding, setExpanding] = useState(false);
  const statusCfg = STATUS_CONFIG[lead.status];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`rounded-2xl border p-4 md:p-6 transition-all duration-300 ${
        themeKey === "dark"
          ? "bg-white/3 border-white/8 hover:border-white/15"
          : "bg-white border-slate-100 shadow-sm hover:shadow-md"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-lg md:text-xl font-black ${theme.text} truncate`}>{lead.brand_name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-widest ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>
          <div className={`flex items-center gap-1 text-xs mt-1 ${theme.muted}`}>
            <Clock size={11} />
            <span>{formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}</span>
          </div>
        </div>
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 mb-4">
        <div className={`flex items-center gap-2 text-xs ${theme.muted}`}>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${themeKey === "dark" ? "bg-blue-500/10" : "bg-blue-50"}`}>
            <Briefcase size={14} className={themeKey === "dark" ? "text-blue-400" : "text-blue-600"} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider opacity-50 font-bold">Type</span>
            <span className="font-bold">{lead.campaign_type}</span>
          </div>
        </div>
        <div className={`flex items-center gap-2 text-xs ${theme.muted}`}>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${themeKey === "dark" ? "bg-blue-500/10" : "bg-blue-50"}`}>
            <DollarSign size={14} className={themeKey === "dark" ? "text-blue-400" : "text-blue-600"} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider opacity-50 font-bold">Budget</span>
            <span className="font-bold">{lead.budget_range}</span>
          </div>
        </div>
        <div className={`flex items-center gap-2 text-xs ${theme.muted} sm:col-span-2`}>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${themeKey === "dark" ? "bg-blue-400/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
             <Mail size={14} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] uppercase tracking-wider opacity-50 font-bold">Contact</span>
            <a href={`mailto:${lead.contact_email}`} className="font-bold underline underline-offset-2 hover:text-blue-500 transition-colors truncate">
              {lead.contact_email}
            </a>
          </div>
        </div>
      </div>

      {/* Brief */}
      {lead.brief && (
        <div
          className={`rounded-xl p-3 mb-4 text-xs leading-relaxed cursor-pointer ${
            themeKey === "dark" ? "bg-white/5 text-white/60" : "bg-slate-50 text-slate-600"
          }`}
          onClick={() => setExpanding(e => !e)}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <MessageSquare size={11} />
            <span className="font-bold uppercase tracking-widest text-[9px]">Brief</span>
          </div>
          <p className={!expanding ? "line-clamp-2" : ""}>{lead.brief}</p>
          {lead.brief.length > 100 && (
            <span className="text-blue-500 text-[10px] font-bold mt-0.5 block">{expanding ? "Show less" : "Read more"}</span>
          )}
        </div>
      )}

      {/* Actions */}
      {lead.status === "pending" && (
        <div className="flex gap-2">
          <button
            onClick={() => onUpdate(lead.id, "responded")}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            <CheckCircle2 size={13} /> Mark Responded
          </button>
          <button
            onClick={() => onUpdate(lead.id, "rejected")}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
              themeKey === "dark"
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                : "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100"
            }`}
          >
            <XCircle size={13} /> Reject
          </button>
        </div>
      )}

      {(lead.status === "responded" || lead.status === "pending") === false && lead.status !== "closed" && lead.status !== "rejected" && (
        <button
          onClick={() => onUpdate(lead.id, "closed")}
          className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
            themeKey === "dark"
              ? "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
              : "bg-transparent border-slate-200 text-slate-400 hover:bg-slate-50"
          }`}
        >
          <XCircle size={13} /> Close Lead
        </button>
      )}
      
      {lead.status === "responded" && (
        <div className="flex gap-2">
          <button
            onClick={() => onUpdate(lead.id, "closed")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
              themeKey === "dark"
                ? "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                : "bg-transparent border-slate-200 text-slate-400 hover:bg-slate-50"
            }`}
          >
            <CheckCircle2 size={13} /> Finish & Close
          </button>
          <button
            onClick={() => onUpdate(lead.id, "rejected")}
            className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${
              themeKey === "dark"
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                : "bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100"
            }`}
          >
            <XCircle size={13} /> Reject
          </button>
        </div>
      )}
    </motion.div>
  );
};

const Leads = () => {
  const { user } = useAuth();
  const { theme, themeKey, setTheme } = useInfluencerTheme();
  const { data: stats } = useDashboardStats(user?.id || "");
  const influencerId = (stats as any)?.influencerId || null;
  const { leads, loading, pendingCount, updateStatus, refetch } = useLeads(influencerId);

  const [filter, setFilter] = useState<"all" | "pending" | "responded" | "closed" | "rejected">("all");

  const filtered = filter === "all" ? leads : leads.filter(l => l.status === filter);

  return (
    <div
      className="min-h-screen relative overflow-hidden pb-20 md:pb-0 transition-colors duration-500"
      style={{ background: theme.background }}
    >
      <ThemedStudioBackground themeKey={themeKey} />
      <InfluencerNavbar currentTheme={themeKey} onThemeChange={setTheme} />
      <MobileBottomNav />

      <main className="relative z-10 px-4 md:px-8 pt-4 pb-12 md:py-12 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <h1 className={`text-2xl md:text-4xl font-black tracking-tight ${theme.text}`}>Brand Leads</h1>
              {pendingCount > 0 && (
                <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                  {pendingCount} new
                </span>
              )}
            </div>
            <p className={`${theme.muted} text-sm mt-1`}>Brands who want to collaborate with you</p>
          </div>
          <button
            onClick={refetch}
            className={`p-2.5 rounded-xl border transition-all ${
              themeKey === "dark"
                ? "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                : "bg-transparent border-slate-200 text-slate-400 hover:bg-slate-50"
            }`}
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 items-center mb-8">
          {(["all", "pending", "responded", "closed", "rejected"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all capitalize border h-10 ${
                filter === f
                  ? themeKey === "dark"
                    ? "bg-blue-600 border-blue-500 text-white shadow-[0_4px_15px_rgba(37,99,235,0.4)]"
                    : "bg-white border-transparent text-blue-600 shadow-sm"
                  : "bg-transparent border-transparent " + (themeKey === "dark" ? "text-white/40 hover:text-white" : "text-slate-400 hover:text-slate-700")
              } ${themeKey === 'dark' ? 'bg-white/5' : 'bg-slate-100'}`}
            >
              <div className="flex items-center gap-2">
                {f}
                {f === "pending" && pendingCount > 0 && (
                  <span className="bg-blue-600 text-white rounded-md px-1.5 py-0.5 text-[9px] min-w-[18px] text-center">
                    {pendingCount}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600" />
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-3xl border p-12 text-center ${
              themeKey === "dark" ? "bg-white/3 border-white/8" : "bg-white border-slate-100"
            }`}
          >
            <Inbox className={`mx-auto mb-4 w-12 h-12 ${themeKey === "dark" ? "text-white/20" : "text-slate-300"}`} />
            <p className={`font-black text-lg ${theme.text}`}>
              {filter === "all" ? "No leads yet" : `No ${filter} leads`}
            </p>
            <p className={`text-sm mt-2 ${theme.muted}`}>
              Share your media kit to start receiving brand inquiries.
            </p>
          </motion.div>
        )}

        {/* Lead cards */}
        <AnimatePresence>
          <div className="space-y-4">
            {filtered.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                themeKey={themeKey}
                theme={theme}
                onUpdate={updateStatus}
              />
            ))}
          </div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Leads;
