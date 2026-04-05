/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState, useMemo, memo, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import InfluencerNavbar from "@/components/influencer/InfluencerNavbar";
import MobileBottomNav from "@/components/influencer/MobileBottomNav";
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";
import {
  Calendar,
  DollarSign,
  Target,
  CheckCircle2,
  Users,
  Sparkles,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { CampaignCardSkeleton } from "@/components/influencer/Skeletons";
import { useCampaigns, useInfluencerProfile, useApplyToCampaign, useMyCampaigns } from "@/hooks/useCampaigns";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  niches: string[];
  deliverables: string;
  timeline: string;
  base_payout: number;
  brand_profiles?: {
    company_name: string;
    industry: string;
    is_verified: boolean;
    city: string;
    state: string;
    description: string;
    company_website: string;
    company_size: string;
  };
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
  const {
    theme,
    themeKey,
    setTheme,
    loading: themeLoading,
  } = useInfluencerTheme();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [negotiationRequested, setNegotiationRequested] = useState(false);

  // ⚡ REACT QUERY HOOKS - Automatic caching & refetching
  const { data: campaigns = [], isLoading: campaignsLoading } = useCampaigns() as { data: Campaign[]; isLoading: boolean };
  const { data: profile, isLoading: profileLoading } = useInfluencerProfile(user?.id || '');
  //@ts-ignore
  const influencerId = profile?.id;
  const { data: myApplications = [] } = useMyCampaigns(influencerId || '');
  const applyMutation = useApplyToCampaign();

  const loading = campaignsLoading || profileLoading;

  // Get applied campaign IDs from myApplications
  //@ts-ignore
  const appliedCampaignIds = useMemo(() => {
    //@ts-ignore
    return myApplications.map(app => app.campaign_id);
  }, [myApplications]);

  /* -------------------------------
     ELIGIBILITY CHECK
  ------------------------------- */
  const isEligible = (campaign: Campaign): boolean => {
    if (!profile) return false;

    const eligibility = campaign.eligibility;
    if (!eligibility) return true;

    // Check min followers
    if (
      eligibility.min_followers &&
      //@ts-ignore
      (!profile.followers_count || profile.followers_count < eligibility.min_followers)
    ) {
      return false;
    }

    // Check niches
    if (eligibility.allowed_niches && eligibility.allowed_niches.length > 0) {
      //@ts-ignore
      if (!profile.niches || profile.niches.length === 0) return false;
      //@ts-ignore
      const hasMatchingNiche = profile.niches.some((n) =>
        //@ts-ignore
        eligibility.allowed_niches.includes(n),
      );
      if (!hasMatchingNiche) return false;
    }

    // Check cities
    if (eligibility.allowed_cities && eligibility.allowed_cities.length > 0) {
      if (
        //@ts-ignore
        !profile.city ||
        //@ts-ignore
        !eligibility.allowed_cities.includes(profile.city)
      ) {
        return false;
      }
    }

    return true;
  };

  // ⚡ MEMOIZED filtered campaigns (performance optimization)
  const eligibleCampaigns = useMemo(() => {
    return campaigns.filter(isEligible);
  }, [campaigns, profile]);

  // ⚡ MEMOIZED searched campaigns
  const displayedCampaigns = useMemo(() => {
    if (!searchTerm) return eligibleCampaigns;
    
    const term = searchTerm.toLowerCase();
    return eligibleCampaigns.filter(
      (c) =>
        //@ts-ignore
        c.name.toLowerCase().includes(term) ||
        //@ts-ignore
        c.description?.toLowerCase().includes(term) ||
        //@ts-ignore
        c.niches.some((n) => n.toLowerCase().includes(term))
    );
  }, [eligibleCampaigns, searchTerm]);

  /* -------------------------------
     APPLY TO CAMPAIGN (using mutation)
  ------------------------------- */
  const applyToCampaign = () => {
    if (!influencerId || !selectedCampaign) return;
    
    applyMutation.mutate({ 
      campaignId: selectedCampaign.id, 
      influencerId,
      negotiationRequested
    }, {
      onSuccess: () => {
        setApplyModalOpen(false);
        setSelectedCampaign(null);
        setNegotiationRequested(false);
      }
    });
  };

  const handleOpenApplyModal = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setNegotiationRequested(false);
    setApplyModalOpen(true);
  };

  /* -------------------------------
     LOADING STATE - PREVENT FLASH
  ------------------------------- */
  if (themeLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: theme.background }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white/50" />
          <p className="text-white/70 text-sm">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-20 md:pb-0">
      {/* Animated Theme Background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ background: theme.background }}
      />

      {/* Navbar */}
      <InfluencerNavbar currentTheme={themeKey} onThemeChange={setTheme} />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* CONTENT */}
      <main className="relative z-10 px-4 md:px-6 py-6 md:py-10 max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h2 className={`text-2xl md:text-3xl font-bold ${theme.text}`}>
                Browse Campaigns
              </h2>
              <p className={theme.muted}>
                Find campaigns that match your profile
              </p>
            </div>

            <div className={`${theme.card} ${theme.radius} px-4 py-2`}>
              <p className={`text-sm ${theme.muted}`}>
                <span className={`font-semibold ${theme.text}`}>
                  {displayedCampaigns.length}
                </span>{" "}
                {displayedCampaigns.length === 1 ? "campaign" : "campaigns"} available
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl ${theme.card} ${theme.text} placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20`}
            />
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CampaignCardSkeleton key={i} theme={theme} />
            ))}
          </div>
        ) : (
          <>
            {/* CAMPAIGNS GRID */}
            {displayedCampaigns.length === 0 ? (
              <div className={`${theme.card} ${theme.radius} p-12 text-center`}>
                {searchTerm ? (
                  <>
                    <p className={theme.muted}>
                      No campaigns match your search "{searchTerm}"
                    </p>
                    <Button
                      onClick={() => setSearchTerm("")}
                      className="mt-4"
                      variant="outline"
                    >
                      Clear Search
                    </Button>
                  </>
                ) : (
                  <p className={theme.muted}>
                    No campaigns available that match your profile right now.
                    Check back soon!
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6">
                {displayedCampaigns.map((campaign, index) => {
                  const isApplied = appliedCampaignIds.includes(campaign.id);

                  return (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4 }}
                    >
                      <Card
                        className={`${theme.card} ${theme.radius} overflow-hidden transition-all duration-300 hover:shadow-2xl h-full flex flex-col`}
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className={`text-lg ${theme.text}`}>
                            {campaign.name}
                          </CardTitle>
                          {campaign.brand_profiles && (
                            <div className="flex flex-col gap-1 mt-1">
                              <div className="flex items-center gap-1.5">
                                <p className={`text-xs font-semibold ${theme.accent}`}>
                                  {campaign.brand_profiles.company_name}
                                </p>
                                {campaign.brand_profiles.is_verified && (
                                  <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
                                    <CheckCircle2 className="h-2.5 w-2.5 text-blue-400" />
                                    <span className="text-[8px] font-bold text-blue-400 uppercase tracking-tighter">Verified</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-muted-foreground uppercase tracking-wider">
                                  {campaign.brand_profiles.industry}
                                </span>
                                {(campaign.brand_profiles.city || campaign.brand_profiles.state) && (
                                  <div className="flex items-center gap-1 text-[10px] text-white/40 font-medium italic">
                                    <MapPin className="h-2.5 w-2.5" />
                                    {campaign.brand_profiles.city}, {campaign.brand_profiles.state}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {campaign.description && (
                            <CardDescription
                              className={`${theme.muted} line-clamp-2 text-sm`}
                            >
                              {campaign.description}
                            </CardDescription>
                          )}
                        </CardHeader>

                        <CardContent className="space-y-4 flex-grow flex flex-col">
                          {/* Niches */}
                          <div className="flex flex-wrap gap-2">
                            {campaign.niches.slice(0, 3).map((niche) => (
                              <span
                                key={niche}
                                className={`px-2 py-1 rounded-lg bg-white/10 text-xs ${theme.muted}`}
                              >
                                {niche}
                              </span>
                            ))}
                            {campaign.niches.length > 3 && (
                              <span
                                className={`px-2 py-1 rounded-lg bg-white/10 text-xs ${theme.muted}`}
                              >
                                +{campaign.niches.length - 3}
                              </span>
                            )}
                          </div>

                          {/* Info Grid */}
                          <div className="space-y-2 flex-grow">
                            <div className="flex items-center gap-2">
                              <Calendar className={`h-4 w-4 ${theme.accent}`} />
                              <span
                                className={`text-xs md:text-sm ${theme.muted}`}
                              >
                                {campaign.timeline}
                              </span>
                            </div>

                            <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
                              <div className="flex items-center gap-2">
                                <DollarSign
                                  className={`h-4 w-4 ${theme.accent}`}
                                />
                                <div className="flex flex-col">
                                  <span
                                    className={`text-xs md:text-sm ${theme.text} font-medium leading-none`}
                                  >
                                    ₹{campaign.base_payout} base payout
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Target className={`h-4 w-4 ${theme.accent}`} />
                              <span
                                className={`text-xs md:text-sm ${theme.muted}`}
                              >
                                {campaign.deliverables}
                              </span>
                            </div>

                            {/* Eligibility Info */}
                            {campaign.eligibility && (
                              <>
                                {campaign.eligibility.min_followers && (
                                  <div className="flex items-center gap-2">
                                    <Users
                                      className={`h-4 w-4 ${theme.accent}`}
                                    />
                                    <span
                                      className={`text-xs ${theme.muted}`}
                                    >
                                      Min {campaign.eligibility.min_followers.toLocaleString()}{" "}
                                      followers
                                    </span>
                                  </div>
                                )}

                                {campaign.eligibility.allowed_cities &&
                                  campaign.eligibility.allowed_cities.length >
                                    0 && (
                                    <div className="flex items-center gap-2">
                                      <MapPin
                                        className={`h-4 w-4 ${theme.accent}`}
                                      />
                                      <span
                                        className={`text-xs ${theme.muted}`}
                                      >
                                        {campaign.eligibility.allowed_cities.join(
                                          ", ",
                                        )}
                                      </span>
                                    </div>
                                  )}
                              </>
                            )}
                          </div>

                          {/* Apply Button */}
                          {isApplied ? (
                            <Button
                              disabled
                              className="w-full"
                              variant="outline"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Applied
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleOpenApplyModal(campaign)}
                              className="w-full"
                            >
                              <Sparkles className="h-4 w-4 mr-2" />
                              Apply Now
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* APPLICATION MODAL */}
      <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
        <DialogContent className={`${theme.card} border flex flex-col md:max-w-md ${theme.text} p-6 overflow-hidden rounded-xl bg-card border-white/10`}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Apply for Campaign</DialogTitle>
            <DialogDescription className="text-white/60">
              {selectedCampaign?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm text-white/60">Base Payout</p>
                <div className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-500/20">
                  Standard Rate
                </div>
              </div>
              <p className="text-2xl font-bold">₹{selectedCampaign?.base_payout}</p>
              <p className="text-[11px] text-white/40 leading-relaxed italic">
                * This is the fixed compensation for the deliverables mentioned. 
                Payments are processed via our secure ledger after content verification.
              </p>
            </div>

            <div className={`p-4 rounded-lg transition-all duration-300 border ${negotiationRequested ? 'bg-amber-500/5 border-amber-500/30' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-start gap-3">
                <input 
                  id="negotiation-checkbox"
                  type="checkbox" 
                  checked={negotiationRequested}
                  onChange={(e) => setNegotiationRequested(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500 transition-all cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="negotiation-checkbox" className="text-sm font-semibold cursor-pointer block mb-1">
                    I want to negotiate a higher pay
                  </label>
                  <p className="text-[11px] text-white/50 leading-tight">
                    Check this only if your profile reach, high engagement, or premium content quality justifies a rate above the base payout.
                  </p>
                </div>
              </div>
              
              {negotiationRequested && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-3 p-2 rounded bg-amber-500/10 text-amber-400 text-[10px] font-medium border border-amber-500/20"
                >
                  💡 Negotiation options will be enabled in your campaign dashboard once the brand shortlists you.
                </motion.div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button 
              variant="outline" 
              className="w-full sm:w-auto" 
              onClick={() => setApplyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="w-full sm:w-auto" 
              onClick={applyToCampaign}
              disabled={applyMutation.isPending}
            >
              {applyMutation.isPending ? "Applying..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(AllCampaigns);