import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

/* ------------------------
   HELPERS
------------------------ */
const normalizeLabel = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const parseFollowers = (input: string): number | null => {
  const v = input.trim().toLowerCase();
  if (!v) return null;

  if (v.endsWith("k")) return Math.round(Number(v.replace("k", "")) * 1000);
  if (v.endsWith("m"))
    return Math.round(Number(v.replace("m", "")) * 1_000_000);

  const n = Number(v.replace(/[^0-9]/g, ""));
  return isNaN(n) ? null : n;
};

/* ------------------------
   DEFAULT OPTIONS
------------------------ */
const DEFAULT_CITIES = ["Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Chennai"];
const DEFAULT_STATES = [
  "Delhi",
  "Maharashtra",
  "Karnataka",
  "Telangana",
  "Tamil Nadu",
];

const ProfileSetup = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [followersInput, setFollowersInput] = useState("");
  const [phone_number, setPhoneNumber] = useState("");

  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [customState, setCustomState] = useState("");

  const [allNiches, setAllNiches] = useState<string[]>([]);
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [newNiche, setNewNiche] = useState("");

  const fetchNiches = async () => {
    const { data } = await supabase.from("niches").select("name");
    setAllNiches(data?.map((n) => n.name) || []);
  };

  useEffect(() => {
    fetchNiches();
  }, []);

  const addNiche = async () => {
    const clean = normalizeLabel(newNiche);
    if (!clean) return;

    const { error } = await supabase.from("niches").insert({ name: clean });
    if (!error) {
      setAllNiches((p) => [...p, clean]);
      setSelectedNiches((p) => [...p, clean]);
      setNewNiche("");
    }
  };

  const submitProfile = async () => {
    const followers = parseFollowers(followersInput);

    if (
      !fullName ||
      !instagramHandle ||
      !followers ||
      !city ||
      !state ||
      !phone_number ||
      selectedNiches.length === 0
    ) {
      toast.error("Please complete all fields");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase.from("influencer_profiles").insert({
      user_id: user.id,
      full_name: fullName.trim(),
      instagram_handle: instagramHandle.replace("@", "").trim(),
      instagram_profile_url: `https://instagram.com/${instagramHandle.replace("@", "")}`,
      followers_count: followers,
      city,
      state,
      phone_number: phone_number.trim(),
      niches: selectedNiches,
      profile_completed: true,
    });

    if (error) {
      toast.error("Failed to save profile");
      return;
    }

    toast.success("Profile completed");
    navigate("/dashboard");
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">Complete Your Profile</h1>

      <Input
        placeholder="Full Name *"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <Input
        placeholder="Instagram Handle *"
        value={instagramHandle}
        onChange={(e) => setInstagramHandle(e.target.value)}
      />
      <Input
        placeholder="Phone Number *"
        value={phone_number}
        onChange={(e) => {
          const numericOnly = e.target.value.replace(/[^0-9]/g, "");
          if (numericOnly.length <= 15) {
            setPhoneNumber(numericOnly);
          }
        }}
      />
      <Input
        placeholder="Followers (e.g. 100k, 1.2M) *"
        value={followersInput}
        onChange={(e) => setFollowersInput(e.target.value)}
      />

      <div>
        <p>City *</p>
        {DEFAULT_CITIES.map((c) => (
          <label key={c} className="flex gap-2">
            <Checkbox checked={city === c} onCheckedChange={() => setCity(c)} />{" "}
            {c}
          </label>
        ))}
        <Input
          placeholder="Add city"
          value={customCity}
          onChange={(e) => setCustomCity(e.target.value)}
        />
        <Button
          onClick={() => {
            setCity(normalizeLabel(customCity));
            setCustomCity("");
          }}
        >
          Add
        </Button>
      </div>

      <div>
        <p>State *</p>
        {DEFAULT_STATES.map((s) => (
          <label key={s} className="flex gap-2">
            <Checkbox
              checked={state === s}
              onCheckedChange={() => setState(s)}
            />{" "}
            {s}
          </label>
        ))}
        <Input
          placeholder="Add state"
          value={customState}
          onChange={(e) => setCustomState(e.target.value)}
        />
        <Button
          onClick={() => {
            setState(normalizeLabel(customState));
            setCustomState("");
          }}
        >
          Add
        </Button>
      </div>

      <div>
        <p>Niches *</p>
        {allNiches.map((n) => (
          <label key={n} className="flex gap-2">
            <Checkbox
              checked={selectedNiches.includes(n)}
              onCheckedChange={() =>
                setSelectedNiches((p) =>
                  p.includes(n) ? p.filter((x) => x !== n) : [...p, n],
                )
              }
            />
            {n}
          </label>
        ))}
        <Input
          placeholder="Add new niche"
          value={newNiche}
          onChange={(e) => setNewNiche(e.target.value)}
        />
        <Button onClick={addNiche}>Add</Button>
      </div>

      <Button onClick={submitProfile}>Save Profile</Button>
    </div>
  );
};

export default ProfileSetup;
