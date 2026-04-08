import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AuthBackground from "@/components/auth/AuthBackground";
import "@/styles/auth-pages.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleRedirect = () => {
    const invitedVia = sessionStorage.getItem("invited_via");
    const campaignSlug = sessionStorage.getItem("campaign_context_slug");

    if (invitedVia && campaignSlug) {
      navigate(`/i/${campaignSlug}`);
    } else {
      navigate("/dashboard");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error.message || "Failed to sign in");
      setIsLoading(false);
    } else {
      toast.success("Welcome back 👋");
      handleRedirect();
    }
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
            Sign in to continue your creator journey
          </p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4 md:space-y-6">
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
          <Button type="submit" disabled={isLoading} className="w-full h-11 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 text-white font-bold">
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-4 md:mt-6 text-center">
          <p className="text-sm md:text-base text-white/70">
            New here? <Link to="/signup" className="text-blue-400 hover:underline">Join as a creator</Link>
          </p>
        </div>

        <div className="mt-3 md:mt-4 text-center">
          <button onClick={handlesignout} className="text-sm text-white/50 hover:text-white">← Back to home</button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;