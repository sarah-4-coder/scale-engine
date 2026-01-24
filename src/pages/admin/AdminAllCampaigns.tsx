import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {  LogOut, User } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/hooks/useAuth";

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
  const { user, signOut } = useAuth();
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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50 w-full px-10 py-2">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary">DotFluence</h1>
            <span className="text-sm text-muted-foreground bg-primary/10 px-3 py-1 rounded-full">
              Influencer
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to={"/dashboard"}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <NotificationBell />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User size={16} />
              <span>{user?.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut size={16} className="mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">All Campaigns</h1>

        {campaigns.length === 0 && (
          <p className="text-muted-foreground">No campaigns created yet.</p>
        )}

        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader>
              <CardTitle>{campaign.name}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              <p>
                <strong>Niches:</strong> {campaign.niches?.join(", ") || "—"}
              </p>

              <p>
                <strong>Deliverables:</strong> {campaign.deliverables}
              </p>

              <p>
                <strong>Timeline:</strong> {campaign.timeline}
              </p>

              <p>
                <strong>Base Payout:</strong> ₹{campaign.base_payout}
              </p>

              <div className="flex gap-2 pt-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(`/admin/campaigns/${campaign.id}/applied`)
                  }
                >
                  Applied Influencers
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate(`/admin/campaigns/${campaign.id}`)}
                >
                  Review Submissions
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
};

export default AdminAllCampaigns;
