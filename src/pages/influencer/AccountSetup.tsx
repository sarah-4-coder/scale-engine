import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ShieldCheck, 
  MapPin, 
  Sparkles, 
  Image as ImageIcon, 
  Loader2, 
  ArrowRight, 
  Tag,
  Camera,
  X
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";
import ThemedStudioBackground from "@/components/influencer/ThemedStudioBackground";

const AccountSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, themeKey } = useInfluencerTheme();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [razorpayId, setRazorpayId] = useState("");

  // Profile Data
  const [profile, setProfile] = useState<any>(null);
  
  // Form State
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [bio, setBio] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [allNiches, setAllNiches] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      if (!user) {
        navigate("/");
        return;
      }

      const { data: profileData } = await supabase
        .from("influencer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
        if (profileData.profile_completed) {
          navigate("/dashboard");
          return;
        }
        setCity(profileData.city || "");
        setState(profileData.state || "");
        setBio(profileData.bio || "");
        setInstagramHandle(profileData.instagram_handle || "");
        if (profileData.niches) setSelectedNiches(profileData.niches);
        if (profileData.profile_image_url) setImagePreview(profileData.profile_image_url);
      }

      // Fetch niches
      const { data: nichesData } = await supabase.from("niches").select("name");
      setAllNiches(nichesData?.map(n => n.name) || []);
      
      setLoading(false);
    };

    init();
  }, [user, navigate]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (userId: string) => {
    if (!profileImage) return null;
    const fileExt = profileImage.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `profile-images/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('influencer-assets')
      .upload(filePath, profileImage, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('influencer-assets')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedNiches.length === 0) {
      toast.error("Please select at least one niche");
      return;
    }
    if (!city || !state) {
      toast.error("Location details are required");
      return;
    }

    setSubmitting(true);
    try {
      if (!user) throw new Error("Not authenticated");

      // 1. Upload Image
      const imageUrl = await uploadImage(user.id);

      // 2. Update Profile
      const { error: profileError } = await supabase
        .from("influencer_profiles")
        .update({
          city,
          state,
          bio,
          instagram_handle: instagramHandle.replace("@", ""),
          niches: selectedNiches,
          profile_image_url: imageUrl || profile?.profile_image_url,
          profile_completed: true
        } as any)
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      toast.success("Profile completed! Welcome aboard.");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Setup error:", error);
      toast.error(error.message || "Failed to complete setup");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden transition-colors duration-500"
      style={{ background: theme.background }}
    >
      <ThemedStudioBackground themeKey={themeKey} />
      
      {/* ProgressBar */}
      <div className="fixed top-0 left-0 w-full h-1.5 z-50 bg-black/10">
        <motion.div
          className="h-full bg-blue-600 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <div className="max-w-xl mx-auto space-y-8 py-12 px-4 relative z-10">
        
        <header className="space-y-4 text-center md:text-left">
           <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <p className="text-[9px] uppercase font-black text-white tracking-widest">Profile Setup</p>
           </div>
           <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight text-white">
                Complete Your <span style={{ color: theme.primary }}>Creative Profile</span>
              </h1>
              <p className="text-base font-medium text-white/70">
                Tell us more about yourself to unlock full platform access.
              </p>
           </div>
        </header>

        <Card className="bg-white/90 backdrop-blur-xl border-white/20 shadow-2xl rounded-[2rem] p-6 md:p-10 overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div className="text-center md:text-left">
                  <h3 className="text-lg font-black flex items-center gap-2 justify-center md:justify-start text-slate-900">
                    <Sparkles className="w-5 h-5" style={{ color: theme.primary }} /> Creative Identity
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">Add your details to attract more brands.</p>
                </div>

                {/* Profile Pic */}
                <div className="flex flex-col items-center gap-4">
                   <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Profile Picture</Label>
                   <div className="relative group">
                       <div className={`w-24 h-24 rounded-3xl ${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} overflow-hidden transition-all group-hover:border-blue-500`}>
                         {imagePreview ? (
                           <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center">
                              <Camera className="w-8 h-8 text-slate-300" />
                           </div>
                         )}
                      </div>
                      <input 
                        type="file" 
                        onChange={handleImageSelect} 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        accept="image/*"
                      />
                      {imagePreview && (
                        <button 
                          type="button"
                          onClick={() => { setImagePreview(""); setProfileImage(null); }}
                          className="absolute -top-2 -right-2 bg-rose-500 text-white p-1 rounded-full shadow-lg transition-transform hover:scale-110"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                   </div>
                   <p className="text-[10px] text-slate-400 font-medium">Click to upload (PNG/JPG)</p>
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={`text-[10px] uppercase font-black ${themeKey === 'dark' ? 'text-white/40' : 'text-slate-400'} tracking-widest ml-3`}>City</Label>
                    <Input 
                      placeholder="e.g. Mumbai"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={`h-14 px-5 ${themeKey === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'} rounded-xl font-bold`}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={`text-[10px] uppercase font-black ${themeKey === 'dark' ? 'text-white/40' : 'text-slate-400'} tracking-widest ml-3`}>State</Label>
                    <Input 
                      placeholder="e.g. Maharashtra"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className={`h-14 px-5 ${themeKey === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-100 text-slate-900'} rounded-xl font-bold`}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className={`text-[10px] uppercase font-black ${themeKey === 'dark' ? 'text-white/40' : 'text-slate-400'} tracking-widest ml-3`}>Instagram Handle</Label>
                    <div className="relative mt-2">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</div>
                      <Input
                        value={instagramHandle}
                        onChange={(e) => setInstagramHandle(e.target.value)}
                        placeholder="yourname"
                        className={`pl-10 h-14 rounded-2xl ${themeKey === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} focus:ring-blue-500 focus:border-blue-500 font-bold`}
                        required
                      />
                    </div>
                    {razorpayId && (
                      <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${themeKey === 'light' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'} text-xs font-bold uppercase tracking-wider border`}>
                        <CheckCircle2 size={12} />
                        Razorpay Linked: {razorpayId}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label className={`text-[10px] uppercase font-black ${themeKey === 'dark' ? 'text-white/40' : 'text-slate-400'} tracking-widest ml-3`}>Creative Bio</Label>
                    <Textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className={`mt-2 min-h-[120px] rounded-2xl ${themeKey === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} focus:ring-primary focus:border-primary font-medium p-4`}
                      required
                    />
                  </div>
                </div>

                 <div className="space-y-3">
                    <Label className={`text-[10px] uppercase font-black ${themeKey === 'dark' ? 'text-white/40' : 'text-slate-400'} tracking-widest ml-3`}>Content Niches</Label>
                    <div className="flex flex-wrap gap-2">
                       {allNiches.map(niche => (
                          <button
                             key={niche}
                             type="button"
                             onClick={() => {
                                if (selectedNiches.includes(niche)) {
                                   setSelectedNiches(selectedNiches.filter(n => n !== niche));
                                } else {
                                   setSelectedNiches([...selectedNiches, niche]);
                                }
                             }}
                             className={cn(
                                "px-4 py-2.5 rounded-xl text-xs font-bold transition-all border",
                                 selectedNiches.includes(niche)
                                 ? "text-white shadow-lg shadow-blue-500/20 border-transparent"
                                 : `${themeKey === 'dark' ? 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200 hover:bg-blue-50'}`
                             )}
                             style={{ 
                                backgroundColor: selectedNiches.includes(niche) ? '#2563EB' : undefined,
                                boxShadow: selectedNiches.includes(niche) ? `0 4px 15px rgba(37,99,235,0.3)` : undefined
                             }}
                          >
                             {niche}
                          </button>
                       ))}
                    </div>
                    <p className={`text-[10px] ${themeKey === 'dark' ? 'text-white/30' : 'text-slate-400'} mt-3 text-center font-bold uppercase tracking-widest`}>Select all that apply</p>
                 </div>
              </div>

              <div className="space-y-4">
                <Button 
                  type="submit" 
                  disabled={submitting}
                   className={`w-full h-16 rounded-2xl text-white font-black text-lg transition-all hover:scale-[1.02] active:scale-100 ${themeKey === 'dark' ? 'bg-white text-blue-600' : 'bg-blue-600 shadow-xl shadow-blue-500/20'}`}
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                       <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       Creating Profile...
                    </div>
                  ) : (
                    "Save & Get Started"
                  )}
                </Button>
              </div>
            </form>
        </Card>

        <footer className="text-center space-y-4">
           <div className="flex items-center justify-center gap-4 opacity-30">
              <ShieldCheck className="w-4 h-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">Secured Platform</p>
           </div>
           <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em]">© 2024 DotFluence Creator</p>
        </footer>
      </div>
    </div>
  );
};

export default memo(AccountSetup);
