/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Send, 
  CheckCircle2, 
  Briefcase, 
  Mail, 
  DollarSign, 
  MessageSquare, 
  ChevronRight, 
  ChevronLeft,
  Globe,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HireMeModalProps {
  open: boolean;
  onClose: () => void;
  influencerId: string;
  influencerName: string;
}

const CAMPAIGN_TYPES = ["Paid", "Barter", "Event", "Ambassador"];
const BUDGET_RANGES = ["Under ₹10k", "₹10k–₹50k", "₹50k–₹2L", "₹2L+"];

export const HireMeModal = ({ open, onClose, influencerId, influencerName }: HireMeModalProps) => {
  const [step, setStep] = useState<"brand" | "campaign" | "success">("brand");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    brand_name: "",
    contact_email: "",
    brand_website: "",
    campaign_type: "",
    budget_range: "",
    brief: "",
  });

  const validateStep1 = () => {
    if (!form.brand_name || !form.contact_email) {
      toast.error("Please fill required fields");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(form.contact_email)) {
      toast.error("Invalid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!form.campaign_type || !form.budget_range) {
      toast.error("Selection required");
      return;
    }

    setLoading(true);
    try {
      // Insert lead
      const { error: leadError } = await supabase.from("media_kit_leads" as any).insert({
        influencer_id: influencerId,
        brand_name: form.brand_name,
        contact_email: form.contact_email,
        campaign_type: form.campaign_type,
        budget_range: form.budget_range,
        brief: `${form.brand_website ? `Website: ${form.brand_website}\n\n` : ''}${form.brief}`.trim() || null,
        status: "pending",
      });
      
      if (leadError) throw leadError;

      // Fire notification to influencer
      const { data: profile } = await supabase
        .from("influencer_profiles")
        .select("user_id")
        .eq("id", influencerId)
        .single();

      if (profile?.user_id) {
        await supabase.from("notifications" as any).insert({
          user_id: profile.user_id,
          title: "New Brand Inquiry! 🎉",
          message: `${form.brand_name} wants to work with you. Check your dashboard.`,
          is_read: false,
        });
      }

      setStep("success");
    } catch (err: any) {
      toast.error(err.message || "Failed to send inquiry");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("brand");
    setForm({ brand_name: "", contact_email: "", brand_website: "", campaign_type: "", budget_range: "", brief: "" });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative z-10 w-full sm:max-w-xl bg-[#0a0a0a] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-[0_-20px_80px_rgba(0,0,0,0.8)]"
          >
            {/* Ambient Accent Line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/10 rounded-full mt-4 sm:hidden" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent opacity-50" />

            <div className="p-8 pb-10 sm:pb-8">
              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={16} className="text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Inquiry Flow</span>
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
                    Work with <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600 italic">
                      {influencerName}
                    </span>
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Steps Progress */}
              {step !== "success" && (
                <div className="flex gap-2 mb-8">
                  <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step === 'brand' ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-blue-600/30'}`} />
                  <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${step === 'campaign' ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-white/10'}`} />
                </div>
              )}

              <AnimatePresence mode="wait">
                {step === "brand" ? (
                  <motion.div
                    key="step-brand"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="grid gap-4">
                      <div className="relative group">
                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Brand / Company Name *"
                          value={form.brand_name}
                          onChange={e => setForm(f => ({ ...f, brand_name: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all"
                        />
                      </div>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
                        <input
                          type="email"
                          placeholder="Contact Email *"
                          value={form.contact_email}
                          onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all"
                        />
                      </div>
                      <div className="relative group">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
                        <input
                          type="url"
                          placeholder="Brand Website / Social (Optional)"
                          value={form.brand_website}
                          onChange={e => setForm(f => ({ ...f, brand_website: e.target.value }))}
                          className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => validateStep1() && setStep("campaign")}
                      className="w-full py-4 mt-4 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-100 transition-all active:scale-[0.98]"
                    >
                      Continue to Details <ChevronRight size={18} />
                    </button>
                  </motion.div>
                ) : step === "campaign" ? (
                  <motion.div
                    key="step-campaign"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest font-black mb-3 ml-1">Type of Campaign</p>
                      <div className="grid grid-cols-2 gap-2">
                        {CAMPAIGN_TYPES.map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, campaign_type: type }))}
                            className={`py-3.5 px-4 rounded-2xl border text-xs font-black transition-all ${
                              form.campaign_type === type
                                ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                                : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-white/30 uppercase tracking-widest font-black mb-3 ml-1">Budget Expectation</p>
                      <div className="grid grid-cols-2 gap-2">
                        {BUDGET_RANGES.map(range => (
                          <button
                            key={range}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, budget_range: range }))}
                            className={`py-3.5 px-4 rounded-2xl border text-xs font-black transition-all ${
                              form.budget_range === range
                                ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                                : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {range}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative group">
                      <MessageSquare className="absolute left-4 top-4 text-white/30 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
                      <textarea
                        placeholder="Tell us about the project brief..."
                        maxLength={500}
                        rows={3}
                        value={form.brief}
                        onChange={e => setForm(f => ({ ...f, brief: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/20 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all resize-none"
                      />
                      <span className="absolute bottom-3 right-4 text-[9px] font-bold text-white/20 group-focus-within:text-white/40">{form.brief.length}/500</span>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep("brand")}
                        className="flex-1 py-4 border border-white/10 text-white/60 font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
                      >
                        <ChevronLeft size={18} /> Back
                      </button>
                      <button
                        onClick={() => handleSubmit()}
                        disabled={loading}
                        className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_10px_40px_rgba(37,99,235,0.5)] active:scale-[0.98]"
                      >
                        {loading ? (
                          <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                        ) : (
                          <>
                            Send Inquiry <Send size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step-success"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="py-12 text-center"
                  >
                    <div className="w-24 h-24 rounded-[2rem] bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(37,99,235,0.5)]">
                      <CheckCircle2 className="w-12 h-12 text-blue-400" />
                    </div>
                    <h3 className="text-3xl font-black text-white mb-3">Sent Successfully!</h3>
                    <p className="text-white/50 text-base leading-relaxed max-w-xs mx-auto">
                      We've fired off your inquiry. <span className="text-blue-400 font-black">{influencerName}</span> will get a notification instantly.
                    </p>
                    <button
                      onClick={handleClose}
                      className="mt-10 w-full py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all text-sm"
                    >
                      Return to Media Kit
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
