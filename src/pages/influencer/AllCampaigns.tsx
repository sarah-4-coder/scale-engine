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
  ChevronRight,
  Zap,
  TrendingUp,
  AlertCircle,
  Search,
  X,
} from "lucide-react";
import { CampaignCardSkeleton } from "@/components/influencer/Skeletons";
import { useCampaigns, useInfluencerProfile, useApplyToCampaign, useMyCampaigns, useBrandVelocity } from "@/hooks/useCampaigns";
import ThemedStudioBackground from "@/components/influencer/ThemedStudioBackground";

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
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const {
    theme,
    themeKey,
    setTheme,
    loading: themeLoading,
  } = useInfluencerTheme();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchOpen, setSearchOpen] = useState(false); // mobile search expand
  const [zapTooltip, setZapTooltip] = useState(false);  // first-time zap hint
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [negotiationRequested, setNegotiationRequested] = useState(false);

  // ⚡ REACT QUERY HOOKS - Automatic caching & refetching
  const { data: campaigns = [], isLoading: campaignsLoading } = useCampaigns() as { data: Campaign[]; isLoading: boolean };
  const { data: profile, isLoading: profileLoading } = useInfluencerProfile(user?.id || '');
  //@ts-ignore
  const influencerId = profile?.id;
  const { data: myApplications = [] } = useMyCampaigns(influencerId || '');
  const { data: fastBrandIds } = useBrandVelocity();
  const applyMutation = useApplyToCampaign();

  const loading = authLoading || campaignsLoading || profileLoading || (!!user && !profile);

  // ⚡ Match Score Calculator
  const computeMatchScore = (campaign: Campaign): number | null => {
    //@ts-ignore
    const influencerNiches: string[] = profile?.niches || [];
    const campaignNiches: string[] = campaign.eligibility?.allowed_niches || campaign.niches || [];
    if (influencerNiches.length === 0) return null; // No profile niches → show prompt
    if (campaignNiches.length === 0) return 100;    // Campaign open to all → perfect match
    const matches = influencerNiches.filter(n =>
      campaignNiches.map(c => c.toLowerCase()).includes(n.toLowerCase())
    ).length;
    return Math.round((matches / campaignNiches.length) * 10) * 10;
  };

  const [fastApprovalOnly, setFastApprovalOnly] = useState(false);


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

  // ⚡ MEMOIZED searched campaigns — sorted by match score descending
  const displayedCampaigns = useMemo(() => {
    let base = eligibleCampaigns;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      base = base.filter(
        (c) =>
          //@ts-ignore
          c.name.toLowerCase().includes(term) ||
          //@ts-ignore
          c.description?.toLowerCase().includes(term) ||
          //@ts-ignore
          c.niches.some((n) => n.toLowerCase().includes(term))
      );
    }
    if (fastApprovalOnly && fastBrandIds) {
      //@ts-ignore
      base = base.filter(c => fastBrandIds.has(c.brand_id));
    }
    // Sort by match score descending (null scores go last)
    return [...base].sort((a, b) => {
      const scoreA = computeMatchScore(a) ?? -1;
      const scoreB = computeMatchScore(b) ?? -1;
      return scoreB - scoreA;
    });
  }, [eligibleCampaigns, searchTerm, fastApprovalOnly, fastBrandIds, profile]);

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
  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center transition-colors duration-500"
        style={{ background: theme.background }}
      >
        <div className="flex flex-col items-center gap-6">
          <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-primary" />
          <p className={`text-sm font-black tracking-widest uppercase opacity-50 ${themeKey === 'dark' ? 'text-white' : 'text-gray-900'}`}>Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden pb-20 md:pb-0 transition-colors duration-500"
      style={{ background: theme.background }}
    >
      {/* Animated Theme Background */}
      <ThemedStudioBackground themeKey={themeKey} />

      {/* Navbar */}
      <InfluencerNavbar currentTheme={themeKey} onThemeChange={setTheme} />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* CONTENT */}
      <main className="relative z-10 px-4 md:px-8 py-6 md:py-12 max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-4 md:mb-8">
          {/* Title row */}
          <div className="flex items-center justify-between gap-3 mb-3 md:mb-4">
            <div>
              <h2 className={`text-xl md:text-3xl font-bold ${theme.text}`}>
                Browse Campaigns
              </h2>
              <p className={`hidden md:block mt-0.5 ${theme.muted}`}>
                Find campaigns that match your profile
              </p>
            </div>
            {/* Desktop count chip only */}
            <div className={`hidden md:block ${theme.card} ${theme.radius} px-4 py-2 shrink-0`}>
              <p className={`text-sm ${theme.muted}`}>
                <span className={`font-semibold ${theme.text}`}>{displayedCampaigns.length}</span>{" "}
                {displayedCampaigns.length === 1 ? "campaign" : "campaigns"} available
              </p>
            </div>
          </div>

          {/* ─── MOBILE UNIFIED TOOLBAR ───────────────────── */}
          <div className="md:hidden mb-3">
            {searchOpen ? (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <input
                  autoFocus
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`flex-1 px-4 py-2.5 rounded-2xl text-sm ${theme.card} ${theme.text} placeholder:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/30 border border-white/10 shadow-lg transition-all`}
                />
                <button
                  onClick={() => { setSearchOpen(false); setSearchTerm(""); }}
                  className={`p-2.5 rounded-2xl border shrink-0 transition-all ${
                    themeKey === 'dark' ? 'bg-white/5 border-white/10 text-white/50' : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl border ${
                themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
              }`}>
                {/* Search trigger */}
                <button className="flex-1 flex items-center gap-2" onClick={() => setSearchOpen(true)}>
                  <Search size={14} className={themeKey === 'dark' ? 'text-white/30 shrink-0' : 'text-slate-400 shrink-0'} />
                  {searchTerm ? (
                    <span className="text-xs text-primary font-semibold truncate">{searchTerm}</span>
                  ) : (
                    <span className={`text-xs ${ themeKey === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>Search campaigns...</span>
                  )}
                </button>
                {/* Clear active search */}
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="shrink-0 text-primary">
                    <X size={12} />
                  </button>
                )}
                {/* Divider */}
                <div className={`h-4 w-px shrink-0 ${ themeKey === 'dark' ? 'bg-white/10' : 'bg-slate-300'}`} />
                {/* Mobile count */}
                <span className={`text-[10px] font-black shrink-0 ${ themeKey === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>
                  {displayedCampaigns.length}
                </span>
                {/* Divider */}
                <div className={`h-4 w-px shrink-0 ${ themeKey === 'dark' ? 'bg-white/10' : 'bg-slate-300'}`} />
                {/* ⚡ Fast toggle with downward tooltip */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => {
                      setFastApprovalOnly(v => !v);
                      setZapTooltip(true);
                      setTimeout(() => setZapTooltip(false), 2800);
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                      fastApprovalOnly
                        ? 'bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                        : themeKey === 'dark' ? 'text-white/40' : 'text-slate-400'
                    }`}
                  >
                    <Zap size={12} className={fastApprovalOnly ? 'fill-white text-white' : 'text-amber-400'} />
                    <span>{fastApprovalOnly ? 'Fast' : 'Any'}</span>
                  </button>
                  {/* Tooltip — renders DOWNWARD, never clips navbar */}
                  {zapTooltip && (
                    <div className="absolute top-full right-0 mt-3 z-[200] pointer-events-none">
                      {/* Arrow pointing up */}
                      <div className="absolute bottom-full right-3 border-[5px] border-transparent border-b-gray-900" />
                      <div className="px-3 py-2 rounded-xl bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shadow-xl border border-white/10 animate-in fade-in zoom-in-95 duration-150">
                        ⚡ Brands that approve within 24h
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search campaigns by name, brand, or niche..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-5 py-3 rounded-2xl ${theme.card} ${theme.text} placeholder:opacity-40 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all border border-white/5 shadow-xl`}
              />
            </div>
            <button
              onClick={() => setFastApprovalOnly(v => !v)}
              title="Show only brands that approve within 24 hours"
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border transition-all shrink-0 ${
                fastApprovalOnly
                  ? 'bg-amber-500 border-amber-400 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                  : themeKey === 'dark'
                  ? 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
                  : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-200'
              }`}
            >
              <Zap size={15} className={fastApprovalOnly ? 'text-white fill-white' : 'text-amber-400'} />
              Fast Approval
            </button>
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
                  //@ts-ignore
                  const isFastApproval = fastBrandIds?.has(campaign.brand_id) ?? false;
                  const matchScore = computeMatchScore(campaign);
                  const matchColor =
                    matchScore === null ? '' :
                    matchScore >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                    matchScore >= 50 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                                       'text-rose-400 bg-rose-500/10 border-rose-500/20';

                  return (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ y: -4 }}
                    >
                      <Card
                        className={`${theme.card} ${theme.radius} overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 h-full flex flex-col border group ${
                          isFastApproval
                            ? 'border-amber-500/20 hover:border-amber-500/40'
                            : 'border-white/5'
                        }`}
                      >
                        <CardHeader className="pb-3">
                          {/* Badge Row */}
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {isFastApproval && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                                <Zap size={10} className="fill-amber-400" /> Fast Approval
                              </span>
                            )}
                            {matchScore !== null ? (
                              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${matchColor}`}>
                                <TrendingUp size={10} /> {matchScore}% Match
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-white/30 text-[10px] font-black uppercase tracking-widest">
                                <AlertCircle size={10} /> Set Niches
                              </span>
                            )}
                          </div>
                          <CardTitle className={`text-lg ${theme.text}`}>
                            {campaign.name}
                          </CardTitle>
                          {campaign.brand_profiles && (
                            <div className="flex flex-col gap-1 mt-1">
                              <div className="flex items-center gap-1.5">
                                <p className={`text-sm font-bold ${themeKey === 'dark' ? 'text-white' : 'text-gray-900'} group-hover:text-primary transition-colors`}>
                                  {campaign.brand_profiles.company_name}
                                </p>
                                {campaign.brand_profiles.is_verified && (
                                  <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full ${themeKey === 'light' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                                    <CheckCircle2 className={`h-2.5 w-2.5 ${themeKey === 'light' ? 'text-blue-600' : 'text-blue-500'}`} />
                                    <span className={`text-[9px] font-bold ${themeKey === 'light' ? 'text-blue-600' : 'text-blue-500'} uppercase tracking-tighter`}>Verified</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-2 py-1 rounded-lg ${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'} border text-muted-foreground uppercase tracking-widest font-bold`}>
                                  {campaign.brand_profiles.industry}
                                </span>
                                {(campaign.brand_profiles.city || campaign.brand_profiles.state) && (
                                  <div className={`flex items-center gap-1 text-[10px] ${theme.muted} font-medium italic`}>
                                    <MapPin className="h-2.5 w-2.5" />
                                    {campaign.brand_profiles.city}, {campaign.brand_profiles.state}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {campaign.description && (
                            <CardDescription
                              className={`${theme.muted} line-clamp-2 text-sm mt-2`}
                            >
                              {campaign.description}
                            </CardDescription>
                          )}
                        </CardHeader>

                        <CardContent className="space-y-5 flex-grow flex flex-col px-6 pb-6">
                          {/* Niches */}
                          <div className="flex flex-wrap gap-2">
                            {campaign.niches.slice(0, 3).map((niche) => (
                              <span
                                key={niche}
                                className={`px-2.5 py-1 rounded-lg ${themeKey === 'dark' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100/50 text-blue-600'} border text-[10px] font-bold uppercase tracking-wider`}
                              >
                                {niche}
                              </span>
                            ))}
                            {campaign.niches.length > 3 && (
                              <span
                                className={`px-2.5 py-1 rounded-lg ${themeKey === 'dark' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100/50 text-blue-600'} border text-[10px] font-bold uppercase tracking-wider`}
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

                          {/* Apply & Details Button */}
                          <div className="flex gap-2 w-full mt-auto pt-2">
                            {isApplied ? (
                              <Button
                                disabled
                                className={`flex-1 rounded-xl border border-white/10 font-bold transition-all ${themeKey === 'dark' ? 'bg-white/5 text-white/50' : 'bg-black/5 text-gray-400'}`}
                                variant="outline"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Applied
                              </Button>
                            ) : (
                              <Button
                                onClick={() => handleOpenApplyModal(campaign)}
                                className={`flex-1 rounded-xl font-black transition-all shadow-lg hover:shadow-primary/20 ${themeKey === 'dark' ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-primary hover:bg-primary/90 text-white'}`}
                              >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Apply
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/dashboard/campaigns/my/${campaign.id}`)}
                              className={`px-4 rounded-xl font-bold border transition-all flex items-center ${
                                themeKey === 'dark' 
                                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' 
                                  : 'bg-transparent border-slate-200 text-slate-900 hover:bg-slate-100'
                              }`}
                              title="Campaign Details"
                            >
                              Details
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </div>
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
            <DialogTitle className={`text-xl font-bold ${themeKey === 'dark' ? 'text-white' : 'text-slate-900'}`}>Apply for Campaign</DialogTitle>
            <DialogDescription className={theme.muted}>
              {selectedCampaign?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className={`p-4 rounded-lg ${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200 shadow-sm'} border space-y-2`}>
              <div className="flex justify-between items-center">
                <p className={`text-sm ${theme.muted}`}>Base Payout</p>
                <div className={`px-2 py-0.5 rounded ${themeKey === 'light' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'} text-[10px] font-bold uppercase tracking-wider border`}>
                  Standard Rate
                </div>
              </div>
              <p className={`text-2xl font-bold ${themeKey === 'dark' ? 'text-white' : 'text-slate-900'}`}>₹{selectedCampaign?.base_payout}</p>
              <p className={`text-[11px] ${theme.muted} opacity-70 leading-relaxed italic`}>
                * This is the fixed compensation for the deliverables mentioned. 
                Payments are processed via our secure ledger after content verification.
              </p>
            </div>

            <div className={`p-4 rounded-lg transition-all duration-300 border ${negotiationRequested ? 'bg-amber-500/10 border-amber-500/30' : (themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200')}`}>
              <div className="flex items-start gap-3">
                <input 
                  id="negotiation-checkbox"
                  type="checkbox" 
                  checked={negotiationRequested}
                  onChange={(e) => setNegotiationRequested(e.target.checked)}
                  className={`mt-1 w-4 h-4 rounded ${themeKey === 'dark' ? 'border-white/20 bg-white/5' : 'border-slate-300 bg-white'} text-amber-500 focus:ring-amber-500 transition-all cursor-pointer`}
                />
                <div className="flex-1">
                  <label htmlFor="negotiation-checkbox" className={`text-sm font-semibold cursor-pointer block mb-1 ${theme.text}`}>
                    I want to negotiate a higher pay
                  </label>
                  <p className={`text-[11px] ${theme.muted} leading-tight`}>
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