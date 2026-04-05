import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, CreditCard, Landmark, CheckCircle2 } from "lucide-react";
import InfluencerNavbar from "@/components/influencer/InfluencerNavbar";

const PaymentSettings = () => {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-background pb-10">
      <InfluencerNavbar />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard")}
          className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Payment Settings</h1>
          <p className="text-muted-foreground mt-1">Manage where you receive your payouts.</p>
          
          {razorpayId && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 size={12} />
              Razorpay Linked: {razorpayId}
            </div>
          )}
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("upi")}
            className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
              activeTab === "upi" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card/50 text-muted-foreground hover:border-border/80"
            }`}
          >
            <CreditCard size={20} />
            <span className="font-semibold">UPI ID</span>
            {activeTab === "upi" && <CheckCircle2 size={16} className="ml-auto" />}
          </button>
          <button
            onClick={() => setActiveTab("bank")}
            className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
              activeTab === "bank" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card/50 text-muted-foreground hover:border-border/80"
            }`}
          >
            <Landmark size={20} />
            <span className="font-semibold">Bank Transfer</span>
            {activeTab === "bank" && <CheckCircle2 size={16} className="ml-auto" />}
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{activeTab === "upi" ? "UPI Details" : "Bank Account Details"}</CardTitle>
            <CardDescription>
              {activeTab === "upi" 
                ? "Enter your UPI ID (e.g., username@bank)" 
                : "Enter your bank account information for direct transfers."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeTab === "upi" ? (
              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  placeholder="name@okaxis"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bankAccountName">Account Holder Name</Label>
                  <Input
                    id="bankAccountName"
                    placeholder="John Doe"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="HDFC Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="1234567890"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    placeholder="HDFC0001234"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                  />
                </div>
              </>
            )}

            <Button 
                onClick={handleSave} 
                disabled={isLoading} 
                className="w-full mt-6"
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
