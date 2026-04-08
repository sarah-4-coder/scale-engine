/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { memo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  TrendingUp,
  DollarSign,
  BarChart3,
  Sparkles,
  X,
  AlertCircle,
  Mail,
  Link,
  ChevronRight,
  Info,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import InfluencerNavbar from "@/components/influencer/InfluencerNavbar";
import MobileBottomNav from "@/components/influencer/MobileBottomNav";
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ThemeKey } from "@/theme/themes";
import {
  StatCardSkeleton,
  CardSkeleton,
} from "@/components/influencer/Skeletons";
import { useDashboardStats } from "@/hooks/useCampaigns";
import { ProfileLinkCard } from "@/components/influencer/ProfileLinkCard";
import BlockedAccountScreen from "@/components/BlockedAccountScreen";
import ProfileSetupDrawer from "@/components/influencer/ProfileSetupDrawer";
import BankDetailsModal from "@/components/influencer/BankDetailsModal";
import ThemedStudioBackground from "@/components/influencer/ThemedStudioBackground";
import { ShareMyCard } from "@/components/influencer/ShareMyCard";
import { toast } from "sonner";

/* --------------------------------
   TYPES
-------------------------------- */
type RecentCampaign = {
  name: string;
  status: "Active" | "Pending" | "Completed";
};

// ⚡ MEMOIZED STAT CARD
const StatCard = memo(({ stat }: { stat: any }) => {
  const { theme, themeKey } = useInfluencerTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className={`${theme.card} transition-all duration-300 hover:scale-[1.02]`}>
      <CardHeader className="flex flex-row justify-between items-center pb-2 px-4 pt-4 md:px-6 md:pt-6">
        <CardTitle className={`text-[10px] uppercase font-black tracking-widest ${theme.muted}`}>{stat.title}</CardTitle>
        <stat.icon className={`h-4 w-4 ${themeKey === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
      </CardHeader>

      <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
        <div className={`text-2xl md:text-3xl font-black ${theme.text}`}>{stat.value}</div>
        <p className={`text-[10px] font-bold mt-1 ${theme.muted}`}>{stat.note}</p>
      </CardContent>
    </Card>
    </motion.div>
  );
});

StatCard.displayName = "StatCard";

const InfluencerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    theme,
    themeKey,
    setTheme,
    loading: themeLoading,
  } = useInfluencerTheme();

  const [isBlocked, setIsBlocked] = useState(false);
  const [checkingBlockStatus, setCheckingBlockStatus] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");

  const { data: stats, isLoading, refetch: refetchStats } = useDashboardStats(user?.id || "");

  const fullName = stats?.fullName || "Creator";
  const followers = stats?.followers;
  const activeCampaigns = stats?.activeCampaigns || 0;
  const earnings = stats?.earnings || 0;
  const recentCampaigns = stats?.recentCampaigns || [];

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("influencer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      const profileData = data as any;
      setProfile(profileData);
      setIsBlocked(profileData?.is_blocked || false);
      
      // Check for completed campaigns without payout details (UPI or Bank)
      if (profileData) {
          const hasPayoutDetails = !!profileData.upi_id || (!!profileData.bank_account_number && !!profileData.bank_ifsc_code);
          
          if (!hasPayoutDetails) {
              const { count } = await supabase
                .from('campaign_influencers')
                .select('*', { count: 'exact', head: true })
                .eq('influencer_id', profileData.id)
                .eq('status', 'completed');
              
              if (count && count > 0) {
                  setShowBankModal(true);
              }
          }
      }

      // One-time prompt for email if missing
      if (profileData && !profileData.email && !sessionStorage.getItem('dismissed_email_prompt')) {
          setShowEmailPrompt(true);
      }

    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setCheckingBlockStatus(false);
    }
  };

  const calculateCompletion = () => {
    if (!profile) return 0;
    // Exactly 5 fields, 20% each
    const fields = [
        !!profile.phone_number,
        !!profile.full_name,
        !!profile.instagram_handle,
        !!(profile.niches && profile.niches.length > 0),
        !!profile.profile_image_url
    ];
    const completedCount = fields.filter(Boolean).length;
    return completedCount * 20;
  };

  const handleLinkEmail = async () => {
    if (!linkEmail || !linkEmail.includes("@")) {
        toast.error("Valid email required");
        return;
    }

    try {
        // Link logic (Case 3): Update profile with email
        const { error } = await supabase
            .from('influencer_profiles')
            // @ts-ignore
            .update({ email: linkEmail })
            .eq('id', profile.id);
        
        if (error) throw error;

        toast.success("Email linked successfully!");
        setShowEmailPrompt(false);
        fetchProfile();
    } catch (e: any) {
        toast.error(e.message);
    }
  };

  const completion = calculateCompletion();

  const statsConfig = [
    {
      title: "Active Campaigns",
      value: activeCampaigns,
      icon: Calendar,
      note: "Currently running",
    },
    {
      title: "Potential Reach",
      value: stats?.avgReach ? stats.avgReach.toLocaleString() : (followers ? followers.toLocaleString() : "—"),
      icon: TrendingUp,
      note: "Avg. reach per post",
    },
    {
      title: "Engagement",
      value: stats?.avgEngagementRate ? `${stats.avgEngagementRate}%` : "Soon",
      icon: BarChart3,
      note: "Creator health score",
    },
    {
      title: "Earnings",
      value: `₹${earnings}`,
      icon: DollarSign,
      note: "Lifetime earnings",
    },
  ];

  if (themeLoading || checkingBlockStatus || (isLoading && !stats)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center transition-colors duration-500"
        style={{ background: theme.background }}
      >
        <div className="flex flex-col items-center gap-6">
          <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-primary" />
          <p className={`text-sm font-black tracking-widest uppercase opacity-50 ${themeKey === 'dark' ? 'text-white' : 'text-gray-900'}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (isBlocked) {
    return <BlockedAccountScreen />;
  }

  return (
    <div 
      className={`influencer-portal min-h-screen relative overflow-hidden pb-20 md:pb-0 transition-colors duration-500`}
      style={{ background: theme.background }}
    >
      <ThemedStudioBackground themeKey={themeKey} />

      <InfluencerNavbar currentTheme={themeKey} onThemeChange={setTheme} />
      <MobileBottomNav />

      <main className="relative z-10 px-4 md:px-6 py-4 md:py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* MAGIC LINK ACCOUNT BLOCKER */}
          {profile?.custom_data?.created_via === 'magic_link' && !profile?.profile_completed && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`w-full ${themeKey === 'dark' ? 'bg-gradient-to-br from-indigo-900/40 to-slate-900/60' : 'bg-gradient-to-br from-purple-100 to-white'} border-2 ${themeKey === 'dark' ? 'border-purple-500/20' : 'border-purple-100'} rounded-[2.5rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden`}
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#ffffff11,transparent_50%)]" />
                
                <div className="relative z-10 flex items-center gap-6">
                    <div className={`h-16 w-16 rounded-3xl ${themeKey === 'dark' ? 'bg-white/10 text-white border-white/10' : 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200'} backdrop-blur-xl flex items-center justify-center border`}>
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                        <h3 className={`font-black text-2xl ${themeKey === 'dark' ? 'text-white' : 'text-slate-950'} tracking-tight`}>Success! Application Submitted</h3>
                        <p className={`font-medium max-w-sm ${themeKey === 'dark' ? 'text-indigo-100/70' : 'text-slate-900/60'}`}>
                          Your profile is currently under review. To browse campaigns, manage applications, and unlock your Media Kit, please complete your creator setup.
                        </p>
                    </div>
                </div>
                
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                    <Button 
                        size="lg" 
                        onClick={() => navigate("/account-setup")}
                        className={`w-full sm:w-auto h-16 rounded-2xl ${themeKey === 'dark' ? 'bg-white text-purple-600' : 'bg-purple-600 text-white'} hover:opacity-90 font-black text-lg px-10 shadow-xl transition-all active:scale-95`}
                    >
                        Setup Account <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            </motion.div>
          )}

          {/* PROFILE COMPLETION BANNER (For normal users or magic link users who finished setup but still missing some fields) */}
          {completion < 100 && !(profile?.custom_data?.created_via === 'magic_link' && !profile?.profile_completed) && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`w-full ${themeKey === 'dark' ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-100'} border rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-xl`}
            >
                <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl ${themeKey === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-600 text-white shadow-lg shadow-purple-100'} flex items-center justify-center`}>
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div className="space-y-0.5 text-center md:text-left">
                        <p className={`text-lg font-black ${themeKey === 'dark' ? 'text-white' : 'text-slate-950'}`}>Complete your creative profile</p>
                        <p className={`text-xs font-bold ${themeKey === 'dark' ? 'text-white/50' : 'text-slate-900/60'}`}>{100 - completion}% more to unlock your full media kit</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-6 w-full md:w-auto">
                    <div className="flex-1 md:w-48 space-y-2">
                        <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                            <span>Progress</span>
                            <span className="text-primary">{completion}%</span>
                        </div>
                        <Progress value={completion} className="h-2 bg-primary/10" />
                    </div>
                    <Button 
                        size="sm" 
                        onClick={() => setShowProfileDrawer(true)}
                        className="rounded-xl font-bold px-6 shadow-lg shadow-primary/20"
                    >
                        Fix Now
                    </Button>
                </div>
            </motion.div>
          )}

          {/* EMAIL PROMPT (CASE 3/ONE-TIME) */}
          {showEmailPrompt && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                  <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-sm font-bold">Add email to secure your account</p>
                        <p className="text-xs text-muted-foreground">This helps you recover your account if you change your phone number.</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                      <Input 
                        placeholder="email@example.com"
                        value={linkEmail}
                        onChange={(e) => setLinkEmail(e.target.value)}
                        className="bg-black/20 border-white/10 h-9 w-48 text-xs"
                      />
                      <Button size="sm" variant="outline" onClick={handleLinkEmail} className="h-9 px-4 text-xs font-bold">Link Email</Button>
                      <button onClick={() => {
                          setShowEmailPrompt(false);
                          sessionStorage.setItem('dismissed_email_prompt', 'true');
                      }} className="p-1 hover:bg-white/5 rounded-full"><X size={14}/></button>
                  </div>
              </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className={`text-2xl md:text-3xl font-bold ${theme.text}`}>
                  Welcome {fullName} 👋
                </h2>
                <p className={theme.muted}>
                  Your personalized creator dashboard
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 md:gap-6">
                {isLoading
                  ? [1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)
                  : statsConfig.map((s) => <StatCard key={s.title} stat={s} />)}
              </div>

              <div className="grid grid-cols-1 gap-4 md:gap-6">
                <Card className={`${theme.card}`}>
                  <CardHeader className="px-4 pt-4 md:px-6 md:pt-6">
                    <CardTitle className={`text-xl font-black ${theme.text}`}>
                      Quick Actions
                    </CardTitle>
                    <CardDescription className={`${theme.muted} font-bold text-[10px] uppercase tracking-wider`}>Move faster</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 px-4 md:px-6 pb-6 mt-2">
                    <Button
                      className={`w-full text-left justify-between h-14 rounded-xl group font-bold border transition-all ${
                        themeKey === 'dark' 
                          ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' 
                          : 'bg-black/5 border-black/5 hover:bg-black/10 text-gray-900'
                      }`}
                      variant="outline"
                      onClick={() => navigate("/dashboard/campaigns/all")}
                    >
                      Browse New Campaigns
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#8B5CF6]" />
                    </Button>
                    <Button
                      variant="outline"
                      className={`w-full text-left justify-between h-14 rounded-xl group font-bold border transition-all ${
                        themeKey === 'dark' 
                          ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' 
                          : 'bg-black/5 border-black/5 hover:bg-black/10 text-gray-900'
                      }`}
                      onClick={() => navigate("/dashboard/campaigns/my")}
                    >
                      Manage Applications
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#8B5CF6]" />
                    </Button>
                    <Button
                      variant="outline"
                      className={`w-full text-left justify-between h-14 rounded-xl group font-bold border transition-all ${
                        themeKey === 'dark' 
                          ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white' 
                          : 'bg-black/5 border-black/5 hover:bg-black/10 text-gray-900'
                      }`}
                      onClick={() => navigate("/dashboard/settings/payment")}
                    >
                      Payment & Bank Settings
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#8B5CF6]" />
                    </Button>
                    <Button
                      variant="outline"
                      className={`w-full text-left justify-between h-14 rounded-xl font-bold border opacity-50 cursor-not-allowed ${
                        themeKey === 'dark' 
                          ? 'bg-white/5 border-white/10 text-white/50' 
                          : 'bg-black/5 border-black/5 text-gray-400'
                      }`}
                      disabled
                    >
                      Audience Analytics
                      <Info className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-6">
              <ProfileLinkCard userId={user?.id || ""} />
              
              {profile?.instagram_handle && (
                <ShareMyCard 
                  handle={profile.instagram_handle} 
                  fullName={fullName} 
                  themeKey={themeKey as any} 
                />
              )}

              <Card className={`${theme.card}`}>
                <CardHeader className="px-4 pt-4 md:px-6 md:pt-6">
                  <CardTitle className={`text-xl font-black ${theme.text}`}>
                    Recent Activity
                  </CardTitle>
                  <CardDescription className={`${theme.muted} font-bold text-[10px] uppercase tracking-wider`}>Campaign Status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 px-4 md:px-6 pb-6">
                  {isLoading ? (
                    <div className="space-y-3">
                      <CardSkeleton />
                      <CardSkeleton />
                    </div>
                  ) : (
                    <>
                      {recentCampaigns.length === 0 && (
                        <p className={`text-sm italic ${theme.muted}`}>
                          No activity yet — explore new opportunities 🚀
                        </p>
                      )}

                      {recentCampaigns.map((c, i) => (
                        <div
                          key={i}
                          className={`flex justify-between items-center p-4 rounded-xl border transition-all ${
                            themeKey === 'dark' 
                              ? 'bg-white/5 border-white/5 hover:bg-white/10' 
                              : 'bg-black/5 border-black/5 hover:bg-black/10'
                          }`}
                        >
                          <span className={`font-black text-sm ${theme.text}`}>
                            {c.name}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full ${
                              c.status === "Active"
                                ? "border-purple-500/50 text-purple-600 bg-purple-500/10"
                                : c.status === "Pending"
                                  ? "border-yellow-500/50 text-yellow-500 bg-yellow-500/10"
                                  : "border-gray-500/50 text-gray-500 bg-gray-500/10"
                            }`}
                          >
                            {c.status}
                          </Badge>
                        </div>
                      ))}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* DRAWERS & MODALS */}
      <ProfileSetupDrawer 
          open={showProfileDrawer} 
          onOpenChange={setShowProfileDrawer} 
          profile={profile}
          onProfileUpdate={() => {
              fetchProfile();
              refetchStats();
          }}
      />

      {profile && (
        <BankDetailsModal 
            open={showBankModal} 
            onOpenChange={setShowBankModal}
            profileId={profile.id}
            onSuccess={fetchProfile}
        />
      )}
    </div>
  );
};

export default memo(InfluencerDashboard);
