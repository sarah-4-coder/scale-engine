/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { sendNotification } from "@/lib/notifications";
import { useNavigate } from "react-router-dom";
import { normalizeLabel } from "@/utils/normalize";
import { useRef } from "react";
import AdminNavbar from "@/components/adminNavbar";

/* -----------------------
   STATIC CITY OPTIONS
----------------------- */
const DEFAULT_CITIES = [
  "Delhi",
  "Mumbai",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Kolkata",
];

const CreateCampaign = () => {
  const navigate = useNavigate();

  /* -----------------------
     CORE FIELDS
  ----------------------- */
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [timeline, setTimeline] = useState("");
  const [basePayout, setBasePayout] = useState("");
  const [deliverables, setDeliverables] = useState("");

  /* -----------------------
     NICHES
  ----------------------- */
  const [allNiches, setAllNiches] = useState<string[]>([]);
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [newNiche, setNewNiche] = useState("");
  const [showNicheDropdown, setShowNicheDropdown] = useState(false);

  /* -----------------------
     ELIGIBILITY TOGGLE
  ----------------------- */
  const [eligibilityEnabled, setEligibilityEnabled] = useState(false);
  const [minFollowers, setMinFollowers] = useState<number | "">("");
  const [allowedCities, setAllowedCities] = useState<string[]>([]);
  const [customCity, setCustomCity] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const fetchNiches = async () => {
    const { data } = await supabase.from("niches").select("name");
    //@ts-ignore
    setAllNiches(data?.map((n) => n.name) || []);
  };

  useEffect(() => {
    fetchNiches();
  }, []);

  const addNewNiche = async () => {
    const clean = normalizeLabel(newNiche);
    if (!clean) return;
//@ts-ignore
    const { error } = await supabase.from("niches").insert({ name: clean });

    if (!error) {
      setAllNiches((prev) => [...prev, clean]);
      setSelectedNiches((prev) => [...prev, clean]);
      setNewNiche("");
    }
  };

  const addCustomCity = () => {
    const clean = normalizeLabel(customCity);
    if (!clean) return;

    setAllowedCities((prev) =>
      prev.includes(clean) ? prev : [...prev, clean],
    );
    setCustomCity("");
  };

  const createCampaign = async () => {
    if (!name || !description || !timeline || selectedNiches.length === 0) {
      toast.error("Please fill required fields");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const eligibility = eligibilityEnabled
      ? {
          min_followers: minFollowers || undefined,
          allowed_niches: selectedNiches,
          allowed_cities: allowedCities,
        }
      : {};

    const { data: campaignData, error } = await supabase
      .from("campaigns")
      //@ts-ignore
      .insert({
        name,
        description,
        timeline,
        base_payout: basePayout ? Number(basePayout) : null,
        deliverables,
        niches: selectedNiches,
        eligibility,
        requirements: {
          deliverables,
        },
        admin_user_id: user.id,
      })
      .select()
      .single() as { data: { id: string } | null; error: any };

    if (error || !campaignData) {
      toast.error("Failed to create campaign");
      return;
    }

    /* -----------------------
       NOTIFY ONLY ELIGIBLE INFLUENCERS
    ----------------------- */
    const { data: influencers, error: influencersError } = await supabase
      .from("influencer_profiles")
      .select("user_id, followers_count,city, niches");

    if (influencersError) {
      toast.error(`Failed to fetch influencers: ${influencersError.message}`);
      return;
    }

    if (!Array.isArray(influencers)) {
      toast.error("Influencer data is not an array");
      return;
    }

    const eligibleInfluencers = influencers.filter((inf: any) => {
      if (
        eligibility.min_followers &&
        inf.followers_count < eligibility.min_followers
      )
        return false;

      if (
        eligibility.allowed_cities?.length &&
        !eligibility.allowed_cities.includes(inf.city)
      )
        return false;

      if (
        eligibility.allowed_niches?.length &&
        !inf.niches?.some((n: string) => eligibility.allowed_niches.includes(n))
      )
        return false;

      return true;
    });

    eligibleInfluencers.forEach((inf) => {
      sendNotification({
        //@ts-ignore
        user_id: inf.user_id,
        role: "influencer",
        type: "campaign_created",
        title: "New campaign available",
        message: `You are eligible for the campaign "${name}"`,
        metadata: { campaign_id: campaignData.id },
      }).catch(console.error);
    });

    toast.success("Campaign created");
    navigate("/admin");
  };

  return (
    <>
    <AdminNavbar/>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Create Campaign</h1>

        <Input
          placeholder="Campaign name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Textarea
          placeholder="Description *"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Input
          placeholder="Timeline *"
          value={timeline}
          onChange={(e) => setTimeline(e.target.value)}
        />
        <Input
          placeholder="Base payout (optional)"
          type="number"
          value={basePayout}
          onChange={(e) => setBasePayout(e.target.value)}
        />
        <Textarea
          placeholder="Deliverables (optional)"
          value={deliverables}
          onChange={(e) => setDeliverables(e.target.value)}
        />

        <div>
          <p className="font-medium">Niches *</p>
          <div className="relative">
            <button
              onClick={() => setShowNicheDropdown(!showNicheDropdown)}
              className="w-full p-2 border border-gray-300 rounded-lg bg-black text-white text-left font-medium hover:bg-gray-900 transition"
            >
              {selectedNiches.length > 0
                ? `${selectedNiches.length} niche(s) selected`
                : "Select niches *"}
            </button>

            {showNicheDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-black border text-white border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                {allNiches.map((n) => (
                  <label
                    key={n}
                    className="flex items-center gap-3 p-2 hover:bg-gray-900 cursor-pointer transition"
                  >
                    <Checkbox
                      checked={selectedNiches.includes(n)}
                      onCheckedChange={() =>
                        setSelectedNiches((prev) =>
                          prev.includes(n)
                            ? prev.filter((x) => x !== n)
                            : [...prev, n],
                        )
                      }
                    />
                    <span className="text-sm">{n}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Add new niche"
              value={newNiche}
              onChange={(e) => setNewNiche(e.target.value)}
            />
            <Button onClick={addNewNiche}>Add</Button>
          </div>
        </div>

        <div className="border p-4 rounded">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={eligibilityEnabled}
              onCheckedChange={() => setEligibilityEnabled(!eligibilityEnabled)}
            />
            Add eligibility rules
          </label>

          {eligibilityEnabled && (
            <div className="space-y-3 mt-3">
              <Input
                placeholder="Minimum followers"
                type="number"
                value={minFollowers}
                onChange={(e) => setMinFollowers(Number(e.target.value))}
              />

              <div>
                <p>Allowed Cities</p>
                <div className="relative">
                  <button
                    onClick={() => setShowCityDropdown(!showCityDropdown)}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-black text-white text-left font-medium hover:bg-gray-900 transition"
                  >
                    {allowedCities.length > 0
                      ? `${allowedCities.length} city(ies) selected`
                      : "Select cities"}
                  </button>

                  {showCityDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-black border text-white border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                      {DEFAULT_CITIES.map((c) => (
                        <label
                          key={c}
                          className="flex items-center gap-3 p-2 hover:bg-gray-900 cursor-pointer transition"
                        >
                          <Checkbox
                            checked={allowedCities.includes(c)}
                            onCheckedChange={() =>
                              setAllowedCities((prev) =>
                                prev.includes(c)
                                  ? prev.filter((x) => x !== c)
                                  : [...prev, c],
                              )
                            }
                          />
                          <span className="text-sm">{c}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add custom city"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                  />
                  <Button onClick={addCustomCity}>Add</Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <Button onClick={createCampaign}>Create Campaign</Button>
      </div>
    </>
  );
};

export default CreateCampaign;
