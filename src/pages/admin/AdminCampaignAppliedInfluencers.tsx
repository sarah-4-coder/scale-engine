/* eslint-disable @typescript-eslint/no-unused-expressions */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

interface AppliedInfluencer {
  id: string;
  influencer_profiles: {
    full_name: string;
    instagram_profile_url: string;
    followers_count: number;
    user_id: string;
  };
}

const AdminCampaignAppliedInfluencers = () => {
  const { id: campaignId } = useParams();
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
      .update({ status: "shortlisted" })
      .in("id", selectedIds);

    if (acceptError) {
      toast.error("Failed to accept selected influencers");
      return;
    }

    // 2️⃣ Mark unselected influencers as REJECTED
    if (rejectedRows.length > 0) {
      await supabase
        .from("campaign_influencers")
        .update({ status: "not_shortlisted" })
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

    const headers = ["Influencer Name", "Instagram Handle", "Phone Number"];
    const csvRows = rows.map((r) => [
      r.influencer_profiles.full_name,
      r.influencer_profiles.instagram_profile_url,
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
    return <div className="p-6">Loading...</div>;
  }

  return (
    <>
      <AdminNavbar />

      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Applied Influencers</h1>

          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV}>
              Export CSV
            </Button>
            <Button onClick={acceptSelected}>Accept Selected</Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead />
              <TableHead>Name</TableHead>
              <TableHead>Instagram</TableHead>
              <TableHead>Followers</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(row.id)}
                    onCheckedChange={() => toggleSelect(row.id)}
                  />
                </TableCell>
                <TableCell>{row.influencer_profiles.full_name}</TableCell>
                <TableCell>
                  <a
                    href={row.influencer_profiles.instagram_profile_url}
                    className="underline"
                  >
                    Profile Link
                  </a>
                </TableCell>
                <TableCell>{row.influencer_profiles.followers_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default AdminCampaignAppliedInfluencers;
