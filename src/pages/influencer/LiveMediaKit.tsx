/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Instagram,
  Mail,
  MapPin,
  TrendingUp,
  Award,
  CheckCircle,
  Copy,
  Share2,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  tier: string;
  completed_campaigns: number;
  verified: boolean;
}

/**
 * Live Media Kit - Public Creator Profile
 * 
 * Features:
 * - Public URL: dotfluence.com/creators/[instagram_handle]
 * - Displays professional portfolio
 * - Shows "Dotfluence Work History"
 * - Verified badge for credibility
 * - Share functionality for viral growth
 * 
 * Accessible at: /creators/:handle
 */
const LiveMediaKit = () => {
  const { handle } = useParams<{ handle: string }>();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        .single<CreatorProfile>();

      if (influencerError) throw influencerError;

      // Fetch user profile for name and email
      let userData = null;
     
      if (influencerData && influencerData.user_id) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("user_id", influencerData.user_id)
          .single();
        userData = data;
      }

      // Fetch completed campaigns count
      const { data: campaignRelations } = await supabase
        .from("campaign_influencers")
        .select("campaign_id, status, final_payout")
        .eq("influencer_id", influencerData.id)
        .eq("status", "completed");

      // Fetch campaign details
      const campaignIds =
        campaignRelations?.map((r: any) => r.campaign_id) || [];

      let campaignDetails: any[] = [];
      if (campaignIds.length > 0) {
        const { data } = await supabase
          .from("campaigns")
          .select("id, name")
          .in("id", campaignIds);
        campaignDetails = data || [];
      }

      // Determine tier based on campaigns
      const completedCount = campaignRelations?.length || 0;
      let tier = "Rising Star";
      if (completedCount >= 10) tier = "Elite Partner";
      else if (completedCount >= 3) tier = "Verified Creator";

      setProfile({
        ...influencerData,
        tier,
        completed_campaigns: completedCount,
        verified: completedCount >= 3,
      });

      setUserInfo(userData);
      setCampaigns(campaignDetails);
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Creator profile not found");
    } finally {
      setLoading(false);
    }
  };

  const copyProfileLink = () => {
    const url = `${window.location.origin}/creators/${handle}`;
    navigator.clipboard.writeText(url);
    toast.success("Profile link copied!");
  };

  const shareProfile = async () => {
    const url = `${window.location.origin}/creators/${handle}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userInfo?.full_name} - Dotfluence Creator`,
          text: `Check out my creator profile on Dotfluence!`,
          url: url,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      copyProfileLink();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Creator Not Found
          </h1>
          <p className="text-white/60">
            This profile doesn't exist or has been removed
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/dotfluence-logo.png"
              alt="Dotfluence"
              className="h-8"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <h1 className="text-xl font-bold text-white">Dotfluence</h1>
          </div>

          <a
            href="https://dotfluence.in"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              size="sm"
              className="text-white border-white/20 hover:bg-white/10"
            >
              Join Platform
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-pink-500/20" />

            <CardContent className="relative p-8">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                {/* Profile Image */}
                <div className="relative">
                  <div className="h-32 w-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-1">
                    <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center text-4xl font-bold text-white">
                      {userInfo?.full_name?.charAt(0) || "?"}
                    </div>
                  </div>
                  {profile.verified && (
                    <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                    <h2 className="text-3xl font-bold text-white">
                      {userInfo?.full_name || "Creator"}
                    </h2>
                    {profile.verified && (
                      <Award className="h-6 w-6 text-yellow-400" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-purple-400 mb-4 justify-center md:justify-start">
                    <Instagram className="h-4 w-4" />
                    <span>@{profile.instagram_handle}</span>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm border border-purple-500/30">
                      {profile.tier}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm border border-blue-500/30">
                      {profile.completed_campaigns} Campaigns Completed
                    </span>
                  </div>

                  {/* Niches */}
                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {profile.niches.map((niche) => (
                      <span
                        key={niche}
                        className="px-3 py-1 rounded-lg bg-white/10 text-white/70 text-sm"
                      >
                        {niche}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={copyProfileLink}
                  variant="outline"
                  className="flex-1 border-white/20 hover:bg-white/10 text-white"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  onClick={shareProfile}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white/60 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Followers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">
                {profile.followers_count.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white/60 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Campaigns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">
                {profile.completed_campaigns}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-white/60 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-400">
                {profile.verified ? "Verified" : "Rising"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Work History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-white">
                Dotfluence Work History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns.length > 0 ? (
                <div className="space-y-3">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                    >
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                      <span className="text-white">{campaign.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/60 text-center py-8">
                  Just getting started! More campaigns coming soon.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center space-y-4"
        >
          <p className="text-white/60">
            Want your own professional media kit?
          </p>
          <a href="https://dotfluence.in" target="_blank" rel="noopener noreferrer">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-6 text-lg">
              Join Dotfluence
            </Button>
          </a>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="bg-black/30 backdrop-blur-xl border-t border-white/10 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-white/60 text-sm">
            © 20246 Dotfluence. Professional Influencer Marketing Platform.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LiveMediaKit;