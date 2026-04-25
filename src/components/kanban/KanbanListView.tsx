/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useMemo } from "react";
import { List } from "react-window";
import {
  ArrowUpDown, ArrowUp, ArrowDown, Instagram, MoreVertical, Eye, FileText,
  Users, MapPin, CheckSquare, Square,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ListViewApplicant {
  id: string;
  campaign_id: string;
  status: string;
  requested_payout: number | null;
  final_payout: number | null;
  created_at: string;
  influencer_profiles: {
    full_name: string;
    instagram_handle: string;
    followers_count: number;
    niches: string[];
    city: string;
    state: string;
    profile_image_url?: string;
    gender?: string;
  };
}

interface KanbanListViewProps {
  applicants: ListViewApplicant[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onViewApplicant: (applicant: ListViewApplicant) => void;
  onViewContract?: (applicant: ListViewApplicant) => void;
  getColumnLabel: (status: string) => string;
  getStatusColor: (status: string) => string;
  basePayout: number;
}

type SortKey = "name" | "handle" | "followers" | "status" | "payout" | "created_at" | "city";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 50;

const formatFollowers = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

const COLUMNS_CONFIG: { key: SortKey; label: string; width: number }[] = [
  { key: "name", label: "Name", width: 200 },
  { key: "handle", label: "Instagram", width: 160 },
  { key: "followers", label: "Followers", width: 110 },
  { key: "status", label: "Stage", width: 140 },
  { key: "payout", label: "Payout", width: 110 },
  { key: "created_at", label: "Applied At", width: 130 },
  { key: "city", label: "City", width: 120 },
];

const ROW_HEIGHT = 72;

export const KanbanListView = ({
  applicants,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onViewApplicant,
  onViewContract,
  getColumnLabel,
  getStatusColor,
  basePayout,
}: KanbanListViewProps) => {
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const allSelected = applicants.length > 0 && applicants.every(a => selectedIds.includes(a.id));

  const handleSort = useCallback((key: SortKey) => {
    if (key === sortKey) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }, [sortKey]);

  const sorted = useMemo(() => {
    return [...applicants].sort((a, b) => {
      let aVal: any;
      let bVal: any;
      switch (sortKey) {
        case "name": aVal = a.influencer_profiles.full_name || ""; bVal = b.influencer_profiles.full_name || ""; break;
        case "handle": aVal = a.influencer_profiles.instagram_handle || ""; bVal = b.influencer_profiles.instagram_handle || ""; break;
        case "followers": aVal = a.influencer_profiles.followers_count || 0; bVal = b.influencer_profiles.followers_count || 0; break;
        case "status": aVal = a.status; bVal = b.status; break;
        case "payout": aVal = a.final_payout ?? a.requested_payout ?? basePayout; bVal = b.final_payout ?? b.requested_payout ?? basePayout; break;
        case "created_at": aVal = new Date(a.created_at).getTime(); bVal = new Date(b.created_at).getTime(); break;
        case "city": aVal = a.influencer_profiles.city || ""; bVal = b.influencer_profiles.city || ""; break;
        default: return 0;
      }
      if (typeof aVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [applicants, sortKey, sortDir, basePayout]);

  const visible = useMemo(() => sorted.slice(0, visibleCount), [sorted, visibleCount]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
  };

  // react-window row renderer
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const applicant = visible[index];
    if (!applicant) return null;
    const profile = applicant.influencer_profiles;
    const isSelected = selectedIds.includes(applicant.id);
    const payout = applicant.final_payout ?? applicant.requested_payout ?? basePayout;
    const initials = (profile.full_name || "?").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

    return (
      <div
        style={style}
        className={cn(
          "flex items-center border-b border-border/30 px-3 transition-colors cursor-pointer select-none",
          isSelected ? "bg-primary/8 hover:bg-primary/12" : "hover:bg-accent/40"
        )}
        onClick={() => onViewApplicant(applicant)}
      >
        {/* Checkbox */}
        <div
          className="flex-shrink-0 mr-3"
          onClick={e => { e.stopPropagation(); onToggleSelect(applicant.id); }}
        >
          {isSelected
            ? <CheckSquare className="h-4 w-4 text-primary" />
            : <Square className="h-4 w-4 text-muted-foreground/40 hover:text-muted-foreground" />}
        </div>

        {/* Avatar + Name */}
        <div className="flex items-center gap-2.5" style={{ width: 200 }} onClick={() => onViewApplicant(applicant)}>
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={profile.profile_image_url} />
            <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm truncate">{profile.full_name || "—"}</span>
        </div>

        {/* Instagram */}
        <div style={{ width: 160 }}>
          <a
            href={`https://instagram.com/${profile.instagram_handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center gap-1 truncate"
            onClick={e => e.stopPropagation()}
          >
            <Instagram className="h-3 w-3 flex-shrink-0" />
            @{profile.instagram_handle || "—"}
          </a>
        </div>

        {/* Followers */}
        <div style={{ width: 110 }} className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3 w-3" />
          {profile.followers_count ? formatFollowers(profile.followers_count) : "—"}
        </div>

        {/* Stage */}
        <div style={{ width: 140 }}>
          <Badge
            variant="outline"
            className={cn("text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full border", getStatusColor(applicant.status))}
          >
            {getColumnLabel(applicant.status)}
          </Badge>
        </div>

        {/* Payout */}
        <div style={{ width: 110 }} className="text-xs font-bold text-foreground">
          ₹{payout.toLocaleString()}
        </div>

        {/* Applied At */}
        <div style={{ width: 130 }} className="text-xs text-muted-foreground">
          {new Date(applicant.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </div>

        {/* City */}
        <div style={{ width: 120 }} className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{profile.city || "—"}</span>
        </div>

        {/* Actions */}
        <div className="ml-auto flex-shrink-0" onClick={e => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewApplicant(applicant)}>
                <Eye className="h-3.5 w-3.5 mr-2" /> View Details
              </DropdownMenuItem>
              {onViewContract && (
                <DropdownMenuItem onClick={() => onViewContract(applicant)}>
                  <FileText className="h-3.5 w-3.5 mr-2" /> View Contract
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }, [visible, selectedIds, basePayout, onToggleSelect, onViewApplicant, onViewContract, getColumnLabel, getStatusColor]);

  return (
    <div className="border border-border/40 rounded-2xl overflow-hidden bg-card/30 backdrop-blur-sm">
      {/* Table Header */}
      <div className="flex items-center bg-muted/40 border-b border-border/30 px-3 py-2.5 sticky top-0 z-10">
        {/* Select All */}
        <div
          className="flex-shrink-0 mr-3 cursor-pointer"
          onClick={() => allSelected ? onDeselectAll() : onSelectAll()}
        >
          {allSelected
            ? <CheckSquare className="h-4 w-4 text-primary" />
            : <Square className="h-4 w-4 text-muted-foreground/50 hover:text-muted-foreground" />}
        </div>

        {COLUMNS_CONFIG.map(col => (
          <button
            key={col.key}
            style={{ width: col.width }}
            onClick={() => handleSort(col.key)}
            className="flex items-center gap-1 text-[10px] uppercase font-black tracking-wider text-muted-foreground hover:text-foreground transition-colors text-left flex-shrink-0"
          >
            {col.label}
            <SortIcon col={col.key} />
          </button>
        ))}
        <div className="ml-auto w-8" />
      </div>

      {/* Virtualized Rows */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Users className="h-8 w-8 opacity-30" />
          <p className="text-sm font-medium">No influencers match your current filters</p>
        </div>
      ) : (
          <List
            style={{ height: Math.min(visible.length * ROW_HEIGHT, 600), width: "100%" }}
            rowCount={visible.length}
            rowHeight={ROW_HEIGHT}
            overscanCount={5}
            rowComponent={Row}
            rowProps={{}}
          />
      )}

      {/* Load More */}
      {visibleCount < sorted.length && (
        <div className="p-4 border-t border-border/20 flex items-center justify-center gap-3">
          <span className="text-xs text-muted-foreground">
            Showing {visible.length} of {sorted.length}
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-xl text-xs"
            onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
          >
            Load 50 more
          </Button>
        </div>
      )}
    </div>
  );
};
