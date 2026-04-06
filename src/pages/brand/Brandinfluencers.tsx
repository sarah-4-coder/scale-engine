/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Users,
  Search,
  Instagram,
  MapPin,
  TrendingUp,
  X,
  Plus,
  MessageSquare,
  PhoneCall,
  Trash2
} from "lucide-react";
import BrandNavbar from "@/components/BrandNavbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";

interface InfluencerProfile {
  id: string;
  user_id: string;
  full_name: string;
  instagram_handle: string;
  instagram_profile_url: string;
  followers_count: number | null;
  niches: string[] | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  profile_image_url: string | null;
}

const BrandInfluencers = () => {
  const [influencers, setInfluencers] = useState<InfluencerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNiche, setSelectedNiche] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [minFollowers, setMinFollowers] = useState<string>("");
  const [availableNiches, setAvailableNiches] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkWhatsAppDialog, setShowBulkWhatsAppDialog] = useState(false);
  const [showBulkAICallDialog, setShowBulkAICallDialog] = useState(false);
  const [showBulkPushDialog, setShowBulkPushDialog] = useState(false);
  const [targetCampaignId, setTargetCampaignId] = useState("");
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  const selectedInfluencers = useMemo(() => 
    influencers.filter(inf => selectedIds.includes(inf.id)),
    [influencers, selectedIds]
  );

  useEffect(() => {
    fetchUserTier();
    const fetchCampaigns = async () => {
        const { data } = await supabase.from('campaigns').select('id, name, total_slots').eq('status', 'active');
        setCampaigns(data || []);
    };
    fetchCampaigns();
    const fetchInfluencers = async () => {
      try {
      setLoading(true);

      // Fetch all influencers from the platform with profile_image_url where is_blocked is false
      const { data, error } = await supabase
        .from("influencer_profiles")
        .select(`
          id,
          user_id,
          full_name,
          instagram_handle,
          instagram_profile_url,
          followers_count,
          niches,
          city,
          state,
          bio,
          profile_image_url
        `)
        .eq("is_blocked", false)
        .order("followers_count", { ascending: false });

      if (error) throw error;

      setInfluencers(data || []);

      // Extract unique niches and cities for filters
      const niches = new Set<string>();
      const cities = new Set<string>();

      data?.forEach((inf) => {
        //@ts-expect-error
        inf.niches?.forEach((niche: string) => niches.add(niche));
        //@ts-expect-error
        if (inf.city) cities.add(inf.city);
      });

      setAvailableNiches(Array.from(niches).sort());
      setAvailableCities(Array.from(cities).sort());
      } catch (error: any) {
      console.error("Error fetching influencers:", error);
      toast.error("Failed to load influencers");
      } finally {
      setLoading(false);
      }
    };

    fetchInfluencers();
  }, []);

  // Filter influencers based on search and filters
  const filteredInfluencers = useMemo(() => {
    return influencers.filter((inf) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          inf.full_name?.toLowerCase().includes(search) ||
          inf.instagram_handle?.toLowerCase().includes(search) ||
          inf.niches?.some((n) => n.toLowerCase().includes(search));

        if (!matchesSearch) return false;
      }

      // Niche filter
      if (selectedNiche !== "all") {
        if (!inf.niches?.includes(selectedNiche)) return false;
      }

      // City filter
      if (selectedCity !== "all") {
        if (inf.city !== selectedCity) return false;
      }

      // Followers filter
      if (minFollowers) {
        const min = parseInt(minFollowers);
        if (!inf.followers_count || inf.followers_count < min) return false;
      }

      return true;
    });
  }, [influencers, searchTerm, selectedNiche, selectedCity, minFollowers]);

  // Clear selection on filter change
  useEffect(() => {
    if (selectedIds.length > 0) {
      setSelectedIds([]);
      toast.info("Selection cleared because filters changed.");
    }
  }, [searchTerm, selectedNiche, selectedCity, minFollowers]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedNiche("all");
    setSelectedCity("all");
    setMinFollowers("");
  };

  const formatFollowers = (count: number | null) => {
    if (!count) return "N/A";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleToggleSelect = (uid: string) => {
    setSelectedIds(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredInfluencers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInfluencers.map(i => i.id));
    }
  };

  const handleBulkWhatsApp = async () => {
    setIsBulkProcessing(true);
    for (let i = 0; i < selectedInfluencers.length; i++) {
        const inf = selectedInfluencers[i];
        //@ts-expect-error
        const phone = inf.phone_number || inf.full_name?.replace(/\D/g, '') || "919000000000"; // Fallback for testing
        const formattedPhone = phone.toString().startsWith('91') ? phone : `91${phone}`;
        const url = `https://wa.me/${formattedPhone}?text=Hi%20${inf.full_name}!%20Dotfluence%20has%20a%20campaign%20for%20you:%20https://dotfluence.in/magic`;
        window.open(url, '_blank');
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setIsBulkProcessing(false);
    setShowBulkWhatsAppDialog(false);
    setSelectedIds([]);
    toast.success(`Launched threads for ${selectedInfluencers.length} influencers`);
  };

  const handleBulkPushToCampaign = async () => {
    if (!targetCampaignId) return;
    setIsBulkProcessing(true);
    try {
        const { data: campaign } = await supabase.from('campaigns').select('total_slots').eq('id', targetCampaignId).single();
        const { count } = await supabase.from('campaign_influencers').select('*', { count: 'exact', head: true }).eq('campaign_id', targetCampaignId);
        
        const remainingSlots = (campaign?.total_slots || 200) - (count || 0);
        let targetList = selectedInfluencers;
        if (selectedInfluencers.length > remainingSlots) {
            if (!confirm(`Only ${remainingSlots} slots remaining. Only the first ${remainingSlots} will be added. Continue?`)) return;
            targetList = selectedInfluencers.slice(0, remainingSlots);
        }

        const applications = targetList.map(inf => ({
            campaign_id: targetCampaignId,
            influencer_id: inf.id,
            status: 'applied',
            payout_agreed: 0
        }));

        const { error } = await supabase.from('campaign_influencers').insert(applications);
        if (error && error.code !== '23505') throw error;

        toast.success(`Influencers pushed to campaign!`);
        setShowBulkPushDialog(false);
        setSelectedIds([]);
    } catch (e) {
        toast.error("Failed to push to campaign");
    } finally {
        setIsBulkProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <BrandNavbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
        </div>
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
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              Platform Influencers
            </h1>
            <p className="text-muted-foreground mt-2">
              Browse {influencers.length} verified influencers on DotFluence
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6 bg-card/50 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or niche..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Niche Filter */}
                <Select value={selectedNiche} onValueChange={setSelectedNiche}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Niches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Niches</SelectItem>
                    {availableNiches.map((niche) => (
                      <SelectItem key={niche} value={niche}>
                        {niche}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* City Filter */}
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {availableCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Min Followers */}
                <Input
                  type="number"
                  placeholder="Min followers"
                  value={minFollowers}
                  onChange={(e) => setMinFollowers(e.target.value)}
                />
              </div>

              {/* Active Filters */}
              {(searchTerm ||
                selectedNiche !== "all" ||
                selectedCity !== "all" ||
                minFollowers) && (
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-sm text-muted-foreground">
                    Active filters:
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="h-7"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Count */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredInfluencers.length} of {influencers.length}{" "}
              influencers
            </p>
            {filteredInfluencers.length > 0 && (
                <div className="flex items-center gap-2">
                    <Checkbox 
                        id="select-all" 
                        checked={selectedIds.length === filteredInfluencers.length && filteredInfluencers.length > 0}
                        onCheckedChange={handleSelectAll}
                        className="border-purple-500/30 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    />
                    <label htmlFor="select-all" className="text-xs font-bold uppercase tracking-widest cursor-pointer text-slate-400">
                        {selectedIds.length === filteredInfluencers.length ? "De-select All" : "Select all on page"}
                    </label>
                </div>
            )}
          </div>

          {/* Influencer Cards */}
          {filteredInfluencers.length === 0 ? (
            <Card className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No influencers found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search criteria
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInfluencers.map((influencer, index) => (
                <motion.div
                  key={influencer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-card/50 backdrop-blur-xl hover:border-primary/50 transition-all h-full relative">
                    <CardContent className="p-6 relative">
                      {/* Checkbox for selection */}
                      <div className="absolute top-4 right-4 z-10">
                        <Checkbox 
                          checked={selectedIds.includes(influencer.id)}
                          onCheckedChange={() => handleToggleSelect(influencer.id)}
                          className="border-purple-500/30 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                      </div>

                      {/* Profile Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                          {influencer.profile_image_url ? (
                            <AvatarImage
                              src={influencer.profile_image_url}
                              alt={influencer.full_name}
                              className="object-cover"
                            />
                          ) : (
                            <AvatarImage
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                influencer.full_name
                              )}&background=random`}
                              alt={influencer.full_name}
                            />
                          )}
                          <AvatarFallback>
                            {influencer.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">
                            {influencer.full_name}
                          </h3>
                          <a
                            href={influencer.instagram_profile_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <Instagram className="h-3 w-3" />
                            @{influencer.instagram_handle}
                          </a>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 mb-4 p-3 bg-muted/30 rounded-lg relative overflow-hidden">
                        <div className={`text-center transition-all ${subscriptionTier === 'free' ? 'blur-sm select-none' : ''}`}>
                          <div className="flex items-center gap-1 justify-center">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-bold text-lg">
                              {formatFollowers(influencer.followers_count)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Followers
                          </p>
                        </div>

                        {influencer.city && (
                          <div className={`text-center flex-1 border-l pl-4 transition-all ${subscriptionTier === 'free' ? 'blur-sm select-none' : ''}`}>
                            <div className="flex items-center gap-1 justify-center">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {influencer.city}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Location
                            </p>
                          </div>
                        )}

                        {subscriptionTier === 'free' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/5 z-10">
                                <Badge className="bg-purple-600/90 text-white border-none text-[10px] uppercase font-black tracking-widest px-2 py-0.5">
                                    Premium Only
                                </Badge>
                            </div>
                        )}
                      </div>

                      {/* Bio */}
                      <div className="relative">
                          <p className={`text-sm text-muted-foreground mb-4 line-clamp-2 transition-all ${subscriptionTier === 'free' ? 'blur-sm select-none' : ''}`}>
                            {influencer.bio || "No bio available for this creator profile."}
                          </p>
                          {subscriptionTier === 'free' && (
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
                          )}
                      </div>

                      {/* Niches */}
                      {influencer.niches && influencer.niches.length > 0 && (
                        <div className={`flex flex-wrap gap-2 mb-4 transition-all ${subscriptionTier === 'free' ? 'blur-sm select-none' : ''}`}>
                          {influencer.niches.slice(0, 3).map((niche) => (
                            <Badge
                              key={niche}
                              variant="secondary"
                              className="text-xs"
                            >
                              {niche}
                            </Badge>
                          ))}
                          {influencer.niches.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{influencer.niches.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Action Button */}
                      <Button
                        variant={subscriptionTier === 'free' ? "default" : "outline"}
                        className={`w-full ${subscriptionTier === 'free' ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 border-none shadow-lg shadow-purple-500/20" : ""}`}
                        onClick={() => {
                            if (subscriptionTier === 'free') {
                                toast.info("Join our Silver or Gold plan to unlock Direct Access 🚀");
                                return;
                            }
                            window.open(influencer.instagram_profile_url, "_blank");
                        }}
                      >
                        {subscriptionTier === 'free' ? (
                            <>Unlock Direct Access</>
                        ) : (
                            <>
                                <Instagram className="h-4 w-4 mr-2" />
                                View Profile
                            </>
                        )}
                      </Button>

                      {/* Note */}
                      <p className="text-xs text-center text-muted-foreground mt-3">
                        Contact details available via admin
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {selectedIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-2xl animate-in slide-in-from-bottom duration-500">
                <Card className="bg-slate-900 shadow-2xl border-purple-500/30 p-4 rounded-2xl border-2">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold border border-purple-500/30">
                                {selectedIds.length}
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">Bulk Actions</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest">{selectedIds.length} creators selected</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="bg-white/5 border-white/10 hover:bg-emerald-500/10 hover:text-emerald-400 h-9" onClick={() => setShowBulkWhatsAppDialog(true)}>
                                <MessageSquare className="h-4 w-4 mr-2" /> WhatsApp All
                            </Button>
                            <Button size="sm" variant="outline" className="bg-white/5 border-white/10 hover:bg-amber-500/10 hover:text-amber-400 h-9" onClick={() => setShowBulkAICallDialog(true)}>
                                <PhoneCall className="h-4 w-4 mr-2" /> AI Call All
                            </Button>
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white h-9" onClick={() => setShowBulkPushDialog(true)}>
                                <Plus className="h-4 w-4 mr-2" /> Push to Campaign
                            </Button>
                            <div className="h-6 w-px bg-white/10 mx-2" />
                            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white" onClick={() => setSelectedIds([])}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        )}

        {/* Dialogs */}
        <Dialog open={showBulkWhatsAppDialog} onOpenChange={setShowBulkWhatsAppDialog}>
          <DialogContent className="bg-slate-900 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Bulk WhatsApp confirmation</DialogTitle>
              <DialogDescription>
                Send pre-fill messages to {selectedIds.length} influencers with 1s interval?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowBulkWhatsAppDialog(false)}>Cancel</Button>
              <Button onClick={handleBulkWhatsApp} disabled={isBulkProcessing} className="bg-emerald-600 hover:bg-emerald-500">
                Confirm & Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showBulkAICallDialog} onOpenChange={setShowBulkAICallDialog}>
          <DialogContent className="bg-slate-900 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Bulk AI Call Confirmation</DialogTitle>
              <DialogDescription>
                Queue outbound calls to {selectedIds.length} influencers?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowBulkAICallDialog(false)}>Cancel</Button>
              <Button onClick={handleBulkWhatsApp} disabled={isBulkProcessing} className="bg-amber-600 hover:bg-amber-500">
                Confirm & Queue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showBulkPushDialog} onOpenChange={setShowBulkPushDialog}>
          <DialogContent className="bg-slate-900 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Push to Campaign</DialogTitle>
              <DialogDescription>Add {selectedIds.length} influencers to an active campaign.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Select value={targetCampaignId} onValueChange={setTargetCampaignId}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select a Campaign" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowBulkPushDialog(false)}>Cancel</Button>
              <Button onClick={handleBulkPushToCampaign} disabled={!targetCampaignId || isBulkProcessing} className="bg-purple-600 hover:bg-purple-500">
                Push Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
;
};

export default BrandInfluencers;