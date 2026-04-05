import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertCircle, LogOut, User, Plus, Filter, Search, MoreHorizontal, Briefcase, Users as UsersIcon, MapPin, Calendar, Clock, ArrowUpRight, Shield } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/hooks/useAuth";
import AdminNavbar from "@/components/adminNavbar";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  niches: string[];
  deliverables: string;
  timeline: string;
  base_payout: number;
  status: string;
  managed_by_dotfluence: boolean;
  transfer_request_status: string | null;
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

  const handleAcceptTransfer = async (campaignId: string) => {
    // @ts-ignore
    const { error } = await supabase
      .from('campaigns')
      .update({ 
        managed_by_dotfluence: true, 
        transfer_request_status: 'accepted' 
      })
      .eq('id', campaignId);
    
    if (error) {
      toast.error("Failed to accept transfer.");
      return;
    }
    toast.success("Campaign is now Managed by DotFluence.");
    fetchCampaigns();
  };

  const handleRejectTransfer = async (campaignId: string) => {
    // @ts-ignore
    const { error } = await supabase
      .from('campaigns')
      .update({ 
        transfer_request_status: 'rejected' 
      })
      .eq('id', campaignId);
      
    if (error) {
      toast.error("Failed to reject transfer.");
      return;
    }
    toast.success("Transfer request rejected.");
    fetchCampaigns();
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
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Campaign Oversight</h1>
              <p className="text-muted-foreground mt-1">Review and manage all platform campaigns</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search campaigns..." 
                  className="pl-9 pr-4 h-10 rounded-full bg-card/50 border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
                />
              </div>
              <Button onClick={() => navigate("/admin/campaigns/new")} className="rounded-full shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" /> New Campaign
              </Button>
            </div>
          </div>

          {/* Pending Handovers Alert Card */}
          {campaigns.filter(c => c.transfer_request_status === 'pending').length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1 rounded-md bg-orange-500/20">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                </div>
                <h2 className="text-xl font-bold text-orange-500">
                  Pending Handover Requests
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.filter(c => c.transfer_request_status === 'pending').map((campaign) => (
                  <Card key={campaign.id} className="border-orange-500/30 bg-orange-500/5 backdrop-blur-xl">
                    <CardHeader className="pb-3 text-orange-700">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <CardDescription>Requested takeover for professional execution</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-orange-600/80 mb-6">
                        The brand has formally requested DotFluence Admins to manage this campaign. Accepting will grant you full execution control.
                      </p>
                      <div className="flex gap-3 mt-auto">
                        <Button 
                          onClick={() => handleAcceptTransfer(campaign.id)} 
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
                        >
                          Accept Transfer
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleRejectTransfer(campaign.id)}
                          className="border-orange-200 text-orange-700 hover:bg-orange-100 rounded-xl"
                        >
                          Reject Request
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Regular Campaigns List */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Campaign Directory
            </h2>

            {campaigns.length === 0 && !loading && (
              <Card className="bg-card/30 border-dashed border-border/50 py-12 flex flex-col items-center justify-center">
                <Briefcase className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No active campaigns found.</p>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.filter(c => c.transfer_request_status !== 'pending').map((campaign) => (
                <Card key={campaign.id} className="bg-card/40 backdrop-blur-md border-border/50 hover:border-primary/30 transition-all hover:translate-y-[-2px] group flex flex-col h-full overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                        {campaign.name}
                      </CardTitle>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {campaign.niches?.slice(0, 2).map((niche) => (
                          <span key={niche} className="text-[10px] px-2 py-0.5 rounded-full bg-muted border border-border/50">
                            {niche}
                          </span>
                        ))}
                      </div>
                    </div>
                    {campaign.managed_by_dotfluence ? (
                      <div className="h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center" title="DotFluence Managed">
                        <Shield className="h-4 w-4 text-blue-500" />
                      </div>
                    ) : (
                       <div className="h-8 w-8 rounded-full bg-muted border border-border/50 flex items-center justify-center" title="Self Managed">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col">
                    <div className="space-y-4 mb-6 flex-1">
                       <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Timeline: {campaign.timeline}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <ArrowUpRight className="h-4 w-4 text-primary" />
                        <span>Budget: ₹{campaign.base_payout.toLocaleString()}</span>
                      </div>
                      <p className="text-sm line-clamp-2 text-muted-foreground/80 italic">
                        "{campaign.description?.substring(0, 100) || "No description provided."}..."
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/30 mt-auto">
                      <Button
                        variant="soft"
                        className="bg-primary/10 hover:bg-primary/20 text-primary border-none rounded-xl text-xs h-10 px-2"
                        onClick={() => navigate(`/admin/campaigns/${campaign.id}/applied`)}
                      >
                        <UsersIcon className="mr-1.5 h-3.5 w-3.5" />
                        Applications
                      </Button>

                      <Button
                        variant="outline"
                        className="rounded-xl border-border/50 text-xs h-10 px-2"
                        onClick={() => navigate(`/admin/campaigns/${campaign.id}`)}
                      >
                        Details
                      </Button>
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

export default AdminAllCampaigns;
