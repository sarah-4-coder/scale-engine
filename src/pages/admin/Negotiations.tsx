/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { sendNotification } from "@/lib/notifications";
import AdminNavbar from "@/components/adminNavbar";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  MessageSquare, 
  User, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Shield,
  Briefcase,
  Instagram,
  Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface NegotiationRow {
  id: string;
  status: string;
  requested_payout: number | null;
  final_payout: number | null;
  negotiation_note: string | null;
  campaign: {
    name: string;
    base_payout: number;
  };
  influencer: {
    instagram_handle: string;
    user_id: string;
  };
}

const AdminNegotiations = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [counterValue, setCounterValue] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchNegotiations = async () => {
      const { data, error } = await supabase
        .from("campaign_influencers")
        .select(
          `
          id,
          status,
          requested_payout,
          final_payout,
          negotiation_note,
          campaigns (
            name,
            base_payout
          ),
          influencer_profiles (
            instagram_handle
          )
        `,
        )
        .in("status", ["admin_negotiated", "influencer_negotiated"]);

      if (error) {
        console.error(error);
        toast.error("Failed to load negotiations");
        return;
      }

      const formatted = (data || []).map((row: any) => ({
        ...row,
        campaign: row.campaigns,
        influencer: row.influencer_profiles,
      }));

      setRows(formatted);
      setLoading(false);
    };

    fetchNegotiations();
  }, []);

  const acceptNegotiation = async (row: NegotiationRow) => {
    const payout = row.requested_payout ?? row.campaign.base_payout;

    const { error } = await supabase
      .from("campaign_influencers")
      .update({
        final_payout: payout,
        status: "accepted",
      } as any)
      .eq("id", row.id);

    if (error) {
      toast.error("Failed to accept negotiation");
      return;
    }

    toast.success("Negotiation accepted");
    // 🔔 Notify influencer about acceptance
    sendNotification({
      user_id: row.influencer.user_id,
      role: "influencer",
      type: "negotiation_accepted",
      title: "Offer accepted",
      message: `Your payout of ₹${payout} was accepted`,
      metadata: {
        campaign_id: row.id,
      },
    }).catch(console.error);

    setRows((prev: any[]) =>
      prev.map((r: any) =>
        r.id === row.id
          ? { ...r, status: "accepted", final_payout: payout }
          : r,
      ),
    );
  };

  const counterNegotiation = async (row: NegotiationRow) => {
    const counter = counterValue[row.id];
    if (!counter) return toast.error("Enter counter amount");

    const { error } = await supabase
      .from("campaign_influencers")
      .update({
        requested_payout: Number(counter),
        status: "admin_negotiated",
      } as any)
      .eq("id", row.id);

    if (error) {
      toast.error("Failed to counter offer");
      return;
    }
    // 🔔 Notify influencer about counter offer
    sendNotification({
      user_id: row.influencer.user_id,
      role: "influencer",
      type: "negotiation_countered",
      title: "New offer from brand",
      message: `Brand countered with ₹${counter}`,
      metadata: {
        campaign_id: row.id,
      },
    }).catch(console.error);

    toast.success("Counter offer sent");

    setRows((prev: any[]) =>
      prev.map((r: any) =>
        r.id === row.id ? { ...r, requested_payout: Number(counter), status: "admin_negotiated" } : r,
      ),
    );
  };

  const rejectNegotiation = async (rowId: string) => {
    const { error } = await supabase
      .from("campaign_influencers")
      .update({ status: "rejected" } as any)
      .eq("id", rowId);

    if (error) {
      toast.error("Failed to reject");
      return;
    }

    toast.success("Influencer rejected");

    setRows((prev: any[]) => prev.filter((r: any) => r.id !== rowId));
  };

  if (loading) {
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
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Negotiation Feed</h1>
              <p className="text-muted-foreground mt-2">Manage creator payouts and platform margins</p>
            </div>
            <div className="flex items-center gap-3">
               <div className="h-10 px-4 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2 text-sm font-bold text-primary">
                  <TrendingUp className="h-4 w-4" /> 
                  Active Deals: {rows.length}
               </div>
            </div>
          </div>

          {/* Negotiations List */}
          <div className="space-y-6">
            {rows.length === 0 && (
              <Card className="bg-card/30 border-dashed border-border/50 py-16 flex flex-col items-center justify-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground font-medium">No open negotiations at the moment.</p>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {rows.map((row) => (
                <Card key={row.id} className="bg-card/40 backdrop-blur-md border-border/50 hover:border-primary/30 transition-all group overflow-hidden">
                  <CardHeader className="pb-4 border-b border-border/20 bg-muted/20">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-background border border-border/50 flex items-center justify-center">
                             <Instagram className="h-5 w-5 text-primary/70" />
                          </div>
                          <div>
                             <CardTitle className="text-lg font-bold">@{row.influencer.instagram_handle}</CardTitle>
                             <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Briefcase className="h-3 w-3" /> {row.campaign.name}
                             </p>
                          </div>
                       </div>
                       <Badge variant="outline" className={cn("rounded-full px-3 py-0.5 text-[10px] uppercase font-bold", 
                          row.status === 'admin_negotiated' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                          'bg-amber-500/10 text-amber-500 border-amber-500/20'
                       )}>
                          {row.status.replace("_", " ")}
                       </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6 space-y-6">
                    {/* Financial Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 rounded-2xl bg-background/40 border border-border/30">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Standard Payout</p>
                          <p className="text-xl font-black text-foreground">₹{row.campaign.base_payout.toLocaleString()}</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20">
                          <p className="text-[10px] font-bold text-primary uppercase mb-1">Requested Amount</p>
                          <p className="text-xl font-black text-primary">₹{row.requested_payout?.toLocaleString() || "—"}</p>
                       </div>
                    </div>

                    {/* Note */}
                    {row.negotiation_note && (
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border/20">
                         <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-[10px] font-bold uppercase text-muted-foreground">Creator Note</span>
                         </div>
                         <p className="text-sm italic text-muted-foreground/90">"{row.negotiation_note}"</p>
                      </div>
                    )}

                    {/* Controls */}
                    <div className="pt-4 border-t border-border/20">
                      {row.status === "accepted" ? (
                        <div className="flex items-center justify-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 font-bold gap-2">
                           <CheckCircle2 className="h-5 w-5" /> Final Deal: ₹{row.final_payout?.toLocaleString()}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                             <div className="relative flex-1">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Counter value..."
                                  className="pl-9 h-11 rounded-xl bg-background/50 border-border/40 focus:border-primary/30"
                                  type="number"
                                  value={counterValue[row.id] || ""}
                                  onChange={(e) =>
                                    setCounterValue((prev) => ({
                                      ...prev,
                                      [row.id]: e.target.value,
                                    }))
                                  }
                                />
                             </div>
                             <Button
                               onClick={() => counterNegotiation(row)}
                               className="h-11 px-6 rounded-xl shadow-lg shadow-primary/20"
                             >
                                <ArrowRight className="h-4 w-4 mr-2" /> Counter
                             </Button>
                          </div>

                          <div className="flex gap-2">
                             <Button 
                                onClick={() => acceptNegotiation(row)}
                                className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
                             >
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Accept Requested
                             </Button>
                             <Button 
                                variant="ghost"
                                onClick={() => rejectNegotiation(row.id)}
                                className="h-11 px-6 rounded-xl text-rose-500 hover:bg-rose-500/10"
                             >
                                <XCircle className="h-4 w-4 mr-2" /> Reject
                             </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminNegotiations;
