/* eslint-disable @typescript-eslint/no-unused-expressions */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { sendNotification } from "@/lib/notifications";
import AdminNavbar from "@/components/adminNavbar";
import { motion } from "framer-motion";
import { 
  Users, 
  Download, 
  CheckCircle2, 
  ChevronRight, 
  Instagram, 
  Briefcase,
  ArrowLeft,
  UserCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AppliedInfluencer {
  id: string;
  influencer_profiles: {
    full_name: string;
    instagram_profile_url: string;
    followers_count: number;
    user_id: string;
    instagram_handle?: string;
  };
}

const AdminCampaignAppliedInfluencers = () => {
  const { id: campaignId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AppliedInfluencer[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchAppliedInfluencers = async () => {
    if (!campaignId) return;

    const { data, error } = await supabase
      .from("campaign_influencers")
      .select(
        `
        id,
        influencer_profiles (
          full_name,
          instagram_profile_url,
          instagram_handle,
          followers_count,
          user_id
        )
      `,
      )
      .eq("campaign_id", campaignId)
      .eq("status", "applied");

    if (error) {
      toast.error("Failed to load applied influencers");
      return;
    }

    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAppliedInfluencers();
  }, [campaignId]);

  const toggleSelect = (id: string) => {
    const copy = new Set(selected);
    copy.has(id) ? copy.delete(id) : copy.add(id);
    setSelected(copy);
  };

  const acceptSelected = async () => {
    if (selected.size === 0) {
      toast.error("No influencers selected");
      return;
    }

    if (!campaignId) return;

    const selectedIds = Array.from(selected);
    const rejectedRows = rows.filter((r) => !selected.has(r.id));
    const selectedRows = rows.filter((r) => selected.has(r.id));

    // 1️⃣ Mark selected influencers as SHORTLISTED
    const { error: acceptError } = await supabase
      .from("campaign_influencers")
      .update({ status: "shortlisted" } as any)
      .in("id", selectedIds);

    if (acceptError) {
      toast.error("Failed to accept selected influencers");
      return;
    }

    // 2️⃣ Mark unselected influencers as REJECTED
    if (rejectedRows.length > 0) {
      await supabase
        .from("campaign_influencers")
        .update({ status: "not_shortlisted" } as any)
        .in(
          "id",
          rejectedRows.map((r) => r.id),
        );
    }

    // 3️⃣ Notify SELECTED influencers
    selectedRows.forEach((row) => {
      sendNotification({
        user_id: row.influencer_profiles.user_id,
        role: "influencer",
        type: "shortlisted",
        title: "You’ve been shortlisted 🎉",
        message:
          "The brand has shortlisted you for this campaign. You can now negotiate the payout.",
        metadata: {
          campaign_id: campaignId,
        },
      }).catch(console.error);
    });

    // 4️⃣ Notify REJECTED influencers
    rejectedRows.forEach((row) => {
      sendNotification({
        user_id: row.influencer_profiles.user_id,
        role: "influencer",
        type: "application_rejected",
        title: "Application not selected",
        message:
          "Thank you for applying. The brand has moved forward with other influencers for this campaign.",
        metadata: {
          campaign_id: campaignId,
        },
      }).catch(console.error);
    });

    toast.success("Brand selection completed");
    setSelected(new Set());
    fetchAppliedInfluencers();
  };

  const exportCSV = () => {
    if (rows.length === 0) return;

    const headers = ["Influencer Name", "Instagram Handle", "Followers"];
    const csvRows = rows.map((r) => [
      r.influencer_profiles.full_name,
      r.influencer_profiles.instagram_handle || r.influencer_profiles.instagram_profile_url,
      r.influencer_profiles.followers_count,
    ]);

    const csvContent = [headers, ...csvRows].map((e) => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "applied_influencers.csv";
    a.click();

    window.URL.revokeObjectURL(url);
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
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
             <button onClick={() => navigate("/admin/campaigns")} className="flex items-center hover:text-primary transition-colors">
                <Briefcase className="h-4 w-4 mr-1" /> Campaigns
             </button>
             <ChevronRight className="h-3 w-3" />
             <span className="font-medium text-foreground">Review Applications</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                 <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                    <UserCheck className="h-6 w-6 text-primary" />
                 </div>
                 <h1 className="text-3xl font-extrabold tracking-tight">Applied Influencers</h1>
              </div>
              <p className="text-muted-foreground">Shortlist the best talent for this campaign</p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={exportCSV} className="rounded-full px-6 bg-card/50">
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              <Button 
                onClick={acceptSelected} 
                disabled={selected.size === 0}
                className="rounded-full px-6 shadow-lg shadow-primary/20"
              >
                Accept Selected ({selected.size})
              </Button>
            </div>
          </div>

          <Card className="bg-card/30 backdrop-blur-md border-border/40 overflow-hidden shadow-none">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-b border-border/40">
                      <TableHead className="w-12 px-6">
                        <Checkbox 
                          checked={selected.size === rows.length && rows.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) setSelected(new Set(rows.map(r => r.id)));
                            else setSelected(new Set());
                          }}
                        />
                      </TableHead>
                      <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Creator</TableHead>
                      <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Instagram</TableHead>
                      <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Reach</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id} className="hover:bg-muted/10 transition-colors group border-b border-border/20">
                        <TableCell className="px-6">
                          <Checkbox
                            checked={selected.has(row.id)}
                            onCheckedChange={() => toggleSelect(row.id)}
                          />
                        </TableCell>
                        <TableCell className="px-6 py-6 text-base font-bold">
                          {row.influencer_profiles.full_name}
                        </TableCell>
                        <TableCell className="px-6 py-6">
                          <a
                            href={row.influencer_profiles.instagram_profile_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-full"
                          >
                            <Instagram className="h-4 w-4" /> 
                            @{row.influencer_profiles.instagram_handle || "Profile"}
                          </a>
                        </TableCell>
                        <TableCell className="px-6 py-6">
                          <div className="flex items-center gap-1.5 font-bold text-muted-foreground">
                            <Users className="h-4 w-4 text-primary" />
                            {row.influencer_profiles.followers_count?.toLocaleString() || "0"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}

                    {rows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="py-20 text-center">
                          <div className="flex flex-col items-center opacity-50">
                             <Users className="h-10 w-10 mb-2" />
                             <p className="text-sm">No pending applications for this campaign.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default AdminCampaignAppliedInfluencers;

