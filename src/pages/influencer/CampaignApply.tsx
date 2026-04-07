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

const CampaignApply = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
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
            setEmail(profileData.email || authUser.email || "");
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100 font-sans p-4 md:p-12">
      <div className="fixed inset-0 bg-slate-50 -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto space-y-8"
      >
        <header className="space-y-4 text-center md:text-left pt-4">
           <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full border border-indigo-100">
              <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
              <p className="text-[9px] uppercase font-black text-indigo-600 tracking-widest">Apply for Campaign</p>
           </div>
           
           <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                {campaign?.name}
              </h1>
              <p className="text-base font-medium text-slate-500 italic">
                with {campaign?.brand?.company_name}
              </p>
           </div>
        </header>

        <Card className="bg-white border-slate-200 shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden">
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
                       <h3 className="text-lg font-black text-slate-900">Creator Identity</h3>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-3">Full Name</Label>
                      <Input 
                        placeholder="Your Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-14 px-6 bg-slate-50 border-slate-100 rounded-xl text-base font-bold text-slate-900"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-3">Instagram</Label>
                        <Input 
                          placeholder="@handle"
                          value={instagramHandle}
                          onChange={(e) => setInstagramHandle(e.target.value)}
                          className="h-14 px-6 bg-slate-50 border-slate-100 rounded-xl text-base font-bold text-slate-900"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-3">Followers</Label>
                        <Input 
                          type="number"
                          placeholder="e.g. 10000"
                          value={followersCount}
                          onChange={(e) => setFollowersCount(e.target.value)}
                          className="h-14 px-6 bg-slate-50 border-slate-100 rounded-xl text-base font-bold text-slate-900"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-3">Mobile Number</Label>
                      <Input 
                        type="tel"
                        placeholder="+91 99999 00000"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-14 px-6 bg-slate-50 border-slate-100 rounded-xl text-base font-bold text-slate-900"
                        required
                      />
                    </div>

                    {!user && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 pt-4 border-t border-slate-100">
                        <div className="space-y-1">
                           <h3 className="text-lg font-black text-slate-900">Secure Access</h3>
                           <p className="text-xs text-slate-500 font-medium tracking-tight">Create a password to manage your application later.</p>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-3">Email Address</Label>
                            <div className="relative">
                              <Input 
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-14 pl-12 bg-slate-50 border-slate-100 rounded-xl font-bold text-slate-900"
                                required
                              />
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-3">Create Password</Label>
                            <div className="relative">
                              <Input 
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-14 pl-12 bg-slate-50 border-slate-100 rounded-xl font-bold"
                                required
                              />
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <Button className="w-full h-14 rounded-xl bg-indigo-600 text-white font-black hover:bg-slate-900 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-indigo-100">
                    Next: Campaign Terms <ArrowRight className="w-4 h-4 group-hover:translate-x-1" />
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
                       <h3 className="text-[10px] uppercase font-black text-indigo-600 tracking-widest">Pricing Preference</h3>
                       <h2 className="text-2xl font-black text-slate-900 tracking-tight">{campaign?.name}</h2>
                    </div>

                    <div className="space-y-4">
                      {/* Standard Rate Card */}
                      <div 
                        onClick={() => setNegotiationPreference('fixed')}
                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                          negotiationPreference === 'fixed' 
                          ? 'border-indigo-600 bg-indigo-50/30' 
                          : 'border-slate-100 bg-slate-50'
                        }`}
                      >
                         <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Standard Rate</p>
                            {negotiationPreference === 'fixed' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                         </div>
                         <p className="text-3xl font-black text-slate-900 mb-4">
                            {campaign?.type === 'barter' ? 'Gifted / Barter' : `₹${campaign?.base_payout?.toLocaleString()}`}
                         </p>
                         <p className="text-[11px] text-slate-500 leading-relaxed italic">
                            * This is the fixed compensation for the deliverables mentioned. Payments are processed via our secure ledger after content verification.
                         </p>
                      </div>

                      {/* Negotiation Toggle */}
                      <div 
                        onClick={() => setNegotiationPreference(negotiationPreference === 'negotiate' ? 'fixed' : 'negotiate')}
                        className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                          negotiationPreference === 'negotiate' 
                          ? 'border-indigo-600 bg-indigo-50/30 shadow-lg shadow-indigo-100' 
                          : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                        }`}
                      >
                         <div className="flex items-start gap-4">
                            <div className={`mt-1 h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                               negotiationPreference === 'negotiate' 
                               ? 'border-indigo-600 bg-indigo-600' 
                               : 'border-slate-300'
                            }`}>
                               {negotiationPreference === 'negotiate' && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                            <div className="space-y-1">
                               <p className="font-black text-slate-900 text-sm tracking-tight">I want to negotiate a higher pay</p>
                               <p className="text-[11px] text-slate-500 leading-relaxed">
                                 Check this only if your profile reach, high engagement, or premium content quality justifies a rate above the base payout.
                               </p>
                               {negotiationPreference === 'negotiate' && (
                                 <motion.p 
                                   initial={{ opacity: 0, height: 0 }}
                                   animate={{ opacity: 1, height: 'auto' }}
                                   className="text-[10px] text-indigo-600 font-bold mt-2 bg-indigo-50 p-2 rounded-lg border border-indigo-100"
                                 >
                                   Negotiation options will be enabled in your campaign dashboard once the brand shortlists you.
                                 </motion.p>
                               )}
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col gap-4">
                    <Button 
                      type="submit"
                      disabled={submitting}
                      className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black text-lg hover:bg-black transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3"
                    >
                      {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                        <>
                           Submit Application 
                           <ArrowRight className="w-5 h-5 group-hover:translate-x-1" />
                        </>
                      )}
                    </Button>
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      className="w-full h-12 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 tracking-[0.2em] transition-all"
                    >
                      Back to Identity
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-4 py-8">
           <div className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Verified Platform Business</p>
           </div>
           <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">© DotFluence Studio • 2024</p>
        </div>
      </motion.div>
    </div>
  );
};

export default CampaignApply;
