/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState, useMemo, memo } from "react";
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
import { CampaignCardSkeleton } from "@/components/influencer/Skeletons";
import ThemedStudioBackground from "@/components/influencer/ThemedStudioBackground";
import { useCampaigns, useInfluencerProfile, useApplyToCampaign, useMyCampaigns } from "@/hooks/useCampaigns";

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
  const {
    theme,
    themeKey,
    setTheme,
    loading: themeLoading,
  } = useInfluencerTheme();

  const [searchTerm, setSearchTerm] = useState("");

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
  const applyToCampaign = (campaignId: string) => {
    if (!influencerId) return;
    
    applyMutation.mutate({ 
      campaignId, 
      influencerId 
    });
  };

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

      {/* Themed Studio Background */}
      {/* <ThemedStudioBackground themeKey={themeKey} /> */}

      {/* Ambient Background */}
      {/* <div className="hidden md:block">
        <AmbientLayer themeKey={themeKey} />
      </div> */}

      {/* Navbar */}
      <InfluencerNavbar currentTheme={themeKey} onThemeChange={setTheme} />

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

                            <div className="flex items-center gap-2">
                              <DollarSign
                                className={`h-4 w-4 ${theme.accent}`}
                              />
                              <span
                                className={`text-xs md:text-sm ${theme.text} font-medium`}
                              >
                                ₹{campaign.base_payout} base payout
                              </span>
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
                              onClick={() => applyToCampaign(campaign.id)}
                              disabled={applyMutation.isPending}
                              className="w-full"
                            >
                              {applyMutation.isPending ? (
                                "Applying..."
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  Apply Now
                                </>
                              )}
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
    </div>
  );
};

export default memo(AllCampaigns);