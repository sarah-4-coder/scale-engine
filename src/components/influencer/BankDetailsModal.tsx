import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Landmark, Loader2, ShieldCheck } from "lucide-react";

interface BankDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  onSuccess: () => void;
}

const BankDetailsModal = ({ open, onOpenChange, profileId, onSuccess }: BankDetailsModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    account_holder_name: "",
    account_number: "",
    ifsc_code: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_holder_name || !formData.account_number || !formData.ifsc_code) {
      toast.error("All bank details are required for payout");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('influencer_profiles')
        .update({
          bank_account_name: formData.account_holder_name,
          bank_account_number: formData.account_number,
          bank_ifsc_code: formData.ifsc_code
        })
        .eq('id', profileId);

      if (error) throw error;

      toast.success("Bank details saved securely!");
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
                <Landmark className="w-6 h-6 text-primary" />
            </div>
          <DialogTitle className="text-2xl font-black">Add Payout Details</DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium">
            We need your bank details to process your payment for the completed campaign.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Account Holder Name</Label>
              <Input 
                placeholder="As per bank records"
                value={formData.account_holder_name}
                onChange={(e) => setFormData({...formData, account_holder_name: e.target.value})}
                className="bg-white/5 border-white/10 h-12"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input 
                placeholder="Enter your account number"
                value={formData.account_number}
                onChange={(e) => setFormData({...formData, account_number: e.target.value})}
                className="bg-white/5 border-white/10 h-12"
                required
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
                required
                maxLength={11}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-4">
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
      </DialogContent>
    </Dialog>
  );
};

export default BankDetailsModal;
