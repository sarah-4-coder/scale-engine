/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import clsx from "clsx";
import { sendNotification } from "@/lib/notifications";
import AdminNavbar from "@/components/adminNavbar";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
}

interface Row {
  id: string;
  status: string;
  final_payout: number | null;
  posted_link: string[] | null;
  influencer_profiles: {
    user_id: string;
    full_name: string;
    phone_number: string;
    instagram_handle: string;
  };
}

const statusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "text-teal-400";
    case "rejected":
      return "text-red-400";
    case "content_posted":
      return "text-yellow-400";
    default:
      return "text-muted-foreground";
  }
};

const AdminCampaignDetails = () => {
  const { id: campaignId } = useParams();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!campaignId) return;

    const { data: campaignData } = await supabase
      .from("campaigns")
      .select("id, name, description")
      .eq("id", campaignId)
      .single();

    setCampaign(campaignData);

    const { data } = await supabase
      .from("campaign_influencers")
      .select(
        `
      id,
      status,
      final_payout,
      posted_link,
      influencer_profiles (
        user_id,
        full_name,
        phone_number,
        instagram_handle
      )
      `,
      )
      .eq("campaign_id", campaignId)
      .in("status", ["accepted", "completed", "content_posted"]);

    setRows(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const metrics = useMemo(
    () => ({
      accepted: rows.filter(
        (r) =>
          r.status === "accepted" ||
          r.status == "completed" ||
          r.status === "content_rejected",
      ).length,
      submissions: rows.filter((r) => r.posted_link).length,
      completed: rows.filter((r) => r.status === "completed").length,
      rejected: rows.filter((r) => r.status === "content_rejected").length,
    }),
    [rows],
  );

  const markCompleted = async (rowId: string) => {
    await supabase
      .from("campaign_influencers")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", rowId);

    toast.success("Marked as completed");
    fetchData();
    // 🔔 Notify influencer: content approved
    sendNotification({
      user_id: rows.find((r) => r.id === rowId)?.influencer_profiles.user_id!,
      role: "influencer",
      type: "content_approved",
      title: "Content approved 🎉",
      message: "Your content has been approved. Campaign completed!",
      metadata: {
        campaign_id: campaignId,
      },
    }).catch(console.error);
  };

  const rejectSubmission = async (rowId: string) => {
    await supabase
      .from("campaign_influencers")
      .update({
        status: "content_rejected",
        posted_link: null,
        posted_at: null,
      })
      .eq("id", rowId);

    toast.success("Submission rejected");
    fetchData();
    // 🔔 Notify influencer: content rejected
    sendNotification({
      user_id: rows.find((r) => r.id === rowId)?.influencer_profiles.user_id!,
      role: "influencer",
      type: "content_rejected",
      title: "Content needs changes",
      message: "Your content was rejected. Please resubmit.",
      metadata: {
        campaign_id: campaignId,
      },
    }).catch(console.error);
  };
  const exportCSV = () => {
    if (!campaign) return;

    const headers = ["Influencer Name", "Instagram Profile", "Posted Content"];

    const rowsData = rows.map((row) => {
      const postedContent = row.posted_link ? row.posted_link.join("\n") : "";

      return [
        row.influencer_profiles.full_name,
        `https://instagram.com/${row.influencer_profiles.instagram_handle}`,
        postedContent,
      ];
    });

    const csvContent = [headers, ...rowsData]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
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
      `${campaign.name.replace(/\s+/g, "_")}_content_submissions.csv`,
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !campaign) {
    return <div className="p-6">Loading…</div>;
  }

  return (
    <>
      <AdminNavbar />

      <div className="p-6 max-w-7xl mx-auto space-y-10">
        {/* Campaign Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gradient">
            {campaign.name}
          </h1>
          {campaign.description && (
            <p className="text-muted-foreground mt-2 max-w-3xl">
              {campaign.description}
            </p>
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            {
              label: "Total Influencers",
              value: metrics.accepted,
              color: "text-primary",
            },
            {
              label: "Submissions Made",
              value: metrics.submissions,
              color: "text-yellow-400",
            },
            {
              label: "Completed",
              value: metrics.completed,
              color: "text-teal-400",
            },
            {
              label: "Rejected",
              value: metrics.rejected,
              color: "text-red-400",
            },
          ].map((m) => (
            <Card key={m.label} className="glass">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{m.label}</p>
                <p className={clsx("text-3xl font-bold mt-1", m.color)}>
                  {m.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-end mb-4">
          <Button variant="outline" onClick={exportCSV}>
            Export CSV
          </Button>
        </div>

        {/* Influencer Table */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Influencer Submissions</CardTitle>
          </CardHeader>

          <CardContent className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-3 text-left">Influencer</th>
                  <th>Phone</th>
                  <th>Instagram</th>
                  <th>Payout</th>
                  <th>Submission</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border hover:bg-white/5 transition"
                  >
                    <td className="py-4 font-medium">
                      {row.influencer_profiles.full_name}
                    </td>
                    <td>{row.influencer_profiles.phone_number}</td>
                    <td>@{row.influencer_profiles.instagram_handle}</td>
                    <td>₹{row.final_payout}</td>

                    <td className="space-y-1">
                      {row.posted_link ? (
                        row.posted_link.map((l, i) => {
                          const [label, url] = l.split(" | ");
                          return (
                            <a
                              key={i}
                              href={url}
                              target="_blank"
                              className="block text-primary underline"
                            >
                              {label}
                            </a>
                          );
                        })
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    <td
                      className={clsx(
                        "capitalize font-medium",
                        statusColor(row.status),
                      )}
                    >
                      {row.status.replace("_", " ")}
                    </td>

                    <td className="text-right">
                      {row.status === "content_posted" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => markCompleted(row.id)}
                          >
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectSubmission(row.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}

                      {row.status === "completed" && (
                        <span className="text-teal-400 font-medium">
                          ✓ Done
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No influencers for this campaign yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminCampaignDetails;
