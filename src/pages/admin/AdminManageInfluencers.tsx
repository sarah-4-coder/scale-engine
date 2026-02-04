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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { parseFollowers } from "@/utils/normalize";
import { toast } from "sonner";
import AdminNavbar from "@/components/adminNavbar";
import { useAuth } from "@/hooks/useAuth";
import { Ban, ShieldCheck, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

      if (showBlockedOnly && !r.is_blocked) return false;

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
    <>
      <AdminNavbar />
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Manage Influencers</h1>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/blocked-influencers")}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Blocked ({rows.filter(r => r.is_blocked).length})
            </Button>
            <Button onClick={exportCSV}>Export CSV</Button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-6 gap-4">
          <Input
            placeholder="Min followers (50k)"
            value={minFollowers}
            onChange={(e) => setMinFollowers(e.target.value)}
          />
          <Input
            placeholder="Max followers (1M)"
            value={maxFollowers}
            onChange={(e) => setMaxFollowers(e.target.value)}
          />

          <MultiSelectDropdown
            label="Niches"
            options={allNiches}
            selected={selectedNiches}
            onChange={setSelectedNiches}
          />

          <MultiSelectDropdown
            label="Cities"
            options={allCities}
            selected={selectedCities}
            onChange={setSelectedCities}
          />

          <MultiSelectDropdown
            label="States"
            options={allStates}
            selected={selectedStates}
            onChange={setSelectedStates}
          />

          <label className="flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-muted">
            <Checkbox
              checked={showBlockedOnly}
              onCheckedChange={(checked) => setShowBlockedOnly(!!checked)}
            />
            <span className="text-sm">Blocked Only</span>
          </label>
        </div>

        {/* TABLE */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Instagram</TableHead>
              <TableHead>Followers</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Niches</TableHead>
              <TableHead>City</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredRows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.full_name}</TableCell>
                <TableCell>
                  <a
                    href={r.instagram_profile_url}
                    target="_blank"
                    className="text-primary underline"
                  >
                    View
                  </a>
                </TableCell>
                <TableCell>{r.followers_count?.toLocaleString()}</TableCell>
                <TableCell>{r.phone_number}</TableCell>
                <TableCell>{r.email}</TableCell>
                <TableCell>{r.niches?.join(", ")}</TableCell>
                <TableCell>{r.city}</TableCell>
                <TableCell>{r.state}</TableCell>
                <TableCell>
                  {r.is_blocked ? (
                    <Badge variant="destructive">Blocked</Badge>
                  ) : (
                    <Badge variant="default">Active</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {r.is_blocked ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnblock(r)}
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Unblock
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleBlockClick(r)}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Block
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* BLOCK DIALOG */}
        <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Block Influencer</DialogTitle>
              <DialogDescription>
                Please provide a reason for blocking {selectedInfluencer?.full_name}.
                They will be notified and unable to access the platform.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for Blocking</label>
                <Textarea
                  placeholder="e.g., Incorrect information provided, fake followers, etc."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBlockDialogOpen(false)}
                disabled={blockingInProgress}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBlockConfirm}
                disabled={blockingInProgress || !blockReason.trim()}
              >
                {blockingInProgress ? "Blocking..." : "Block Influencer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default AdminManageInfluencers;