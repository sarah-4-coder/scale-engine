import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2, CheckCircle2, ShieldCheck, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";
import { useAuth } from "@/hooks/useAuth";
import ThemedStudioBackground from "@/components/influencer/ThemedStudioBackground";
import InfluencerNavbar from "@/components/influencer/InfluencerNavbar";
import MobileBottomNav from "@/components/influencer/MobileBottomNav";

const CampaignApply = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, themeKey, setTheme } = useInfluencerTheme();
  const { user: authUser, loading: authLoading } = useAuth();
  
  const [step, setStep] = useState(1); // 1: Identity/Auth, 2: Commercials
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [campaign, setCampaign] = useState<any>(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [followersCount, setFollowersCount] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [negotiationPreference, setNegotiationPreference] = useState<'fixed' | 'negotiate'>('fixed');

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      try {
        const { data: campaignData, error: campaignError } = await supabase
          .from("campaigns")
          .select("id, name, base_payout, type, brand:brand_profiles!brand_id(company_name)")
          .eq("id", id)
          .maybeSingle();

        if (campaignError) throw campaignError;
        setCampaign(campaignData);

        if (authUser) {
          const { data: profileData } = await supabase
            .from("influencer_profiles")
            .select("*")
            .eq("user_id", authUser.id)
            .maybeSingle();

          if (profileData) {
            setFullName(profileData.full_name || "");
            setInstagramHandle(profileData.instagram_handle?.replace("@", "") || "");
            setFollowersCount(profileData.followers_count?.toString() || "");
            setPhone(profileData.phone_number || "");
            setEmail((profileData as any).email || authUser.email || "");
          }
        }
      } catch (error) {
        console.error("Initialization error:", error);
        toast.error("Failed to load application details");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id]);

  const handleNextToCommercials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !instagramHandle || !followersCount || !phone) {
      toast.error("Please fill in all identity fields");
      return;
    }
    if (!user && (!email || !password)) {
      toast.error("Email and password are required to create your secure account");
      return;
    }
    setStep(2);
  };

  const handleApplyClick = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      let currentUserId = user?.id;

      // 1. Auth: If guest, sign up with email/password
      if (!currentUserId) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
              role: 'influencer'
            }
          }
        });

        if (authError) throw authError;
        currentUserId = authData.user?.id;
      }

      if (!currentUserId) throw new Error("Authentication failed");

      // 2. Upsert Profile
      const { data: profile, error: profileError } = await supabase
        .from("influencer_profiles")
        .upsert({
          user_id: currentUserId,
          email: email || user?.email,
          phone_number: phone,
          full_name: fullName,
          instagram_handle: instagramHandle.replace("@", ""),
          followers_count: parseInt(followersCount),
          profile_completed: false, // Mark as false to trigger the setup flow on dashboard
          custom_data: { 
            created_via: 'magic_link',
            negotiation_requested: negotiationPreference === 'negotiate'
          }
        } as any, { onConflict: 'user_id' })
        .select()
        .single();

      if (profileError) throw profileError;

      // 3. Submit Application
      const applicationData: any = {
        campaign_id: id,
        influencer_id: profile.id,
        status: 'applied',
        negotiation_requested: negotiationPreference === 'negotiate',
        source: 'magic_link'
      };

      const { error: appError } = await supabase
        .from("campaign_influencers")
        .insert(applicationData);

      if (appError) {
        if (appError.code === '23505') {
          toast.info("Application already submitted!");
          navigate("/dashboard");
          return;
        }
        throw appError;
      }

      toast.success("Application submitted! Check your email to confirm.");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center transition-colors duration-500"
        style={{ background: theme.background }}
      >
        <div className="flex flex-col items-center gap-6">
          <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-primary" />
          <p className={`text-sm font-black tracking-widest uppercase opacity-50 ${themeKey === 'dark' ? 'text-white' : 'text-gray-900'}`}>Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden pb-20 transition-colors duration-500"
      style={{ background: theme.background }}
    >
      <ThemedStudioBackground themeKey={themeKey} />
      
      {/* Navbar */}
      <InfluencerNavbar currentTheme={themeKey} onThemeChange={setTheme} />

      {/* Mobile Bottom Navigation - Hidden on desktop */}
      <div className="md:hidden">
        <MobileBottomNav />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto space-y-8 px-4 relative z-10 pt-10"
      >
         <div className="mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className={`text-2xl md:text-3xl font-bold ${theme.text}`}>
                Campaign Application
              </h2>
              <p className={theme.muted}>
                Join the {campaign?.brand?.company_name} team
              </p>
            </div>
            
            <div className={`${theme.card} ${theme.radius} px-4 py-2 border border-white/5`}>
               <h3 className={`text-lg font-black ${theme.text}`}>
                {campaign?.name}
               </h3>
            </div>
          </div>
        </div>

        <Card className={`${theme.card} ${theme.radius} border border-white/10 shadow-2xl overflow-hidden`}>
          <CardContent className="p-8 md:p-12">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form 
                  key="step1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleNextToCommercials}
                  className="space-y-8"
                >
                    <div className="space-y-6">
                      <div className="space-y-4">
                         <h3 className="text-xl font-black text-white tracking-tight">Creator Identity</h3>
                      </div>

                      <div className="space-y-2">
                        <Label className={`text-[10px] uppercase font-black tracking-widest ml-3 ${theme.muted}`}>Full Name</Label>
                        <Input 
                          placeholder="Your Name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={`h-14 px-6 ${themeKey === 'dark' ? 'bg-white/5' : 'bg-black/5'} border-white/10 rounded-xl text-base font-bold ${theme.text} focus:border-primary/50 transition-all`}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className={`text-[10px] uppercase font-black tracking-widest ml-3 ${theme.muted}`}>Instagram</Label>
                          <Input 
                            placeholder="@handle"
                            value={instagramHandle}
                            onChange={(e) => setInstagramHandle(e.target.value)}
                            className={`h-14 px-6 ${themeKey === 'dark' ? 'bg-white/5' : 'bg-black/5'} border-white/10 rounded-xl text-base font-bold ${theme.text} focus:border-primary/50 transition-all`}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className={`text-[10px] uppercase font-black tracking-widest ml-3 ${theme.muted}`}>Followers</Label>
                          <Input 
                            type="number"
                            placeholder="e.g. 10000"
                            value={followersCount}
                            onChange={(e) => setFollowersCount(e.target.value)}
                            className={`h-14 px-6 ${themeKey === 'dark' ? 'bg-white/5' : 'bg-black/5'} border-white/10 rounded-xl text-base font-bold ${theme.text} focus:border-primary/50 transition-all`}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className={`text-[10px] uppercase font-black tracking-widest ml-3 ${theme.muted}`}>Mobile Number</Label>
                        <Input 
                          type="tel"
                          placeholder="+91 99999 00000"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={`h-14 px-6 ${themeKey === 'dark' ? 'bg-white/5' : 'bg-black/5'} border-white/10 rounded-xl text-base font-bold ${theme.text} focus:border-primary/50 transition-all`}
                          required
                        />
                      </div>

                      {!user && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 pt-8 border-t border-white/10">
                          <div className="space-y-1">
                             <h3 className="text-xl font-black text-white tracking-tight">Secure Access</h3>
                             <p className="text-xs text-[#A1A1AA] font-bold tracking-tight">Create a password to manage your dashboard.</p>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className={`text-[10px] uppercase font-black tracking-widest ml-3 ${theme.muted}`}>Email Address</Label>
                              <div className="relative">
                                <Input 
                                  type="email"
                                  placeholder="your@email.com"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className={`h-14 pl-12 ${themeKey === 'dark' ? 'bg-white/5' : 'bg-black/5'} border-white/10 rounded-xl font-bold ${theme.text} focus:border-primary/50`}
                                  required
                                />
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className={`text-[10px] uppercase font-black tracking-widest ml-3 ${theme.muted}`}>Create Password</Label>
                              <div className="relative">
                                <Input 
                                  type="password"
                                  placeholder="••••••••"
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  className={`h-14 pl-12 ${themeKey === 'dark' ? 'bg-white/5' : 'bg-black/5'} border-white/10 rounded-xl font-bold ${theme.text} focus:border-primary/50`}
                                  required
                                />
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-20" />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    <Button className="w-full h-16 rounded-2xl bg-primary text-white font-black text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 group shadow-2xl shadow-primary/20">
                      Next: Campaign Terms <ArrowRight className="w-5 h-5 group-hover:translate-x-1" />
                    </Button>
                </motion.form>
              )}

              {step === 2 && (
                <motion.form 
                  key="step2"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onSubmit={handleApplyClick}
                  className="space-y-8"
                >
                  <div className="space-y-8">
                     <div className="text-center md:text-left space-y-1">
                        <h3 className={`text-[10px] uppercase font-black ${themeKey === 'dark' ? 'text-blue-400' : 'text-blue-600'} tracking-[0.2em]`}>Pricing Preference</h3>
                        <h2 className={`text-3xl font-black ${themeKey === 'dark' ? 'text-white' : 'text-slate-900'} tracking-tight leading-none`}>{campaign?.name}</h2>
                     </div>

                    <div className="space-y-4">
                      {/* Standard Rate Card */}
                        <div 
                          onClick={() => setNegotiationPreference('fixed')}
                          className={`p-8 rounded-[1.5rem] border-2 cursor-pointer transition-all duration-300 ${
                            negotiationPreference === 'fixed' 
                            ? `border-primary ${themeKey === 'dark' ? 'bg-primary/10' : 'bg-primary/5'} shadow-[0_0_30px_rgba(139,92,246,0.15)]` 
                            : 'border-white/5 bg-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                              <p className={`text-[10px] uppercase font-black tracking-widest ${theme.muted}`}>Standard Rate</p>
                              {negotiationPreference === 'fixed' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                          </div>
                          <p className={`text-4xl font-black ${theme.text} mb-6`}>
                              {campaign?.type === 'barter' ? 'Gifted / Barter' : `₹${campaign?.base_payout?.toLocaleString()}`}
                          </p>
                          <p className={`text-[11px] ${theme.muted} font-black leading-relaxed italic`}>
                              * Fixed compensation per deliverables. Payments processed via secure ledger after content verification.
                          </p>
                        </div>

                      {/* Negotiation Toggle */}
                          <div 
                            onClick={() => setNegotiationPreference(negotiationPreference === 'negotiate' ? 'fixed' : 'negotiate')}
                            className={`p-8 rounded-[1.5rem] border-2 cursor-pointer transition-all duration-300 ${
                              negotiationPreference === 'negotiate' 
                              ? `${themeKey === 'light' ? 'border-blue-500/50 bg-blue-500/5' : 'border-blue-500/50 bg-blue-500/5'} shadow-[0_0_30px_rgba(37,99,235,0.15)]` 
                              : `${themeKey === 'dark' ? 'border-white/5 bg-white/5' : 'border-black/5 bg-black/5'} hover:border-blue-500/30`
                            }`}
                          >
                          <div className="flex items-start gap-5">
                                <div className={`mt-1 h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                    negotiationPreference === 'negotiate' 
                                    ? (themeKey === 'light' ? 'border-blue-500 bg-blue-500' : 'border-blue-500 bg-blue-500')
                                    : `${themeKey === 'dark' ? 'border-white/20' : 'border-black/20'}`
                                }`}>
                                  {negotiationPreference === 'negotiate' && <CheckCircle2 className="w-4 h-4 text-white" />}
                                </div>
                              <div className="space-y-1">
                                <p className={`font-black ${theme.text} text-base tracking-tight`}>I want to negotiate a higher pay</p>
                                <p className={`text-[11px] ${theme.muted} font-black leading-relaxed`}>
                                  Select this if your reach or content quality justifies a rate above the base payout.
                                </p>
                                 {negotiationPreference === 'negotiate' && (
                                   <motion.p 
                                     initial={{ opacity: 0, height: 0 }}
                                     animate={{ opacity: 1, height: 'auto' }}
                                     className={`text-[10px] ${themeKey === 'light' ? 'text-blue-600 bg-blue-500/10 border-blue-500/20' : 'text-blue-500 bg-blue-500/10 border-blue-500/20'} font-black mt-3 p-3 rounded-xl border uppercase tracking-widest`}
                                   >
                                     Negotiation enabled in dashboard upon shortlisting.
                                   </motion.p>
                                 )}
                              </div>
                          </div>
                        </div>
                    </div>
                  </div>

                  <div className="pt-6 flex flex-col gap-6">
                     <Button 
                       type="submit"
                       disabled={submitting}
                       className={`w-full h-16 rounded-[1.25rem] font-black text-xl transition-all flex items-center justify-center gap-3 ${
                         themeKey === 'dark' ? 'bg-white text-blue-600' : 'bg-blue-600 text-white shadow-2xl shadow-blue-500/20'
                       }`}
                     >
                      {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                        <>
                           Submit Application 
                           <ArrowRight className="w-6 h-6 group-hover:translate-x-1" />
                        </>
                      )}
                    </Button>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      className="w-full h-12 text-[10px] font-black uppercase text-[#A1A1AA] hover:text-white tracking-[0.4em] transition-all"
                    >
                      Back to Identity
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

         <div className="flex flex-col items-center gap-6 py-12">
            <div className={`flex items-center gap-2 px-4 py-2 ${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} rounded-full shadow-inner`}>
               <ShieldCheck className={`w-4 h-4 ${themeKey === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
               <p className={`text-[10px] font-black ${theme.muted} uppercase tracking-[0.2em]`}>Verified Studio Partner</p>
            </div>
            <p className={`text-[9px] font-black ${themeKey === 'dark' ? 'text-white/10' : 'text-slate-300'} uppercase tracking-[0.5em]`}>© DotFluence Studio • MMXXIV</p>
         </div>
      </motion.div>
    </div>
  );
};

export default CampaignApply;
