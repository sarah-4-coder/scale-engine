/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Sparkles,
  Check,
  X,
  AlertCircle,
  Trash2,
  ArrowRight,
  Link as LinkIcon,
  Play,
  Camera,
  Eye,
  Heart,
  CheckCircle2,
  Plus,
  Edit3,
  Briefcase,
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
import { formatNumber, parseFormattedNumber } from "@/utils/Formatnumbers";
import { useNavigate } from "react-router-dom";
import { PORTFOLIO_THEMES, PortfolioThemeKey } from "@/theme/portfolioThemes";
import { Palette, Share2, Download } from "lucide-react";

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

interface Service {
  name: string;
  description: string;
  price: string;
}

// Predefined service templates
const SERVICE_TEMPLATES: Service[] = [
  {
    name: "Single Reel",
    description: "Cinematic vertical video (up to 60s) with trending audio and professional editing.",
    price: "Custom",
  },
  {
    name: "Story Set",
    description: "Sequence of 3-5 stories with swipe-up links and direct audience engagement.",
    price: "Custom",
  },
  {
    name: "UGC Content",
    description: "Raw video clips and photos for brand's own marketing and paid ads.",
    price: "Custom",
  },
  {
    name: "Static Post",
    description: "High-quality image post with caption and engagement strategy.",
    price: "Custom",
  },
  {
    name: "Carousel Post",
    description: "Multi-image post with cohesive storytelling and high engagement.",
    price: "Custom",
  },
  {
    name: "Product Review",
    description: "In-depth product review with honest feedback and recommendations.",
    price: "Custom",
  },
  {
    name: "Brand Integration",
    description: "Seamless brand integration in organic content that resonates with audience.",
    price: "Custom",
  },
  {
    name: "Long-form Video",
    description: "IGTV or YouTube video with detailed product showcase or brand story.",
    price: "Custom",
  },
];

/**
 * Media Kit Setup Component - Premium Design with Services
 */
const MediaKitSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, themeKey } = useInfluencerTheme();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  // Form data
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [bio, setBio] = useState("");
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedPortfolioTheme, setSelectedPortfolioTheme] = useState<PortfolioThemeKey>("default");

  // Instagram link input
  const [instagramLink, setInstagramLink] = useState("");
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [currentLinkViews, setCurrentLinkViews] = useState("");
  const [currentLinkLikes, setCurrentLinkLikes] = useState("");

  // Custom service creation
  const [isCreatingCustomService, setIsCreatingCustomService] = useState(false);
  const [customService, setCustomService] = useState<Service>({
    name: "",
    description: "",
    price: "Custom",
  });

  useEffect(() => {
    loadExistingProfile();
  }, [user]);

  const loadExistingProfile = async () => {
    try {
      const { data: influencerData } = (await supabase
        .from("influencer_profiles")
        .select("id, user_id, instagram_handle, profile_image_url, media_kit_bio, services, media_kit_completed, media_kit_enabled, profile_completed, custom_data, portfolio_theme")
        .eq("user_id", user?.id)
        .single()) as any;

      if (influencerData) {
        // Restriction: Magic link users must complete account setup first
        if (influencerData.custom_data?.created_via === 'magic_link' && !influencerData.profile_completed) {
          toast.error("Please complete your account setup first");
          navigate("/dashboard");
          return;
        }

        setProfile(influencerData);
        setProfileImageUrl(influencerData.profile_image_url || "");
        setBio(influencerData.media_kit_bio || "");
        setServices(influencerData.services || []);
        setSelectedPortfolioTheme((influencerData.portfolio_theme as PortfolioThemeKey) || "default");

        // Load existing portfolio
        const { data: portfolioData } = await supabase
          .from("portfolio_content")
          .select("*")
          .eq("influencer_id", influencerData.id)
          .order("display_order");

        if (portfolioData) {
          setPortfolioItems(portfolioData);
        }

        // Determine current step
        if (influencerData.media_kit_completed) {
          setStep(6);
        } else if (influencerData.portfolio_theme) {
          setStep(5);
        } else if (influencerData.services && influencerData.services.length > 0) {
          setStep(4);
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

      const { error } = await supabase.storage
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

  const extractInstagramPostData = (url: string) => {
    if (!url.includes("instagram.com")) {
      throw new Error("Please enter a valid Instagram post URL");
    }

    const contentType: "image" | "video" = url.includes("/reel/") ? "video" : "image";
    return {
      content_type: contentType,
      instagram_post_url: url,
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
    setLoading(true);
    try {
      const { error } = await supabase
        .from("influencer_profiles")
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

  const handleAddInstagramLink = async () => {
    if (!instagramLink.trim()) {
      toast.error("Please enter an Instagram link");
      return;
    }

    setIsAddingLink(true);
    try {
      const postData = extractInstagramPostData(instagramLink);
      const views = parseFormattedNumber(currentLinkViews) || 0;
      const likes = parseFormattedNumber(currentLinkLikes) || 0;

      const newItem: PortfolioItem = {
        ...postData,
        reach_count: views,
        engagement_count: likes,
        display_order: portfolioItems.length,
      };

      const { data, error } = await supabase
        .from("portfolio_content")
        .insert({
          influencer_id: profile.id,
          ...newItem,
        })
        .select()
        .single();

      if (error) throw error;
        //@ts-ignore
      setPortfolioItems([...portfolioItems, { ...newItem, id: data.id }]);
      setInstagramLink("");
      setCurrentLinkViews("");
      setCurrentLinkLikes("");
      toast.success("Instagram post added!");
    } catch (error: any) {
      console.error("Error adding link:", error);
      toast.error(error.message || "Failed to add Instagram link");
    } finally {
      setIsAddingLink(false);
    }
  };

  const handleRemovePortfolioItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("portfolio_content")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      setPortfolioItems(portfolioItems.filter((item) => item.id !== itemId));
      toast.success("Post removed");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove post");
    }
  };

  const handleAddService = (template: Service) => {
    if (services.length >= 6) {
      toast.error("Maximum 6 services allowed");
      return;
    }
    setServices([...services, template]);
    toast.success("Service added!");
  };

  const handleRemoveService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
    toast.success("Service removed");
  };

  const handleAddCustomService = () => {
    if (!customService.name.trim() || !customService.description.trim()) {
      toast.error("Please fill in all service details");
      return;
    }
    if (services.length >= 6) {
      toast.error("Maximum 6 services allowed");
      return;
    }
    setServices([...services, customService]);
    setCustomService({ name: "", description: "", price: "Custom" });
    setIsCreatingCustomService(false);
    toast.success("Custom service added!");
  };

  const handleStep4Submit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("influencer_profiles")
        .update({ services: services as any })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Services saved!");
      setStep(5);
    } catch (error) {
      console.error("Error saving services:", error);
      toast.error("Failed to save services");
    } finally {
      setLoading(false);
    }
  };

  const handlePublishMediaKit = async () => {
    if (portfolioItems.length < 3) {
      toast.error("Add at least 3 Instagram posts to publish");
      return;
    }
    setStep(5);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("influencer_profiles")
        .update({
          media_kit_enabled: true,
          media_kit_completed: true,
          services: services as any,
          portfolio_theme: selectedPortfolioTheme,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("🎉 Media Kit Published!");
      setStep(6);
    } catch (error) {
      console.error("Error publishing media kit:", error);
      toast.error("Failed to publish media kit");
    } finally {
      setLoading(false);
    }
  };

  const mediaKitUrl = `${window.location.origin}/creators/${profile?.instagram_handle}`;

  const copyMediaKitLink = () => {
    navigator.clipboard.writeText(mediaKitUrl);
    toast.success("Link copied to clipboard!");
  };

  const totalSteps = 5;
  const progress = ((step - 1) / totalSteps) * 100;

  return (
    <div className={`min-h-screen ${themeKey === 'light' ? 'bg-slate-50' : 'bg-[#050505]'} pb-20 md:pb-0`}>
     

      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] ${themeKey === 'light' ? 'bg-blue-600/10' : 'bg-blue-600/10'} blur-[120px] rounded-full`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] ${themeKey === 'light' ? 'bg-blue-600/10' : 'bg-blue-600/10'} blur-[120px] rounded-full`} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 md:py-12 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 md:space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${themeKey === 'light' ? 'bg-black/5 border-black/10 text-black/60' : 'bg-white/5 border-white/10 text-white/60'} text-xs font-medium`}
          >
            <Sparkles size={14} className={themeKey === 'light' ? 'text-blue-600' : 'text-blue-400'} />
            Premium Media Kit Setup
          </motion.div>
          <h1 className={`text-3xl md:text-4xl lg:text-5xl font-black ${themeKey === 'light' ? 'text-black' : 'text-white'} break-words`}>
            Build Your Professional{" "}
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${themeKey === 'light' ? 'from-blue-600 to-blue-400' : 'from-blue-400 to-blue-600'}`}>
              Portfolio
            </span>
          </h1>
          <p className={`${themeKey === 'light' ? 'text-black/60' : 'text-white/60'} text-sm md:text-base max-w-2xl mx-auto`}>
            Create a stunning media kit to showcase your best work and attract brand collaborations
          </p>
        </div>

        {/* Progress Bar */}
        {step < 6 && (
          <div className={`${themeKey === 'light' ? 'bg-white border-black/10' : 'bg-white/5 border-white/10'} rounded-2xl p-4 md:p-6 shadow-sm`}>
            <div className="flex justify-between items-center mb-3">
              <span className={`text-sm md:text-base font-semibold ${themeKey === 'light' ? 'text-black' : 'text-white'}`}>
                Step {step} of {totalSteps}
              </span>
              <span className={`text-xs md:text-sm ${themeKey === 'light' ? 'text-black/60' : 'text-white/60'}`}>{Math.round(progress)}% Complete</span>
            </div>
            <div className={`h-2 ${themeKey === 'light' ? 'bg-black/5' : 'bg-white/10'} rounded-full overflow-hidden`}>
              <motion.div
                className={`h-full bg-gradient-to-r ${themeKey === 'light' ? 'from-blue-600 to-blue-400' : 'from-blue-500 to-blue-800'}`}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

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
              <Card className={`${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'} rounded-2xl md:rounded-3xl shadow-sm`}>
                <CardHeader>
                  <CardTitle className={`text-xl md:text-2xl ${themeKey === 'dark' ? 'text-white' : 'text-slate-900'}`}>Upload Profile Picture</CardTitle>
                  <CardDescription className={`${themeKey === 'dark' ? 'text-white/60' : 'text-slate-500'} text-sm md:text-base`}>
                    Choose a professional photo that represents your brand
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center gap-6">
                    {/* Image Preview */}
                    <div className="relative">
                      <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-blue-500 to-blue-800 p-1">
                        {profileImageUrl || profileImage ? (
                          <img
                            src={
                              profileImage
                                ? URL.createObjectURL(profileImage)
                                : profileImageUrl
                            }
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full rounded-full bg-white/10 flex items-center justify-center text-3xl md:text-4xl font-bold text-white">
                            {profile?.instagram_handle?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      {(profileImageUrl || profileImage) && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 rounded-full p-1.5">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Upload Button */}
                    <label className="cursor-pointer">
                      <div className={`px-6 py-3 ${themeKey === 'dark' ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'} border rounded-xl transition-all font-semibold text-sm md:text-base flex items-center gap-2`}>
                        <Upload size={18} />
                        Choose Photo
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setProfileImage(file);
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <Button
                    onClick={handleStep1Submit}
                    disabled={loading || (!profileImage && !profileImageUrl)}
                    className={`w-full text-white font-bold py-6 rounded-xl text-base transition-all ${themeKey === 'light' ? 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg' : 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900'}`}
                  >
                    {loading ? "Saving..." : "Continue"}
                    <ArrowRight className="h-5 w-5 ml-2" />
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
              <Card className={`${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'} rounded-2xl md:rounded-3xl`}>
                <CardHeader>
                  <CardTitle className={`text-xl md:text-2xl ${themeKey === 'dark' ? 'text-white' : 'text-slate-900'}`}>Write Your Bio</CardTitle>
                  <CardDescription className={`${themeKey === 'dark' ? 'text-white/60' : 'text-slate-500'} text-sm md:text-base`}>
                    Tell brands what makes you unique and why they should work with you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="e.g., Luxury travel & lifestyle creator based in Mumbai. Helping brands tell authentic stories through cinematic storytelling and high-engagement visuals..."
                    rows={6}
                    className={`${themeKey === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'} resize-none rounded-xl text-sm md:text-base`}
                  />
                  <div className={`flex items-center justify-between text-xs md:text-sm ${themeKey === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
                    <span>
                      {bio.length > 0 ? `${bio.length} characters` : "Start typing..."}
                    </span>
                    <span>Aim for 100-300 characters</span>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setStep(1)}
                      className={`flex-1 bg-transparent border border-solid transition-all ${themeKey === 'dark' ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900'} py-6 rounded-xl`}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleStep2Submit}
                      disabled={loading || bio.length < 50}
                      className={`flex-1 text-white font-bold py-6 rounded-xl transition-all ${themeKey === 'light' ? 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg' : 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900'}`}
                    >
                      {loading ? "Saving..." : "Continue"}
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP 3: Portfolio */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* Add Instagram Link */}
              <Card className={`${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} rounded-2xl md:rounded-3xl`}>
                <CardHeader>
                  <CardTitle className={`text-xl md:text-2xl ${theme.text}`}>Add Your Best Content</CardTitle>
                  <CardDescription className={theme.muted}>
                    Add links to your top 3-6 Instagram posts (minimum 3 required)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Input
                      value={instagramLink}
                      onChange={(e) => setInstagramLink(e.target.value)}
                      placeholder="https://instagram.com/p/xxxxx or /reel/xxxxx"
                      className={`${themeKey === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'} rounded-xl h-12`}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        value={currentLinkViews}
                        onChange={(e) => setCurrentLinkViews(e.target.value)}
                        placeholder="Views (e.g., 45.2K)"
                        className={`${themeKey === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'} rounded-xl h-12`}
                      />
                      <Input
                        value={currentLinkLikes}
                        onChange={(e) => setCurrentLinkLikes(e.target.value)}
                        placeholder="Likes (e.g., 3.2K)"
                        className={`${themeKey === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'} rounded-xl h-12`}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleAddInstagramLink}
                    disabled={isAddingLink || !instagramLink.trim()}
                    className={`w-full text-white font-bold py-6 rounded-xl transition-all ${themeKey === 'light' ? 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg' : 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900'}`}
                  >
                    {isAddingLink ? "Adding..." : "Add Post"}
                    <LinkIcon className="h-5 w-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              {/* Portfolio Grid */}
              {portfolioItems.length > 0 ? (
                <Card className={`${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} rounded-2xl md:rounded-3xl`}>
                  <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                      {portfolioItems.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className={`relative aspect-[3/4] rounded-xl md:rounded-2xl overflow-hidden ${themeKey === 'dark' ? 'bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-white/10' : 'bg-slate-50 border-slate-100'} border group`}
                        >
                          {/* Content Preview */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            {item.content_type === "video" ? (
                              <Play className="h-10 w-10 md:h-12 md:w-12 text-blue-600" />
                            ) : (
                              <Camera className="h-10 w-10 md:h-12 md:w-12 text-blue-600" />
                            )}
                          </div>

                          {/* Stats Overlay */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                            <div className="flex justify-between items-center text-white text-xs">
                              <div className="flex items-center gap-1">
                                <Eye size={12} />
                                <span>{formatNumber(item.reach_count || 0)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart size={12} />
                                <span>{formatNumber(item.engagement_count || 0)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => handleRemovePortfolioItem(item.id!)}
                            className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} />
                          </button>

                          {/* Type Badge */}
                          {item.content_type === "video" && (
                            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-full p-1.5">
                              <Play size={12} className="text-white" fill="white" />
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className={`${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} rounded-2xl md:rounded-3xl`}>
                  <CardContent className="p-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <LinkIcon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className={`text-lg font-bold ${theme.text} mb-1`}>
                          No posts added yet
                        </h3>
                        <p className={`text-sm ${theme.muted}`}>
                          Add at least 3 Instagram links above to build your portfolio
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={() => setStep(2)}
                  className={`flex-1 bg-transparent border border-solid transition-all ${themeKey === 'dark' ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900'} py-6 rounded-xl`}
                >
                  Back
                </Button>
                <Button
                  onClick={() => {
                    if (portfolioItems.length < 3) {
                      toast.error("Add at least 3 posts before continuing");
                      return;
                    }
                    setStep(4);
                  }}
                  disabled={portfolioItems.length < 3}
                  className={`flex-1 text-white font-bold py-6 rounded-xl transition-all border border-transparent ${themeKey === 'light' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg' : 'bg-gradient-to-r from-blue-600 to-pink-500 hover:from-blue-700 hover:to-pink-600'}`}
                >
                  Continue
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>

              {portfolioItems.length < 3 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className={`text-sm ${themeKey === 'dark' ? 'text-yellow-200' : 'text-yellow-800'} font-semibold mb-1`}>
                        Add at least 3 Instagram links to continue
                      </p>
                      <p className={`text-xs ${themeKey === 'dark' ? 'text-yellow-200/80' : 'text-yellow-700'}`}>
                        Progress: {portfolioItems.length}/3 posts added. Add{" "}
                        {3 - portfolioItems.length} more to proceed.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 4: Services */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <Card className={`${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} rounded-2xl md:rounded-3xl`}>
                <CardHeader>
                  <CardTitle className={`text-xl md:text-2xl ${theme.text} flex items-center gap-2`}>
                    <Briefcase className="h-6 w-6 text-blue-600" />
                    Your Services
                  </CardTitle>
                  <CardDescription className={theme.muted}>
                    Choose from our templates or create your own custom services (optional)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Selected Services */}
                  {services.length > 0 && (
                    <div className="space-y-3">
                      <h3 className={`text-sm font-semibold ${themeKey === 'dark' ? 'text-white/80' : 'text-slate-700'}`}>Your Services ({services.length}/6)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {services.map((service, index) => (
                           <div
                             key={index}
                             className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-white/10 relative group"
                           >
                             <button
                               onClick={() => handleRemoveService(index)}
                               className="absolute top-2 right-2 bg-rose-500/80 hover:bg-rose-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                             >
                               <X size={12} />
                             </button>
                             <h4 className={`font-bold ${themeKey === 'dark' ? 'text-white' : 'text-slate-900'} text-sm mb-1`}>{service.name}</h4>
                             <p className={`text-xs ${themeKey === 'dark' ? 'text-white/60' : 'text-slate-600'} line-clamp-2`}>{service.description}</p>
                             <p className="text-xs text-blue-400 font-semibold mt-2">{service.price}</p>
                           </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Service Templates */}
                  <div className="space-y-3">
                    <h3 className={`text-sm font-semibold ${themeKey === 'dark' ? 'text-white/80' : 'text-slate-700'}`}>Choose from Templates</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                      {SERVICE_TEMPLATES.map((template, index) => (
                        <button
                          key={index}
                          onClick={() => handleAddService(template)}
                          disabled={services.length >= 6}
                          className={`p-4 rounded-xl ${themeKey === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} border hover:border-blue-500/50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className={`font-bold text-sm ${themeKey === 'dark' ? 'text-white' : 'text-slate-900'}`}>{template.name}</h4>
                            <Plus size={16} className="text-blue-400 group-hover:scale-110 transition-transform" />
                          </div>
                          <p className={`text-xs line-clamp-2 ${themeKey === 'dark' ? 'text-white/60' : 'text-slate-600'}`}>{template.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Service */}
                  {!isCreatingCustomService ? (
                    <Button
                      onClick={() => setIsCreatingCustomService(true)}
                      className={`w-full py-4 rounded-xl bg-transparent border border-solid transition-all ${themeKey === 'dark' ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
                      disabled={services.length >= 6}
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Create Custom Service
                    </Button>
                  ) : (
                    <div className={`p-4 rounded-xl ${themeKey === 'dark' ? 'bg-white/5' : 'bg-slate-50'} border border-blue-500/30 space-y-3`}>
                      <h3 className={`text-sm font-semibold flex items-center gap-2 ${themeKey === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        <Edit3 size={16} className="text-blue-400" />
                        Custom Service
                      </h3>
                      <Input
                        value={customService.name}
                        onChange={(e) => setCustomService({ ...customService, name: e.target.value })}
                        placeholder="Service Name"
                        className={`${themeKey === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'} rounded-xl`}
                      />
                      <Textarea
                        value={customService.description}
                        onChange={(e) => setCustomService({ ...customService, description: e.target.value })}
                        placeholder="Service Description"
                        rows={3}
                        className={`${themeKey === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'} resize-none rounded-xl`}
                      />
                      <Input
                        value={customService.price}
                        onChange={(e) => setCustomService({ ...customService, price: e.target.value })}
                        placeholder="Price (e.g., $500, Custom, Contact for pricing)"
                        className={`${themeKey === 'dark' ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'} rounded-xl`}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setIsCreatingCustomService(false);
                            setCustomService({ name: "", description: "", price: "Custom" });
                          }}
                          variant="ghost"
                          className={`flex-1 border border-solid transition-all ${themeKey === 'dark' ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddCustomService}
                          className={`flex-1 text-white transition-all border border-transparent ${themeKey === 'light' ? 'bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}
                        >
                          Add Service
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={() => setStep(3)}
                      className={`flex-1 py-6 rounded-xl bg-transparent border border-solid transition-all ${themeKey === 'dark' ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handlePublishMediaKit}
                      disabled={loading}
                      className={`flex-1 text-white font-bold py-6 rounded-xl transition-all border border-transparent ${themeKey === 'light' ? 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}
                    >
                      {loading ? "Publishing..." : services.length > 0 ? "Publish Media Kit" : "Skip & Publish"}
                      <Check className="h-5 w-5 ml-2" />
                    </Button>
                  </div>

                  {services.length === 0 && (
                    <p className={`text-center text-sm ${themeKey === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                      Services are optional. You can skip this step or add them later.
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP 5: Theme Selection */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <Card className={`${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'} rounded-2xl md:rounded-3xl`}>
                <CardHeader>
                  <CardTitle className={`text-xl md:text-2xl ${themeKey === 'dark' ? 'text-white' : 'text-slate-900'} flex items-center gap-2`}>
                    <Palette className="h-6 w-6 text-blue-600" />
                    Choose Your Aesthetic
                  </CardTitle>
                  <CardDescription className={`${themeKey === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
                    Select a studio theme to make your media kit stand out
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(Object.keys(PORTFOLIO_THEMES) as PortfolioThemeKey[]).map((themeKeyOption) => {
                      const themeOption = PORTFOLIO_THEMES[themeKeyOption];
                      const isSelected = selectedPortfolioTheme === themeKeyOption;
                      
                      return (
                        <button
                          key={themeKeyOption}
                          onClick={() => setSelectedPortfolioTheme(themeKeyOption)}
                          className={`relative text-left p-6 rounded-2xl border-2 transition-all group overflow-hidden ${
                            isSelected 
                              ? 'border-blue-600 bg-blue-600/5 ring-1 ring-blue-600/50' 
                              : themeKey === 'dark' 
                                ? 'border-white/10 bg-white/5 hover:border-white/20' 
                                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          {/* Theme Preview Color Chips */}
                          <div className="flex gap-1 mb-4">
                            <div className="w-4 h-4 rounded-full border border-white/10" style={{ background: themeOption.background }} />
                            <div className="w-4 h-4 rounded-full border border-white/10" style={{ background: themeOption.accent.replace('text-', '') }} />
                          </div>
                          
                          <h4 className={`text-lg font-black mb-1 ${isSelected ? 'text-blue-500' : themeKey === 'dark' ? 'text-white' : 'text-black'}`}>
                            {themeOption.name}
                          </h4>
                          <p className={`text-xs ${themeKey === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>
                            {themeKeyOption === 'cyberpunk' && "High-contrast neon design for bold creators."}
                            {themeKeyOption === 'minimal_studio' && "Clean, professional, and timeless studio look."}
                            {themeKeyOption === 'editorial_vogue' && "Magazine-style elegance with premium typography."}
                            {themeKeyOption === 'default' && "The classic Dotfluence dark minimalist look."}
                          </p>

                          {isSelected && (
                            <div className="absolute top-4 right-4 bg-blue-600 rounded-full p-1 shadow-lg">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Theme Preview Image Area (Mockup) */}
                  <div className={`rounded-2xl border ${themeKey === 'dark' ? 'border-white/10 bg-black/40' : 'border-slate-200 bg-slate-100'} p-4 text-center`}>
                    <div className="flex items-center justify-center gap-2 mb-2">
                       <Sparkles size={16} className="text-blue-500" />
                       <span className={`text-[10px] font-bold uppercase tracking-widest ${themeKey === 'dark' ? 'text-white/40' : 'text-slate-500'}`}>Real-time Preview Soon</span>
                    </div>
                    <p className={`text-xs italic ${themeKey === 'dark' ? 'text-white/30' : 'text-slate-400'}`}>
                      Theme applied: <span className="font-bold text-blue-500 capitalize">{selectedPortfolioTheme.replace('_', ' ')}</span>
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => setStep(4)}
                      className={`flex-1 py-6 rounded-xl bg-transparent border border-solid transition-all ${themeKey === 'dark' ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleFinalSubmit}
                      disabled={loading}
                      className={`flex-1 text-white font-black py-6 rounded-xl transition-all border border-transparent ${themeKey === 'light' ? 'bg-blue-600 hover:bg-blue-700 shadow-lg' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-[0_0_20px_rgba(37,99,235,0.4)]'}`}
                    >
                      {loading ? "Publishing..." : "Finalize & Publish"}
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* STEP 6: Success */}
          {step === 6 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className={`${themeKey === 'dark' ? 'bg-white/5 border-2 border-blue-500/30' : 'bg-white border-2 border-blue-500/10 shadow-2xl shadow-blue-500/5'} rounded-2xl md:rounded-3xl`}>
                <CardContent className="p-8 md:p-12 text-center space-y-6 md:space-y-8">
                  <div className="flex justify-center">
                    <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <CheckCircle2 className="h-10 w-10 md:h-12 md:w-12 text-white" />
                    </div>
                  </div>

                  <div>
                    <h2 className={`text-3xl md:text-4xl font-black ${theme.text} mb-3`}>
                      🎉 Media Kit Published!
                    </h2>
                    <p className={`${theme.muted} text-sm md:text-base`}>
                      Your professional portfolio is now live and ready to impress brands
                    </p>
                  </div>

                  {/* Share Link */}
                  <div className={`${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} rounded-xl p-4 md:p-6`}>
                    <p className={`text-sm ${theme.muted} mb-3`}>Your Media Kit URL:</p>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={mediaKitUrl}
                        readOnly
                        className={`flex-1 ${themeKey === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'} rounded-lg px-4 py-3 text-sm outline-none`}
                      />
                      <Button
                        onClick={copyMediaKitLink}
                        className={`text-white font-black px-6 rounded-lg whitespace-nowrap h-12 md:h-auto transition-all ${themeKey === 'light' ? 'bg-blue-600 hover:bg-blue-700 shadow-md' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}
                      >
                        Copy Link
                      </Button>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className={`${themeKey === 'dark' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-50 border-blue-100'} border rounded-xl p-6 text-left`}>
                    <h3 className={`text-lg md:text-xl font-black ${themeKey === 'dark' ? 'text-white' : 'text-blue-900'} mb-4 flex items-center gap-2`}>
                      <Sparkles className="text-blue-600" size={20} />
                      Next Steps
                    </h3>
                    <ol className={`space-y-3 text-sm md:text-base ${themeKey === 'dark' ? 'text-blue-200' : 'text-blue-800'}`}>
                      <li className="flex items-start gap-3">
                        <span className="bg-blue-600 text-white rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                          1
                        </span>
                        <span>Add this link to your Instagram bio</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="bg-blue-600 text-white rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                          2
                        </span>
                        <span>Share it when brands reach out to you</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="bg-blue-600 text-white rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                          3
                        </span>
                        <span>Update your portfolio regularly with new content</span>
                      </li>
                    </ol>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href={mediaKitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button
                        className={`w-full bg-transparent border border-solid transition-all ${themeKey === 'dark' ? 'border-white/20 text-white hover:bg-white/10' : 'border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900'} py-6 rounded-xl font-bold`}
                      >
                        View Live Media Kit
                      </Button>
                    </a>
                    <Button
                      onClick={() => setStep(4)}
                      className={`flex-1 text-white font-black py-6 rounded-xl transition-all border border-transparent ${themeKey === 'light' ? 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}
                    >
                      Edit Media Kit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center pt-8">
          <button
            onClick={() => navigate("/dashboard")}
            className={`${theme.muted} hover:text-blue-500 text-sm transition-colors font-bold flex items-center justify-center mx-auto gap-2 group`}
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to Dashboard
          </button>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default MediaKitSetup;