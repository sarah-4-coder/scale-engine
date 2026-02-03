/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle, AlertCircle } from "lucide-react";
import BrandNavbar from "@/components/BrandNavbar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { sendNotification } from "@/lib/notifications";

const BrandCreateCampaign = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [description, setDescription] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [timeline, setTimeline] = useState("");
  const [basePayout, setBasePayout] = useState("");
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [availableNiches, setAvailableNiches] = useState<string[]>([]);

  // Eligibility criteria
  const [minFollowers, setMinFollowers] = useState("");
  const [maxFollowers, setMaxFollowers] = useState("");
  const [requiredCities, setRequiredCities] = useState("");

  useEffect(() => {
    const checkVerification = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("brand_profiles")
        .select("is_verified")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        //@ts-ignore
        setIsVerified(profile.is_verified);
      }
    };

    const fetchNiches = async () => {
      const { data } = await supabase.from("niches").select("name");
      if (data) {
        //@ts-ignore
        setAvailableNiches(data.map((n) => n.name));
      }
    };

    checkVerification();
    fetchNiches();
  }, [user]);

  const handleNicheToggle = (niche: string) => {
    setSelectedNiches((prev) =>
      prev.includes(niche)
        ? prev.filter((n) => n !== niche)
        : [...prev, niche]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!user) {
      toast.error("Not authenticated");
      setIsLoading(false);
      return;
    }

    if (!isVerified) {
      toast.error("Your brand account must be verified to create campaigns");
      setIsLoading(false);
      return;
    }

    try {
      const eligibility: any = {};
      if (minFollowers) eligibility.min_followers = parseInt(minFollowers);
      if (maxFollowers) eligibility.max_followers = parseInt(maxFollowers);
      if (requiredCities) {
        eligibility.cities = requiredCities
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean);
      }
      if (selectedNiches.length > 0) {
        eligibility.allowed_niches = selectedNiches;
      }

      const { data, error } = await supabase
        .from("campaigns")
        //@ts-ignore
        .insert({
          name: campaignName,
          description: description,
          niches: selectedNiches.length > 0 ? selectedNiches : null,
          deliverables: deliverables,
          timeline: timeline,
          base_payout: parseFloat(basePayout),
          brand_user_id: user.id,
          can_negotiate: false, // Brand campaigns are fixed-price
          eligibility: Object.keys(eligibility).length > 0 ? eligibility : null,
          status: "active",
        })
        .select()
        .single() as { data: { id: string } | null; error: any };

      if (error) throw error;

      if (!data) {
        throw new Error("Failed to create campaign");
      }

      // 📢 Notify eligible influencers
      const { data: influencers, error: influencersError } = await supabase
        .from("influencer_profiles")
        .select("user_id, followers_count, city, niches");

      if (!influencersError && Array.isArray(influencers)) {
        const eligibleInfluencers = influencers.filter((inf: any) => {
          if (
            eligibility.min_followers &&
            (!inf.followers_count || inf.followers_count < eligibility.min_followers)
          )
            return false;

          if (
            eligibility.max_followers &&
            inf.followers_count &&
            inf.followers_count > eligibility.max_followers
          )
            return false;

          if (
            eligibility.cities?.length &&
            !eligibility.cities.includes(inf.city)
          )
            return false;

          if (
            eligibility.allowed_niches?.length &&
            (!inf.niches ||
              !inf.niches.some((n: string) =>
                eligibility.allowed_niches.includes(n)
              ))
          )
            return false;

          return true;
        });

        // Send notifications to eligible influencers
        eligibleInfluencers.forEach((inf) => {
          sendNotification({
            //@ts-ignore
            user_id: inf.user_id,
            role: "influencer",
            type: "campaign_created",
            title: "New campaign available",
            message: `You are eligible for the campaign "${campaignName}"`,
            //@ts-ignore
            metadata: { campaign_id: data.id },
          }).catch(console.error);
        });
      }

      toast.success("Campaign created successfully! 🎉");
      navigate(`/brand/campaigns/${data.id}`);
    } catch (error: any) {
      console.error("Campaign creation error:", error);
      toast.error(error.message || "Failed to create campaign");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVerified) {
    return (
      <div className="min-h-screen bg-background">
        <BrandNavbar />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Alert className="border-yellow-500/30 bg-yellow-500/5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your brand account is not yet verified. You cannot create
                campaigns until your account is approved by our admin team.
                Please check back in 24-48 hours.
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BrandNavbar />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <PlusCircle className="h-8 w-8 text-primary" />
              Create New Campaign
            </h1>
            <p className="text-muted-foreground mt-2">
              Launch your influencer marketing campaign
            </p>
          </div>

          {/* Info Alert */}
          <Alert className="mb-6 bg-blue-500/5 border-blue-500/30">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-600 dark:text-blue-400">
              Your campaigns are <strong>fixed-price</strong>. Influencers
              cannot negotiate the payout amount.
            </AlertDescription>
          </Alert>

          {/* Form */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Campaign Details</CardTitle>
              <CardDescription>
                Provide information about your campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaignName">Campaign Name *</Label>
                    <Input
                      id="campaignName"
                      placeholder="Summer Fashion Collection 2024"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your campaign, brand, and what you're looking for..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>

                {/* Niches */}
                <div className="space-y-2">
                  <Label>Target Niches</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-muted/30 rounded-lg max-h-60 overflow-y-auto">
                    {availableNiches.map((niche) => (
                      <div key={niche} className="flex items-center space-x-2">
                        <Checkbox
                          id={niche}
                          checked={selectedNiches.includes(niche)}
                          onCheckedChange={() => handleNicheToggle(niche)}
                        />
                        <Label
                          htmlFor={niche}
                          className="text-sm cursor-pointer"
                        >
                          {niche}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Campaign Requirements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deliverables">Deliverables *</Label>
                    <Textarea
                      id="deliverables"
                      placeholder="e.g., 1 Instagram Reel + 2 Stories"
                      value={deliverables}
                      onChange={(e) => setDeliverables(e.target.value)}
                      required
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeline">Timeline *</Label>
                    <Textarea
                      id="timeline"
                      placeholder="e.g., Content due by March 15, 2024"
                      value={timeline}
                      onChange={(e) => setTimeline(e.target.value)}
                      required
                      rows={3}
                    />
                  </div>
                </div>

                {/* Payout */}
                <div className="space-y-2">
                  <Label htmlFor="basePayout">Fixed Payout (₹) *</Label>
                  <Input
                    id="basePayout"
                    type="number"
                    placeholder="10000"
                    value={basePayout}
                    onChange={(e) => setBasePayout(e.target.value)}
                    required
                    min="0"
                    step="100"
                  />
                  <p className="text-xs text-muted-foreground">
                    This is a fixed amount. Influencers cannot negotiate.
                  </p>
                </div>

                {/* Eligibility Criteria */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold">
                    Eligibility Criteria (Optional)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minFollowers">Minimum Followers</Label>
                      <Input
                        id="minFollowers"
                        type="number"
                        placeholder="10000"
                        value={minFollowers}
                        onChange={(e) => setMinFollowers(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxFollowers">Maximum Followers</Label>
                      <Input
                        id="maxFollowers"
                        type="number"
                        placeholder="100000"
                        value={maxFollowers}
                        onChange={(e) => setMaxFollowers(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requiredCities">
                      Required Cities (comma-separated)
                    </Label>
                    <Input
                      id="requiredCities"
                      placeholder="Mumbai, Delhi, Bangalore"
                      value={requiredCities}
                      onChange={(e) => setRequiredCities(e.target.value)}
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/brand/campaigns")}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⏳</span> Creating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Create Campaign
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default BrandCreateCampaign;