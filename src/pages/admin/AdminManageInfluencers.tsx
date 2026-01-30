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
import { parseFollowers } from "@/utils/normalize";
import { toast } from "sonner";
import AdminNavbar from "@/components/adminNavbar";

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
  const [rows, setRows] = useState<InfluencerRow[]>([]);
  const [loading, setLoading] = useState(true);

  /* -----------------------
     FILTER STATES
  ----------------------- */
  const [minFollowers, setMinFollowers] = useState("");
  const [maxFollowers, setMaxFollowers] = useState("");

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
        "id, user_id, full_name, instagram_profile_url, followers_count, phone_number, niches, city, state",
      );

    const userIds = profiles?.map((p) => p.user_id) || [];

    const { data: emails } = await supabase.rpc("get_user_emails", {
      user_ids: userIds,
    });

    const emailMap = new Map(emails?.map((e) => [e.id, e.email]));

    const merged =
      profiles?.map((p) => ({
        ...p,
        email: emailMap.get(p.user_id) || "—",
      })) || [];

    setRows(merged);

    setAllCities(
      Array.from(new Set(merged.map((r) => r.city).filter(Boolean))),
    );
    setAllStates(
      Array.from(new Set(merged.map((r) => r.state).filter(Boolean))),
    );

    const { data: nicheData } = await supabase.from("niches").select("name");
    setAllNiches(nicheData?.map((n) => n.name) || []);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* -----------------------
     FILTER LOGIC
  ----------------------- */
  const filteredRows = useMemo(() => {
    const min = parseFollowers(minFollowers);
    const max = parseFollowers(maxFollowers);

    return rows.filter((r) => {
      if (min && (!r.followers_count || r.followers_count < min)) return false;
      if (max && (!r.followers_count || r.followers_count > max)) return false;

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
          <Button onClick={exportCSV}>Export CSV</Button>
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-5 gap-4">
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default AdminManageInfluencers;
