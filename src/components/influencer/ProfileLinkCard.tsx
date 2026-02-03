/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Copy, Share2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProfileLinkCardProps {
  userId: string;
}

/**
 * Profile Link Card Component
 * 
 * Shows influencers their public media kit URL
 * Encourages them to add it to their Instagram bio
 * Creates the viral loop effect
 */
export const ProfileLinkCard = ({ userId }: ProfileLinkCardProps) => {
  const { theme } = useInfluencerTheme();
  const [instagramHandle, setInstagramHandle] = useState<string | null>(null);
  const [profileUrl, setProfileUrl] = useState<string>("");

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data } = await supabase
        .from("influencer_profiles")
        .select("instagram_handle")
        .eq("user_id", userId)
        .single();
        //@ts-ignore
      if (data && data.instagram_handle) {
        //@ts-ignore
        setInstagramHandle(data.instagram_handle);
        //@ts-ignore
        setProfileUrl(`${window.location.origin}/creators/${data.instagram_handle}`);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
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
          title: "My Dotfluence Media Kit",
          text: "Check out my professional creator portfolio!",
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

  if (!instagramHandle) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <Card className={`${theme.card} ${theme.radius} border-2 border-purple-500/30`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className={`h-5 w-5 ${theme.accent}`} />
            <CardTitle className="text-lg">Your Live Media Kit</CardTitle>
          </div>
          <CardDescription>
            Share this link in your Instagram bio to attract more brands!
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* URL Display */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
            <input
              type="text"
              value={profileUrl}
              readOnly
              className="flex-1 bg-transparent text-sm text-white/80 outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={copyLink}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>

            <Button
              onClick={shareLink}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <Share2 className="h-3 w-3 mr-1" />
              Share
            </Button>

            <Button
              onClick={openLink}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View
            </Button>
          </div>

          {/* Tip */}
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <p className="text-xs text-purple-300">
              💡 <strong>Pro Tip:</strong> Add this link to your Instagram bio
              to showcase your work and attract premium brand deals!
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};