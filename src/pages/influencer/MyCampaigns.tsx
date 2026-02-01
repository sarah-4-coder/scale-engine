/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import InfluencerNavbar from "@/components/influencer/InfluencerNavbar";
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";
import AmbientLayer from "@/components/ambient/AmbientLayer";
import { ThemeKey } from "@/theme/themes";
import {
  ArrowRight,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { CampaignCardSkeleton } from "@/components/influencer/Skeletons";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  niches: string[];
  deliverables: string;
  timeline: string;
  base_payout: number;
  admin_user_id: string;
}

interface Application {
  campaign_id: string;
  status: string;
  requested_payout: number | null;
  final_payout: number | null;
  posted_link?: string[] | null;
}

const ThemedStudioBackground = ({ themeKey }: { themeKey: ThemeKey }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Don't render on mobile to prevent lag
  if (isMobile) return null;

  switch (themeKey) {
    case "tech":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Tech Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(34, 211, 238, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(34, 211, 238, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Circuit Board Pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="2" fill="#22d3ee"/>
                <circle cx="90" cy="90" r="2" fill="#818cf8"/>
                <line x1="10" y1="10" x2="50" y2="10" stroke="#22d3ee" strokeWidth="1"/>
                <line x1="50" y1="10" x2="50" y2="50" stroke="#22d3ee" strokeWidth="1"/>
                <line x1="50" y1="50" x2="90" y2="90" stroke="#818cf8" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#circuit)" />
          </svg>

          {/* Floating Monitor Frame */}
          <motion.div
            className="absolute bottom-10 left-10 w-96 h-64 border-4 border-cyan-500/20 rounded-lg"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute inset-2 bg-gradient-to-br from-cyan-500/5 to-indigo-500/5 rounded" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-cyan-400/30 text-6xl font-mono">
              {'{ }'}
            </div>
          </motion.div>

          {/* Code Snippets */}
          <motion.div
            className="absolute top-20 right-20 font-mono text-cyan-300/20 text-sm space-y-2"
            animate={{ opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div>const theme = 'tech';</div>
            <div>function render() {'{'}</div>
            <div>&nbsp;&nbsp;return success;</div>
            <div>{'}'}</div>
          </motion.div>

          {/* Binary Background */}
          <div className="absolute inset-0 opacity-5 text-cyan-400 text-xs font-mono overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="whitespace-nowrap"
                animate={{ x: [0, -1000] }}
                transition={{ duration: 20 + i * 2, repeat: Infinity, ease: "linear" }}
              >
                01010011 01010101 01000011 01000011 01000101 01010011 01010011
              </motion.div>
            ))}
          </div>
        </div>
      );

    case "fashion":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Minimalist Lines */}
          <svg className="absolute inset-0 w-full h-full opacity-8" xmlns="http://www.w3.org/2000/svg">
            <line x1="10%" y1="0" x2="10%" y2="100%" stroke="#000" strokeWidth="0.5" opacity="0.1"/>
            <line x1="30%" y1="0" x2="30%" y2="100%" stroke="#000" strokeWidth="0.5" opacity="0.1"/>
            <line x1="70%" y1="0" x2="70%" y2="100%" stroke="#000" strokeWidth="0.5" opacity="0.1"/>
            <line x1="90%" y1="0" x2="90%" y2="100%" stroke="#000" strokeWidth="0.5" opacity="0.1"/>
            <line x1="0" y1="20%" x2="100%" y2="20%" stroke="#000" strokeWidth="0.5" opacity="0.1"/>
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#000" strokeWidth="0.5" opacity="0.1"/>
            <line x1="0" y1="80%" x2="100%" y2="80%" stroke="#000" strokeWidth="0.5" opacity="0.1"/>
          </svg>

          {/* Wardrobe Hangers */}
          <motion.div
            className="absolute top-10 right-20 w-64 h-80"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Hanger 1 */}
            <svg width="100" height="120" className="absolute left-0" viewBox="0 0 100 120">
              <path d="M 20 20 Q 50 10 80 20 L 75 25 L 50 100 L 25 25 Z" 
                    fill="none" stroke="#404040" strokeWidth="2" opacity="0.3"/>
              <circle cx="50" cy="15" r="8" fill="none" stroke="#404040" strokeWidth="2" opacity="0.3"/>
            </svg>
            
            {/* Hanger 2 */}
            <svg width="100" height="120" className="absolute left-20 top-10" viewBox="0 0 100 120">
              <path d="M 20 20 Q 50 10 80 20 L 75 25 L 50 100 L 25 25 Z" 
                    fill="none" stroke="#404040" strokeWidth="2" opacity="0.2"/>
              <circle cx="50" cy="15" r="8" fill="none" stroke="#404040" strokeWidth="2" opacity="0.2"/>
            </svg>
          </motion.div>

          {/* Geometric Shapes */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute border border-neutral-700/20"
              style={{
                width: `${60 + i * 20}px`,
                height: `${60 + i * 20}px`,
                top: `${20 + i * 10}%`,
                left: `${10 + i * 12}%`,
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 30 + i * 5, repeat: Infinity, ease: "linear" }}
            />
          ))}

          {/* Fashion Text Pattern */}
          <div className="absolute bottom-10 left-10 text-neutral-800/10 text-8xl font-serif italic">
            STYLE
          </div>
        </div>
      );

    case "fitness":
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Energy Grid */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(220, 38, 38, 0.3) 2px, transparent 2px),
                linear-gradient(90deg, rgba(34, 197, 94, 0.3) 2px, transparent 2px)
              `,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Dumbbell Illustration */}
          <svg className="absolute bottom-20 left-10 w-96 h-32 opacity-20" viewBox="0 0 400 150">
            {/* Left weight */}
            <rect x="10" y="30" width="60" height="90" rx="5" fill="#dc2626"/>
            <rect x="30" y="20" width="20" height="110" rx="5" fill="#dc2626"/>
            
            {/* Bar */}
            <rect x="70" y="65" width="260" height="20" rx="10" fill="#666"/>
            
            {/* Right weight */}
            <rect x="330" y="30" width="60" height="90" rx="5" fill="#22c55e"/>
            <rect x="350" y="20" width="20" height="110" rx="5" fill="#22c55e"/>
          </svg>

          {/* Heart Rate Line */}
          <svg className="absolute top-1/4 right-20 w-96 h-32 opacity-20" viewBox="0 0 400 100">
            <polyline
              points="0,50 50,50 70,20 90,80 110,50 350,50"
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
            />
          </svg>

          {/* Pulsing Circles */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-4"
              style={{
                borderColor: i % 2 === 0 ? 'rgba(220, 38, 38, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                width: `${100 + i * 40}px`,
                height: `${100 + i * 40}px`,
                top: `${40 + i * 8}%`,
                right: `${10 + i * 5}%`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 2 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}

          {/* Flame Effect */}
          <motion.div
            className="absolute top-20 right-1/3"
            animate={{
              y: [0, -10, 0],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <svg width="80" height="100" viewBox="0 0 80 100">
              <path
                d="M 40 10 Q 50 30 45 50 Q 55 65 40 90 Q 25 65 35 50 Q 30 30 40 10"
                fill="#dc2626"
                opacity="0.3"
              />
            </svg>
          </motion.div>

          {/* Motivational Text */}
          <div className="absolute bottom-20 right-20 text-red-500/10 text-6xl font-bold transform -rotate-12">
            POWER
          </div>
        </div>
      );

    default:
      // Default creative studio
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Dot Grid */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(124, 58, 237, 0.4) 1px, transparent 1px)`,
              backgroundSize: '30px 30px',
            }}
          />

          {/* Floating Orbs */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${60 + i * 30}px`,
                height: `${60 + i * 30}px`,
                background: i % 2 === 0 
                  ? 'radial-gradient(circle, rgba(251, 146, 60, 0.2), transparent)'
                  : 'radial-gradient(circle, rgba(99, 102, 241, 0.2), transparent)',
                top: `${Math.random() * 80}%`,
                left: `${Math.random() * 80}%`,
              }}
              animate={{
                y: [0, -20, 0],
                x: [0, 10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 5 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}

          {/* Sparkle Pattern */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path
                  d="M 10 0 L 12 8 L 20 10 L 12 12 L 10 20 L 8 12 L 0 10 L 8 8 Z"
                  fill={i % 2 === 0 ? '#fb923c' : '#6366f1'}
                  opacity="0.4"
                />
              </svg>
            </motion.div>
          ))}

          {/* Creative Text */}
          <div className="absolute top-1/3 left-10 text-orange-500/10 text-9xl font-bold">
            CREATE
          </div>
        </div>
      );
  }
};

const MyCampaigns = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    theme,
    themeKey,
    setTheme,
    loading: themeLoading,
  } = useInfluencerTheme();

  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [influencerId, setInfluencerId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("influencer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      toast.error("Influencer profile not found");
      return;
    }
    //@ts-ignore
    setInfluencerId(profile.id);

    const { data: applicationsData } = await supabase
      .from("campaign_influencers")
      .select(
        "campaign_id, status, requested_payout, final_payout, posted_link",
      )
      //@ts-ignore
      .eq("influencer_id", profile.id);

    setApplications(applicationsData || []);
    //@ts-ignore
    const campaignIds = applicationsData?.map((a) => a.campaign_id) || [];

    if (campaignIds.length > 0) {
      const { data: campaignsData } = await supabase
        .from("campaigns")
        .select("*")
        .in("id", campaignIds);

      setCampaigns(campaignsData || []);
    } else {
      setCampaigns([]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscription
  useEffect(() => {
    if (!influencerId) return;

    const subscription = supabase
      .channel(`my_campaigns_${influencerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "campaign_influencers",
          filter: `influencer_id=eq.${influencerId}`,
        },
        (payload) => {
          console.log("Real-time update:", payload);
          fetchData();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [influencerId, fetchData]);

  const getStatusInfo = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; color: string; icon: any; bg: string }
    > = {
      applied: {
        label: "Applied",
        color: "text-blue-400",
        icon: Clock,
        bg: "bg-blue-500/20",
      },
      shortlisted: {
        label: "Shortlisted",
        color: "text-green-400",
        icon: CheckCircle2,
        bg: "bg-green-500/20",
      },
      influencer_negotiated: {
        label: "Negotiating",
        color: "text-yellow-400",
        icon: AlertCircle,
        bg: "bg-yellow-500/20",
      },
      admin_negotiated: {
        label: "Counter Offer",
        color: "text-orange-400",
        icon: AlertCircle,
        bg: "bg-orange-500/20",
      },
      accepted: {
        label: "Accepted",
        color: "text-green-400",
        icon: CheckCircle2,
        bg: "bg-green-500/20",
      },
      not_shortlisted: {
        label: "Not Shortlisted",
        color: "text-red-400",
        icon: XCircle,
        bg: "bg-red-500/20",
      },
      rejected: {
        label: "Rejected",
        color: "text-red-400",
        icon: XCircle,
        bg: "bg-red-500/20",
      },
      content_posted: {
        label: "Content Submitted",
        color: "text-purple-400",
        icon: CheckCircle2,
        bg: "bg-purple-500/20",
      },
      content_rejected: {
        label: "Content Rejected",
        color: "text-red-400",
        icon: XCircle,
        bg: "bg-red-500/20",
      },
      completed: {
        label: "Completed",
        color: "text-emerald-400",
        icon: CheckCircle2,
        bg: "bg-emerald-500/20",
      },
    };

    return (
      statusMap[status] || {
        label: status,
        color: "text-gray-400",
        icon: Clock,
        bg: "bg-gray-500/20",
      }
    );
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Theme Background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ background: theme.background }}
      />

      {/* Themed Studio Background (CSS-based, hidden on mobile) */}
      <ThemedStudioBackground themeKey={themeKey} />

      {/* Ambient Background (hidden on mobile) */}
      <div className="hidden md:block">
        <AmbientLayer themeKey={themeKey} />
      </div>

      {/* Navbar */}
      <InfluencerNavbar currentTheme={themeKey} onThemeChange={setTheme} />

      {/* CONTENT */}
      <main className="relative z-10 px-6 py-10 max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-10">
          <h2 className={`text-3xl font-bold ${theme.text}`}>My Campaigns</h2>
          <p className={theme.muted}>
            Track and manage your campaign applications
          </p>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <CampaignCardSkeleton key={i} theme={theme} />
            ))}
          </div>
        ) : (
          <>
            {/* CAMPAIGNS GRID */}
            {campaigns.length === 0 ? (
              <div className={`${theme.card} ${theme.radius} p-12 text-center`}>
                <p className={theme.muted}>
                  You haven't applied to any campaigns yet.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/dashboard/campaigns/all")}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-medium"
                >
                  Browse Campaigns
                </motion.button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {campaigns.map((campaign, index) => {
                  const application = applications.find(
                    (a) => a.campaign_id === campaign.id,
                  );
                  if (!application) return null;

                  const statusInfo = getStatusInfo(application.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -4 }}
                      onClick={() =>
                        navigate(`/dashboard/campaigns/my/${campaign.id}`)
                      }
                      className="cursor-pointer"
                    >
                      <Card
                        className={`${theme.card} ${theme.radius} overflow-hidden transition-all duration-300 hover:shadow-2xl`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <CardTitle className={`text-lg ${theme.text}`}>
                              {campaign.name}
                            </CardTitle>
                            <ArrowRight
                              className={`h-5 w-5 ${theme.accent} flex-shrink-0 mt-1`}
                            />
                          </div>

                          {/* Status Badge */}
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusInfo.bg} w-fit`}
                          >
                            <StatusIcon
                              className={`h-3.5 w-3.5 ${statusInfo.color}`}
                            />
                            <span
                              className={`text-xs font-medium ${statusInfo.color}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {/* Description */}
                          {campaign.description && (
                            <p
                              className={`${theme.muted} text-sm line-clamp-2`}
                            >
                              {campaign.description}
                            </p>
                          )}

                          {/* Quick Info */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className={`h-4 w-4 ${theme.accent}`} />
                              <span className={`text-sm ${theme.muted}`}>
                                {campaign.timeline}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <DollarSign
                                className={`h-4 w-4 ${theme.accent}`}
                              />
                              <span
                                className={`text-sm ${theme.text} font-medium`}
                              >
                                {application.final_payout
                                  ? `₹${application.final_payout} (Final)`
                                  : `₹${campaign.base_payout} (Base)`}
                              </span>
                            </div>
                          </div>

                          {/* Niches */}
                          <div className="flex flex-wrap gap-2">
                            {campaign.niches.slice(0, 3).map((niche) => (
                              <span
                                key={niche}
                                className={`px-2 py-1 rounded-lg bg-white/10 text-xs ${theme.muted}`}
                              >
                                {niche}
                              </span>
                            ))}
                            {campaign.niches.length > 3 && (
                              <span
                                className={`px-2 py-1 rounded-lg bg-white/10 text-xs ${theme.muted}`}
                              >
                                +{campaign.niches.length - 3} more
                              </span>
                            )}
                          </div>

                          {/* Click to view */}
                          <div className={`pt-2 border-t border-white/10`}>
                            <p
                              className={`text-xs ${theme.accent} flex items-center gap-1`}
                            >
                              Click to view details
                              <ArrowRight className="h-3 w-3" />
                            </p>
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
    </div>
  );
};

export default MyCampaigns;
