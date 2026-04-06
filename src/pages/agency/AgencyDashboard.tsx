import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/hooks/useAuth";
import { useAgencyStats } from "@/hooks/useAgencyStats";
import { motion } from "framer-motion";
import { 
  Building2, 
  Users, 
  Rocket, 
  Plus, 
  ExternalLink, 
  Settings, 
  Inbox, 
  Activity as ActivityIcon, 
  Briefcase,
  Download 
} from "lucide-react";
import { exportToCSV } from "@/utils/csvUtils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GlobalInbox from "@/components/agency/GlobalInbox";
import GlobalActivityFeed from "@/components/agency/GlobalActivityFeed";

const AgencyDashboard = () => {
  const { brands, setActiveBrandId } = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    totalCampaigns, 
    totalInfluencers, 
    activeCampaigns, 
    pendingApplications, 
    inbox, 
    activities, 
    isLoading: statsLoading,
    refetch 
  } = useAgencyStats();

  const [agencyProfile, setAgencyProfile] = useState<any>(null);

  useEffect(() => {
    const fetchAgency = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('agency_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setAgencyProfile(data);
    };
    fetchAgency();
  }, [user]);

  const handleManageBrand = (brandId: string) => {
    setActiveBrandId(brandId);
    navigate("/company/dashboard");
  };

  const handleExportCRM = () => {
    if (!inbox || inbox.length === 0) return;

    const exportData = inbox.map(item => ({
      campaign_name: item.campaigns?.name || 'N/A',
      influencer_name: item.influencer_profiles?.full_name || 'N/A',
      influencer_phone: item.influencer_profiles?.phone || 'N/A',
      instagram_handle: item.influencer_profiles?.instagram_handle || 'N/A',
      status: item.status?.replace('_', ' ').toUpperCase() || 'N/A',
      posted_link: item.posted_link ? (item.posted_link[0]?.split(': ')[1] || item.posted_link[0]) : 'None',
      payout: item.campaigns?.payout || '0',
      created_at: new Date(item.created_at).toLocaleDateString()
    }));

    const exportColumns = [
      { key: 'campaign_name', header: 'Campaign Name' },
      { key: 'influencer_name', header: 'Influencer Name' },
      { key: 'influencer_phone', header: 'Phone Number' },
      { key: 'instagram_handle', header: 'Instagram' },
      { key: 'status', header: 'Status' },
      { key: 'posted_link', header: 'Content Link' },
      { key: 'payout', header: 'Payout (INR)' },
      { key: 'created_at', header: 'Applied On' },
    ];

    exportToCSV(exportData, 'Agency_CRM_Export', exportColumns);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8 pt-24 text-slate-200">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {agencyProfile?.agency_name || "Agency Operations"} 🏢
            </h1>
            <p className="text-slate-400">Command Center • {brands.length} active client brands</p>
          </div>
          <div className="flex gap-4">
            <Button 
                onClick={() => navigate("/agency/roster")}
                variant="outline"
                className="border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
            >
                <Users className="h-4 w-4 mr-2" /> Direct Roster
            </Button>
            <Button 
                onClick={() => navigate("/company/profile-setup")}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-500/20"
            >
                <Plus className="h-4 w-4 mr-2" /> Add New Client
            </Button>
            <Button 
                variant="outline" 
                onClick={() => navigate("/agency/profile")}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
                <Settings className="h-4 w-4 mr-2" /> Agency Profile
            </Button>
          </div>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total Clients" value={brands.length} icon={Building2} color="blue" />
          <StatCard title="Portfolio Campaigns" value={totalCampaigns} icon={Briefcase} color="purple" />
          <StatCard title="Active Running" value={activeCampaigns} icon={Rocket} color="orange" />
          <StatCard title="Pending Review" value={pendingApplications} icon={Inbox} color="emerald" highlight={pendingApplications > 0} />
        </div>

        {/* Unified Command Tabs */}
        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList className="bg-slate-900 border border-white/5 p-1 rounded-xl">
            <TabsTrigger value="portfolio" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg px-6">
               Portfolio
            </TabsTrigger>
            <TabsTrigger value="crm" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg px-6 relative">
               CRM Inbox
               {pendingApplications > 0 && (
                   <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-[10px] flex items-center justify-center rounded-full border-2 border-slate-950 font-bold">
                       {pendingApplications}
                   </span>
               )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg px-6">
               Global Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {brands.map((brand) => (
                    <BrandCard key={brand.id} brand={brand} onManage={handleManageBrand} />
                ))}
                <AddBrandCard onClick={() => navigate("/company/profile-setup")} />
            </div>
          </TabsContent>

          <TabsContent value="crm" className="space-y-4">
            <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white">Applications Waiting</h2>
                        <p className="text-sm text-slate-500">Fast-track influencer approvals across all clients</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleExportCRM}
                            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                            disabled={!inbox || inbox.length === 0}
                        >
                            <Download className="h-4 w-4 mr-2" /> Export CRM CSV
                        </Button>
                        <Button variant="ghost" size="sm" onClick={refetch} className="text-slate-400">Refresh</Button>
                    </div>
                </div>
                <GlobalInbox items={inbox} />
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-6">
                 <h2 className="text-xl font-bold text-white mb-6">Recent Status Changes</h2>
                 <GlobalActivityFeed activities={activities} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// --- Child Components ---

const StatCard = ({ title, value, icon: Icon, color, highlight }: any) => (
    <div className={`bg-slate-900/50 border ${highlight ? 'border-purple-500/50 shadow-lg shadow-purple-500/5' : 'border-white/10'} rounded-2xl p-6 transition-all`}>
        <div className="flex items-center gap-4 mb-4">
            <div className={`h-10 w-10 bg-${color}-500/20 rounded-xl flex items-center justify-center border border-${color}-500/30 text-${color}-400`}>
                <Icon size={20} />
            </div>
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</h3>
        </div>
        <p className={`text-3xl font-bold ${highlight ? 'text-purple-400' : 'text-white'}`}>{value}</p>
    </div>
);

const BrandCard = ({ brand, onManage }: any) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all group"
    >
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="h-14 w-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:bg-purple-500/10 group-hover:border-purple-500/30 transition-all">
                    {brand.logo_url ? (
                        <img src={brand.logo_url} alt={brand.company_name} className="h-full w-full object-contain rounded-2xl" />
                    ) : (
                        <Building2 className="h-8 w-8 text-slate-500 group-hover:text-purple-400" />
                    )}
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{brand.company_name}</h3>
            <p className="text-slate-500 text-sm mb-4 line-clamp-1">{brand.industry || "General Industry"}</p>
            
            <div className="pt-4 border-t border-white/5 flex gap-3">
                <Button 
                    onClick={() => onManage(brand.id)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white border-white/10 h-10"
                >
                    <ExternalLink className="h-4 w-4 mr-2" /> Work on Client
                </Button>
            </div>
        </div>
    </motion.div>
);

const AddBrandCard = ({ onClick }: any) => (
    <div 
        onClick={onClick}
        className="border-2 border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 hover:bg-white/5 cursor-pointer transition-all min-h-[220px]"
    >
        <div className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
            <Plus size={24} className="text-slate-500" />
        </div>
        <div className="text-center">
            <p className="text-white font-medium text-sm">Add New Client</p>
        </div>
    </div>
);

export default AgencyDashboard;
