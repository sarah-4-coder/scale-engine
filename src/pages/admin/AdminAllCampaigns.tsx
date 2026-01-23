import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  niches: string[];
  deliverables: string;
  timeline: string;
  base_payout: number;
  status: string;
  created_at: string;
}

const AdminAllCampaigns = () => {
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load campaigns");
      return;
    }

    setCampaigns(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">All Campaigns</h1>

      {campaigns.length === 0 && (
        <p className="text-muted-foreground">
          No campaigns created yet.
        </p>
      )}

      {campaigns.map((campaign) => (
        <Card key={campaign.id}>
          <CardHeader>
            <CardTitle>{campaign.name}</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            <p>
              <strong>Niches:</strong>{" "}
              {campaign.niches?.join(", ") || "—"}
            </p>

            <p>
              <strong>Deliverables:</strong>{" "}
              {campaign.deliverables}
            </p>

            <p>
              <strong>Timeline:</strong>{" "}
              {campaign.timeline}
            </p>

            <p>
              <strong>Base Payout:</strong> ₹{campaign.base_payout}
            </p>

            <div className="flex gap-2 pt-3">
              <Button
                onClick={() =>
                  navigate(`/admin/campaigns/${campaign.id}`)
                }
              >
                Review Submissions
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminAllCampaigns;
