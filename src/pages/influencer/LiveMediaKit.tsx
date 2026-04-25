/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, memo } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Instagram,
  MapPin,
  Heart,
  ExternalLink,
  Play,
  Eye,
  Users,
  TrendingUp,
  Globe,
  Mail,
  CheckCircle2,
  Camera,
  BarChart3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";
import { ThemeKey } from "@/theme/themes";
import { PORTFOLIO_THEMES, PortfolioThemeKey } from "@/theme/portfolioThemes";
import ThemedStudioBackground from "@/components/influencer/ThemedStudioBackground";
import { HireMeModal } from "@/components/influencer/HireMeModal";

interface CreatorProfile {
  id: string;
  user_id: string;
  instagram_handle: string;
  followers_count: number;
  niches: string[];
  bio: string | null;
  profile_image_url: string | null;
  media_kit_bio: string | null;
  city: string | null;
  state: string | null;
  full_name: string;
  portfolio_theme?: string;
  services?: Array<{
    name: string;
    description: string;
    price: string;
  }>;
}

interface PortfolioItem {
  id: string;
  content_type: "image" | "video";
  content_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  reach_count: number | null;
  engagement_count: number | null;
  posted_date: string | null;
  instagram_post_url: string | null;
}

const getThumbnailUrl = (url: string | null) => {
  if (!url) return null;
  if (url.includes("instagram.com")) {
    // Remove query params and trailing slash for cleaner transformation
    const cleanUrl = url.split("?")[0].replace(/\/$/, "");
    return `${cleanUrl}/media/?size=l`;
  }
  return url;
};

const formatNumber = (num: number | null | undefined): string => {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

/**
 * DOTFLUENCE - Premium Live Media Kit
 * A high-conversion, professional portfolio for modern creators
 */
const LiveMediaKit = () => {
  const { handle } = useParams<{ handle: string }>();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"portfolio" | "audience" | "services">("portfolio");
  const [scrolled, setScrolled] = useState(false);
  const [hireMeOpen, setHireMeOpen] = useState(false);
  // PORTFOLIO THEME RESOLUTION
  const selectedThemeKey = (profile?.portfolio_theme as PortfolioThemeKey) || "default";
  const themeValues = PORTFOLIO_THEMES[selectedThemeKey] || PORTFOLIO_THEMES.default;
  const themeKey = themeValues.uiThemeKey as ThemeKey;
  const theme = themeValues;

  useEffect(() => {
    loadCreatorProfile();
  }, [handle]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const loadCreatorProfile = async () => {
    try {
      const { data: influencerData, error: influencerError } = await supabase
        .from("influencer_profiles")
        .select("id, user_id, instagram_handle, followers_count, niches, bio, profile_image_url, media_kit_bio, city, state, full_name, services, portfolio_theme")
        .eq("instagram_handle", handle)
        .eq("media_kit_enabled", true)
        .single<CreatorProfile>();

      if (influencerError) throw influencerError;

      const { data: portfolioData } = await supabase
        .from("portfolio_content")
        .select("*")
        .eq("influencer_id", influencerData.id)
        .order("display_order", { ascending: true });

      setProfile(influencerData);
      setPortfolio((portfolioData as PortfolioItem[]) || []);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Creator profile not found");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${themeKey === 'dark' ? 'bg-[#050505]' : 'bg-slate-50'} flex items-center justify-center`}>
        <div className={`animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 ${themeKey === 'dark' ? 'border-blue-600' : 'border-blue-600'}`} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Creator Not Found
          </h1>
          <p className="text-white/60">
            This profile doesn't exist or is not public yet
          </p>
        </div>
      </div>
    );
  }

  // ===============================
  // ENGAGEMENT & REACH CALCULATION
  // ===============================

  // Total engagement across all contents
  const totalEngagement = portfolio.reduce(
    (sum, item) => sum + (item.engagement_count || 0),
    0,
  );

  // Total views / reach across all contents
  const totalViews = portfolio.reduce(
    (sum, item) => sum + (item.reach_count || 0),
    0,
  );

  // ✅ FINAL: Weighted Average Engagement Rate (%)
  const avgEngagement =
    (totalViews > 0 ? (totalEngagement / totalViews) * 100 : 4.8); // safe fallback

  // ✅ FINAL: Average Reach per Content
  const avgReach =
    portfolio.length > 0
      ? totalViews / portfolio.length
      : profile.followers_count * 0.36; // realistic IG reach assumption

  return (
    <div 
      className={`min-h-screen transition-all duration-700 selection:bg-blue-500/30 overflow-x-hidden ${theme.fontFamily}`}
      style={{ background: theme.background }}
    >
      <ThemedStudioBackground themeKey={themeKey} />

      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-500 ${
          scrolled
            ? (themeKey === 'dark' ? "bg-black/90" : "bg-white/90") + " backdrop-blur-xl border-b border-white/5 py-4"
            : "bg-transparent py-6 md:py-8"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 md:w-8 md:h-8 ${themeKey === 'dark' ? 'bg-white/5 border-white/10 text-blue-400' : 'bg-blue-600 text-white'} rounded-lg flex items-center justify-center font-black text-sm md:text-base border shadow-sm`}>
              D
            </div>
            <span className={`font-black tracking-tight text-lg md:text-xl ${themeKey === 'dark' ? 'text-white' : 'text-slate-900'}`}>
              DOTFLUENCE
            </span>
          </div>
          <motion.a
            href={`https://instagram.com/${profile.instagram_handle}`}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05, rotateZ: 2 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 md:px-6 py-2.5 rounded-full text-xs md:text-sm font-black flex items-center gap-2 transition-all ${theme.buttonClass}`}
          >
            <Instagram size={14} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">Contact Creator</span>
            <span className="sm:hidden">Contact</span>
          </motion.a>
          <motion.button
            onClick={() => setHireMeOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 md:px-6 py-2.5 rounded-full text-xs md:text-sm font-black flex items-center gap-2 transition-all ${theme.buttonClass}`}
          >
            ✉️ <span className="hidden sm:inline">Work With Me</span><span className="sm:hidden">Hire</span>
          </motion.button>
        </div>
      </nav>

      {/* Hero Section - FIXED FOR MOBILE */}
      <section className="relative z-10 pt-24 md:pt-32 pb-12 md:pb-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Mobile Layout: Image First, Then Info */}
          <div className="md:hidden space-y-6">
            {/* Profile Image - Mobile */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              className="relative flex justify-center"
            >
              <motion.div
                className={`relative z-10 aspect-[4/5] w-full max-w-xs ${theme.radius} overflow-hidden border ${theme.border} ${theme.heroGlow || 'shadow-[0_0_50px_rgba(37,99,235,0.15)]'} transition-shadow duration-500`}
              >
                {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full ${themeKey === 'dark' ? 'bg-gradient-to-br from-blue-500/20 to-blue-800/20' : 'bg-slate-100'} flex items-center justify-center text-6xl font-bold`}>
                    {profile.instagram_handle.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-widest mb-1">
                      Handle
                    </p>
                    <p className="text-lg font-bold break-all">
                      @{profile.instagram_handle}
                    </p>
                  </div>
                  {profile.city && profile.state && (
                    <div className="text-right">
                      <p className="text-white/60 text-xs uppercase tracking-widest mb-1">
                        Location
                      </p>
                      <p className="text-xs font-medium flex items-center gap-1 justify-end">
                        <MapPin size={14} /> {profile.city}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
              <div className={`absolute -top-4 -left-4 w-20 h-20 bg-blue-500/20 rounded-full blur-2xl opacity-50`} />
            </motion.div>

            {/* Info - Mobile */}
            <div className="space-y-4 text-center px-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'} border ${theme.muted} text-xs font-medium`}
              >
                <CheckCircle2 size={12} className={themeKey === 'dark' ? 'text-blue-500' : 'text-blue-600'} />
                Verified Dotfluence Creator
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-4xl sm:text-5xl font-black tracking-tighter leading-[0.9] break-words ${themeKey === 'dark' ? 'text-white' : 'text-slate-950'}`}
              >
                {profile.full_name.split(" ")[0]} <br />
                <span className={`text-transparent bg-clip-text bg-gradient-to-r ${themeKey === 'dark' ? 'from-blue-200 via-blue-300 to-blue-200' : 'from-blue-600 via-blue-700 to-blue-900'}`}>
                  {profile.full_name.split(" ").slice(1).join(" ")}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`text-sm ${theme.muted} leading-relaxed break-words`}
              >
                {profile.media_kit_bio || profile.bio}
              </motion.p>

              <div className="flex flex-wrap gap-2 justify-center">
                {profile.niches?.map((niche) => (
                  <span
                    key={niche}
                    className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs hover:bg-white/10 transition-colors"
                  >
                    {niche}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Layout: Side by Side */}
          <div className="hidden md:grid md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-7 space-y-6 text-left">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'} border ${theme.muted} text-xs font-medium`}
              >
                <CheckCircle2 size={12} className="text-blue-600" />
                Verified Dotfluence Creator
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9] break-words pr-4 ${themeKey === 'dark' ? 'text-white' : 'text-slate-900'}`}
              >
                {profile.full_name.split(" ")[0]} <br />
                <span className={`text-transparent bg-clip-text bg-gradient-to-r ${themeKey === 'dark' ? 'from-blue-200 via-blue-300 to-blue-200' : 'from-blue-600 via-blue-700 to-blue-900'}`}>
                  {profile.full_name.split(" ").slice(1).join(" ")}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`text-base lg:text-lg ${theme.muted} max-w-lg leading-relaxed break-words pr-4 font-medium`}
              >
                {profile.media_kit_bio || profile.bio}
              </motion.p>

              <div className="flex flex-wrap gap-3 pr-4">
                {profile.niches?.map((niche) => (
                  <span
                    key={niche}
                    className={`px-5 py-2.5 rounded-2xl ${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/5'} border ${theme.muted} text-xs font-black uppercase tracking-widest hover:scale-105 transition-all`}
                  >
                    {niche}
                  </span>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateX: 20, y: 50 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
              className="md:col-span-5 relative group"
              style={{ perspective: 1000 }}
            >
              <motion.div
                className="relative z-10 aspect-[4/5] max-w-sm mx-auto rounded-[2rem] overflow-hidden border border-white/20 shadow-[0_40px_80px_rgba(0,0,0,0.5)] group-hover:shadow-[0_40px_100px_rgba(37,99,235,0.4)] transition-all duration-700"
              >
                {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full ${themeKey === 'dark' ? 'bg-gradient-to-br from-blue-500/20 to-blue-800/20' : 'bg-slate-100'} flex items-center justify-center text-6xl font-bold`}>
                    {profile.instagram_handle.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                  <div className="max-w-[60%]">
                    <p className="text-white/60 text-xs uppercase tracking-widest mb-1">
                      Handle
                    </p>
                    <p className="text-xl font-bold break-all">
                      @{profile.instagram_handle}
                    </p>
                  </div>
                  {profile.city && profile.state && (
                    <div className="text-right">
                      <p className="text-white/60 text-xs uppercase tracking-widest mb-1">
                        Location
                      </p>
                      <p className="text-sm font-medium flex items-center gap-1 justify-end">
                        <MapPin size={14} /> {profile.city}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
              <div className={`absolute -top-4 -right-4 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl opacity-50`} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-10 px-4 md:px-6 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              {
                label: "Followers",
                value: formatNumber(profile.followers_count),
                icon: Users,
              },
              {
                label: "Avg Engagement",
                value: `${avgEngagement.toFixed(1)}%`,
                icon: Heart,
              },
              {
                label: "Avg Reach",
                value: formatNumber(Math.round(avgReach)),
                icon: TrendingUp,
              },
              { label: "Content Types", value: portfolio.length, icon: Camera },
            ].map((stat, i) => (
              <div
                key={i}
                className={`p-4 md:p-8 rounded-2xl md:rounded-[2rem] ${theme.card} border border-white/5 shadow-2xl hover:shadow-[0_20px_50px_rgba(37,99,235,0.2)] transition-all duration-300 hover:-translate-y-1`}
              >
                <stat.icon className={`${themeKey === 'dark' ? 'text-blue-400' : 'text-blue-600'} mb-2 md:mb-4 drop-shadow-[0_0_15px_rgba(37,99,235,0.5)]`} size={20} />
                <p className={`text-2xl md:text-4xl font-black tracking-tighter ${theme.text}`}>
                  {stat.value}
                </p>
                <p className={`text-[10px] md:text-xs font-black uppercase tracking-widest mt-1 ${theme.muted}`}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <section className="relative z-10 px-4 md:px-6 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto">
          <div className={`flex gap-4 md:gap-8 ${themeKey === 'dark' ? 'border-white/10' : 'border-slate-200'} mb-8 md:mb-12 overflow-x-auto border-b`}>
            {["portfolio", "audience", "services"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`pb-3 md:pb-4 text-xs md:text-sm font-black uppercase tracking-[0.2em] relative transition-all whitespace-nowrap ${
                  activeTab === tab 
                    ? (themeKey === 'dark' ? "text-white" : "text-blue-600 font-black") 
                    : (themeKey === 'dark' ? "text-white/40" : "text-slate-400 font-bold")
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-1 ${themeKey === 'dark' ? 'bg-blue-600' : 'bg-blue-600'} transition-all duration-300`}
                  />
                )}
              </button>
            ))}
          </div>

          {activeTab === "portfolio" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {portfolio.map((item, index) => (
                <div
                  key={item.id}
                  className={`group relative aspect-[3/4] rounded-[2rem] overflow-hidden ${theme.card} border border-white/5 transition-all duration-500 hover:shadow-[0_30px_60px_rgba(37,99,235,0.2)] hover:-translate-y-1`}
                >
                  <div className="absolute inset-0 w-full h-full bg-slate-900/50">
                    <img 
                      src={getThumbnailUrl(item.thumbnail_url || item.content_url) || ""} 
                      alt={item.caption || "Portfolio item"} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className={`absolute inset-0 flex items-center justify-center -z-10 bg-gradient-to-br ${themeKey === 'dark' ? 'from-blue-600/10' : 'from-blue-600/10'} to-transparent`}>
                      {item.content_type === "video" ? (
                        <Play className={`h-12 w-12 md:h-16 md:w-16 ${themeKey === 'dark' ? 'text-blue-600' : 'text-blue-600'} opacity-50`} />
                      ) : (
                        <Camera className={`h-12 w-12 md:h-16 md:w-16 ${themeKey === 'dark' ? 'text-blue-600' : 'text-blue-600'} opacity-50`} />
                      )}
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-6 md:p-8 flex flex-col justify-end">
                    <div className="flex justify-between items-center mb-4 text-white">
                      <div className="flex items-center gap-2">
                        <Eye size={16} className="text-blue-400" />
                        <span className="font-black text-sm md:text-base">
                          {formatNumber(item.reach_count)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Heart size={16} className="text-rose-500" />
                        <span className="font-black text-sm md:text-base">
                          {formatNumber(item.engagement_count)}
                        </span>
                      </div>
                    </div>
                    <a
                      href={item.instagram_post_url || `https://instagram.com/${profile.instagram_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 md:py-3 bg-white text-black rounded-xl text-center font-bold text-sm flex items-center justify-center gap-2 hover:bg-white/90 transition-colors"
                    >
                      {item.content_type === "video" ? (
                        <Play size={14} fill="currentColor" />
                      ) : (
                        <Camera size={14} />
                      )}
                      View Content
                    </a>
                  </div>
                  {item.content_type === "video" && (
                    <div className="absolute top-3 md:top-4 right-3 md:right-4 p-2 bg-black/40 backdrop-blur-md rounded-full">
                      <Play size={14} className="text-white" fill="white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === "audience" && (
            <div className="grid md:grid-cols-2 gap-4 md:gap-8">
              <div className={`p-5 md:p-8 rounded-2xl md:rounded-3xl ${theme.card} border border-white/5 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)] hover:-translate-y-1`}>
                <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2">
                  <Globe size={18} className="text-blue-500" /> Audience Insights
                </h3>
                <div className="space-y-4">
                  <div className="text-center py-6">
                    <BarChart3 className="mx-auto mb-4 text-blue-500/50" size={48} />
                    <p className="text-white/60 text-sm">Detailed audience demographics available on request</p>
                  </div>
                </div>
              </div>
              <div className={`p-5 md:p-8 rounded-2xl md:rounded-3xl ${theme.card} border border-white/5 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(225,29,72,0.15)] hover:-translate-y-1`}>
                <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2">
                  <Users size={18} className="text-rose-500" /> Engagement Quality
                </h3>
                <div className="text-center py-6 md:py-10">
                  <div className={`text-4xl md:text-7xl font-black ${themeKey === 'dark' ? 'text-blue-500' : 'text-blue-600'} mb-2 tracking-tighter`}>
                    {avgEngagement.toFixed(1)}%
                  </div>
                  <div className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] ${theme.muted}`}>
                    Average Engagement Rate
                  </div>
                  <p className={`text-sm ${theme.muted} mt-6 font-medium`}>High-quality, authentic audience interaction</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "services" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {profile.services && profile.services.length > 0 ? (
                profile.services.map((service, i) => (
                  <div
                    key={i}
                    className={`p-5 md:p-8 rounded-xl md:rounded-3xl ${theme.card} border-white/5 border hover:border-blue-600/50 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(37,99,235,0.15)] hover:-translate-y-1`}
                  >
                    <h4 className={`text-xl md:text-2xl font-black mb-1 md:mb-2 ${theme.text}`}>
                      {service.name}
                    </h4>
                    <p className={`${theme.muted} text-[11px] md:text-sm mb-4 md:mb-6 leading-relaxed font-medium`}>
                      {service.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className={`${themeKey === 'dark' ? 'text-blue-500' : 'text-blue-600'} font-bold text-sm md:text-base`}>
                        {service.price}
                      </span>
                      <a
                        href={`https://instagram.com/${profile.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <button className={`text-xs font-bold uppercase tracking-widest ${themeKey === 'dark' ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-blue-600'} flex items-center gap-1`}>
                          Inquire <ExternalLink size={12} />
                        </button>
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className={`col-span-full p-8 rounded-2xl ${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} text-center`}>
                  <p className={`${theme.muted} text-sm`}>
                    Contact creator directly for collaboration opportunities
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-4 md:px-6 py-12 md:py-32 text-center">
        <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
          <h2 className={`text-3xl md:text-5xl lg:text-7xl font-black leading-tight break-words px-2 ${theme.text}`}>
            Let's create something{" "}
            <span className={`italic font-serif ${themeKey === 'dark' ? 'text-blue-500' : 'text-blue-600'}`}>
              extraordinary
            </span>{" "}
            together.
          </h2>
          <div className="flex flex-col md:flex-row justify-center gap-3 md:gap-4">
            <a
              href={`https://instagram.com/${profile.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto"
            >
              <button className={`w-full md:w-auto bg-gradient-to-r ${themeKey === 'dark' ? 'from-blue-600 to-blue-800' : 'from-blue-600 to-blue-800'} px-8 md:px-10 py-3 md:py-4 rounded-2xl font-bold text-sm md:text-lg text-white hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all`}>
                Start Collaboration
              </button>
            </a>
            <a
              href={`https://instagram.com/${profile.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto"
            >
              <button className={`w-full md:w-auto ${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'} backdrop-blur-md px-8 md:px-10 py-3 md:py-4 rounded-2xl font-bold text-sm md:text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2 ${themeKey === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                <Mail size={18} className="md:w-5 md:h-5" /> Send Message
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 md:py-12 px-4 md:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
          <div className="text-white/30 text-xs md:text-sm text-center md:text-left">
            © 2026 {profile.full_name}. Verified by{" "}
            <a
              href="https://dotfluence.in"
              className="text-white/60 hover:text-white"
            >
              Dotfluence
            </a>
            .
          </div>
          <div className="flex gap-4 md:gap-6 text-white/30 text-xs md:text-sm">
            {/* <a href="#" className="hover:text-white">
              Terms
            </a>
            <a href="#" className="hover:text-white">
              Privacy
            </a> */}
            <a href="https://dotfluence.in" className="hover:text-white">
              Powered by Dotfluence
            </a>
          </div>
        </div>
      </footer>

      <HireMeModal
        open={hireMeOpen}
        onClose={() => setHireMeOpen(false)}
        influencerId={profile.id}
        influencerName={profile.full_name}
      />
    </div>
  );
};

export default LiveMediaKit;
