/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, UserPlus, Building2, AlertCircle, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AgencySignup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate work email
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
      // Sign up user with 'agency' role in metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: "agency", // This is read by the revised handle_new_user trigger
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Wait for the database trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Create the agency_profiles entry
        const { error: profileError } = await supabase
          .from("agency_profiles")
          .insert({
            user_id: authData.user.id,
            agency_name: agencyName,
            website: "",
          });

        if (profileError) {
          console.error("Agency profile error:", profileError);
          throw profileError;
        }

        toast.success("🎉 Agency account created! Redirecting to setup...");
        
        // Wait a bit more for auth state to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Navigate to agency onboarding
        navigate("/agency/onboarding", { replace: true });
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
      {/* Animated background - Purple/Blue for Agency */}
      <motion.div
        className="absolute inset-0"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{
          background:
            "radial-gradient(circle at 20% 20%, #8b5cf6, transparent 40%), radial-gradient(circle at 80% 80%, #3b82f6, transparent 40%), #020617",
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
            <h1 className="text-3xl font-bold text-white tracking-tight">DotFluence</h1>
          </Link>
          <div className="flex items-center justify-center gap-2 mt-3 text-purple-400">
            <Briefcase className="h-5 w-5" />
            <p className="text-white/70 font-semibold">Agency SaaS Portal</p>
          </div>
          <p className="text-white/60 text-sm mt-2">
            Manage multiple brand clients from one dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-white/80">
              Agent Full Name
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Jane Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="agencyName" className="text-white/80">
              Agency Name
            </Label>
            <Input
              id="agencyName"
              type="text"
              placeholder="Elevate Marketing Solutions"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/80">
              Work Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="jane@agency.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
            <p className="text-[10px] text-white/50">
              Note: Work email required for agency validation
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
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all duration-300 font-bold py-6 text-lg"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin text-xl">⏳</span> Creating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserPlus size={20} /> Create Agency Account
              </span>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center pt-6 border-t border-white/5">
          <p className="text-white/70 mb-4">
            Already registered?{" "}
            <Link
              to="/company/login"
              className="text-purple-400 hover:text-purple-300 underline font-medium"
            >
              Sign in
            </Link>
          </p>
          <div className="space-y-3">
             <Link to="/company/signup" className="block text-white/50 hover:text-white text-xs transition-colors">
              Are you an individual brand? Sign up here
            </Link>
            <button
              onClick={handleSignout}
              className="text-sm text-white/40 hover:text-white transition-colors"
            >
              ← Back to DotFluence Home
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AgencySignup;
