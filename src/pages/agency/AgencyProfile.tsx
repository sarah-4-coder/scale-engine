import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Link as LinkIcon, Building2, Save, ArrowLeft } from "lucide-react";

const AgencyProfile = () => {
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

      toast.success("Agency profile updated successfully");
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
    <div className="min-h-screen bg-slate-950 py-12 px-4 relative overflow-hidden text-slate-200">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-2xl mx-auto relative z-10">
        <Button 
            variant="ghost" 
            onClick={() => navigate("/agency/dashboard")}
            className="mb-8 text-slate-400 hover:text-white"
        >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>

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
              <h1 className="text-2xl font-bold text-white">Agency Profile</h1>
              <p className="text-slate-400 text-sm">Manage your marketing agency settings</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="agencyName" className="text-slate-300">Agency Name</Label>
              <Input
                id="agencyName"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Agency Name"
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
                placeholder="Agency description..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 min-h-[150px]"
              />
            </div>

            <div className="pt-4">
               <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold h-12"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <span className="animate-spin">⏳</span> Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    <Save className="h-5 w-5" /> Save Changes
                  </span>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default AgencyProfile;
