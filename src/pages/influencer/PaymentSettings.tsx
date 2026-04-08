import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, CreditCard, Landmark, CheckCircle2 } from "lucide-react";
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";
import ThemedStudioBackground from "@/components/influencer/ThemedStudioBackground";
import InfluencerNavbar from "@/components/influencer/InfluencerNavbar";

const PaymentSettings = () => {
  const navigate = useNavigate();
  const { theme, themeKey, setTheme } = useInfluencerTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"upi" | "bank">("upi");

  // Form state
  const [upiId, setUpiId] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [razorpayId, setRazorpayId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('influencer_profiles')
        .select('upi_id, bank_name, account_number, ifsc_code, bank_account_name, razorpay_account_id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setUpiId(profile.upi_id || "");
        setBankName(profile.bank_name || "");
        setAccountNumber(profile.account_number || "");
        setIfscCode(profile.ifsc_code || "");
        setBankAccountName(profile.bank_account_name || "");
        setRazorpayId(profile.razorpay_account_id || null);
        
        if (profile.bank_name || profile.account_number) {
            setActiveTab("bank");
        }
      }
    };

    fetchPaymentDetails();
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload: any = {
      upi_id: activeTab === "upi" ? upiId : null,
      bank_name: activeTab === "bank" ? bankName : null,
      account_number: activeTab === "bank" ? accountNumber : null,
      ifsc_code: activeTab === "bank" ? ifscCode : null,
      bank_account_name: activeTab === "bank" ? bankAccountName : null,
    };

    const { error } = await supabase
      .from("influencer_profiles")
      .update(payload)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to update payment settings");
    } else {
      toast.success("Payment settings updated successfully! 🎉");
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-500" style={{ background: theme.background }}>
      <ThemedStudioBackground themeKey={themeKey} />
      <InfluencerNavbar currentTheme={themeKey} onThemeChange={setTheme} />
      
      <main className="relative z-10 container mx-auto px-4 py-8 max-w-2xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard")}
          className={`mb-6 -ml-2 ${theme.muted} hover:text-foreground`}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${theme.text}`}>Payment Settings</h1>
          <p className={`${theme.muted} mt-1`}>Manage where you receive your payouts.</p>
          
          {razorpayId && (
            <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${themeKey === 'light' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'} text-xs font-bold uppercase tracking-wider border`}>
              <CheckCircle2 size={12} />
              Razorpay Linked: {razorpayId}
            </div>
          )}
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("upi")}
            className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
              activeTab === "upi" 
                ? (themeKey === 'dark' ? "border-blue-600 bg-blue-600/10 text-blue-400" : "border-blue-600 bg-blue-600/10 text-blue-600")
                : `${themeKey === 'dark' ? 'border-white/10 bg-white/5 text-white/50' : 'border-black/5 bg-black/5 text-black/50'} hover:border-blue-500/30`
            }`}
          >
            <CreditCard size={20} />
            <span className="font-semibold">UPI ID</span>
            {activeTab === "upi" && <CheckCircle2 size={16} className="ml-auto" />}
          </button>
          <button
            onClick={() => setActiveTab("bank")}
            className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
              activeTab === "bank" 
                ? (themeKey === 'dark' ? "border-blue-600 bg-blue-600/10 text-blue-400" : "border-blue-600 bg-blue-600/10 text-blue-600")
                : `${themeKey === 'dark' ? 'border-white/10 bg-white/5 text-white/50' : 'border-black/5 bg-black/5 text-black/50'} hover:border-blue-500/30`
            }`}
          >
            <Landmark size={20} />
            <span className="font-semibold">Bank Transfer</span>
            {activeTab === "bank" && <CheckCircle2 size={16} className="ml-auto" />}
          </button>
        </div>

        <Card className={`${theme.card} border-white/10`}>
          <CardHeader>
            <CardTitle className={theme.text}>{activeTab === "upi" ? "UPI Details" : "Bank Account Details"}</CardTitle>
            <CardDescription className={theme.muted}>
              {activeTab === "upi" 
                ? "Enter your UPI ID (e.g., username@bank)" 
                : "Enter your bank account information for direct transfers."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeTab === "upi" ? (
              <div className="space-y-2">
                <Label htmlFor="upiId" className={theme.text}>UPI ID</Label>
                <Input
                  id="upiId"
                  placeholder="name@okaxis"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className={`${themeKey === 'light' ? 'bg-white text-slate-900 border-slate-200' : 'bg-white/5 text-white border-white/10'}`}
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bankAccountName" className={theme.text}>Account Holder Name</Label>
                  <Input
                    id="bankAccountName"
                    placeholder="John Doe"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    className={`${themeKey === 'light' ? 'bg-white text-slate-900 border-slate-200' : 'bg-white/5 text-white border-white/10'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName" className={theme.text}>Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="HDFC Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className={`${themeKey === 'light' ? 'bg-white text-slate-900 border-slate-200' : 'bg-white/5 text-white border-white/10'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber" className={theme.text}>Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="1234567890"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className={`${themeKey === 'light' ? 'bg-white text-slate-900 border-slate-200' : 'bg-white/5 text-white border-white/10'}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifscCode" className={theme.text}>IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    placeholder="HDFC0001234"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    className={`${themeKey === 'light' ? 'bg-white text-slate-900 border-slate-200' : 'bg-white/5 text-white border-white/10'}`}
                  />
                </div>
              </>
            )}

            <Button 
                onClick={handleSave} 
                disabled={isLoading} 
                className={`w-full mt-6 ${themeKey === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold h-12 rounded-xl`}
            >
              {isLoading ? "Saving..." : "Save Payment Details"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PaymentSettings;
