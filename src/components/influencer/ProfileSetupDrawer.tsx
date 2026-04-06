import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Instagram, User, MapPin, Briefcase, Tag, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfileSetupDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  onProfileUpdate: () => void;
}

const ProfileSetupDrawer = ({ open, onOpenChange, profile, onProfileUpdate }: ProfileSetupDrawerProps) => {
  const [loading, setLoading] = useState(false);
  const [niches, setNiches] = useState<string[]>([]);
  const [availableNiches, setAvailableNiches] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    full_name: "",
    instagram_handle: "",
    bio: "",
    city: "",
    state: ""
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        instagram_handle: profile.instagram_handle || "",
        bio: profile.bio || "",
        city: profile.city || "",
        state: profile.state || ""
      });
      setNiches(profile.niches || []);
    }
  }, [profile]);

  useEffect(() => {
    const fetchNiches = async () => {
      const { data } = await supabase.from('niches').select('*').order('name');
      if (data) setAvailableNiches(data);
    };
    fetchNiches();
  }, []);

  const toggleNiche = (nicheName: string) => {
    setNiches(prev => 
      prev.includes(nicheName) 
        ? prev.filter(n => n !== nicheName)
        : [...prev, nicheName]
    );
  };

  const handleSave = async () => {
    if (!formData.full_name || !formData.instagram_handle) {
      toast.error("Name and Instagram handle are required");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('influencer_profiles')
        .update({
          ...formData,
          niches,
          profile_completed: true // Mark as completed when saved from here
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success("Profile updated!");
      onProfileUpdate();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-card border-white/5">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-2xl font-black">Complete Your Profile</SheetTitle>
          <SheetDescription>
            High-quality profiles get 4x more campaign approvals.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8 py-4">
          {/* Basics */}
          <div className="space-y-4">
            <Label className="text-xs uppercase font-black text-primary tracking-widest">Basic Information</Label>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        className="pl-10"
                    />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Instagram Handle</Label>
                <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        value={formData.instagram_handle}
                        onChange={(e) => setFormData({...formData, instagram_handle: e.target.value})}
                        className="pl-10"
                    />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <Label className="text-xs uppercase font-black text-primary tracking-widest">Location</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City</Label>
                <Input 
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Input 
                    value={formData.state}
                    onChange={(e) => setFormData({...formData, state: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label className="text-xs uppercase font-black text-primary tracking-widest">Bio / Description</Label>
            <Textarea 
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Tell brands why they should work with you..."
                className="h-32 resize-none"
            />
          </div>

          {/* Niches */}
          <div className="space-y-4">
            <Label className="text-xs uppercase font-black text-primary tracking-widest">Your Niches</Label>
            <div className="flex flex-wrap gap-2">
              {availableNiches.map((n) => (
                <Badge 
                    key={n.id}
                    variant={niches.includes(n.name) ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1"
                    onClick={() => toggleNiche(n.name)}
                >
                    {n.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <Button 
                onClick={handleSave} 
                className="w-full h-14 text-lg font-bold rounded-xl"
                disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" /> : "Save Profile"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProfileSetupDrawer;
