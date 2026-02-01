/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import InfluencerNavbar from "@/components/influencer/InfluencerNavbar";
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";
import AmbientLayer from "@/components/ambient/AmbientLayer";
import { 
  Calendar, 
  DollarSign, 
  Target, 
  CheckCircle2, 
  Users,
  Sparkles,
  TrendingUp,
  MapPin,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  niches: string[];
  deliverables: string;
  timeline: string;
  base_payout: number;
  eligibility?: {
    min_followers?: number;
    allowed_niches?: string[];
    allowed_cities?: string[];
  };
}

interface InfluencerProfile {
  id: string;
  niches: string[] | null;
  followers_count: number | null;
  city: string | null;
}

const AllCampaigns = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, themeKey, setTheme, loading: themeLoading } = useInfluencerTheme();

  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [appliedCampaignIds, setAppliedCampaignIds] = useState<string[]>([]);
  const [influencerId, setInfluencerId] = useState<string | null>(null);
  const [profile, setProfile] = useState<InfluencerProfile | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Influencer profile (FULL — needed for eligibility)
      const { data: profileData } = await supabase
        .from("influencer_profiles")
        .select("id, niches, followers_count, city")
        .eq("user_id", user.id)
        .single();

      if (!profileData) {
        toast.error("Influencer profile not found");
        return;
      }
      //@ts-ignore
      setInfluencerId(profileData.id);
      setProfile(profileData);

      // All campaigns
      const { data: campaignsData } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      setCampaigns(campaignsData || []);

      // Applied campaigns
      const { data: applications } = await supabase
        .from("campaign_influencers")
        .select("campaign_id")
        //@ts-ignore
        .eq("influencer_id", profileData.id);
      //@ts-ignore
      setAppliedCampaignIds(applications?.map((a) => a.campaign_id) || []);

      setLoading(false);
    };

    fetchData();
  }, [user]);

  /* -----------------------
     ELIGIBILITY CHECK
  ----------------------- */
  const isEligible = (campaign: Campaign) => {
    if (!profile) return false;

    const e = campaign.eligibility || {};

    // Min followers
    if (
      e.min_followers &&
      (!profile.followers_count ||
        profile.followers_count < e.min_followers)
    ) {
      return false;
    }

    // Allowed cities
    if (
      e.allowed_cities?.length &&
      (!profile.city || !e.allowed_cities.includes(profile.city))
    ) {
      return false;
    }

    // Allowed niches
    if (
      e.allowed_niches?.length &&
      (!profile.niches ||
        !profile.niches.some((n) => e.allowed_niches!.includes(n)))
    ) {
      return false;
    }

    return true;
  };

  const applyToCampaign = async (campaignId: string) => {
    if (!influencerId) return;
    //@ts-ignore
    const { error } = await supabase.from("campaign_influencers").insert({
      campaign_id: campaignId,
      influencer_id: influencerId,
      status: "applied",
    });

    if (error) {
      toast.error("Already applied or not allowed");
      return;
    }

    toast.success("Applied successfully! Check My Campaigns to track progress.");
    setAppliedCampaignIds((prev) => [...prev, campaignId]);
  };

  if (loading || themeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  const eligibleCampaigns = campaigns.filter(isEligible);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Theme Background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ background: theme.background }}
      />

      {/* Ambient Background */}
      <AmbientLayer themeKey={themeKey} />

      {/* Navbar */}
      <InfluencerNavbar currentTheme={themeKey} onThemeChange={setTheme} />

      {/* CONTENT */}
      <main className="relative z-10 px-6 py-10 max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-3"
          >
            <Sparkles className={`h-8 w-8 ${theme.accent}`} />
            <h2 className={`text-3xl font-bold ${theme.text}`}>
              Discover Campaigns
            </h2>
          </motion.div>
          <p className={theme.muted}>
            Find campaigns that match your profile and start earning
          </p>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`mt-6 ${theme.card} ${theme.radius} p-4`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${theme.primary} bg-opacity-20`}>
                  <Target className={`h-5 w-5 ${theme.accent}`} />
                </div>
                <div>
                  <p className={`text-sm ${theme.muted}`}>Available</p>
                  <p className={`text-xl font-bold ${theme.text}`}>
                    {eligibleCampaigns.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${theme.primary} bg-opacity-20`}>
                  <CheckCircle2 className={`h-5 w-5 ${theme.accent}`} />
                </div>
                <div>
                  <p className={`text-sm ${theme.muted}`}>Applied</p>
                  <p className={`text-xl font-bold ${theme.text}`}>
                    {appliedCampaignIds.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${theme.primary} bg-opacity-20`}>
                  <TrendingUp className={`h-5 w-5 ${theme.accent}`} />
                </div>
                <div>
                  <p className={`text-sm ${theme.muted}`}>Your Niche</p>
                  <p className={`text-sm font-medium ${theme.text}`}>
                    {profile?.niches?.[0] || "Not set"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CAMPAIGNS GRID */}
        {eligibleCampaigns.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${theme.card} ${theme.radius} p-12 text-center`}
          >
            <div className="max-w-md mx-auto">
              <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${theme.primary} bg-opacity-20 mb-4`}>
                <Target className={`h-12 w-12 ${theme.accent}`} />
              </div>
              <h3 className={`text-xl font-bold ${theme.text} mb-2`}>
                No Campaigns Available
              </h3>
              <p className={`${theme.muted} mb-6`}>
                There are no campaigns matching your profile at the moment. Check back soon for new opportunities!
              </p>
              <Button
                onClick={() => navigate("/dashboard")}
                className="bg-gradient-to-r from-purple-500 to-indigo-500"
              >
                Go to Dashboard
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {eligibleCampaigns.map((campaign, index) => {
              const isApplied = appliedCampaignIds.includes(campaign.id);

              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="h-full"
                >
                  <Card className={`${theme.card} ${theme.radius} overflow-hidden transition-all duration-300 hover:shadow-2xl h-full flex flex-col`}>
                    {/* Header with gradient overlay */}
                    <div className={`relative p-6 bg-gradient-to-br ${theme.primary} bg-opacity-10`}>
                      <CardHeader className="p-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <CardTitle className={`text-xl ${theme.text}`}>
                            {campaign.name}
                          </CardTitle>
                          {isApplied && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20">
                              <CheckCircle2 className="h-3 w-3 text-green-400" />
                              <span className="text-xs text-green-400 font-medium">
                                Applied
                              </span>
                            </div>
                          )}
                        </div>

                        {campaign.description && (
                          <CardDescription className={`${theme.muted} line-clamp-2`}>
                            {campaign.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                    </div>

                    {/* Content */}
                    <CardContent className="p-6 space-y-4 flex-grow">
                      {/* Niches */}
                      <div>
                        <p className={`text-xs ${theme.muted} mb-2`}>Niches</p>
                        <div className="flex flex-wrap gap-2">
                          {campaign.niches.map((niche) => (
                            <span
                              key={niche}
                              className={`px-2 py-1 rounded-lg bg-white/10 text-xs ${theme.text}`}
                            >
                              {niche}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Target className={`h-4 w-4 ${theme.accent} mt-0.5 flex-shrink-0`} />
                          <div className="flex-grow min-w-0">
                            <p className={`text-xs ${theme.muted}`}>Deliverables</p>
                            <p className={`text-sm ${theme.text} font-medium`}>
                              {campaign.deliverables}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Calendar className={`h-4 w-4 ${theme.accent} mt-0.5 flex-shrink-0`} />
                          <div className="flex-grow">
                            <p className={`text-xs ${theme.muted}`}>Timeline</p>
                            <p className={`text-sm ${theme.text} font-medium`}>
                              {campaign.timeline}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <DollarSign className={`h-4 w-4 ${theme.accent} mt-0.5 flex-shrink-0`} />
                          <div className="flex-grow">
                            <p className={`text-xs ${theme.muted}`}>Base Payout</p>
                            <p className={`text-lg ${theme.text} font-bold`}>
                              ₹{campaign.base_payout.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Eligibility Info (if available) */}
                      {campaign.eligibility && (
                        <div className="pt-3 border-t border-white/10">
                          <p className={`text-xs ${theme.muted} mb-2`}>Requirements</p>
                          <div className="space-y-1">
                            {campaign.eligibility.min_followers && (
                              <div className="flex items-center gap-2">
                                <Users className={`h-3 w-3 ${theme.accent}`} />
                                <span className={`text-xs ${theme.text}`}>
                                  {campaign.eligibility.min_followers.toLocaleString()}+ followers
                                </span>
                              </div>
                            )}
                            {campaign.eligibility.allowed_cities && campaign.eligibility.allowed_cities.length > 0 && (
                              <div className="flex items-center gap-2">
                                <MapPin className={`h-3 w-3 ${theme.accent}`} />
                                <span className={`text-xs ${theme.text}`}>
                                  {campaign.eligibility.allowed_cities.join(", ")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>

                    {/* Footer Action */}
                    <div className="p-6 pt-0">
                      {isApplied ? (
                        <Button
                          disabled
                          variant="outline"
                          className="w-full"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Already Applied
                        </Button>
                      ) : (
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button
                            onClick={() => applyToCampaign(campaign.id)}
                            className={`w-full bg-gradient-to-r ${theme.primary}`}
                          >
                            Apply Now
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default AllCampaigns;