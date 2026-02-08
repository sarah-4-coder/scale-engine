/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import AuthBackground from "@/components/auth/AuthBackground";
import { Upload, Camera, X } from "lucide-react";
import "@/styles/auth-pages.css";

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

  // Profile image state
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

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

  const progress = step * 20; // Changed to 20% per step (5 steps total)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setProfileImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setProfileImage(null);
    setProfileImagePreview("");
  };

  const uploadProfileImage = async (userId: string): Promise<string | null> => {
    if (!profileImage) return null;

    try {
      setUploadingImage(true);

      // Generate unique filename
      const fileExt = profileImage.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('influencer-assets')
        .upload(filePath, profileImage, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('influencer-assets')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload profile image");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return fullName && instagramHandle && phone;
    if (step === 2) return profileImage !== null; // Profile image is required
    if (step === 3) return parseFollowers(followersInput);
    if (step === 4) return city && state;
    if (step === 5) return selectedNiches.length > 0;
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

    try {
      // Upload profile image first
      const profileImageUrl = await uploadProfileImage(user.id);

      if (!profileImageUrl) {
        toast.error("Please upload a profile image");
        return;
      }

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
        profile_image_url: profileImageUrl,
        profile_completed: true,
      });

      if (error) {
        toast.error("Failed to save profile");
        return;
      }

      fireConfetti(true);
      toast.success("🎉 Campaigns unlocked!");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (error) {
      console.error("Error submitting profile:", error);
      toast.error("Failed to create profile");
    }
  };

  const handlesignout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    window.location.replace("https://dotfluence.in");
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* ANIMATED INFLUENCER BACKGROUND */}
      <AuthBackground />

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
              <>
                <p className="text-sm md:text-base font-medium mb-4">Upload your profile picture</p>
                
                {/* Image Upload Area */}
                {!profileImagePreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-colors bg-white/5">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Camera className="w-12 h-12 mb-3 text-white/60" />
                      <p className="mb-2 text-sm text-white/80">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-white/60">PNG, JPG or JPEG (MAX. 5MB)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={profileImagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg p-2">
                      <p className="text-xs text-white/80 text-center">
                        ✓ Image ready to upload
                      </p>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-white/60 text-center mt-2">
                  This photo will be visible to brands on your profile
                </p>
              </>
            )}

            {step === 3 && (
              <Input
                placeholder="Your reach (100k, 1M)" className="h-11 text-base"
                value={followersInput}
                onChange={(e) => setFollowersInput(e.target.value)}
              />
            )}

            {step === 4 && (
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

            {step === 5 && (
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

          {step < 5 ? (
            <Button disabled={!canProceed()} onClick={nextStep} className="h-11 text-sm md:text-base">
              Next
            </Button>
          ) : (
            <Button 
              disabled={!canProceed() || uploadingImage} 
              onClick={submitProfile} 
              className="h-11 text-sm md:text-base"
            >
              {uploadingImage ? "Uploading..." : "Finish & Unlock"}
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