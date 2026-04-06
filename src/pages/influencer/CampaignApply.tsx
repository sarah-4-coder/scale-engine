import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Instagram, User, ArrowRight, Loader2, Users, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const CampaignApply = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [followersCount, setFollowersCount] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }

      try {
        const { data: campaignData, error: campaignError } = await supabase
          .from("campaigns")
          .select("id, name, brand:brand_profiles!brand_id(company_name)")
          .eq("id", id)
          .maybeSingle() as any;

        if (campaignError) throw campaignError;
        setCampaign(campaignData);

        const { data: profileData } = await supabase
          .from("influencer_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileData) {
          setFullName(profileData.full_name || "");
          setInstagramHandle(profileData.instagram_handle?.replace("@", "") || "");
          setFollowersCount(profileData.followers_count?.toString() || "");
        }
      } catch (error) {
        console.error("Initialization error:", error);
        toast.error("Failed to load application details");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !instagramHandle || !followersCount) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: newProfile, error: profileError } = await supabase
        .from("influencer_profiles")
        .upsert({
          user_id: user.id,
          phone_number: user.phone,
          full_name: fullName,
          instagram_handle: instagramHandle.replace("@", ""),
          followers_count: parseInt(followersCount),
          profile_completed: false,
          custom_data: { 
            created_via: 'magic_link' 
          }
        } as any, { onConflict: 'user_id' })
        .select()
        .single();

      if (profileError) throw profileError;

      const { error: appError } = await supabase
        .from("campaign_influencers")
        .insert({
          campaign_id: id,
          influencer_id: newProfile.id,
          status: 'applied',
          source: 'magic_link'
        });

      if (appError) {
        if (appError.code === '23505') {
          toast.info("You have already applied for this campaign.");
          navigate("/dashboard");
          return;
        }
        throw appError;
      }

      sessionStorage.removeItem("invited_via");
      toast.success("Application submitted successfully!");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Application error:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFB]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 font-sans p-4 md:p-12">
      <div className="fixed inset-0 bg-slate-50 -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto space-y-8 py-4 md:py-8"
      >
        <header className="space-y-4 text-center md:text-left pt-4">
           <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full border border-indigo-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              <p className="text-[9px] uppercase font-black text-indigo-600 tracking-widest">Identity Verified</p>
           </div>
           
           <div className="space-y-2">
              <h1 className="text-2xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                {campaign?.name}
              </h1>
              <p className="text-base font-medium text-slate-500">
                Terms with <span className="text-slate-900 font-bold">{campaign?.brand?.company_name}</span>
              </p>
           </div>
        </header>

        <Card className="bg-white border-slate-200 shadow-xl shadow-slate-200/40 rounded-[2rem] p-6 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              {/* Field: Full Name */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-3">
                  Full Name
                </Label>
                <Input 
                  placeholder="Professional Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-14 px-5 bg-slate-50 border-slate-100 rounded-xl text-base font-bold text-slate-900 transition-all placeholder:text-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Field: IG */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-3">
                    Instagram
                  </Label>
                  <div className="relative">
                    <Input 
                      placeholder="handle"
                      value={instagramHandle}
                      onChange={(e) => setInstagramHandle(e.target.value.replace('@', ''))}
                      className="h-14 pl-10 bg-slate-50 border-slate-100 rounded-xl text-base font-bold text-slate-900 transition-all placeholder:text-slate-300"
                      required
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-300">@</span>
                  </div>
                </div>

                {/* Field: Reach */}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-3">
                    Followers
                  </Label>
                  <Input 
                    type="number"
                    placeholder="e.g. 10000"
                    value={followersCount}
                    onChange={(e) => setFollowersCount(e.target.value)}
                    className="h-14 px-5 bg-slate-50 border-slate-100 rounded-xl text-base font-bold text-slate-900 transition-all placeholder:text-slate-300"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={submitting}
                className="w-full h-14 rounded-xl bg-indigo-600 text-white text-base font-black hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2.5 group"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Confirm Application 
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
              
              <div className="flex items-center justify-center gap-3 mt-8 opacity-30">
                  <ShieldCheck className="w-4 h-4 text-slate-900" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Escrow Protected</p>
              </div>
            </div>
          </form>
        </Card>

        <p className="text-center text-slate-300 text-[9px] font-bold uppercase tracking-[0.2em]">
            © DotFluence Creator • 2024
        </p>
      </motion.div>
    </div>
  );
};

export default CampaignApply;
