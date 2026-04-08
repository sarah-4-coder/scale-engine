/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, CheckCircle2, Briefcase, Mail, DollarSign, MessageSquare } from "lucide-react";
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
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    brand_name: "",
    contact_email: "",
    campaign_type: "",
    budget_range: "",
    brief: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brand_name || !form.contact_email || !form.campaign_type || !form.budget_range) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(form.contact_email)) {
      toast.error("Please enter a valid email");
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
        brief: form.brief || null,
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
          message: `${form.brand_name} wants to work with you. Check your leads dashboard.`,
          is_read: false,
        });
      }

      setStep("success");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("form");
    setForm({ brand_name: "", contact_email: "", campaign_type: "", budget_range: "", brief: "" });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
            className="relative z-10 w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.8)]"
          >
            {/* Ambient glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

            {step === "form" ? (
              <div className="p-6 md:p-8">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Work With Me</h2>
                    <p className="text-white/50 text-sm mt-1">Send a collaboration inquiry to <span className="text-blue-400 font-bold">{influencerName}</span></p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Brand Name */}
                  <div className="relative">
                    <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Brand / Company Name *"
                      maxLength={100}
                      value={form.brand_name}
                      onChange={e => setForm(f => ({ ...f, brand_name: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/8 transition-all"
                    />
                  </div>

                  {/* Email */}
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4" />
                    <input
                      type="email"
                      placeholder="Your Email Address *"
                      value={form.contact_email}
                      onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/8 transition-all"
                    />
                  </div>

                  {/* Campaign Type */}
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2 ml-1">Campaign Type *</p>
                    <div className="grid grid-cols-2 gap-2">
                      {CAMPAIGN_TYPES.map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, campaign_type: type }))}
                          className={`py-2.5 px-3 rounded-xl border text-sm font-bold transition-all ${
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

                  {/* Budget Range */}
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2 ml-1">Budget Range *</p>
                    <div className="grid grid-cols-2 gap-2">
                      {BUDGET_RANGES.map(range => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, budget_range: range }))}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
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

                  {/* Brief */}
                  <div className="relative">
                    <MessageSquare className="absolute left-3.5 top-3.5 text-white/30 w-4 h-4" />
                    <textarea
                      placeholder="Campaign brief (optional, max 500 chars)"
                      maxLength={500}
                      rows={3}
                      value={form.brief}
                      onChange={e => setForm(f => ({ ...f, brief: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/8 transition-all resize-none"
                    />
                    <span className="absolute bottom-2 right-3 text-[10px] text-white/20">{form.brief.length}/500</span>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:shadow-[0_0_40px_rgba(37,99,235,0.6)] active:scale-[0.98]"
                  >
                    {loading ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                    ) : (
                      <>
                        <Send size={16} />
                        Send Inquiry
                      </>
                    )}
                  </button>

                  <p className="text-center text-[10px] text-white/20">No account needed. Your message goes directly to the creator.</p>
                </form>
              </div>
            ) : (
              /* Success State */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 md:p-12 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.6, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(37,99,235,0.3)]"
                >
                  <CheckCircle2 className="w-10 h-10 text-blue-400" />
                </motion.div>
                <h3 className="text-2xl font-black text-white mb-2">Inquiry Sent!</h3>
                <p className="text-white/50 text-sm leading-relaxed">
                  Your inquiry has been sent! <span className="text-blue-400 font-semibold">{influencerName}</span> will get back to you soon.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-8 px-8 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all text-sm"
                >
                  Close
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
