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
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";
import ThemedStudioBackground from "@/components/influencer/ThemedStudioBackground";

const InfluencerLogin = () => {
  const navigate = useNavigate();
  const { theme, themeKey, setTheme } = useInfluencerTheme();
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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 transition-colors duration-500" style={{ background: theme.background }}>
      <ThemedStudioBackground themeKey={themeKey} />
      
      <div className="w-full max-w-md relative z-10">
        <Link 
          to="/login" 
          className={`inline-flex items-center gap-2 text-sm font-bold ${theme.muted} hover:text-blue-600 mb-8 transition-colors group`}
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to main login
        </Link>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`${theme.card} border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden`}>
            <CardHeader className="text-center pt-12 pb-8">
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 border border-blue-600/20">
                <Phone className="w-8 h-8" />
              </div>
              <CardTitle className={`text-3xl font-black tracking-tight ${theme.text}`}>Influencer Login</CardTitle>
              <CardDescription className={`text-base font-medium px-4 ${theme.muted}`}>
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
                      <Label className={`text-xs uppercase font-black ${theme.muted} tracking-widest ml-1`}>Phone Number</Label>
                      <div className="relative">
                        <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.muted} opacity-50`} />
                        <Input 
                          type="tel"
                          placeholder="98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={`h-14 pl-12 ${themeKey === 'dark' ? 'bg-white/5' : 'bg-black/5'} border-white/10 rounded-2xl text-lg font-bold ${theme.text}`}
                          required
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isAuthenticating}
                      className="w-full h-14 rounded-2xl text-lg font-black bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20"
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
                      <Label className={`text-xs uppercase font-black ${theme.muted} tracking-widest ml-1`}>Verify OTP</Label>
                      <div className="relative">
                        <MessageSquare className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.muted} opacity-50`} />
                        <Input 
                          type="text"
                          placeholder="000000"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          className={`h-14 pl-12 ${themeKey === 'dark' ? 'bg-white/5' : 'bg-black/5'} border-white/10 rounded-2xl text-lg font-bold tracking-[0.5em] text-center ${theme.text}`}
                          required
                          autoFocus
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => setStep('phone')}
                        className="text-xs font-bold text-blue-600 hover:underline ml-1"
                      >
                        Change phone number
                      </button>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isAuthenticating}
                      className="w-full h-14 rounded-2xl text-lg font-black bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20"
                    >
                      {isAuthenticating ? <Loader2 className="w-6 h-6 animate-spin" /> : "Verify & Login"}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="mt-8 text-center border-t border-white/5 pt-8">
                <p className={`text-xs ${theme.muted} font-medium`}>
                  Don't have an account? <br />
                  <span className="opacity-60">You can only join via a campaign invite link.</span>
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
