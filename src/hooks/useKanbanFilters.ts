/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useCallback, useRef, useEffect } from "react";

export interface KanbanFilters {
  search: string;
  followerTier: string; // "all" | "1k-10k" | "10k-50k" | "50k-100k" | "100k-500k" | "500k+"
  niches: string[];
  gender: string; // "all" | "male" | "female" | "other"
  location: string;
  visibleStages: string[]; // column ids that are visible
}

export const DEFAULT_FILTERS = (allStageIds: string[]): KanbanFilters => ({
  search: "",
  followerTier: "all",
  niches: [],
  gender: "all",
  location: "",
  visibleStages: allStageIds,
});

const FOLLOWER_TIERS: Record<string, [number, number]> = {
  "1k-10k": [1_000, 10_000],
  "10k-50k": [10_000, 50_000],
  "50k-100k": [50_000, 100_000],
  "100k-500k": [100_000, 500_000],
  "500k+": [500_000, Infinity],
};

export function useKanbanFilters(applicants: any[], allStageIds: string[]) {
  const [filters, setFilters] = useState<KanbanFilters>(DEFAULT_FILTERS(allStageIds));
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync visibleStages when stage list changes (e.g. barter vs paid campaign)
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      visibleStages: allStageIds,
    }));
  }, [allStageIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search
  const setSearch = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(value), 300);
  }, []);

  const setFollowerTier = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, followerTier: value }));
  }, []);

  const setNiches = useCallback((value: string[]) => {
    setFilters(prev => ({ ...prev, niches: value }));
  }, []);

  const setGender = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, gender: value }));
  }, []);

  const setLocation = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, location: value }));
  }, []);

  const setVisibleStages = useCallback((value: string[]) => {
    setFilters(prev => ({ ...prev, visibleStages: value }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS(allStageIds));
    setDebouncedSearch("");
  }, [allStageIds]);

  // All unique niches extracted from current applicants
  const availableNiches = useMemo(() => {
    const nicheSet = new Set<string>();
    applicants.forEach(a => {
      (a.influencer_profiles?.niches || []).forEach((n: string) => nicheSet.add(n));
    });
    return Array.from(nicheSet).sort();
  }, [applicants]);

  // City/state suggestions for autocomplete
  const locationSuggestions = useMemo(() => {
    const locs = new Set<string>();
    applicants.forEach(a => {
      const p = a.influencer_profiles;
      if (p?.city) locs.add(p.city);
      if (p?.state) locs.add(p.state);
    });
    return Array.from(locs).sort();
  }, [applicants]);

  // Apply all filters
  const filteredApplicants = useMemo(() => {
    return applicants.filter(a => {
      const profile = a.influencer_profiles || {};

      // Search
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const name = (profile.full_name || "").toLowerCase();
        const handle = (profile.instagram_handle || "").toLowerCase();
        if (!name.includes(q) && !handle.includes(q)) return false;
      }

      // Follower tier
      if (filters.followerTier !== "all") {
        const range = FOLLOWER_TIERS[filters.followerTier];
        if (range) {
          const count = profile.followers_count || 0;
          if (count < range[0] || count >= range[1]) return false;
        }
      }

      // Niches
      if (filters.niches.length > 0) {
        const profileNiches: string[] = profile.niches || [];
        const hasMatch = filters.niches.some(n => profileNiches.includes(n));
        if (!hasMatch) return false;
      }

      // Gender
      if (filters.gender !== "all") {
        const g = (profile.gender || "").toLowerCase();
        if (g !== filters.gender) return false;
      }

      // Location
      if (filters.location) {
        const q = filters.location.toLowerCase();
        const city = (profile.city || "").toLowerCase();
        const state = (profile.state || "").toLowerCase();
        if (!city.includes(q) && !state.includes(q)) return false;
      }

      return true;
    });
  }, [applicants, debouncedSearch, filters.followerTier, filters.niches, filters.gender, filters.location]);

  // Is any filter active?
  const isFiltered = useMemo(() => {
    return (
      filters.search !== "" ||
      filters.followerTier !== "all" ||
      filters.niches.length > 0 ||
      filters.gender !== "all" ||
      filters.location !== "" ||
      filters.visibleStages.length !== allStageIds.length
    );
  }, [filters, allStageIds.length]);

  return {
    filters,
    filteredApplicants,
    setSearch,
    setFollowerTier,
    setNiches,
    setGender,
    setLocation,
    setVisibleStages,
    clearAllFilters,
    availableNiches,
    locationSuggestions,
    isFiltered,
  };
}
