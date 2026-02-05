/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

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

const DEFAULT_CITIES = ["Delhi", "Mumbai", "Bengaluru", "Hyderabad", "Chennai"];
const DEFAULT_STATES = [
  "Delhi",
  "Maharashtra",
  "Karnataka",
  "Telangana",
  "Tamil Nadu",
];

/* ------------------------
   CONFETTI
------------------------ */
const fireConfetti = (big = false) => {
  confetti({
    particleCount: big ? 200 : 40,
    spread: big ? 120 : 60,
    origin: { y: 0.8 },
  });
};

const ProfileSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [fullName, setFullName] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [phone, setPhone] = useState("");
  const [followersInput, setFollowersInput] = useState("");

  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [customState, setCustomState] = useState("");

  const [allNiches, setAllNiches] = useState<string[]>([]);
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [newNiche, setNewNiche] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.replace("https://platform.dotfluent.in/login");
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    supabase
      .from("niches")
      .select("name")
      .then(({ data }) => {
        //@ts-ignore
        setAllNiches(data?.map((n) => n.name) || []);
      });
  }, []);

  const progress = step * 25;

  const canProceed = () => {
    if (step === 1) return fullName && instagramHandle && phone;
    if (step === 2) return parseFollowers(followersInput);
    if (step === 3) return city && state;
    if (step === 4) return selectedNiches.length > 0;
    return false;
  };

  const nextStep = () => {
    fireConfetti();
    setStep((s) => s + 1);
  };

  const submitProfile = async () => {
    const followers = parseFollowers(followersInput);
    if (!followers) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    //@ts-ignore
    const { error } = await supabase.from("influencer_profiles").insert({
      user_id: user.id,
      full_name: fullName.trim(),
      instagram_handle: instagramHandle.replace("@", ""),
      instagram_profile_url: `https://instagram.com/${instagramHandle.replace(
        "@",
        "",
      )}`,
      phone_number: phone,
      followers_count: followers,
      city,
      state,
      niches: selectedNiches,
      profile_completed: true,
    });

    if (error) {
      toast.error("Failed to save profile");
      return;
    }

    fireConfetti(true);
    toast.success("🎉 Campaigns unlocked!");
    setTimeout(() => navigate("/dashboard/campaigns/all"), 1200);
  };

  const handlesignout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    window.location.replace("https://dotfluence.in");
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* ANIMATED BACKGROUND */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{
          background:
            "radial-gradient(circle at 20% 20%, #ff7a18, transparent 40%), radial-gradient(circle at 80% 80%, #6366f1, transparent 40%), #020617",
        }}
      />

      {/* CARD */}
      <div className="relative z-10 w-[90%] md:w-full max-w-lg rounded-2xl bg-black/40 backdrop-blur-xl p-6 md:p-8 shadow-2xl text-white">
        <h1 className="text-xl md:text-2xl font-bold mb-1">
          Unlock campaigns by completing your profile
        </h1>
        <p className="text-xs md:text-sm text-white/70 mb-4">
          Creators with 100% profiles get approved faster 🚀
        </p>

        {/* PROGRESS */}
        <div className="mb-4 md:mb-6">
          <div className="flex justify-between text-[10px] md:text-xs mb-1">
            <span>Profile completion</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-400 to-indigo-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* STEPS */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }}
            className="space-y-3 md:space-y-4"
          >
            {step === 1 && (
              <>
                <Input
                  placeholder="Your name" className="h-11 text-base"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <Input
                  placeholder="Instagram handle" className="h-11 text-base"
                  value={instagramHandle}
                  onChange={(e) => setInstagramHandle(e.target.value)}
                />
                <Input
                  placeholder="Phone number" className="h-11 text-base"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/[^0-9]/g, ""))
                  }
                />
              </>
            )}

            {step === 2 && (
              <Input
                placeholder="Your reach (100k, 1M)" className="h-11 text-base"
                value={followersInput}
                onChange={(e) => setFollowersInput(e.target.value)}
              />
            )}

            {step === 3 && (
              <>
                <p className="text-sm md:text-base font-medium">Where are you based?</p>

                {/* CITY */}
                <p className="text-xs md:text-sm mt-2">City</p>
                {DEFAULT_CITIES.map((c) => (
                  <label key={c} className="flex gap-2 text-sm md:text-base">
                    <Checkbox
                      checked={city === c}
                      onCheckedChange={() => setCity(c)}
                    />
                    {c}
                  </label>
                ))}
                <div className="flex gap-2 text-sm md:text-base">
                  <Input
                    placeholder="Add city" className="h-11 text-base"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                  />
                  <Button
                    type="button" className="h-11 text-sm md:text-base"
                    onClick={() => {
                      const clean = normalizeLabel(customCity);
                      if (clean) {
                        setCity(clean);
                        setCustomCity("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                {city && !DEFAULT_CITIES.includes(city) && (
                  <p className="text-[10px] md:text-xs text-green-400 mt-1">
                    ✅ Selected city:{" "}
                    <span className="text-sm md:text-base font-medium">{city}</span>
                  </p>
                )}

                {/* STATE */}
                <p className="text-xs md:text-sm mt-3 md:mt-4">State</p>
                {DEFAULT_STATES.map((s) => (
                  <label key={s} className="flex gap-2 text-sm md:text-base">
                    <Checkbox
                      checked={state === s}
                      onCheckedChange={() => setState(s)}
                    />
                    {s}
                  </label>
                ))}
                <div className="flex gap-2 text-sm md:text-base">
                  <Input
                    placeholder="Add state" className="h-11 text-base"
                    value={customState}
                    onChange={(e) => setCustomState(e.target.value)}
                  />
                  <Button
                    type="button" className="h-11 text-sm md:text-base"
                    onClick={() => {
                      const clean = normalizeLabel(customState);
                      if (clean) {
                        setState(clean);
                        setCustomState("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                {state && !DEFAULT_STATES.includes(state) && (
                  <p className="text-[10px] md:text-xs text-green-400 mt-1">
                    ✅ Selected state:{" "}
                    <span className="text-sm md:text-base font-medium">{state}</span>
                  </p>
                )}
              </>
            )}

            {step === 4 && (
              <>
                <p className="text-sm md:text-base font-medium">
                  What should brands contact you for?
                </p>
                {allNiches.map((n) => (
                  <label key={n} className="flex gap-2 text-sm md:text-base">
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
                  placeholder="Add niche" className="h-11 text-base"
                  value={newNiche}
                  onChange={(e) => setNewNiche(e.target.value)}
                />
                <Button
                  className="h-11 text-sm md:text-base"
                  onClick={() => {
                    const clean = normalizeLabel(newNiche);
                    if (clean) {
                      setAllNiches((p) => [...p, clean]);
                      setSelectedNiches((p) => [...p, clean]);
                      //@ts-ignore
                      supabase.from("niches").insert({ name: clean });
                      setNewNiche("");
                    }
                  }}
                >
                  Add niche
                </Button>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ACTIONS */}
        <div className="flex justify-between mt-4 md:mt-6">
          {step > 1 && (
            <Button variant="ghost" onClick={() => setStep(step - 1)} className="h-11 text-sm md:text-base">
              Back
            </Button>
          )}

          {step < 4 ? (
            <Button disabled={!canProceed()} onClick={nextStep} className="h-11 text-sm md:text-base">
              Next
            </Button>
          ) : (
            <Button disabled={!canProceed()} onClick={submitProfile} className="h-11 text-sm md:text-base">
              Finish & Unlock
            </Button>
          )}
        </div>
        <div className="mt-3 md:mt-4 text-center">
          <button
            onClick={handlesignout}
            className="text-sm text-white/50 hover:text-white"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;