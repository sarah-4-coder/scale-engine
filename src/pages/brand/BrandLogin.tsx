import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const BrandLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error(error.message || "Failed to sign in");
      setIsLoading(false);
    } else {
      toast.success("Welcome back to your brand dashboard 🚀");
    }
  };

  const handleSignout = async () => {
    await supabase.auth.signOut({ scope: "local" });
    window.location.replace("https://dotfluence.in");
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
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
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-bold text-white">DotFluence</h1>
          </Link>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Building2 className="h-5 w-5 text-emerald-400" />
            <p className="text-white/70">Brand & Agency Portal</p>
          </div>
          <p className="text-white/60 text-sm mt-2">
            Sign in to manage your campaigns
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:opacity-90 transition"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span> Signing in...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn size={18} /> Sign In
              </span>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-white/70">
            New brand or agency?{" "}
            <Link
              to="/brand/signup"
              className="text-emerald-400 hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center border-t border-white/10 pt-4">
          <p className="text-white/60 text-sm mb-2">Are you an influencer?</p>
          <Link to="/login" className="text-blue-400 hover:underline text-sm">
            Sign in as Influencer
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

export default BrandLogin;