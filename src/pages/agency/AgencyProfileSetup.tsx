import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Link as LinkIcon, Building2, Save, CheckCircle2 } from "lucide-react";

const AgencyProfileSetup = () => {
  const [agencyName, setAgencyName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAgencyProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/company/login");
          return;
        }

        const { data: profile, error } = await supabase
          .from("agency_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (profile) {
          setAgencyName(profile.agency_name || "");
          setDescription(profile.description || "");
          setWebsite(profile.website || "");
        }
      } catch (error: any) {
        console.error("Error fetching agency profile:", error);
        toast.error("Failed to load profile data");
      } finally {
        setIsFetching(false);
      }
    };

    fetchAgencyProfile();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("agency_profiles")
        .upsert({
          user_id: user.id,
          agency_name: agencyName,
          description,
          website,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast.success("Profile saved successfully");
      navigate("/agency/dashboard");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-2xl mx-auto relative z-10">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
              <Building2 className="text-purple-400 h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Agency Profile Setup</h1>
              <p className="text-slate-400 text-sm">Tell us about your marketing agency</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="agencyName" className="text-slate-300">Agency Name</Label>
              <Input
                id="agencyName"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="DotFluence Talent Management"
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="text-slate-300">Website URL</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://youragency.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-300">About the Agency</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="We specialize in managing premium lifestyle brands and top-tier influencers..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 min-h-[150px]"
              />
            </div>

            <div className="pt-4 flex gap-4">
               <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold h-12"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span> Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-5 w-5" /> Save Profile
                  </span>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/agency/dashboard")}
                className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                Skip for now
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.2 }}
               className="bg-slate-900/30 border border-white/5 rounded-xl p-4 flex items-start gap-3"
            >
                <CheckCircle2 className="text-emerald-500 h-5 w-5 mt-0.5" />
                <div>
                   <h3 className="text-white font-medium text-sm">Multi-Brand Management</h3>
                   <p className="text-slate-500 text-xs mt-1">Manage 20+ clients from a single agent login without switching accounts.</p>
                </div>
            </motion.div>
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: 0.3 }}
               className="bg-slate-900/30 border border-white/5 rounded-xl p-4 flex items-start gap-3"
            >
                <CheckCircle2 className="text-blue-500 h-5 w-5 mt-0.5" />
                <div>
                   <h3 className="text-white font-medium text-sm">Automated Billing</h3>
                   <p className="text-slate-500 text-xs mt-1">Split commission between your agency and influencers seamlessly.</p>
                </div>
            </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AgencyProfileSetup;
