import { motion } from "framer-motion";
import { Check, X, Eye, ExternalLink, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "@/contexts/WorkspaceContext";

interface GlobalInboxProps {
  items: any[];
}

const GlobalInbox = ({ items }: GlobalInboxProps) => {
  const navigate = useNavigate();
  const { setActiveBrandId } = useWorkspace();

  const handleDetail = (campaignId: string, brandId: string) => {
    setActiveBrandId(brandId);
    navigate(`/company/campaigns/${campaignId}`);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="h-16 w-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-white/5">
          <Check className="h-8 w-8 opacity-20" />
        </div>
        <p className="text-sm font-medium">Your CRM Inbox is empty</p>
        <p className="text-xs opacity-60 mt-1">New applications will appear here across all brands.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="group relative"
        >
          <Card className="bg-slate-900/50 border-white/10 overflow-hidden hover:border-purple-500/30 transition-all">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row md:items-center">
                {/* Brand & Campaign Info */}
                <div className="w-full md:w-1/3 p-4 bg-white/5 border-b md:border-b-0 md:border-r border-white/5">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Client Portfolio
                    </span>
                  </div>
                  <h4 className="text-white font-bold truncate">{item.campaigns?.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Status: <span className="text-purple-400 font-medium uppercase">{item.status.replace('_', ' ')}</span>
                  </p>
                </div>

                {/* Influencer Info */}
                <div className="flex-1 p-4 flex items-center gap-4">
                  <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center border border-white/10 overflow-hidden">
                    {item.influencer_profiles?.profile_image_url ? (
                      <img src={item.influencer_profiles.profile_image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="text-white font-medium truncate">{item.influencer_profiles?.full_name}</h4>
                        {item.status === 'influencer_negotiated' && (
                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]">
                                Counter Offer: ₹{item.requested_payout}
                            </Badge>
                        )}
                        {item.status === 'content_posted' && (
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">
                                Verification Needed
                            </Badge>
                        )}
                    </div>
                    {item.status === 'content_posted' && item.posted_link && (
                        <a 
                            href={item.posted_link[0]?.split(': ')[1] || item.posted_link[0]} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[10px] text-blue-400 hover:underline flex items-center gap-1 mt-1 font-medium"
                        >
                            <ExternalLink className="h-3 w-3" /> View Submitted Content
                        </a>
                    )}
                    <p className="text-xs text-slate-500 mt-1">Applied {new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 flex flex-row md:flex-col items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-white/10 bg-white/5 text-white hover:bg-white/10 w-full md:w-auto"
                    onClick={() => handleDetail(item.campaign_id, item.campaigns.brand_id)}
                  >
                    <Eye className="h-4 w-4 mr-2" /> Detail
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default GlobalInbox;
