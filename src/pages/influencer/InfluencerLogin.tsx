import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, ArrowRight, Loader2, MessageSquare, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const InfluencerLogin = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    
    setIsAuthenticating(true);
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });

    if (error) {
      toast.error(error.message);
    } else {
      setStep('otp');
      toast.success("OTP sent to your phone");
    }
    setIsAuthenticating(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setIsAuthenticating(true);
    
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    const { data: { session }, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms',
    });
    
    if (error) {
      toast.error(error.message);
      setIsAuthenticating(false);
      return;
    }

    if (session?.user) {
        // Case 6: Check if influencer profile exists
        const { data: profile } = await supabase
            .from('influencer_profiles')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();
        
        if (!profile) {
            toast.error("No account found with this number. You can only create an account via a campaign invite link.");
            await supabase.auth.signOut();
            setIsAuthenticating(false);
            return;
        }

        toast.success("Welcome back!");
        navigate('/dashboard');
    }
    setIsAuthenticating(false);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_50%_0%,#3b82f615,transparent_50%)] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <Link 
          to="/login" 
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-white mb-8 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to main login
        </Link>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="text-center pt-12 pb-8">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary border border-primary/20">
                <Phone className="w-8 h-8" />
              </div>
              <CardTitle className="text-3xl font-black tracking-tight">Influencer Login</CardTitle>
              <CardDescription className="text-base font-medium px-4">
                Enter your phone number to access your creator dashboard
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-12">
              <AnimatePresence mode="wait">
                {step === 'phone' ? (
                  <motion.form
                    key="phone-step"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleSendOtp}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-black text-muted-foreground tracking-widest ml-1">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input 
                          type="tel"
                          placeholder="98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl text-lg font-bold"
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isAuthenticating}
                      className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20"
                    >
                      {isAuthenticating ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Send OTP <ArrowRight className="ml-2 w-5 h-5" /></>}
                    </Button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="otp-step"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleVerifyOtp}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-black text-muted-foreground tracking-widest ml-1">Verify OTP</Label>
                      <div className="relative">
                        <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input 
                          type="text"
                          placeholder="000000"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl text-lg font-bold tracking-[0.5em] text-center"
                          required
                          autoFocus
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => setStep('phone')}
                        className="text-xs font-bold text-primary hover:underline ml-1"
                      >
                        Change phone number
                      </button>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isAuthenticating}
                      className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20"
                    >
                      {isAuthenticating ? <Loader2 className="w-6 h-6 animate-spin" /> : "Verify & Login"}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="mt-8 text-center border-t border-white/5 pt-8">
                <p className="text-xs text-muted-foreground font-medium">
                  Don't have an account? <br />
                  <span className="text-white/60">You can only join via a campaign invite link.</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default InfluencerLogin;
