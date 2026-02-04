/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Instagram,
  MapPin,
  Heart,
  ExternalLink,
  Play,
  Eye,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatNumber } from "@/utils/Formatnumbers";
import { THEMES, ThemeKey } from "@/theme/themes";

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
  portfolio_theme?: ThemeKey;
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

/**
 * Live Media Kit - Premium Creator Portfolio (REDESIGNED)
 * 
 * NEW FEATURES:
 * - Theme preserved from setup
 * - Simple, premium design
 * - Shows followers beautifully (not separate card)
 * - Individual post stats (views, likes) with formatting
 * - No avg engagement/reach
 * - Creator-first approach
 */
const LiveMediaKit = () => {
  const { handle } = useParams<{ handle: string }>();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Get theme from profile or use default
  const themeKey = profile?.portfolio_theme || "default";
  const theme = THEMES[themeKey];

  useEffect(() => {
    loadCreatorProfile();
  }, [handle]);

  const loadCreatorProfile = async () => {
    try {
      // Fetch influencer profile
      const { data: influencerData, error: influencerError } = await supabase
        .from("influencer_profiles")
        .select("*")
        .eq("instagram_handle", handle)
        .eq("media_kit_enabled", true)
        .single<CreatorProfile>();

      if (influencerError) throw influencerError;

      // Fetch portfolio content
      const { data: portfolioData } = await supabase
        .from("portfolio_content")
        .select("*")
        .eq("influencer_id", influencerData.id)
        .order("display_order", { ascending: true })
        .limit(6);

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
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: theme.background }}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white/50" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: theme.background }}
      >
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Themed Background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ background: theme.background }}
      />

      {/* Header */}
      <div className="relative z-10 bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-white">Creator Portfolio</h1>
            <a
              href={`https://instagram.com/${profile.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="sm"
                className="text-white border-white/20 hover:bg-white/10"
              >
                <Instagram className="h-4 w-4 mr-2" />
                Follow
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Header - Premium Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Card className={`${theme.card} ${theme.radius} overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />

            <CardContent className="relative p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                {/* Profile Image */}
                <div className="relative flex-shrink-0">
                  <div className={`h-32 w-32 md:h-40 md:w-40 rounded-full bg-gradient-to-br  p-1`}>
                    {profile.profile_image_url ? (
                      <img
                        src={profile.profile_image_url}
                        alt={profile.instagram_handle}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-4xl font-bold text-white">
                        {profile.instagram_handle.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  {/* Followers Badge - Integrated */}
                  <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full ${theme.card} border border-white/10 backdrop-blur-xl`}>
                    <p className={`text-sm font-semibold ${theme.text} whitespace-nowrap`}>
                      {formatNumber(profile.followers_count)} followers
                    </p>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left mt-4 md:mt-0">
                  <h2 className={`text-3xl md:text-4xl font-bold ${theme.text} mb-2`}>
                    @{profile.instagram_handle}
                  </h2>

                  {profile.city && profile.state && (
                    <div className={`flex items-center gap-2 ${theme.muted} mb-4 justify-center md:justify-start`}>
                      <MapPin className="h-4 w-4" />
                      <span>
                        {profile.city}, {profile.state}
                      </span>
                    </div>
                  )}

                  {/* Bio */}
                  {profile.media_kit_bio && (
                    <p className={`${theme.text} opacity-80 mb-4 max-w-2xl`}>
                      {profile.media_kit_bio}
                    </p>
                  )}

                  {/* Niches */}
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {profile.niches?.map((niche) => (
                      <span
                        key={niche}
                        className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${theme.primary} bg-opacity-20 ${theme.text} text-sm border border-white/10`}
                      >
                        {niche}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Portfolio Grid - Premium, Simple Design */}
        {portfolio.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-6 flex items-center gap-3">
              <Sparkles className={`h-6 w-6 ${theme.accent}`} />
              <h2 className={`text-2xl font-bold ${theme.text}`}>
                Best Performing Content
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {portfolio.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <a
                    href={item.instagram_post_url || `https://instagram.com/${profile.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Card className={`${theme.card} ${theme.radius} overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl`}>
                      {/* Content Preview */}
                      <div className="relative aspect-square bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                        <div className="w-full h-full flex items-center justify-center">
                          {item.content_type === "video" ? (
                            <Play className={`h-16 w-16 ${theme.accent}`} />
                          ) : (
                            <Instagram className={`h-16 w-16 ${theme.accent}`} />
                          )}
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="text-center">
                            <ExternalLink className="h-8 w-8 text-white mx-auto mb-2" />
                            <p className="text-white text-sm font-medium">
                              View on Instagram
                            </p>
                          </div>
                        </div>

                        {/* Content Type Badge */}
                        {item.content_type === "video" && (
                          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-full p-2">
                            <Play className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Stats - Clean, Premium Design */}
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Eye className={`h-4 w-4 ${theme.accent}`} />
                            <span className={`text-sm font-medium ${theme.text}`}>
                              {formatNumber(item.reach_count)}
                            </span>
                            <span className={`text-xs ${theme.muted}`}>views</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Heart className={`h-4 w-4 ${theme.accent}`} />
                            <span className={`text-sm font-medium ${theme.text}`}>
                              {formatNumber(item.engagement_count)}
                            </span>
                            <span className={`text-xs ${theme.muted}`}>likes</span>
                          </div>
                        </div>

                        {/* Link Preview */}
                        <div className={`text-xs ${theme.muted} truncate flex items-center gap-1`}>
                          <Instagram className="h-3 w-3" />
                          <span className="truncate">
                            {item.instagram_post_url?.replace('https://instagram.com/', '').replace('https://www.instagram.com/', '')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${theme.card} ${theme.radius} p-8 text-center`}
        >
          <h3 className={`text-2xl font-bold ${theme.text} mb-3`}>
            Ready to Collaborate?
          </h3>
          <p className={`${theme.muted} mb-6 max-w-md mx-auto`}>
            Connect with me on Instagram to discuss partnership opportunities
          </p>
          <a
            href={`https://instagram.com/${profile.instagram_handle}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              className={`bg-gradient-to-r ${theme.primary} text-white px-8`}
            >
              <Instagram className="h-5 w-5 mr-2" />
              Let's Work Together
            </Button>
          </a>
        </motion.div>

        {/* Powered by Badge */}
        <div className="text-center py-4">
          <a 
            href="https://dotfluence.in" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 text-sm ${theme.muted} hover:text-white transition-colors`}
          >
            <span>Powered by Dotfluence</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default LiveMediaKit;