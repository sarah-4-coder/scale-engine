/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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
  };
}

const AdminNegotiations = () => {
  const [rows, setRows] = useState<NegotiationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [counterValue, setCounterValue] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchNegotiations = async () => {
      const { data, error } = await supabase
        .from("campaign_influencers")
        .select(`
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
        `)
        .in("status", ["admin_negotiated", "applied","influencer_negotiated"]);

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
      })
      .eq("id", row.id);

    if (error) {
      toast.error("Failed to accept negotiation");
      return;
    }

    toast.success("Negotiation accepted");

    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id ? { ...r, status: "accepted", final_payout: payout } : r
      )
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
      })
      .eq("id", row.id);

    if (error) {
      toast.error("Failed to counter offer");
      return;
    }

    toast.success("Counter offer sent");

    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? { ...r, requested_payout: Number(counter) }
          : r
      )
    );
  };

  const rejectNegotiation = async (rowId: string) => {
    const { error } = await supabase
      .from("campaign_influencers")
      .update({ status: "rejected" })
      .eq("id", rowId);

    if (error) {
      toast.error("Failed to reject");
      return;
    }

    toast.success("Influencer rejected");

    setRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Negotiations</h1>

      {rows.length === 0 && (
        <p className="text-muted-foreground">No negotiations pending.</p>
      )}

      {rows.map((row) => (
        <Card key={row.id}>
          <CardHeader>
            <CardTitle>
              {row.campaign.name} — @{row.influencer.instagram_handle}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <p><strong>Base payout:</strong> ₹{row.campaign.base_payout}</p>
            <p><strong>Requested payout:</strong> ₹{row.requested_payout ?? "—"}</p>

            {row.negotiation_note && (
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> {row.negotiation_note}
              </p>
            )}

            {row.status === "accepted" ? (
              <p className="text-green-600 font-medium">
                Accepted · Final payout ₹{row.final_payout}
              </p>
            ) : (
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => acceptNegotiation(row)}>
                  Accept
                </Button>

                <Input
                  placeholder="Counter amount"
                  className="w-40"
                  value={counterValue[row.id] || ""}
                  onChange={(e) =>
                    setCounterValue((prev) => ({
                      ...prev,
                      [row.id]: e.target.value,
                    }))
                  }
                />

                <Button variant="outline" onClick={() => counterNegotiation(row)}>
                  Counter
                </Button>

                <Button variant="destructive" onClick={() => rejectNegotiation(row.id)}>
                  Reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminNegotiations;
