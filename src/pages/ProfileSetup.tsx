import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

const ProfileSetup = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [instagramHandle, setInstagramHandle] = useState("");
  const [nichesInput, setNichesInput] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // 🔒 Block access if profile already completed
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (!user) return;

      const { data } = await supabase
        .from("influencer_profiles")
        .select("profile_completed")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.profile_completed) {
        navigate("/dashboard", { replace: true });
        return;
      }

      setChecking(false);
    };

    checkExistingProfile();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const niches = nichesInput
      .split(",")
      .map((n) => n.trim().toLowerCase())
      .filter(Boolean);

    if (niches.length === 0) {
      toast.error("Please enter at least one niche");
      setLoading(false);
      return;
    }

    const cleanHandle = instagramHandle.replace("@", "").trim();
    const instagramProfileUrl = `https://www.instagram.com/${cleanHandle}`;

    const { error } = await supabase.from("influencer_profiles").insert({
      user_id: user.id,
      instagram_handle: cleanHandle,
      instagram_profile_url: instagramProfileUrl,
      niches,
      phone_number: phone,
      profile_completed: true,
    });

    if (error) {
      console.error(error);
      toast.error("Failed to complete profile");
      setLoading(false);
      return;
    }

    toast.success("Profile completed successfully");
    navigate("/dashboard", { replace: true });
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-card border border-border rounded-xl p-6 space-y-6"
        >
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Complete Your Profile</h1>
            <p className="text-sm text-muted-foreground">
              One-time setup. Cannot be edited later.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Instagram Handle</Label>
            <Input
              placeholder="@yourhandle"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Niches (comma separated)</Label>
            <Input
              placeholder="fashion, beauty, lifestyle"
              value={nichesInput}
              onChange={(e) => setNichesInput(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input
              placeholder="+91XXXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Complete Profile"}
          </Button>
        </form>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          <LogOut size={16} className="mr-2" />
          Sign Out
        </Button>
      </div>
    </>
  );
};

export default ProfileSetup;
