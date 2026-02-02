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
  Filter,
  X,
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

  useEffect(() => {
    const fetchInfluencers = async () => {
      try {
        setLoading(true);

        // Fetch all influencers from the platform
        const { data, error } = await supabase
          .from("influencer_profiles")
          .select("*")
          .order("followers_count", { ascending: false });

        if (error) throw error;

        setInfluencers(data || []);

        // Extract unique niches and cities for filters
        const niches = new Set<string>();
        const cities = new Set<string>();

        data?.forEach((inf) => {
          inf.niches?.forEach((niche) => niches.add(niche));
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
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredInfluencers.length} of {influencers.length}{" "}
              influencers
            </p>
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
                  <Card className="bg-card/50 backdrop-blur-xl hover:border-primary/50 transition-all h-full">
                    <CardContent className="p-6">
                      {/* Profile Header */}
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                              influencer.full_name
                            )}&background=random`}
                          />
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
                      <div className="flex items-center gap-4 mb-4 p-3 bg-muted/30 rounded-lg">
                        <div className="text-center">
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
                          <div className="text-center flex-1 border-l pl-4">
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
                      </div>

                      {/* Bio */}
                      {influencer.bio && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {influencer.bio}
                        </p>
                      )}

                      {/* Niches */}
                      {influencer.niches && influencer.niches.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
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
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          window.open(
                            influencer.instagram_profile_url,
                            "_blank"
                          )
                        }
                      >
                        <Instagram className="h-4 w-4 mr-2" />
                        View Profile
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
      </main>
    </div>
  );
};

export default BrandInfluencers;