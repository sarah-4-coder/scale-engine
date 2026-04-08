/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Copy, Share2, Sparkles, Settings, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ProfileLinkCardProps {
  userId: string;
}

/**
 * Profile Link Card Component (Updated)
 * 
 * Shows:
 * - Media kit status (complete/incomplete)
 * - Shareable link (if complete)
 * - Setup CTA (if incomplete)
 */
export const ProfileLinkCard = ({ userId }: ProfileLinkCardProps) => {
  const { theme, themeKey } = useInfluencerTheme();
  const navigate = useNavigate();
  
  const [instagramHandle, setInstagramHandle] = useState<string | null>(null);
  const [profileUrl, setProfileUrl] = useState<string>("");
  const [isMediaKitComplete, setIsMediaKitComplete] = useState(false);
  const [portfolioCount, setPortfolioCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data: influencerData } = await supabase
        .from("influencer_profiles")
        .select("id, instagram_handle, media_kit_completed, media_kit_enabled, profile_image_url, media_kit_bio")
        .eq("user_id", userId)
        .single() as { data: { id: string; instagram_handle: string; media_kit_completed: boolean; media_kit_enabled: boolean; profile_image_url: string; media_kit_bio: string } | null };

      if (influencerData && influencerData.instagram_handle) {
        setInstagramHandle(influencerData.instagram_handle);
        setProfileUrl(`${window.location.origin}/creators/${influencerData.instagram_handle}`);
        setIsMediaKitComplete(influencerData.media_kit_completed || false);

        // Count portfolio items
        const { data: portfolioData } = await supabase
          .from("portfolio_content")
          .select("id")
          .eq("influencer_id", influencerData.id);

        setPortfolioCount(portfolioData?.length || 0);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    toast.success("Link copied to clipboard!");
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Professional Media Kit",
          text: "Check out my creator portfolio!",
          url: profileUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      copyLink();
    }
  };

  const openLink = () => {
    window.open(profileUrl, "_blank");
  };

  if (loading) {
    return (
      <Card className={`${theme.card} ${theme.radius}`}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-white/10 rounded w-1/3" />
            <div className="h-10 bg-white/10 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!instagramHandle) {
    return null;
  }

  // If media kit is NOT complete, show setup CTA
  if (!isMediaKitComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card className={`${theme.card} ${theme.radius} border-2 border-blue-500/30 shadow-blue-500/5`}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <CardTitle className={`text-lg ${themeKey === 'dark' ? 'text-white' : 'text-slate-900'}`}>Create Your Media Kit</CardTitle>
            </div>
            <CardDescription className={theme.muted}>
              Get a professional portfolio link to share with brands
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Progress Checklist */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className={`h-2 w-2 rounded-full ${portfolioCount >= 1 ? 'bg-blue-600 shadow-[0_0_8px_#9333ea]' : (themeKey === 'dark' ? 'bg-white/20' : 'bg-slate-200 shadow-none')}`} />
                <span className={themeKey === 'dark' ? 'text-white/70' : 'text-slate-700'}>Upload profile image</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`h-2 w-2 rounded-full ${portfolioCount >= 1 ? 'bg-blue-600 shadow-[0_0_8px_#9333ea]' : (themeKey === 'dark' ? 'bg-white/20' : 'bg-slate-200 shadow-none')}`} />
                <span className={themeKey === 'dark' ? 'text-white/70' : 'text-slate-700'}>Write your bio</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`h-2 w-2 rounded-full ${portfolioCount >= 3 ? 'bg-blue-600 shadow-[0_0_8px_#9333ea]' : (themeKey === 'dark' ? 'bg-white/20' : 'bg-slate-200 shadow-none')}`} />
                <span className={themeKey === 'dark' ? 'text-white/70' : 'text-slate-700'}>Add 3+ portfolio items ({portfolioCount}/3)</span>
              </div>
            </div>

            {/* CTA */}
            <Button
              onClick={() => navigate("/dashboard/media-kit/setup")}
              className={`w-full ${themeKey === 'dark' ? 'bg-white text-blue-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-100'} font-black rounded-2xl h-14`}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Setup Media Kit (2 min)
            </Button>

            {/* Info */}
            <div className={`${themeKey === 'dark' ? 'bg-blue-600/10 border-blue-600/30' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4`}>
              <p className={`text-xs ${themeKey === 'dark' ? 'text-blue-200' : 'text-slate-600'} font-medium`}>
                💡 Get a shareable link like: <br />
                <span className={`font-mono ${themeKey === 'dark' ? 'text-blue-100' : 'text-blue-700'} font-bold`}>
                  platform.dotfluence.in/creators/{instagramHandle}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // If media kit IS complete, show shareable link
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <Card className={`${theme.card} ${theme.radius} overflow-hidden`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <CardTitle className={`text-xl font-black ${themeKey === 'dark' ? 'text-white' : 'text-slate-900'}`}>Your Media Kit</CardTitle>
            </div>
            <Button
              onClick={() => navigate("/dashboard/media-kit/setup")}
              variant="ghost"
              size="sm"
              className={`${theme.muted} hover:text-blue-600 hover:bg-blue-50`}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className={`${theme.muted} font-black text-[10px] uppercase tracking-wider`}>
            Share this link to attract brands
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* URL Display */}
          <div className={`flex items-center gap-2 p-4 rounded-xl ${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} border group hover:border-blue-600/30 transition-colors`}>
            <input
              type="text"
              value={profileUrl}
              readOnly
              className={`flex-1 bg-transparent text-sm font-bold outline-none ${themeKey === 'dark' ? 'text-white' : 'text-slate-800'}`}
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={copyLink}
              variant="outline"
              size="sm"
              className={`text-[10px] font-black uppercase tracking-tight ${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} text-blue-600 hover:bg-blue-50`}
            >
              <Copy className="h-3 w-3 mr-1 text-blue-600" />
              Copy
            </Button>

            <Button
              onClick={shareLink}
              variant="outline"
              size="sm"
              className={`text-[10px] font-black uppercase tracking-tight ${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} text-blue-600 hover:bg-blue-50`}
            >
              <Share2 className="h-3 w-3 mr-1 text-blue-600" />
              Share
            </Button>

            <Button
              onClick={openLink}
              className={`text-[10px] font-black uppercase tracking-tight ${themeKey === 'dark' ? 'bg-white text-blue-600' : 'bg-blue-600 text-white shadow-blue-100'} border-none shadow-lg`}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View
            </Button>
          </div>

          {/* Tip */}
          <div className="p-4 rounded-xl bg-blue-600/5 border border-blue-600/10">
            <p className={`text-[10px] font-bold ${theme.muted}`}>
              💡 <strong className={`${themeKey === 'dark' ? 'text-white' : 'text-slate-900'}`}>Pro Tip:</strong> Add this to your bio to showcase your work!
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};