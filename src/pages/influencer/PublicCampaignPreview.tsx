import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Instagram, Users, CheckCircle2, ShieldCheck, ArrowRight, X, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

const PublicCampaignPreview = () => {
  const { slug } = useParams();
  const { signInWithOtp, verifyOtp } = useAuth();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOtpFlow, setShowOtpFlow] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [roleConflict, setRoleConflict] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCampaign();
  }, [slug]);

  const fetchCampaign = async () => {
    try {
      const { data, error } = await supabase
        .from("campaigns")
        .select(`
          id, name, description, type, deliverables, timeline, 
          base_payout, status, application_deadline, niches, brand_id
        `)
        .eq("slug", slug)
        .maybeSingle() as any;

      if (error) throw error;
      if (data) {
          const { data: brand } = await supabase
            .from('brand_profiles')
            .select('company_name, logo_url')
            .eq('id', data.brand_id)
            .maybeSingle();
          setCampaign({ ...data, brand });
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
      toast.error("Error loading campaign");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setIsAuthenticating(true);
    
    // Support both 10-digit and prefixed numbers
    const cleanPhone = phone.replace(/\s+/g, '');
    const formattedPhone = cleanPhone.startsWith('+') 
      ? cleanPhone 
      : cleanPhone.startsWith('91') && cleanPhone.length === 12
        ? `+${cleanPhone}`
        : `+91${cleanPhone}`;

    const { error } = await signInWithOtp(formattedPhone);
    if (error) {
      toast.error(error.message);
    } else {
      setStep('otp');
      toast.success("OTP sent to your phone");
    }
    setIsAuthenticating(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setIsAuthenticating(true);
    const { error } = await verifyOtp(phone, otp);
    if (error) {
      toast.error(error.message);
      setIsAuthenticating(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsAuthenticating(false);
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle() as any;

    if (roleData?.role === 'agency' || roleData?.role === 'brand' || roleData?.role === 'admin') {
      setRoleConflict(true);
      setIsAuthenticating(false);
      return;
    }

    const cleanPhone = phone.replace(/\s+/g, '');
    const formattedPhone = cleanPhone.startsWith('+') 
      ? cleanPhone 
      : cleanPhone.startsWith('91') && cleanPhone.length === 12
        ? `+${cleanPhone}`
        : `+91${cleanPhone}`;

    const { data: profile } = await supabase
      .from('influencer_profiles')
      .select('id')
      .eq('phone_number', formattedPhone)
      .maybeSingle() as any;

    if (profile) {
      const { data: application } = await supabase
        .from('campaign_influencers')
        .select('id')
        .eq('campaign_id', campaign.id)
        .eq('influencer_id', profile.id)
        .maybeSingle();

      if (application) {
        toast.info("You have already applied for this campaign.");
        navigate('/dashboard');
        return;
      }
    }

    sessionStorage.setItem("invited_via", "campaign");
    sessionStorage.setItem("campaign_context_id", campaign.id);
    navigate(`/campaign/${campaign.id}/preview`);
    setIsAuthenticating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-50">
        <div className="w-20 h-20 bg-rose-100 rounded-3xl flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-rose-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Campaign Link Inactive</h1>
        <p className="text-slate-500 max-w-sm mt-2">This campaign link is no longer active or does not exist.</p>
        <Button onClick={() => navigate("/")} variant="outline" className="mt-8 rounded-2xl px-8 h-12">Go to Home</Button>
      </div>
    );
  }

  const isClosed = campaign.status === 'closed' || (campaign.application_deadline && new Date(campaign.application_deadline) < new Date());

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100 font-sans">
      <div className="fixed inset-0 bg-slate-50 -z-10" />
      
      {/* Top Navigation / Brand Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden">
                {campaign.brand?.logo_url ? (
                    <img src={campaign.brand.logo_url} className="w-full h-full object-cover" alt="" />
                ) : (
                    <Users className="w-5 h-5 text-white" />
                )}
             </div>
             <div className="hidden sm:block">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Collaborate with</p>
                <p className="font-bold text-sm tracking-tight">{campaign.brand?.company_name}</p>
             </div>
          </div>
          <Badge className="bg-indigo-50 text-indigo-600 hover:bg-indigo-50 border-indigo-100 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
            {campaign.type || 'Partnership'}
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 md:py-24 space-y-12">
        {/* Hero Section */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="space-y-6 text-center md:text-left"
        >
          <div className="flex items-center gap-2 justify-center md:justify-start">
             <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
             <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Verified Opportunity</p>
          </div>
          
          <h1 className="text-3xl md:text-7xl font-black tracking-tight leading-tight text-slate-900">
            {campaign.name}
          </h1>
          
          <p className="text-lg md:text-2xl font-medium text-slate-600 leading-relaxed max-w-2xl px-2 md:px-0">
            {campaign.description}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-8 md:gap-10 pt-2">
             <div className="space-y-0.5">
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Payout</p>
                <p className="text-2xl md:text-3xl font-black text-slate-900">
                    {campaign.type === 'barter' ? 'Gifted' : `₹${campaign.base_payout?.toLocaleString()}`}
                </p>
             </div>
             <div className="w-[1px] h-8 bg-slate-200" />
             <div className="space-y-0.5">
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Platform</p>
                <p className="text-2xl md:text-3xl font-black text-slate-900">Instagram</p>
             </div>
             <div className="w-[1px] h-8 bg-slate-200 hidden sm:block" />
             <div className="space-y-0.5 hidden sm:block">
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Timeline</p>
                <p className="text-2xl md:text-3xl font-black text-slate-900">{campaign.timeline || '14 Days'}</p>
             </div>
          </div>
        </motion.div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
           {/* Deliverables Card */}
           <Card className="bg-white border-slate-200 shadow-xl shadow-slate-200/40 rounded-[2rem] p-6 md:p-10 space-y-6">
              <h3 className="text-[11px] uppercase font-black text-slate-900 flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-indigo-600" /> Deliverables
              </h3>
              <div className="space-y-3">
                 {(Array.isArray(campaign.deliverables) ? campaign.deliverables : [campaign.deliverables]).map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100/50 group hover:border-indigo-100 transition-all">
                       <span className="text-[10px] font-black text-slate-400 group-hover:text-indigo-600">0{i+1}</span>
                       <p className="font-bold text-slate-700 text-sm leading-snug">{item}</p>
                    </div>
                 ))}
              </div>
           </Card>

           {/* Action Card */}
           <Card className="bg-white border-slate-200 shadow-xl shadow-slate-200/40 rounded-[2rem] p-6 md:p-10 h-full flex flex-col justify-center min-h-[300px]">
              <div className="space-y-8">
                 {roleConflict ? (
                    <div className="text-center p-6 bg-rose-50 border border-rose-100 rounded-2xl space-y-4">
                       <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-rose-900 uppercase">Creator Only</p>
                          <p className="text-[11px] text-rose-600">Switch account to apply.</p>
                       </div>
                       <Button onClick={() => setRoleConflict(false)} variant="link" className="text-[10px] font-black uppercase text-rose-600 tracking-widest">Reset</Button>
                    </div>
                 ) : isClosed ? (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl">
                       <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Closed</p>
                       <p className="text-slate-500 text-sm mt-2">Registration for this is closed.</p>
                    </div>
                 ) : (
                    <div className="space-y-6">
                       <div className="text-center space-y-1">
                          <h4 className="text-xl font-black text-slate-900 tracking-tight">Apply to Partner</h4>
                          <p className="text-[11px] text-slate-500 font-medium font-sans">Open for all verified creators</p>
                       </div>
                       <Button 
                          onClick={() => navigate(`/apply/${campaign.id}`)}
                          className="w-full h-16 rounded-2xl bg-indigo-600 text-white text-lg font-black hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 group"
                       >
                          Apply Now 
                          <ArrowRight className="ml-2.5 w-5 h-5 group-hover:translate-x-1 transition-all" />
                       </Button>
                       <div className="flex items-center justify-center gap-2 opacity-50">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <p className="text-[9px] font-black uppercase tracking-widest">Safe & Secure</p>
                       </div>
                    </div>
                 )}
              </div>
           </Card>
        </div>
      </main>

      {/* Footer / Trust Bar */}
      <footer className="max-w-4xl mx-auto px-6 py-12 border-t border-slate-200">
         <div className="flex flex-col sm:flex-row items-center justify-between gap-8 opacity-40 grayscale">
             <div className="flex items-center gap-6">
                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" className="h-4" alt="" />
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <p className="text-[10px] uppercase font-black text-slate-600 tracking-widest">Platform Protected</p>
             </div>
             <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-slate-900" />
                <p className="text-[10px] uppercase font-black text-slate-600 tracking-widest">Payment Escrow Active</p>
             </div>
         </div>
      </footer>
    </div>
  );
};

export default PublicCampaignPreview;
