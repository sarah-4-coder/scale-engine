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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useWorkspace } from "@/contexts/WorkspaceContext";

const BrandCreateCampaign = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeBrandId, brands, isLoading: workspaceLoading } = useWorkspace();
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
  const [contractAuthorized, setContractAuthorized] = useState(false);

  // Eligibility criteria
  const [minFollowers, setMinFollowers] = useState("");
  const [maxFollowers, setMaxFollowers] = useState("");
  const [requiredCities, setRequiredCities] = useState("");

  // Management Style
  const [managedByDotfluence, setManagedByDotfluence] = useState(false);
  const [payoutDelayDays, setPayoutDelayDays] = useState("7");
  const [completedCampaignsCount, setCompletedCampaignsCount] = useState(0);

  useEffect(() => {
    const checkVerification = async () => {
      if (!user || !activeBrandId) return;

      const brand = brands.find(b => b.id === activeBrandId);
      if (brand) {
        setIsVerified(brand.is_verified);
      } else {
        // Fallback fetch if not in context
        const { data: profile } = await supabase
          .from("brand_profiles")
          .select("is_verified")
          .eq("id", activeBrandId)
          .single();

        if (profile) {
          setIsVerified((profile as any).is_verified);
        }
      }
    };

    const fetchNiches = async () => {
      const { data } = await supabase.from("niches").select("name");
      if (data) {
        setAvailableNiches((data as any).map((n: any) => n.name));
      }
    };

    const fetchCampaignCount = async () => {
      if (!user || !activeBrandId) return;
      const { count } = await supabase
        .from("campaigns")
        .select("*", { count: "exact", head: true })
        .eq("brand_id", activeBrandId)
        .eq("managed_by_dotfluence", false);
      
      setCompletedCampaignsCount(count || 0);
    };

    if (!workspaceLoading) {
      checkVerification();
      fetchNiches();
      fetchCampaignCount();
    }
  }, [user, activeBrandId, brands, workspaceLoading]);

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

    if (!activeBrandId) {
      toast.error("No active brand selected");
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

      const platformFeePercent = managedByDotfluence 
        ? 17 
        : (completedCampaignsCount < 1 ? 0 : 7);
      
      const executionModel = managedByDotfluence ? 'brand_managed' : 'brand_self';

      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          name: campaignName,
          description: description,
          niches: selectedNiches.length > 0 ? selectedNiches : null,
          deliverables: deliverables,
          timeline: timeline,
          base_payout: parseFloat(basePayout),
          brand_user_id: user.id,
          brand_id: activeBrandId, // Associated with the active workspace
          managed_by_dotfluence: managedByDotfluence,
          platform_fee_percent: platformFeePercent,
          execution_model: executionModel,
          payout_delay_days: parseInt(payoutDelayDays),
          eligibility: Object.keys(eligibility).length > 0 ? eligibility : null,
          status: "active",
        } as any)
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
      navigate(`/company/campaigns/${data.id}`);
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
          {/* <Alert className="mb-6 bg-blue-500/5 border-blue-500/30">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-600 dark:text-blue-400">
              Your campaigns are <strong>fixed-price</strong>. Influencers
              cannot negotiate the payout amount.
            </AlertDescription>
          </Alert> */}

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

                {/* Payout & Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
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
                    <p className="text-[10px] text-muted-foreground italic">Influencers receive 100% of this value.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payoutDelay">Payout Timeline *</Label>
                    <Select value={payoutDelayDays} onValueChange={setPayoutDelayDays}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Immediate upon approval</SelectItem>
                        <SelectItem value="7">7 Days after approval</SelectItem>
                        <SelectItem value="15">15 Days after approval</SelectItem>
                        <SelectItem value="30">30 Days (Net-30)</SelectItem>
                        <SelectItem value="60">60 Days (Net-60)</SelectItem>
                        <SelectItem value="90">90 Days (Net-90)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground italic">Standard industry terms apply.</p>
                  </div>
                </div>

                {/* Management Style */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    Campaign Management Style <span className="text-red-500">*</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      onClick={() => setManagedByDotfluence(false)}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${!managedByDotfluence ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/20'}`}
                    >
                      <h4 className="font-medium mb-1 flex justify-between">
                        Self-Managed
                        {!managedByDotfluence && <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground">✓</span>}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">You handle all communications, negotiations, and draft approvals.</p>
                      <span className="text-xs font-semibold text-green-400">Platform Fee applies</span>
                    </div>

                    <div 
                      onClick={() => setManagedByDotfluence(true)}
                      className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${managedByDotfluence ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 hover:border-white/20'}`}
                    >
                      <h4 className="font-medium mb-1 flex justify-between">
                        DotFluence Managed Service
                        {managedByDotfluence && <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white">✓</span>}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">Our team executes and handles everything end-to-end for you.</p>
                      <span className="text-xs font-semibold text-blue-400">17% Agency Fee applies</span>
                    </div>
                  </div>
                </div>

                {/* Fee Summary */}
                <div className="p-4 bg-muted/20 border border-white/10 rounded-xl space-y-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Est. Cost Per Influencer</h3>
                  <div className="flex justify-between text-sm">
                    <span>Influencer Payout:</span>
                    <span>₹{basePayout || "0"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>
                      {managedByDotfluence ? "Agency Fee (17%):" : "Platform Fee (7%):"}
                      {!managedByDotfluence && completedCampaignsCount < 1 && (
                        <span className="ml-2 text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">FREE (Trial)</span>
                      )}
                    </span>
                    <span className={!managedByDotfluence && completedCampaignsCount < 1 ? "line-through opacity-50" : ""}>
                      ₹{managedByDotfluence 
                         ? (parseFloat(basePayout || "0") * 0.17).toFixed(2) 
                         : (parseFloat(basePayout || "0") * 0.07).toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-white/10 flex justify-between font-bold">
                    <span>Total Cost:</span>
                    <span className="text-primary text-lg">
                      ₹{managedByDotfluence 
                         ? (parseFloat(basePayout || "0") * 1.17).toFixed(2) 
                         : (!managedByDotfluence && completedCampaignsCount < 1)
                           ? parseFloat(basePayout || "0").toFixed(2)
                           : (parseFloat(basePayout || "0") * 1.07).toFixed(2)}
                    </span>
                  </div>
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

                {/* Contract Authorization */}
                <div className="space-y-4 border-t pt-6 bg-primary/5 p-6 rounded-2xl border border-primary/10 mb-6">
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="contractAuth" 
                      checked={contractAuthorized}
                      onCheckedChange={(checked) => setContractAuthorized(checked as boolean)}
                      className="mt-1 border-primary/50 text-primary"
                    />
                    <div className="space-y-1.5">
                      <Label htmlFor="contractAuth" className="text-sm font-extrabold leading-none tracking-tight text-foreground uppercase">
                        Authorize AI Smart Contract Generation
                      </Label>
                      <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                        By launching this campaign, you formally authorize Dotfluence to automatically generate tailored, legally-binding partnership agreements for every creator you collaborate with. These contracts are dynamically orchestrated via Gemini AI based on your specific deliverables, brand identity, and payout terms. 
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate("/company/campaigns")}
                    className="flex-1 h-12 rounded-xl font-bold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !contractAuthorized}
                    className="flex-1 h-12 bg-primary hover:bg-primary/90 rounded-xl font-extrabold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin text-lg">⚙️</span> Orchestrating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 uppercase tracking-widest text-[11px]">
                        <PlusCircle className="h-4 w-4" />
                        Launch Campaign
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