import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, UserPlus, Phone, Mail, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AuthBackground from "@/components/auth/AuthBackground";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import "@/styles/auth-pages.css";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp, signInWithOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fill phone if invited via magic link
    const invitedPhone = sessionStorage.getItem("invited_phone");
    if (invitedPhone) {
      setPhone(invitedPhone);
    }
  }, []);

  const handleRedirect = () => {
    const invitedVia = sessionStorage.getItem("invited_via");
    const campaignSlug = sessionStorage.getItem("campaign_context_slug");

    if (invitedVia && campaignSlug) {
      navigate(`/i/${campaignSlug}`);
    } else {
      navigate("/profile-setup");
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName);

    if (error) {
      toast.error(error.message || "Failed to sign up");
      setIsLoading(false);
    } else {
      toast.success("🎉 Account created!");
      handleRedirect();
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error("Please enter a phone number");
      return;
    }
    setIsLoading(true);
    const { error } = await signInWithOtp(phone);
    if (error) {
      toast.error(error.message);
    } else {
      setShowOtp(true);
      toast.success("OTP sent to your phone");
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await verifyOtp(phone, otp);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Verified successfully!");
      handleRedirect();
    }
    setIsLoading(false);
  };

  const handlesignout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    window.location.replace("https://dotfluence.in");
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <AuthBackground />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-[90%] md:w-full max-w-md rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 md:p-8 shadow-2xl text-white"
      >
        <div className="text-center mb-6 md:mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-2xl md:text-3xl font-bold text-white">DotFluence</h1>
          </Link>
          <p className="text-sm md:text-base text-white/70 mt-2">
            Join as a creator & unlock brand campaigns
          </p>
        </div>

        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="fullName" className="text-sm md:text-base text-white/80">Full name</Label>
            <Input
              id="fullName"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="email" className="text-sm md:text-base text-white/80">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="password text-white/80">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white pr-10"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-orange-500 to-indigo-500">
            {isLoading ? "Creating..." : "Create account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-white/70">
            Already a creator? <Link to="/login" className="text-orange-400 hover:underline">Sign in</Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <button onClick={handlesignout} className="text-sm text-white/50 hover:text-white">← Back to home</button>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;