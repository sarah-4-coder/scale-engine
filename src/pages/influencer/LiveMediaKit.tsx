/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
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
  avg_engagement_rate?: number;
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
        .select("*")
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
      setPortfolio(portfolioData || []);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Creator profile not found");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Creator Not Found</h1>
          <p className="text-white/60">This profile doesn't exist or is not public yet</p>
        </div>
      </div>
    );
  }

  // Calculate average engagement rate
  const avgEngagement = profile.avg_engagement_rate || 
    (portfolio.length > 0 
      ? (portfolio.reduce((sum, item) => sum + ((item.engagement_count || 0) / (item.reach_count || 1)) * 100, 0) / portfolio.length)
      : 4.8);

  // Calculate average reach
  const avgReach = portfolio.length > 0
    ? portfolio.reduce((sum, item) => sum + (item.reach_count || 0), 0) / portfolio.length
    : profile.followers_count * 0.36;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30">
      {/* Dynamic Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-900/20 blur-[120px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled ? "bg-black/80 backdrop-blur-md py-3" : "bg-transparent py-4 md:py-6"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-lg flex items-center justify-center font-bold text-sm md:text-base">
              D
            </div>
            <span className="font-bold tracking-tight text-lg md:text-xl">DOTFLUENCE</span>
          </div>
          <a
            href={`https://instagram.com/${profile.instagram_handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-black px-4 md:px-5 py-2 rounded-full text-xs md:text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <Instagram size={14} className="md:w-4 md:h-4" />
            <span className="hidden sm:inline">Contact Creator</span>
            <span className="sm:hidden">Contact</span>
          </a>
        </div>
      </nav>

      {/* Hero Section - FIXED FOR MOBILE */}
      <section className="relative z-10 pt-24 md:pt-32 pb-12 md:pb-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Mobile Layout: Image First, Then Info */}
          <div className="md:hidden space-y-6">
            {/* Profile Image - Mobile */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative flex justify-center"
            >
              <div className="relative z-10 aspect-[4/5] w-full max-w-xs rounded-[2rem] overflow-hidden border border-white/20 shadow-2xl">
                {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-6xl font-bold">
                    {profile.instagram_handle.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Handle</p>
                    <p className="text-lg font-bold break-all">@{profile.instagram_handle}</p>
                  </div>
                  {profile.city && profile.state && (
                    <div className="text-right">
                      <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Location</p>
                      <p className="text-xs font-medium flex items-center gap-1 justify-end">
                        <MapPin size={14} /> {profile.city}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute -top-4 -left-4 w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full blur-2xl opacity-50" />
            </motion.div>

            {/* Info - Mobile */}
            <div className="space-y-4 text-center px-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-medium"
              >
                <CheckCircle2 size={12} className="text-blue-400" />
                Verified Dotfluence Creator
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl sm:text-5xl font-black tracking-tighter leading-[0.9] break-words"
              >
                {profile.full_name.split(" ")[0]} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
                  {profile.full_name.split(" ").slice(1).join(" ")}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-white/60 leading-relaxed break-words"
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
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-medium"
              >
                <CheckCircle2 size={12} className="text-blue-400" />
                Verified Dotfluence Creator
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9] break-words pr-4"
              >
                {profile.full_name.split(" ")[0]} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
                  {profile.full_name.split(" ").slice(1).join(" ")}
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-base lg:text-lg text-white/60 max-w-lg leading-relaxed break-words pr-4"
              >
                {profile.media_kit_bio || profile.bio}
              </motion.p>

              <div className="flex flex-wrap gap-3 pr-4">
                {profile.niches?.map((niche) => (
                  <span
                    key={niche}
                    className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors"
                  >
                    {niche}
                  </span>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="md:col-span-5 relative"
            >
              <div className="relative z-10 aspect-[4/5] max-w-sm mx-auto rounded-[2rem] overflow-hidden border border-white/20 shadow-2xl">
                {profile.profile_image_url ? (
                  <img
                    src={profile.profile_image_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-6xl font-bold">
                    {profile.instagram_handle.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                  <div className="max-w-[60%]">
                    <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Handle</p>
                    <p className="text-xl font-bold break-all">@{profile.instagram_handle}</p>
                  </div>
                  {profile.city && profile.state && (
                    <div className="text-right">
                      <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Location</p>
                      <p className="text-sm font-medium flex items-center gap-1 justify-end">
                        <MapPin size={14} /> {profile.city}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-500 rounded-full blur-2xl opacity-50" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative z-10 px-4 md:px-6 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: "Followers", value: formatNumber(profile.followers_count), icon: Users },
              { label: "Avg Engagement", value: `${avgEngagement.toFixed(1)}%`, icon: Heart },
              { label: "Avg Reach", value: formatNumber(Math.round(avgReach)), icon: TrendingUp },
              { label: "Content Types", value: portfolio.length, icon: Camera },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <stat.icon className="text-purple-400 mb-2 md:mb-3" size={18} />
                <p className="text-2xl md:text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-white/40 text-xs md:text-sm mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <section className="relative z-10 px-4 md:px-6 pb-16 md:pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-4 md:gap-8 border-b border-white/10 mb-8 md:mb-12 overflow-x-auto">
            {["portfolio", "audience", "services"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`pb-3 md:pb-4 text-xs md:text-sm font-bold uppercase tracking-widest relative transition-colors whitespace-nowrap ${
                  activeTab === tab ? "text-white" : "text-white/40"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="tab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500"
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "portfolio" && (
              <motion.div
                key="portfolio"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
              >
                {portfolio.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-[3/4] rounded-2xl md:rounded-3xl overflow-hidden bg-white/5 border border-white/10"
                  >
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      {item.content_type === "video" ? (
                        <Play className="h-12 w-12 md:h-16 md:w-16 text-purple-400" />
                      ) : (
                        <Camera className="h-12 w-12 md:h-16 md:w-16 text-purple-400" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-6 md:p-8 flex flex-col justify-end">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <Eye size={16} className="text-purple-400 md:w-[18px] md:h-[18px]" />
                          <span className="font-bold text-sm md:text-base">
                            {formatNumber(item.reach_count)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Heart size={16} className="text-pink-400 md:w-[18px] md:h-[18px]" />
                          <span className="font-bold text-sm md:text-base">
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
                        <Play size={14} className="text-white md:w-4 md:h-4" fill="white" />
                      </div>
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === "audience" && (
              <motion.div
                key="audience"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid md:grid-cols-2 gap-6 md:gap-8"
              >
                <div className="p-6 md:p-8 rounded-2xl md:rounded-3xl bg-white/5 border border-white/10">
                  <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2">
                    <Globe size={18} className="text-purple-400 md:w-5 md:h-5" /> Audience Insights
                  </h3>
                  <div className="space-y-4">
                    <div className="text-center py-6">
                      <BarChart3 className="mx-auto mb-4 text-purple-400" size={48} />
                      <p className="text-white/60 text-sm">
                        Detailed audience demographics available on request
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6 md:p-8 rounded-2xl md:rounded-3xl bg-white/5 border border-white/10">
                  <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2">
                    <Users size={18} className="text-pink-400 md:w-5 md:h-5" /> Engagement Quality
                  </h3>
                  <div className="text-center py-6">
                    <div className="text-4xl md:text-5xl font-black text-purple-400 mb-2">
                      {avgEngagement.toFixed(1)}%
                    </div>
                    <div className="text-white/40 text-xs md:text-sm uppercase tracking-widest">
                      Average Engagement Rate
                    </div>
                    <p className="text-white/60 text-xs md:text-sm mt-4">
                      High-quality, authentic audience interaction
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "services" && (
              <motion.div
                key="services"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid md:grid-cols-3 gap-4 md:gap-6"
              >
                {profile.services && profile.services.length > 0 ? (
                  profile.services.map((service, i) => (
                    <div
                      key={i}
                      className="p-6 md:p-8 rounded-2xl md:rounded-3xl bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors"
                    >
                      <h4 className="text-lg md:text-xl font-bold mb-2">{service.name}</h4>
                      <p className="text-white/40 text-xs md:text-sm mb-4 md:mb-6 leading-relaxed">
                        {service.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-400 font-bold text-sm md:text-base">{service.price}</span>
                        <a
                          href={`https://instagram.com/${profile.instagram_handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <button className="text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white flex items-center gap-1">
                            Inquire <ExternalLink size={12} />
                          </button>
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full p-8 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-white/60 text-sm">
                      Contact creator directly for collaboration opportunities
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-4 md:px-6 py-16 md:py-32 text-center">
        <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
          <h2 className="text-3xl md:text-4xl lg:text-6xl font-black leading-tight break-words px-2">
            Let's create something{" "}
            <span className="italic font-serif text-purple-400">extraordinary</span> together.
          </h2>
          <div className="flex flex-col md:flex-row justify-center gap-3 md:gap-4">
            <a
              href={`https://instagram.com/${profile.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto"
            >
              <button className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-500 px-8 md:px-10 py-3 md:py-4 rounded-2xl font-bold text-sm md:text-lg hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all">
                Start Collaboration
              </button>
            </a>
            <a
              href={`https://instagram.com/${profile.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto"
            >
              <button className="w-full md:w-auto bg-white/5 border border-white/10 backdrop-blur-md px-8 md:px-10 py-3 md:py-4 rounded-2xl font-bold text-sm md:text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2">
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
            <a href="https://dotfluence.in" className="text-white/60 hover:text-white">
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
    </div>
  );
};

export default LiveMediaKit;