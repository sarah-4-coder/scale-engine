/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { parseFollowers } from "@/utils/normalize";
import { toast } from "sonner";
import AdminNavbar from "@/components/adminNavbar";
import { useAuth } from "@/hooks/useAuth";
import { Ban, ShieldCheck, Eye, Search, Filter, Download, UserPlus, MapPin, Users, Mail, Phone, Instagram, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

/* -----------------------
   TYPES
----------------------- */
interface InfluencerRow {
  id: string;
  user_id: string;
  full_name: string;
  instagram_profile_url: string;
  followers_count: number | null;
  phone_number: string;
  email: string;
  niches: string[] | null;
  city: string | null;
  state: string | null;
  is_blocked: boolean;
  blocked_reason: string | null;
}

/* -----------------------
   DROPDOWN COMPONENT
----------------------- */

const MultiSelectDropdown = ({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  /* -----------------------
     CLOSE ON OUTSIDE CLICK
  ----------------------- */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between"
        onClick={() => setOpen((o) => !o)}
      >
        {selected.length ? `${label} (${selected.length})` : label}
      </Button>

      {open && (
        <div className="absolute z-50 mt-2 w-full max-h-60 overflow-y-auto rounded-md border bg-card p-2 shadow">
          {options.length === 0 && (
            <p className="text-sm text-muted-foreground px-2 py-1">
              No options available
            </p>
          )}

          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-muted rounded"
            >
              <Checkbox
                checked={selected.includes(opt)}
                onCheckedChange={() =>
                  onChange(
                    selected.includes(opt)
                      ? selected.filter((v) => v !== opt)
                      : [...selected, opt],
                  )
                }
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminManageInfluencers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<InfluencerRow[]>([]);
  const [loading, setLoading] = useState(true);

  /* -----------------------
     BLOCKING STATES
  ----------------------- */
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerRow | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [blockingInProgress, setBlockingInProgress] = useState(false);

  /* -----------------------
     FILTER STATES
  ----------------------- */
  const [minFollowers, setMinFollowers] = useState("");
  const [maxFollowers, setMaxFollowers] = useState("");
  const [showBlockedOnly, setShowBlockedOnly] = useState(false);

  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);

  const [allNiches, setAllNiches] = useState<string[]>([]);
  const [allCities, setAllCities] = useState<string[]>([]);
  const [allStates, setAllStates] = useState<string[]>([]);

  /* -----------------------
     FETCH DATA
  ----------------------- */
  const fetchData = async () => {
    setLoading(true);

    const { data: profiles } = await supabase
      .from("influencer_profiles")
      .select(
        "id, user_id, full_name, instagram_profile_url, followers_count, phone_number, niches, city, state, is_blocked, blocked_reason",
      );
      //@ts-ignore
    const userIds = profiles?.map((p) => p.user_id) || [];
      //@ts-ignore
    const { data: emails } = await supabase.rpc("get_user_emails", {
      user_ids: userIds,
    });
    //@ts-ignore
    const emailMap = new Map(emails?.map((e) => [e.id, e.email]));

    const merged =
      profiles?.map((p) => ({
        //@ts-ignore
        ...p,
        //@ts-ignore
        email: emailMap.get(p.user_id) || "—",
      })) || [];

    setRows(merged);

    setAllCities(
      Array.from(new Set(merged.map((r) => r.city).filter(Boolean))),
    );
    setAllStates(
      Array.from(new Set(merged.map((r) => r.state).filter(Boolean))),
    );
    //@ts-ignore
    const { data: nicheData } = await supabase.from("niches").select("name");
    //@ts-ignore
    setAllNiches(nicheData?.map((n) => n.name) || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* -----------------------
     BLOCK/UNBLOCK FUNCTIONS
  ----------------------- */
  const handleBlockClick = (influencer: InfluencerRow) => {
    setSelectedInfluencer(influencer);
    setBlockReason("");
    setBlockDialogOpen(true);
  };

  const handleBlockConfirm = async () => {
    if (!selectedInfluencer || !blockReason.trim()) {
      toast.error("Please provide a reason for blocking");
      return;
    }

    setBlockingInProgress(true);

    try {
      const { error } = await supabase
        .from("influencer_profiles")
        //@ts-ignore
        .update({
          is_blocked: true,
          blocked_reason: blockReason,
          blocked_at: new Date().toISOString(),
          blocked_by_user_id: user?.id,
        })
        .eq("id", selectedInfluencer.id);

      if (error) throw error;

      // Send notification to influencer
      //@ts-ignore
      await supabase.from("notifications").insert({
        user_id: selectedInfluencer.user_id,
        role: "influencer",
        type: "account_blocked",
        title: "Account Blocked",
        message: `Your account has been blocked. Reason: ${blockReason}`,
        is_read: false,
      });

      toast.success("Influencer blocked successfully");
      setBlockDialogOpen(false);
      setSelectedInfluencer(null);
      setBlockReason("");
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error blocking influencer:", error);
      toast.error("Failed to block influencer");
    } finally {
      setBlockingInProgress(false);
    }
  };

  const handleUnblock = async (influencer: InfluencerRow) => {
    try {
      const { error } = await supabase
        .from("influencer_profiles")
        //@ts-ignore
        .update({
          is_blocked: false,
          blocked_reason: null,
          blocked_at: null,
          blocked_by_user_id: null,
        })
        .eq("id", influencer.id);

      if (error) throw error;

      // Send notification to influencer
      //@ts-ignore
      await supabase.from("notifications").insert({
        user_id: influencer.user_id,
        role: "influencer",
        type: "account_unblocked",
        title: "Account Unblocked",
        message: "Your account has been unblocked. You can now access the platform.",
        is_read: false,
      });

      toast.success("Influencer unblocked successfully");
      fetchData(); // Refresh data
    } catch (error) {
      console.error("Error unblocking influencer:", error);
      toast.error("Failed to unblock influencer");
    }
  };

  /* -----------------------
     FILTER LOGIC
  ----------------------- */
  const filteredRows = useMemo(() => {
    const min = parseFollowers(minFollowers);
    const max = parseFollowers(maxFollowers);

    return rows.filter((r) => {
      if (min && (!r.followers_count || r.followers_count < min)) return false;
      if (max && (!r.followers_count || r.followers_count > max)) return false;

      if (showBlockedOnly && r.is_blocked) return false;

      if (
        selectedNiches.length &&
        (!r.niches || !r.niches.some((n) => selectedNiches.includes(n)))
      )
        return false;

      if (selectedCities.length && !selectedCities.includes(r.city || ""))
        return false;

      if (selectedStates.length && !selectedStates.includes(r.state || ""))
        return false;

      return true;
    });
  }, [
    rows,
    minFollowers,
    maxFollowers,
    selectedNiches,
    selectedCities,
    selectedStates,
    showBlockedOnly,
  ]);

  /* -----------------------
     EXPORT
  ----------------------- */
  const exportCSV = () => {
    if (!filteredRows.length) {
      toast.error("No data to export");
      return;
    }

    const csv = [
      [
        "Name",
        "Instagram",
        "Followers",
        "Phone",
        "Email",
        "Niches",
        "City",
        "State",
        "Status",
        "Blocked Reason",
      ],
      ...filteredRows.map((r) => [
        r.full_name,
        r.instagram_profile_url,
        r.followers_count ?? "",
        r.phone_number,
        r.email,
        r.niches?.join(" | ") ?? "",
        r.city ?? "",
        r.state ?? "",
        r.is_blocked ? "Blocked" : "Active",
        r.blocked_reason ?? "",
      ]),
    ]
      .map((r) => r.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "influencers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-6">Loading influencers…</div>;

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />
      
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Creator Network</h1>
              <p className="text-muted-foreground mt-2">Manage and monitor the influencer ecosystem</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="rounded-full px-6 bg-card/50 backdrop-blur-sm border-border/50"
                onClick={() => navigate("/admin/blocked-influencers")}
              >
                <Ban className="mr-2 h-4 w-4 text-rose-500" />
                Blocked ({rows.filter(r => r.is_blocked).length})
              </Button>
              <Button onClick={exportCSV} className="rounded-full px-6 shadow-lg shadow-primary/20">
                <Download className="mr-2 h-4 w-4" /> Export Network
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          <Card className="mb-10 bg-card/30 backdrop-blur-md border-border/40 shadow-none">
            <CardHeader className="pb-4">
               <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Execution Filters</CardTitle>
               </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Followers (Min)</label>
                  <Input
                    placeholder="e.g. 50k"
                    value={minFollowers}
                    onChange={(e) => setMinFollowers(e.target.value)}
                    className="h-10 rounded-xl bg-background/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Followers (Max)</label>
                  <Input
                    placeholder="e.g. 1M"
                    value={maxFollowers}
                    onChange={(e) => setMaxFollowers(e.target.value)}
                    className="h-10 rounded-xl bg-background/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Niche</label>
                  <MultiSelectDropdown
                    label="All Niches"
                    options={allNiches}
                    selected={selectedNiches}
                    onChange={setSelectedNiches}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Location (City)</label>
                  <MultiSelectDropdown
                    label="All Cities"
                    options={allCities}
                    selected={selectedCities}
                    onChange={setSelectedCities}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase px-1">Location (State)</label>
                  <MultiSelectDropdown
                    label="All States"
                    options={allStates}
                    selected={selectedStates}
                    onChange={setSelectedStates}
                  />
                </div>

                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 h-10 px-4 w-full border border-border/50 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors bg-background/50">
                    <Checkbox
                      checked={showBlockedOnly}
                      onCheckedChange={(checked) => setShowBlockedOnly(!!checked)}
                    />
                    <span className="text-xs font-medium">Active Only</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Network Table */}
          <Card className="bg-card/40 backdrop-blur-md border-border/40 overflow-hidden shadow-none">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/40">
                    <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Creator</TableHead>
                    <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Reach</TableHead>
                    <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Contact</TableHead>
                    <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Specialization</TableHead>
                    <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Location</TableHead>
                    <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Status</TableHead>
                    <TableHead className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-muted-foreground text-right">Execution</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredRows.map((r) => (
                    <TableRow key={r.id} className="border-border/20 hover:bg-muted/10 transition-colors group">
                      <TableCell className="px-6 py-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-base">{r.full_name}</span>
                          <a
                            href={r.instagram_profile_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <Instagram className="h-3 w-3" /> View Profile
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-6">
                        <div className="flex flex-col gap-0.5">
                           <span className="font-bold text-foreground">{r.followers_count?.toLocaleString() || "0"}</span>
                           <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Followers</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-6">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" /> {r.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" /> {r.phone_number}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-6">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {r.niches?.slice(0, 3).map((niche) => (
                            <Badge key={niche} variant="secondary" className="text-[9px] px-2 py-0 font-medium bg-muted/50 border border-border/50 text-muted-foreground">
                              {niche}
                            </Badge>
                          ))}
                          {(r.niches?.length || 0) > 3 && (
                            <span className="text-[9px] text-muted-foreground font-bold">+{r.niches!.length - 3}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-6">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                           <MapPin className="h-3.5 w-3.5 text-primary/60" />
                           {r.city}, {r.state}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-6 font-medium">
                        {r.is_blocked ? (
                          <Badge variant="destructive" className="rounded-full px-3 py-0.5 text-[10px] uppercase font-black bg-rose-500/10 text-rose-500 border-none shadow-none">Blocked</Badge>
                        ) : (
                          <Badge variant="default" className="rounded-full px-3 py-0.5 text-[10px] uppercase font-black bg-emerald-500/10 text-emerald-500 border-none shadow-none">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-6 py-6 text-right">
                        {r.is_blocked ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full text-emerald-500 hover:bg-emerald-500/10 h-9"
                            onClick={() => handleUnblock(r)}
                          >
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Restore
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-full text-rose-500 hover:bg-rose-500/10 h-9"
                            onClick={() => handleBlockClick(r)}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Suspend
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {filteredRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-20 text-center">
                         <div className="flex flex-col items-center opacity-30">
                            <Users className="h-12 w-12 mb-3" />
                            <p className="font-bold">No creators matching current filters.</p>
                         </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </motion.div>
      </main>

      {/* BLOCK DIALOG */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl border-border/40 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-rose-500">
               <Ban className="h-6 w-6" /> Terminate Access
            </DialogTitle>
            <DialogDescription className="text-foreground/70 py-2">
              Are you sure you want to suspend access for <span className="font-bold text-foreground">{selectedInfluencer?.full_name}</span>? They will be blacklisted from all campaigns.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Official Reason</label>
              <Textarea
                placeholder="e.g. Failure to deliver content after payment, platform abuse..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={4}
                className="rounded-2xl bg-muted/30 border-border/30 focus:border-rose-500/30 focus:ring-rose-500/20"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setBlockDialogOpen(false)}
              disabled={blockingInProgress}
              className="rounded-full px-6"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlockConfirm}
              disabled={blockingInProgress || !blockReason.trim()}
              className="rounded-full px-6 shadow-lg shadow-rose-500/20"
            >
              {blockingInProgress ? "Applying Block..." : "Confirm Suspension"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminManageInfluencers;