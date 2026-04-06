/* eslint-disable @typescript-eslint/no-explicit-any */
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
import {
  Upload,
  Camera,
  X,
  Loader2,
  Instagram,
  AlertCircle,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [upiId, setUpiId] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");

  // Follower fetching states
  const [fetchingFollowers, setFetchingFollowers] = useState(false);
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [followersFetchError, setFollowersFetchError] = useState<string>("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualFollowersInput, setManualFollowersInput] = useState("");

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
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('influencer_profiles')
        .select(`
          full_name,
          instagram_handle,
          phone_number,
          city,
          state,
          niches,
          profile_image_url,
          upi_id,
          bank_name,
          account_number,
          ifsc_code
        `)
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || "");
        setInstagramHandle(profile.instagram_handle || "");
        setPhone(profile.phone_number || "");
        setCity(profile.city || "");
        setState(profile.state || "");
        setSelectedNiches(profile.niches || []);
        setProfileImagePreview(profile.profile_image_url || "");
        setUpiId(profile.upi_id || "");
        setBankName(profile.bank_name || "");
        setAccountNumber(profile.account_number || "");
        setIfscCode(profile.ifsc_code || "");
        
        // If it's an update, maybe skip to step 5? 
        // No, let's keep it as is for now, but pre-filled.
      }
    };

    fetchProfile();
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

  const progress = step * 20; // 20% per step (5 steps total)

  /**
   * Fetch Instagram followers count when handle is entered
   */
  const fetchInstagramFollowers = async (handle: string) => {
    const cleanHandle = handle.replace("@", "").trim();
    if (!cleanHandle) return;

    setFetchingFollowers(true);
    setFollowersFetchError("");
    setShowManualEntry(false);

    try {
      const { data, error } = await supabase.functions.invoke(
        "fetch-instagram-followers",
        {
          body: { instagram_handle: cleanHandle },
        },
      );

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      if (data?.followers_count) {
        setFollowersCount(data.followers_count);
        toast.success(
          `✓ Fetched ${data.followers_count.toLocaleString()} followers`,
        );
      } else if (data?.error) {
        // Check if manual entry is allowed
        if (data.can_proceed_manually) {
          setShowManualEntry(true);
          setFollowersFetchError(data.error);
          toast.warning(data.error, {
            description: "You can enter your follower count manually below",
          });
        } else {
          throw new Error(data.error);
        }
      }
    } catch (error: any) {
      console.error("Error fetching followers:", error);

      // Always allow manual entry on error
      setShowManualEntry(true);
      setFollowersFetchError(
        error.message || "Unable to fetch followers automatically",
      );
      toast.error("Could not fetch followers automatically", {
        description: "You can enter manually below",
      });
    } finally {
      setFetchingFollowers(false);
    }
  };

  const handleManualFollowerSubmit = () => {
    const count = parseFollowers(manualFollowersInput);
    if (count) {
      setFollowersCount(count);
      setShowManualEntry(false);
      toast.success(`Follower count set to ${count.toLocaleString()}`);
    } else {
      toast.error("Please enter a valid follower count");
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setProfileImage(file);

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

      const fileExt = profileImage.name.split(".").pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("influencer-assets")
        .upload(filePath, profileImage, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("influencer-assets")
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
    if (step === 1)
      return fullName && instagramHandle && phone && followersCount;
    if (step === 2) return profileImage !== null;
    if (step === 3) return city && state;
    if (step === 4) return selectedNiches.length > 0;
    if (step === 5) return upiId || (bankName && accountNumber && ifscCode);
    return false;
  };

  const nextStep = () => {
    // Auto-fetch followers when moving from step 1 if not already fetched
    if (step === 1 && !followersCount && !showManualEntry && instagramHandle) {
      fetchInstagramFollowers(instagramHandle);
      return;
    }

    fireConfetti();
    setStep((s) => s + 1);
  };

  const submitProfile = async () => {
    if (!followersCount) {
      toast.error("Followers count is required");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const profileImageUrl = await uploadProfileImage(user.id);

      if (!profileImageUrl) {
        toast.error("Please upload a profile image");
        return;
      }

      //@ts-ignore
      const { error } = await supabase.from("influencer_profiles").upsert({
        user_id: user.id,
        full_name: fullName.trim(),
        instagram_handle: instagramHandle.replace("@", ""),
        instagram_profile_url: `https://instagram.com/${instagramHandle.replace("@", "")}`,
        phone_number: phone,
        followers_count: followersCount,
        city,
        state,
        niches: selectedNiches,
        profile_image_url: profileImageUrl,
        profile_completed: true,
        last_followers_fetch: new Date().toISOString(),
        upi_id: upiId,
        bank_name: bankName,
        account_number: accountNumber,
        ifsc_code: ifscCode,
      }, { onConflict: 'user_id' });

      if (error) {
        toast.error("Failed to save profile");
        return;
      }

      fireConfetti(true);
      toast.success("🎉 Campaigns unlocked!");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (error) {
      console.error("Error submitting profile:", error);
      toast.error("Something went wrong");
    }
  };

  const handlesignout = async () => {
    await supabase.auth.signOut();
    window.location.replace("https://platform.dotfluence.in/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <AuthBackground />

      <div className="w-full max-w-md px-4 md:px-8 py-6 md:py-8 relative z-10">
        {/* PROGRESS BAR */}
        <div className="w-full bg-white/10 rounded-full h-2 mb-6 md:mb-8 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        {/* STEP INDICATOR */}
        <h1 className="text-2xl md:text-3xl font-bold mb-1 text-center">
          Step {step} of 5
        </h1>
        <p className="text-white/60 text-center mb-6 md:mb-8 text-sm md:text-base">
          {step === 1 && "Let's get to know you"}
          {step === 2 && "Add your profile picture"}
          {step === 3 && "Your location"}
          {step === 4 && "Your content niches"}
          {step === 5 && "Payout Details (Optional)"}
        </p>

        {/* INPUTS */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3 md:space-y-4"
          >
            {step === 1 && (
              <>
                <Input
                  placeholder="Full name"
                  className="h-11 text-base"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Instagram handle (e.g., @username)"
                      className="h-11 text-base flex-1"
                      value={instagramHandle}
                      onChange={(e) => {
                        setInstagramHandle(e.target.value);
                        setFollowersCount(null);
                        setFollowersFetchError("");
                        setShowManualEntry(false);
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => fetchInstagramFollowers(instagramHandle)}
                      disabled={!instagramHandle || fetchingFollowers}
                      className="h-11 px-4"
                    >
                      {fetchingFollowers ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Instagram className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-white/60 md:hidden text-right">
                    Tap to fetch followers from Instagram
                  </div>

                  {/* Auto-fetched followers */}
                  {followersCount && !showManualEntry && (
                    <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <Instagram className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-green-400">
                        {followersCount.toLocaleString()} followers ✓
                      </span>
                    </div>
                  )}

                  {/* Manual entry fallback */}
                  {showManualEntry && (
                    <div className="space-y-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-xs text-yellow-400 mb-2">
                            Fetching is in Progress, you can enter it manually in the meantime
                          </p>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter followers (e.g., 10k, 1M)"
                              className="h-9 text-sm"
                              value={manualFollowersInput}
                              onChange={(e) =>
                                setManualFollowersInput(e.target.value)
                              }
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleManualFollowerSubmit}
                              className="h-9"
                            >
                              Set
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {fetchingFollowers && (
                    <p className="text-xs text-white/60 flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Fetching followers count...
                    </p>
                  )}
                </div>

                <Input
                  placeholder="Phone number"
                  className="h-11 text-base"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/[^0-9]/g, ""))
                  }
                />
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-sm md:text-base font-medium mb-4">
                  Upload your profile picture
                </p>

                {!profileImagePreview ? (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-colors bg-white/5">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Camera className="w-12 h-12 mb-3 text-white/60" />
                      <p className="mb-2 text-sm text-white/80">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-white/60">
                        PNG, JPG or JPEG (MAX. 5MB)
                      </p>
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
              <>
                <p className="text-sm md:text-base font-medium">
                  Where are you based?
                </p>

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
                    placeholder="Add city"
                    className="h-11 text-base"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                  />
                  <Button
                    type="button"
                    className="h-11 text-sm md:text-base"
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
                    <span className="text-sm md:text-base font-medium">
                      {city}
                    </span>
                  </p>
                )}

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
                    placeholder="Add state"
                    className="h-11 text-base"
                    value={customState}
                    onChange={(e) => setCustomState(e.target.value)}
                  />
                  <Button
                    type="button"
                    className="h-11 text-sm md:text-base"
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
                    <span className="text-sm md:text-base font-medium">
                      {state}
                    </span>
                  </p>
                )}
              </>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <p className="text-sm md:text-base font-medium">
                  Select your content categories
                </p>
                <p className="text-xs text-white/60">
                  Pick at least one niche that best describes your content.
                </p>
                
                <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {allNiches.length > 0 ? (
                    allNiches.map((niche) => (
                      <label 
                        key={niche} 
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer",
                          selectedNiches.includes(niche) 
                            ? "bg-primary/20 border-primary text-white" 
                            : "bg-white/5 border-white/10 text-white/60 hover:border-white/30"
                        )}
                      >
                        <Checkbox
                          checked={selectedNiches.includes(niche)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedNiches([...selectedNiches, niche]);
                            } else {
                              setSelectedNiches(selectedNiches.filter(n => n !== niche));
                            }
                          }}
                          className="sr-only"
                        />
                        <Tag className={cn("h-3.5 w-3.5", selectedNiches.includes(niche) ? "text-primary" : "text-white/40")} />
                        <span className="text-sm font-medium">{niche}</span>
                      </label>
                    ))
                  ) : (
                    <div className="col-span-2 py-8 text-center text-white/40 italic">
                      Loading categories...
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                  <Input
                    placeholder="Add custom niche"
                    className="h-10 text-sm"
                    value={newNiche}
                    onChange={(e) => setNewNiche(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const clean = normalizeLabel(newNiche);
                        if (clean && !allNiches.includes(clean)) {
                          setAllNiches([...allNiches, clean]);
                          setSelectedNiches([...selectedNiches, clean]);
                          setNewNiche("");
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-10"
                    onClick={() => {
                      const clean = normalizeLabel(newNiche);
                      if (clean && !allNiches.includes(clean)) {
                        setAllNiches([...allNiches, clean]);
                        setSelectedNiches([...selectedNiches, clean]);
                        setNewNiche("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                  <p className="text-sm text-purple-200">
                    Enter your payment details to receive lightning-fast payouts after campaign completion.
                  </p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs text-white/60 ml-1">UPI ID (Recommended)</label>
                  <Input
                    placeholder="username@okaxis"
                    className="h-11 text-base"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                  />
                </div>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-white/40">OR BANK TRANSFER</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Input
                    placeholder="Bank Name"
                    className="h-11 text-base"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                  <Input
                    placeholder="Account Number"
                    className="h-11 text-base"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                  <Input
                    placeholder="IFSC Code"
                    className="h-11 text-base uppercase"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ACTIONS */}
        <div className="flex justify-between mt-4 md:mt-6">
          {step > 1 && (
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              className="h-11 text-sm md:text-base"
            >
              Back
            </Button>
          )}

          {step < 5 ? (
            <Button
              disabled={!canProceed() || fetchingFollowers}
              onClick={nextStep}
              className="h-11 text-sm md:text-base"
            >
              {fetchingFollowers ? "Fetching..." : "Next"}
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
