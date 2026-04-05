import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface ManualDistributionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  influencers: any[];
  campaign: any;
  onMarkPaid: (influencer: any) => Promise<void>;
  isProcessing: string | null;
}

export const ManualDistributionDialog: React.FC<ManualDistributionDialogProps> = ({
  isOpen,
  onClose,
  influencers,
  campaign,
  onMarkPaid,
  isProcessing
}) => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const fundedInfluencers = influencers.filter(i => i.funding_status === 'funded');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manual Payout Distribution</DialogTitle>
          <DialogDescription>
            Transfer funds manually to the influencers below and mark them as paid.
            This campaign has been fully funded to Dotfluence Escrow.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Influencer</TableHead>
                <TableHead>Payment Details</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fundedInfluencers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No pending funded payouts found.
                  </TableCell>
                </TableRow>
              ) : (
                fundedInfluencers.map((inf) => (
                  <TableRow key={inf.id}>
                    <TableCell>
                      <div className="font-medium">{inf.influencer_profiles?.full_name || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">@{inf.influencer_profiles?.instagram_handle}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {inf.influencer_profiles?.upi_id ? (
                          <div className="flex items-center gap-2 group">
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">UPI</span>
                            <span className="text-sm font-mono">{inf.influencer_profiles.upi_id}</span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-4 w-4 opacity-0 group-hover:opacity-100"
                              onClick={() => copyToClipboard(inf.influencer_profiles.upi_id, 'UPI ID')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : null}
                        
                        {(inf.influencer_profiles?.account_number || inf.influencer_profiles?.bank_account_number) ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 group">
                              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">A/C</span>
                              <span className="text-sm font-mono">
                                {inf.influencer_profiles.account_number || inf.influencer_profiles.bank_account_number}
                              </span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-4 w-4 opacity-0 group-hover:opacity-100"
                                onClick={() => copyToClipboard(inf.influencer_profiles.account_number || inf.influencer_profiles.bank_account_number, 'Account Number')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 group">
                              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">IFSC</span>
                              <span className="text-sm font-mono">
                                {inf.influencer_profiles.ifsc_code || inf.influencer_profiles.bank_ifsc_code}
                              </span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-4 w-4 opacity-0 group-hover:opacity-100"
                                onClick={() => copyToClipboard(inf.influencer_profiles.ifsc_code || inf.influencer_profiles.bank_ifsc_code, 'IFSC Code')}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            {inf.influencer_profiles?.bank_name && (
                              <div className="text-[10px] text-muted-foreground italic px-1.5 font-medium">
                                {inf.influencer_profiles.bank_name}
                              </div>
                            )}
                          </div>
                        ) : null}

                        {!inf.influencer_profiles?.upi_id && 
                         !inf.influencer_profiles?.account_number && 
                         !inf.influencer_profiles?.bank_account_number && (
                          <span className="text-xs text-destructive">No payment details linked</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold">₹{inf.net_payout?.toLocaleString() || inf.final_payout?.toLocaleString()}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200"
                        onClick={() => onMarkPaid(inf)}
                        disabled={isProcessing === `manual-payout-${inf.id}`}
                      >
                        {isProcessing === `manual-payout-${inf.id}` ? (
                          "Processing..."
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Paid
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
