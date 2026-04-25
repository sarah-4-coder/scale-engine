/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import { Search, X, Filter, ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KanbanFilters } from "@/hooks/useKanbanFilters";

interface KanbanColumn {
  id: string;
  label: string;
  color: string;
}

interface KanbanFilterBarProps {
  filters: KanbanFilters;
  totalCount: number;
  filteredCount: number;
  availableNiches: string[];
  locationSuggestions: string[];
  columns: KanbanColumn[];
  onSearchChange: (v: string) => void;
  onFollowerTierChange: (v: string) => void;
  onNichesChange: (v: string[]) => void;
  onGenderChange: (v: string) => void;
  onLocationChange: (v: string) => void;
  onVisibleStagesChange: (v: string[]) => void;
  onClearAll: () => void;
  isFiltered: boolean;
}

const FOLLOWER_TIERS = [
  { value: "all", label: "All Followers" },
  { value: "1k-10k", label: "1K – 10K" },
  { value: "10k-50k", label: "10K – 50K" },
  { value: "50k-100k", label: "50K – 100K" },
  { value: "100k-500k", label: "100K – 500K" },
  { value: "500k+", label: "500K+" },
];

export const KanbanFilterBar = ({
  filters,
  totalCount,
  filteredCount,
  availableNiches,
  locationSuggestions,
  columns,
  onSearchChange,
  onFollowerTierChange,
  onNichesChange,
  onGenderChange,
  onLocationChange,
  onVisibleStagesChange,
  onClearAll,
  isFiltered,
}: KanbanFilterBarProps) => {
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [locationInput, setLocationInput] = useState(filters.location);
  const locationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filters.location) setLocationInput("");
  }, [filters.location]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredSuggestions = locationSuggestions.filter(s =>
    locationInput && s.toLowerCase().includes(locationInput.toLowerCase())
  );

  const toggleNiche = (niche: string) => {
    const current = filters.niches;
    if (current.includes(niche)) {
      onNichesChange(current.filter(n => n !== niche));
    } else {
      onNichesChange([...current, niche]);
    }
  };

  const toggleStage = (stageId: string) => {
    const current = filters.visibleStages;
    if (current.includes(stageId)) {
      if (current.length === 1) return; // keep at least one
      onVisibleStagesChange(current.filter(s => s !== stageId));
    } else {
      onVisibleStagesChange([...current, stageId]);
    }
  };

  const activeFilterCount = [
    filters.search !== "",
    filters.followerTier !== "all",
    filters.niches.length > 0,
    filters.gender !== "all",
    filters.location !== "",
    filters.visibleStages.length !== columns.length,
  ].filter(Boolean).length;

  return (
    <div className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-3 md:p-4 space-y-3 shadow-sm">
      {/* Row 1: Search + primary filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or @handle..."
            value={filters.search}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-sm bg-background/70 border-border/50 rounded-xl"
          />
          {filters.search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Follower Tier */}
        <Select value={filters.followerTier} onValueChange={onFollowerTierChange}>
          <SelectTrigger className="h-9 text-sm w-[130px] bg-background/70 border-border/50 rounded-xl">
            <SelectValue placeholder="Followers" />
          </SelectTrigger>
          <SelectContent>
            {FOLLOWER_TIERS.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Gender */}
        <Select value={filters.gender} onValueChange={onGenderChange}>
          <SelectTrigger className="h-9 text-sm w-[110px] bg-background/70 border-border/50 rounded-xl">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        {/* Niche multi-select */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 rounded-xl text-sm gap-1.5 bg-background/70 border-border/50">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Niches
              {filters.niches.length > 0 && (
                <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-primary text-primary-foreground">
                  {filters.niches.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-64 overflow-y-auto w-52">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Select Niches</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableNiches.length === 0 ? (
              <div className="text-xs text-muted-foreground px-2 py-3 text-center">No niches found</div>
            ) : (
              availableNiches.map(niche => (
                <DropdownMenuCheckboxItem
                  key={niche}
                  checked={filters.niches.includes(niche)}
                  onCheckedChange={() => toggleNiche(niche)}
                >
                  {niche}
                </DropdownMenuCheckboxItem>
              ))
            )}
            {filters.niches.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <button
                  className="w-full text-xs text-rose-500 hover:text-rose-600 py-1.5 px-2 text-left font-medium"
                  onClick={() => onNichesChange([])}
                >
                  Clear niches
                </button>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Stage visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 rounded-xl text-sm gap-1.5 bg-background/70 border-border/50">
              <Filter className="h-3.5 w-3.5" />
              Stages
              {filters.visibleStages.length !== columns.length && (
                <Badge className="ml-1 h-4 px-1.5 text-[10px] bg-primary text-primary-foreground">
                  {filters.visibleStages.length}
                </Badge>
              )}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Show/Hide Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map(col => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={filters.visibleStages.includes(col.id)}
                onCheckedChange={() => toggleStage(col.id)}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear All */}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-9 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 text-sm"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Row 2: Location + Counter */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        {/* Location autocomplete */}
        <div ref={locationRef} className="relative min-w-[160px] w-full sm:w-auto">
          <Input
            placeholder="Filter by city or state..."
            value={locationInput}
            onChange={e => {
              setLocationInput(e.target.value);
              onLocationChange(e.target.value);
              setShowLocationSuggestions(true);
            }}
            onFocus={() => setShowLocationSuggestions(true)}
            className="h-8 text-xs bg-background/70 border-border/50 rounded-xl pr-8"
          />
          {locationInput && (
            <button
              onClick={() => {
                setLocationInput("");
                onLocationChange("");
                setShowLocationSuggestions(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          {showLocationSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-popover border border-border rounded-xl shadow-lg z-50 max-h-40 overflow-y-auto">
              {filteredSuggestions.map(s => (
                <button
                  key={s}
                  className="w-full text-left text-xs px-3 py-2 hover:bg-accent transition-colors"
                  onClick={() => {
                    setLocationInput(s);
                    onLocationChange(s);
                    setShowLocationSuggestions(false);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results counter */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="text-[10px] font-bold">
              {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active
            </Badge>
          )}
          <span className="text-xs text-muted-foreground font-medium">
            Showing{" "}
            <span className="font-bold text-foreground">{filteredCount}</span>
            {" "}of{" "}
            <span className="font-bold text-foreground">{totalCount}</span>
            {" "}influencers
          </span>
        </div>
      </div>
    </div>
  );
};
