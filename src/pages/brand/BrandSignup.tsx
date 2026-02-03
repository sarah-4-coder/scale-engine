/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, UserPlus, Building2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

const BrandSignup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate work email (basic check)
    const isWorkEmail = !email.endsWith("@gmail.com") && 
                        !email.endsWith("@yahoo.com") && 
                        !email.endsWith("@hotmail.com") &&
                        !email.endsWith("@outlook.com");

    if (!isWorkEmail) {
      toast.error("Please use a work email address (not personal email)");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      // Sign up user with brand role in metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: contactPersonName,
            role: "brand",
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Wait a bit for the database trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 500));

        // Create profile
        //@ts-ignore
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: authData.user.id,
          full_name: contactPersonName,
        });

        if (profileError) {
          console.error("Profile error:", profileError);
          // Don't throw - the trigger might have already created it
        }

        // Create brand role
        //@ts-ignore
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: authData.user.id,
          role: "brand",
        });

        if (roleError) {
          console.error("Role error:", roleError);
          // Don't throw - the trigger might have already created it
        }

        // Create brand profile (unverified by default)
        const { error: brandProfileError } = await supabase
          .from("brand_profiles")
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          .insert({
            user_id: authData.user.id,
            company_name: companyName,
            work_email: email,
            contact_person_name: contactPersonName,
            phone_number: "", // Will be completed in profile setup
            is_verified: false,
            profile_completed: false,
          });

        if (brandProfileError) throw brandProfileError;

        toast.success("🎉 Account created! Complete your profile to get started");
        
        // Force navigation after a short delay to ensure auth state is updated
        setTimeout(() => {
          navigate("/company/profile-setup", { replace: true });
        }, 500);
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    window.location.replace("https://dotfluence.in");
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8">
      {/* Animated background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{
          background:
            "radial-gradient(circle at 20% 20%, #10b981, transparent 40%), radial-gradient(circle at 80% 80%, #3b82f6, transparent 40%), #020617",
        }}
      />

      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-8 shadow-2xl text-white"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-white">DotFluence</h1>
          </Link>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Building2 className="h-5 w-5 text-emerald-400" />
            <p className="text-white/70">Brand & Agency Portal</p>
          </div>
          <p className="text-white/60 text-sm mt-2">
            Join and access verified influencers
          </p>
        </div>

        {/* Notice */}
        <Alert className="mb-6 bg-blue-500/10 border-blue-500/30">
          <AlertCircle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-200 text-sm">
            Your account will be reviewed by our team. You'll get access within
            24 hours of verification.
          </AlertDescription>
        </Alert>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contactPersonName" className="text-white/80">
              Your Full Name
            </Label>
            <Input
              id="contactPersonName"
              type="text"
              placeholder="John Doe"
              value={contactPersonName}
              onChange={(e) => setContactPersonName(e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-white/80">
              Company / Agency Name
            </Label>
            <Input
              id="companyName"
              type="text"
              placeholder="Acme Marketing Agency"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/80">
              Work Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
            <p className="text-xs text-white/50">
              ⚠️ Personal emails (Gmail, Yahoo, etc.) are not accepted
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/80">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-white/50">Minimum 6 characters</p>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:opacity-90 transition"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span> Creating account...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserPlus size={18} /> Create Brand Account
              </span>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-white/70">
            Already have an account?{" "}
            <Link
              to="/company/login"
              className="text-emerald-400 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center border-t border-white/10 pt-4">
          <p className="text-white/60 text-sm mb-2">Are you an influencer?</p>
          <Link to="/signup" className="text-blue-400 hover:underline text-sm">
            Sign up as Influencer
          </Link>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={handleSignout}
            className="text-sm text-white/50 hover:text-white"
          >
            ← Back to home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default BrandSignup;