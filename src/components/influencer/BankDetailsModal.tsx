import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Landmark, Loader2, ShieldCheck, Wallet } from "lucide-react";

interface BankDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  onSuccess: () => void;
}

const BankDetailsModal = ({ open, onOpenChange, profileId, onSuccess }: BankDetailsModalProps) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<"upi" | "bank">("upi");
  const [formData, setFormData] = useState({
    upi_id: "",
    account_holder_name: "",
    account_number: "",
    ifsc_code: ""
  });

  useEffect(() => {
    if (open && profileId) {
      loadProfileData();
    }
  }, [open, profileId]);

  const loadProfileData = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from('influencer_profiles')
        .select('upi_id, bank_account_name, bank_account_number, bank_ifsc_code')
        .eq('id', profileId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setFormData({
          upi_id: data.upi_id || "",
          account_holder_name: data.bank_account_name || "",
          account_number: data.bank_account_number || "",
          ifsc_code: data.bank_ifsc_code || ""
        });
        // Set default tab based on what's available
        if (data.upi_id) setPayoutMethod("upi");
        else if (data.bank_account_number) setPayoutMethod("bank");
      }
    } catch (err) {
      console.error("Error loading bank details:", err);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (payoutMethod === "upi") {
      if (!formData.upi_id) {
        toast.error("UPI ID is required");
        return;
      }
    } else {
      if (!formData.account_holder_name || !formData.account_number || !formData.ifsc_code) {
        toast.error("All bank details are required for payout");
        return;
      }
    }

    setLoading(true);
    try {
      const updateData: any = {};
      if (payoutMethod === "upi") {
        updateData.upi_id = formData.upi_id;
      } else {
        updateData.bank_account_name = formData.account_holder_name;
        updateData.bank_account_number = formData.account_number;
        updateData.bank_ifsc_code = formData.ifsc_code;
      }

      const { error } = await supabase
        .from('influencer_profiles')
        .update(updateData)
        .eq('id', profileId);

      if (error) throw error;

      toast.success("Payout details saved securely!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-white/5 rounded-3xl">
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-2">
            {payoutMethod === "upi" ? <Wallet className="w-6 h-6 text-primary" /> : <Landmark className="w-6 h-6 text-primary" />}
          </div>
          <DialogTitle className="text-2xl font-black">Add Payout Details</DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium">
            Choose your preferred payout method to receive your earnings.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={payoutMethod} onValueChange={(v) => setPayoutMethod(v as "upi" | "bank")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 rounded-xl p-1 mb-6">
            <TabsTrigger value="upi" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold">
              UPI
            </TabsTrigger>
            <TabsTrigger value="bank" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white transition-all font-bold">
              Bank Account
            </TabsTrigger>
          </TabsList>

          {fetching ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Fetching secure details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <TabsContent value="upi" className="space-y-4 m-0">
              <div className="space-y-2">
                <Label>UPI ID</Label>
                <Input 
                  placeholder="username@bank"
                  value={formData.upi_id}
                  onChange={(e) => setFormData({...formData, upi_id: e.target.value})}
                  className="bg-white/5 border-white/10 h-12"
                  required={payoutMethod === "upi"}
                />
                <p className="text-[10px] text-muted-foreground ml-1">Example: john@okicici, mobile-number@paytm</p>
              </div>
            </TabsContent>

            <TabsContent value="bank" className="space-y-4 m-0">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Account Holder Name</Label>
                  <Input 
                    placeholder="As per bank records"
                    value={formData.account_holder_name}
                    onChange={(e) => setFormData({...formData, account_holder_name: e.target.value})}
                    className="bg-white/5 border-white/10 h-12"
                    required={payoutMethod === "bank"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input 
                    placeholder="Enter your account number"
                    value={formData.account_number}
                    onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                    className="bg-white/5 border-white/10 h-12"
                    required={payoutMethod === "bank"}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>IFSC Code</Label>
                    <span className="text-[10px] text-primary font-black uppercase tracking-widest">11 Characters</span>
                  </div>
                  <Input 
                    placeholder="HDFC0001234"
                    value={formData.ifsc_code}
                    onChange={(e) => setFormData({...formData, ifsc_code: e.target.value})}
                    className="bg-white/5 border-white/10 h-12 uppercase"
                    required={payoutMethod === "bank"}
                    maxLength={11}
                  />
                </div>
              </div>
            </TabsContent>

            <DialogFooter className="flex-col sm:flex-col gap-4 mt-6">
              <Button 
                type="submit" 
                className="w-full h-14 text-lg font-bold rounded-xl shadow-xl shadow-primary/20"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : "Save & Request Payout"}
              </Button>
              <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                Data is encrypted and stored securely
              </div>
            </DialogFooter>
          </form>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default BankDetailsModal;
