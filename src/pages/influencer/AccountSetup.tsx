import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const AccountSetup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Profile Data
  const [profile, setProfile] = useState<any>(null);
  
  // Form State
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [allNiches, setAllNiches] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
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
        if (profileData.niches) setSelectedNiches(profileData.niches);
        if (profileData.profile_image_url) setImagePreview(profileData.profile_image_url);
      }

      // Fetch niches
      const { data: nichesData } = await supabase.from("niches").select("name");
      setAllNiches(nichesData?.map(n => n.name) || []);
      
      setLoading(false);
    };

    init();
  }, [navigate]);

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Upload Image
      const imageUrl = await uploadImage(user.id);

      // 2. Update Profile
      const { error: profileError } = await supabase
        .from("influencer_profiles")
        .update({
          city,
          state,
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
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-12">
      <div className="max-w-xl mx-auto space-y-8 py-4">
        
        <header className="space-y-4 text-center md:text-left">
           <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-full border border-indigo-100">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <p className="text-[9px] uppercase font-black text-indigo-600 tracking-widest">Profile Setup</p>
           </div>
           <div className="space-y-2">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                Complete Your <span className="text-indigo-600">Creative Profile</span>
              </h1>
              <p className="text-base font-medium text-slate-500">
                Tell us more about yourself to unlock full platform access.
              </p>
           </div>
        </header>

        <Card className="bg-white border-slate-200 shadow-xl shadow-slate-200/40 rounded-[2rem] p-6 md:p-10 overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div className="text-center md:text-left">
                  <h3 className="text-lg font-black flex items-center gap-2 justify-center md:justify-start">
                    <Sparkles className="w-5 h-5 text-indigo-600" /> Creative Identity
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">Add your details to attract more brands.</p>
                </div>

                {/* Profile Pic */}
                <div className="flex flex-col items-center gap-4">
                   <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Profile Picture</Label>
                   <div className="relative group">
                      <div className="w-24 h-24 rounded-3xl bg-slate-100 border-2 border-slate-200 overflow-hidden transition-all group-hover:border-indigo-600">
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
                      <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-3">City</Label>
                      <Input 
                        placeholder="e.g. Mumbai"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-14 px-5 bg-slate-50 border-slate-100 rounded-xl font-bold text-slate-900"
                        required
                      />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-3">State</Label>
                      <Input 
                        placeholder="e.g. Maharashtra"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="h-14 px-5 bg-slate-50 border-slate-100 rounded-xl font-bold text-slate-900"
                        required
                      />
                   </div>
                </div>

                {/* Niches */}
                <div className="space-y-3">
                   <Label className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-3">Content Niches</Label>
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
                               ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                               : "bg-slate-50 border-slate-100 text-slate-500 hover:border-indigo-100 hover:bg-white"
                            )}
                         >
                            {niche}
                         </button>
                      ))}
                   </div>
                   <p className="text-[10px] text-slate-400 mt-2 text-center italic">Select all that apply to you</p>
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full h-16 rounded-2xl bg-indigo-600 text-white font-black text-lg transition-all hover:bg-slate-900 shadow-xl shadow-indigo-100 group"
                >
                  {submitting ? <Loader2 className="animate-spin" /> : (
                    <>
                      Complete Your Profile
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
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

export default AccountSetup;
