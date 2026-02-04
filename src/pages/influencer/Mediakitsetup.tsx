/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Check,
  X,
  TrendingUp,
  Heart,
  ExternalLink,
  AlertCircle,
  Trash2,
  ArrowRight,
  Link as LinkIcon,
  Play,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import InfluencerNavbar from "@/components/influencer/InfluencerNavbar";
import MobileBottomNav from "@/components/influencer/MobileBottomNav";
import { THEMES, ThemeKey } from "@/theme/themes";
import { formatNumber, parseFormattedNumber } from "@/utils/Formatnumbers";
import { Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PortfolioItem {
  id?: string;
  instagram_post_url: string;
  content_url: string;
  thumbnail_url?: string;
  content_type: "image" | "video";
  caption?: string;
  reach_count?: number;
  engagement_count?: number;
  display_order: number;
}

/**
 * Media Kit Setup Component (UPDATED)
 *
 * Guides influencers through creating their public media kit:
 * 1. Upload profile image
 * 2. Write compelling bio
 * 3. Add Instagram links to best performing content (NO FILE UPLOAD)
 * 4. Get shareable link
 */
const MediaKitSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme } = useInfluencerTheme();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Form data
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [bio, setBio] = useState("");
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);

  // NEW: Instagram link input instead of file upload
  const [instagramLink, setInstagramLink] = useState("");
  const [isAddingLink, setIsAddingLink] = useState(false);
  // NEW: Stats for each Instagram link
  const [currentLinkViews, setCurrentLinkViews] = useState("");
  const [currentLinkLikes, setCurrentLinkLikes] = useState("");

  // NEW: Theme selection for portfolio
  const [selectedPortfolioTheme, setSelectedPortfolioTheme] =
    useState<ThemeKey>("default");

  useEffect(() => {
    loadExistingProfile();
  }, [user]);

  const loadExistingProfile = async () => {
    try {
      const { data: influencerData } = (await supabase
        .from("influencer_profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single()) as any;

      if (influencerData) {
        setProfile(influencerData);
        setProfileImageUrl(influencerData.profile_image_url || "");
        setBio(influencerData.media_kit_bio || "");
        setSelectedPortfolioTheme(influencerData.portfolio_theme || "default");

        // Load existing portfolio
        const { data: portfolioData } = await supabase
          .from("portfolio_content")
          .select("*")
          .eq("influencer_id", influencerData.id)
          .order("display_order");

        if (portfolioData) {
          setPortfolioItems(portfolioData);
        }

        // Determine current step based on completion
        if (influencerData.media_kit_completed) {
          setStep(4); // Go to final step
        } else if (portfolioData && portfolioData.length > 0) {
          setStep(3);
        } else if (influencerData.media_kit_bio) {
          setStep(2);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const uploadProfileImage = async () => {
    if (!profileImage || !profile) return null;

    try {
      const fileExt = profileImage.name.split(".").pop();
      const fileName = `${profile.id}-profile.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      const { data, error } = await supabase.storage
        .from("influencer-media")
        .upload(filePath, profileImage, { upsert: true });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("influencer-media").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      return null;
    }
  };

  /**
   * NEW: Extract Instagram post metadata from link
   * This is a simplified version - you may want to enhance this with actual Instagram API
   */
  const extractInstagramPostData = (url: string) => {
    // Basic validation
    if (!url.includes("instagram.com")) {
      throw new Error("Please enter a valid Instagram post URL");
    }

    // Determine content type from URL
    const contentType = url.includes("/reel/") ? "video" : "image";

    // Extract post ID (simplified - you might want more robust parsing)
    const postId = url.split("/").filter(Boolean).pop()?.split("?")[0] || "";

    return {
      content_type: contentType,
      instagram_post_url: url,
      // For now, we'll use placeholder URLs - ideally you'd fetch actual media from Instagram
      content_url: url,
      thumbnail_url: url,
    };
  };

  const handleStep1Submit = async () => {
    setLoading(true);
    try {
      let imageUrl = profileImageUrl;

      if (profileImage) {
        const uploadedUrl = await uploadProfileImage();
        if (!uploadedUrl) {
          setLoading(false);
          return;
        }
        imageUrl = uploadedUrl;
      }

      const { error } = await supabase
        .from("influencer_profiles")
        //@ts-expect-error
        .update({ profile_image_url: imageUrl })
        .eq("id", profile.id);

      if (error) throw error;

      setProfileImageUrl(imageUrl);
      toast.success("Profile image saved!");
      setStep(2);
    } catch (error) {
      console.error("Error saving profile image:", error);
      toast.error("Failed to save profile image");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async () => {
    if (!bio.trim()) {
      toast.error("Please write a bio");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("influencer_profiles")
        //@ts-expect-error
        .update({ media_kit_bio: bio })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Bio saved!");
      setStep(3);
    } catch (error) {
      console.error("Error saving bio:", error);
      toast.error("Failed to save bio");
    } finally {
      setLoading(false);
    }
  };

  /**
   * NEW: Add portfolio item from Instagram link
   */
  const handleAddInstagramLink = async () => {
    if (!instagramLink.trim()) {
      toast.error("Please paste an Instagram link");
      return;
    }

    if (!currentLinkViews.trim() || !currentLinkLikes.trim()) {
      toast.error("Please enter views and likes for this post");
      return;
    }

    setIsAddingLink(true);
    try {
      // Extract post data
      const postData = extractInstagramPostData(instagramLink);

      // Parse the views and likes
      const views = parseFormattedNumber(currentLinkViews);
      const likes = parseFormattedNumber(currentLinkLikes);

      if (views === null || likes === null) {
        toast.error("Please enter valid numbers for views and likes");
        return;
      }

      // Create portfolio item
      const newItem: PortfolioItem = {
        ...postData,
        content_type: postData.content_type as "image" | "video",
        reach_count: views,
        engagement_count: likes,
        display_order: portfolioItems.length,
      };

      const { data, error } = await supabase
        .from("portfolio_content")
        //@ts-expect-error
        .insert({
          influencer_id: profile.id,
          content_type: newItem.content_type,
          content_url: newItem.content_url,
          thumbnail_url: newItem.thumbnail_url,
          instagram_post_url: newItem.instagram_post_url,
          reach_count: newItem.reach_count,
          engagement_count: newItem.engagement_count,
          display_order: newItem.display_order,
        })
        .select()
        .single();

      if (error) throw error;

      setPortfolioItems([...portfolioItems, data]);
      setInstagramLink("");
      setCurrentLinkViews("");
      setCurrentLinkLikes("");
      toast.success("Instagram post added to portfolio!");
    } catch (error: any) {
      console.error("Error adding Instagram link:", error);
      toast.error(error.message || "Failed to add Instagram link");
    } finally {
      setIsAddingLink(false);
    }
  };

  const handleDeletePortfolioItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("portfolio_content")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setPortfolioItems(portfolioItems.filter((item) => item.id !== itemId));
      toast.success("Portfolio item removed");
    } catch (error) {
      console.error("Error deleting portfolio item:", error);
      toast.error("Failed to delete item");
    }
  };

  const handlePublishMediaKit = async () => {
    if (portfolioItems.length < 3) {
      toast.error("Please add at least 3 portfolio items");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("influencer_profiles")
        //@ts-expect-error
        .update({
          media_kit_completed: true,
          media_kit_enabled: true,
          portfolio_theme: selectedPortfolioTheme, // Save theme
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("🎉 Media kit published!");
      setStep(4);
    } catch (error) {
      console.error("Error publishing media kit:", error);
      toast.error("Failed to publish media kit");
    } finally {
      setLoading(false);
    }
  };

  const mediaKitUrl = profile?.instagram_handle
    ? `${window.location.origin}/creators/${profile.instagram_handle}`
    : "";

  const copyMediaKitLink = () => {
    navigator.clipboard.writeText(mediaKitUrl);
    toast.success("Link copied to clipboard!");
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
              <Sparkles className="h-8 w-8 text-purple-500" />
              Create Your Media Kit
            </h1>
            <p className="text-white/60">
              Build a professional portfolio to attract premium brands
            </p>
          </motion.div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step
                    ? "w-12 bg-purple-500"
                    : s < step
                      ? "w-8 bg-purple-500/50"
                      : "w-8 bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {/* STEP 1: Profile Image */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className={`${theme.card} ${theme.radius}`}>
                <CardHeader>
                  <CardTitle>Upload Profile Image</CardTitle>
                  <CardDescription>
                    Add a professional photo that brands will see first
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Image Preview */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="h-32 w-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-1">
                        {profileImageUrl || profileImage ? (
                          <img
                            src={
                              profileImage
                                ? URL.createObjectURL(profileImage)
                                : profileImageUrl
                            }
                            alt="Profile"
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-white/40" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Upload Button */}
                  <div>
                    <label className="cursor-pointer">
                      <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-purple-500/50 transition-colors">
                        <Upload className="h-8 w-8 text-white/40 mx-auto mb-2" />
                        <p className="text-white/60 text-sm">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-white/40 text-xs mt-1">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setProfileImage(file);
                        }}
                      />
                    </label>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={handleStep1Submit}
                    disabled={loading || (!profileImage && !profileImageUrl)}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    {loading ? "Saving..." : "Continue"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP 2: Bio */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className={`${theme.card} ${theme.radius}`}>
                <CardHeader>
                  <CardTitle>Write Your Bio</CardTitle>
                  <CardDescription>
                    Tell brands what makes you unique and why they should work
                    with you
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <Textarea
                    placeholder="Hi! I'm a lifestyle influencer passionate about sustainable fashion and wellness. I create authentic content that resonates with my engaged community of 50K+ followers..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={6}
                    className="bg-white/5 border-white/10 text-white resize-none"
                  />

                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <p className="text-sm text-purple-200">
                      💡 <strong>Pro Tip:</strong> Include your niche, audience
                      demographics, and what types of brands you love working
                      with
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleStep2Submit}
                      disabled={loading || !bio.trim()}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                    >
                      {loading ? "Saving..." : "Continue"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP 3: Portfolio (UPDATED - Instagram Links Only) */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <Card className={`${theme.card} ${theme.radius}`}>
                <CardHeader>
                  <CardTitle>Add Your Best Content</CardTitle>
                  <CardDescription>
                    Paste Instagram links to posts/reels with high engagement
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Instagram Link Input */}
                  <div className="space-y-4 p-6 border border-white/10 rounded-xl bg-black/20">
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-5 w-5 text-purple-400" />
                      <h3 className="text-lg font-semibold text-white">
                        Add Instagram Content
                      </h3>
                    </div>

                    {/* Instagram URL */}
                    <div>
                      <label className="text-sm text-white/60 mb-2 block">
                        Instagram Post/Reel URL
                      </label>
                      <Input
                        type="url"
                        placeholder="https://instagram.com/p/..."
                        value={instagramLink}
                        onChange={(e) => setInstagramLink(e.target.value)}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-white/60 mb-2 block flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Total Views
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g., 13M or 1.5K"
                          value={currentLinkViews}
                          onChange={(e) => setCurrentLinkViews(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>

                      <div>
                        <label className="text-sm text-white/60 mb-2 block flex items-center gap-2">
                          <Heart className="h-4 w-4" />
                          Total Likes
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g., 850K or 45K"
                          value={currentLinkLikes}
                          onChange={(e) => setCurrentLinkLikes(e.target.value)}
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleAddInstagramLink}
                      disabled={isAddingLink}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                    >
                      {isAddingLink ? "Adding..." : "Add to Portfolio"}
                    </Button>

                    <div className="text-xs text-white/40 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <p>
                        💡 Enter views and likes in any format: 13M, 1.5K, 850K,
                        etc.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current Portfolio */}
              {portfolioItems.length > 0 ? (
                <Card className={`${theme.card} ${theme.radius}`}>
                  <CardHeader>
                    <CardTitle>
                      Your Portfolio ({portfolioItems.length}/3 minimum)
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                        {portfolioItems.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-4 rounded-xl bg-gradient-to-r from-white/5 to-white/10 border border-white/20 hover:border-purple-500/50 transition-all group"
                            >
                                <div className="flex flex-col gap-4">
                                    {/* Header with icon and delete button */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center mt-1">
                                                {item.content_type === "video" ? (
                                                    <Play className="h-6 w-6 text-white" />
                                                ) : (
                                                    <ImageIcon className="h-6 w-6 text-white" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-semibold line-clamp-2 break-words">
                                                    {item.instagram_post_url.length > 60
                                                        ? `${item.instagram_post_url.substring(0, 60)}...`
                                                        : item.instagram_post_url}
                                                </p>
                                                <p className="text-xs text-white/40 mt-1">
                                                    {item.content_type === "video" ? "Reel" : "Post"}
                                                </p>
                                            </div>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeletePortfolioItem(item.id!)}
                                            className="text-red-400/60 hover:text-red-300 hover:bg-red-500/20 flex-shrink-0 h-10 w-10 transition-all"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Stats in a clean row */}
                                    <div className="grid grid-cols-2 gap-3 pl-17">
                                        <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                                            <p className="text-xs text-white/60 flex items-center gap-1.5 mb-1">
                                                <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
                                                Views
                                            </p>
                                            <p className="text-sm font-semibold text-white">
                                                {formatNumber(item.reach_count || 0)}
                                            </p>
                                        </div>

                                        <div className="bg-black/30 rounded-lg p-3 border border-white/10">
                                            <p className="text-xs text-white/60 flex items-center gap-1.5 mb-1">
                                                <Heart className="h-3.5 w-3.5 text-pink-400" />
                                                Likes
                                            </p>
                                            <p className="text-sm font-semibold text-white">
                                                {formatNumber(item.engagement_count || 0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className={`${theme.card} ${theme.radius}`}>
                  <CardContent className="p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-purple-500/10 flex items-center justify-center">
                        <LinkIcon className="h-8 w-8 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          No posts added yet
                        </h3>
                        <p className="text-sm text-white/60">
                          Add at least 3 Instagram links above to build your
                          portfolio
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Theme Selector */}
              <div className="mt-8 p-6 border border-white/10 rounded-xl bg-black/20">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="h-5 w-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">
                    Portfolio Theme
                  </h3>
                </div>
                <p className="text-white/60 text-sm mb-4">
                  Choose a theme for your public portfolio
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.values(THEMES).map((themeOption) => (
                    <button
                      key={themeOption.key}
                      onClick={() => setSelectedPortfolioTheme(themeOption.key)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedPortfolioTheme === themeOption.key
                          ? "border-purple-500 bg-purple-500/20"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-lg bg-gradient-to-r ${themeOption.primary} mb-2 mx-auto`}
                      />
                      <p className="text-sm text-white text-center">
                        {themeOption.name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handlePublishMediaKit}
                  disabled={loading || portfolioItems.length < 3}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                >
                  {loading ? "Publishing..." : "Publish Media Kit"}
                  <Check className="h-4 w-4 ml-2" />
                </Button>
              </div>

              {portfolioItems.length < 3 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-200 font-semibold mb-1">
                        Add at least 3 Instagram links to publish
                      </p>
                      <p className="text-xs text-yellow-200/80">
                        Progress: {portfolioItems.length}/3 posts added. Add{" "}
                        {3 - portfolioItems.length} more to publish your media
                        kit.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 4: Success */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card
                className={`${theme.card} ${theme.radius} border-2 border-purple-500/30`}
              >
                <CardContent className="p-8 text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Check className="h-10 w-10 text-white" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      🎉 Media Kit Published!
                    </h2>
                    <p className="text-white/60">
                      Your professional portfolio is now live
                    </p>
                  </div>

                  {/* Share Link */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                    <p className="text-sm text-white/60 mb-2">
                      Your Media Kit URL:
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={mediaKitUrl}
                        readOnly
                        className="flex-1 bg-transparent text-white text-sm outline-none"
                      />
                      <Button
                        onClick={copyMediaKitLink}
                        size="sm"
                        variant="outline"
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-6 text-left">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      📱 Next Steps:
                    </h3>
                    <ol className="space-y-3 text-sm text-purple-200">
                      <li className="flex items-start gap-3">
                        <span className="bg-purple-500 text-white rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 text-xs">
                          1
                        </span>
                        <span>Add this link to your Instagram bio</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="bg-purple-500 text-white rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 text-xs">
                          2
                        </span>
                        <span>Share it when brands reach out to you</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="bg-purple-500 text-white rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 text-xs">
                          3
                        </span>
                        <span>
                          Update your portfolio regularly with new content
                        </span>
                      </li>
                    </ol>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col md:flex-row gap-3">
                    <a
                      href={mediaKitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Media Kit
                      </Button>
                    </a>
                    <Button
                      onClick={() => setStep(3)}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                    >
                      Edit Portfolio
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="mt-4 md:mt-6 text-center">
        <button
            onClick={() => navigate("/dashboard")}
            className="text-white/50 hover:text-white text-sm transition-colors "
        >
            ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default MediaKitSetup;
