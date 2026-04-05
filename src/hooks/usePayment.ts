import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PaymentApplicant {
  id: string;
  influencer_id: string;
  status: string;
  final_payout: number | null;
  requested_payout?: number | null;
  influencer_profiles: {
    user_id: string;
    full_name: string;
  };
}

export interface PaymentCampaign {
  id: string;
  name: string;
  base_payout: number;
  managed_by_dotfluence?: boolean;
  execution_model?: 'agency' | 'brand_self' | 'brand_managed' | 'internal';
  platform_fee_percent?: number | null;
  brand_profiles?: {
    company_name: string;
    work_email: string;
  };
}

export const usePayment = (onSuccess?: () => void) => {
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);

  const calculateFeesAndTax = (payout: number, model?: string, campaignFeePercent?: number | null) => {
    // Priority: Persisted DB percentage, or model-based default (15% managed, 5% self)
    const feePercent = (campaignFeePercent !== undefined && campaignFeePercent !== null)
      ? (campaignFeePercent / 100) 
      : (model === 'brand_managed' ? 0.17 : 0.07);

    const platformFee = Math.round(payout * feePercent);
    const tdsAmount = Math.round(payout * 0.10); // Standard 10% TDS
    const netPayout = payout - tdsAmount;
    
    return { platformFee, tdsAmount, netPayout };
  };

  const finalizePayment = async (
    applicant: PaymentApplicant, 
    campaign: PaymentCampaign, 
    payout: number, 
    fee: number,
    referenceId?: string,
    paymentMode: string = 'razorpay'
  ) => {
    try {
      const { tdsAmount, netPayout } = calculateFeesAndTax(payout, campaign.execution_model, campaign.platform_fee_percent);

      // 1. Update Status to Paid (Influencer settled)
      const { error: updateError } = await supabase
        .from("campaign_influencers")
        .update({ 
          status: "paid", // Change from completed to paid
          funding_status: "settled",
          tds_amount: tdsAmount,
          net_payout: netPayout,
          platform_fee_amount: fee,
          final_payout: payout
        } as any)
        .eq("id", applicant.id);

      if (updateError) throw updateError;

      // 2. Log Transactions (Ledger)
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: ledgerError } = await supabase.from("transactions").insert([
        {
          user_id: user?.id,
          campaign_id: campaign.id,
          contract_id: applicant.id,
          influencer_id: applicant.influencer_id,
          amount: payout + fee,
          type: "brand_inflow",
          status: "completed",
          provider_tx_id: referenceId,
          description: `Merchant Funding: ${applicant.influencer_profiles.full_name} for ${campaign.name}`
        },
        {
          user_id: applicant.influencer_profiles.user_id,
          campaign_id: campaign.id,
          contract_id: applicant.id,
          influencer_id: applicant.influencer_id,
          amount: payout,
          type: "influencer_payout",
          status: "completed",
          provider_tx_id: referenceId,
          description: `Payout Distributed: ${campaign.name} (${paymentMode})`
        },
        {
          user_id: user?.id,
          campaign_id: campaign.id,
          contract_id: applicant.id,
          influencer_id: applicant.influencer_id,
          amount: fee,
          type: campaign.execution_model === 'brand_managed' ? "agency_fee" : "platform_fee",
          status: "completed",
          provider_tx_id: referenceId,
          description: `Service Fee Collected: ${campaign.name}`
        }
      ] as any);

      if (ledgerError) throw ledgerError;

      toast.success("Merchant funded & payout distributed! Creator marked as PAID.");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Finalize payment error:", error);
      toast.error(error instanceof Error ? error.message : "Status updated but ledger logging failed.");
    } finally {
      setIsProcessingPayment(null);
    }
  };

  const handleApproveContent = async (applicant: any, campaign: any) => {
    setIsProcessingPayment(applicant.id);
    try {
      const payout = applicant.final_payout || campaign.base_payout;
      const { platformFee, tdsAmount, netPayout } = calculateFeesAndTax(payout, campaign.execution_model, campaign.platform_fee_percent);

      // Update to Completed, but Funding stays Unfunded
      const { error } = await supabase
        .from("campaign_influencers")
        .update({
          status: "completed", // Content approved, awaiting payment
          funding_status: "unfunded",
          final_payout: payout,
          platform_fee_amount: platformFee,
          tds_amount: tdsAmount,
          net_payout: netPayout
        } as any)
        .eq("id", applicant.id);

      if (error) throw error;

      toast.success("Content Approved! Awaiting merchant funding.");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error("Failed to approve content: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsProcessingPayment(null);
    }
  };

  const handleMerchantFunding = async (applicant: any, campaign: any) => {
    if (!campaign || !applicant.influencer_profiles.user_id) {
      toast.error("Missing campaign or influencer details");
      return;
    }

    setIsProcessingPayment(applicant.id);

    try {
      const payout = applicant.final_payout || campaign.base_payout;
      const { platformFee } = calculateFeesAndTax(payout, campaign.execution_model, campaign.platform_fee_percent);
      const totalAmount = payout + platformFee;

      // Create Razorpay Order for Merchant Funding
      const { data, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: { amount: totalAmount, contractId: applicant.id, type: 'merchant_funding' }
      });

      if (orderError) throw orderError;
      if (data?.error) throw new Error(data.error);

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      const options = {
        key: razorpayKey,
        amount: data.amount,
        currency: data.currency,
        name: "DotFluence Merchant",
        description: `Fund Campaign: ${campaign.name}`,
        order_id: data.id,
        handler: async function (response: any) {
          // Once funded, update funding_status to 'funded'
          await supabase
            .from("campaign_influencers")
            .update({ funding_status: 'funded' })
            .eq("id", applicant.id);
          
          // Store the funding transaction in ledger
          await supabase.from("transactions").insert({
            campaign_id: campaign.id,
            amount: totalAmount,
            type: "brand_inflow",
            status: "completed",
            provider_tx_id: response.razorpay_payment_id,
            description: `Merchant Funding Received from ${campaign.brand_profiles?.company_name || 'Partner'}`
          } as any);

          toast.success("Merchant Account Funded! Ready for distribution.");
          if (onSuccess) onSuccess();
        },
        prefill: { 
          name: campaign.brand_profiles?.company_name || "", 
          email: campaign.brand_profiles?.work_email || "" 
        },
        theme: { color: "#7C3AED" }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast.error(error.message || "Funding failed");
    } finally {
      setIsProcessingPayment(null);
    }
  };

  const handleBatchMerchantFunding = async (campaignId: string, influencers: any[]) => {
    setIsProcessingPayment('batch-fund-' + campaignId);
    try {
      const totalAmount = influencers.reduce((acc, i) => acc + (i.final_payout || 0) + (i.platform_fee_amount || 0), 0);
      
      const { data, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: { amount: totalAmount, campaignId, type: 'merchant_funding_batch' }
      });

      if (orderError) throw orderError;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        order_id: data.id,
        name: "DotFluence Merchant",
        description: `Batch Fund: ${influencers.length} Creators`,
        handler: async function (response: any) {
          const ids = influencers.map(i => i.id);
          await supabase.from("campaign_influencers").update({ funding_status: 'funded' }).in("id", ids);
          
          await supabase.from("transactions").insert({
            campaign_id: campaignId,
            amount: totalAmount,
            type: "brand_inflow",
            status: "completed",
            provider_tx_id: response.razorpay_payment_id,
            description: `Batch Merchant Funding Received (${influencers.length} Creators)`
          } as any);

          toast.success("Merchant Account Funded in Batch!");
          if (onSuccess) onSuccess();
        },
        theme: { color: "#7C3AED" }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast.error("Batch funding failed");
    } finally {
      setIsProcessingPayment(null);
    }
  };

  const handleManualPayout = async (applicant: any, campaign: any) => {
    setIsProcessingPayment('manual-payout-' + applicant.id);
    try {
      const manualTransferId = `man_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await finalizePayment(
        applicant, 
        campaign, 
        applicant.final_payout, 
        applicant.platform_fee_amount, 
        manualTransferId, 
        'manual_transfer'
      );
      toast.success("Payout marked as paid manually!");
    } catch (error: any) {
      toast.error("Failed to mark payout: " + error.message);
    } finally {
      setIsProcessingPayment(null);
    }
  };

  const handleSystemPayoutDistribution = async (applicant: any, campaign: any) => {
    setIsProcessingPayment('payout-' + applicant.id);
    try {
      // Trigger Razorpay Payout (Transfer API via Edge Function)
      const { data, error } = await supabase.functions.invoke('distribute-payout', {
        body: { contractId: applicant.id }
      });

      if (error) throw error;
      if (!data?.results?.[0]?.transferData?.id) throw new Error("No transfer ID returned");
      
      const transferId = data.results[0].transferData.id;
      await finalizePayment(applicant, campaign, applicant.final_payout, applicant.platform_fee_amount, transferId, 'razorpay_route');
      toast.success("Payout distributed successfully!");
    } catch (error: any) {
      toast.error("Payout Distribution Failed: " + error.message);
    } finally {
      setIsProcessingPayment(null);
    }
  };

  const handleBatchSystemPayoutDistribution = async (campaignId: string, influencers: any[]) => {
    setIsProcessingPayment('batch-payout-' + campaignId);
    try {
      // Trigger Batch Razorpay Payouts
      const { data, error } = await supabase.functions.invoke('distribute-payout', {
        body: { batchIds: influencers.map(i => i.id) }
      });

      if (error) throw error;
      if (!data?.results) throw new Error("Invalid response from servers");

      for (const res of data.results) {
        const inf = influencers.find(i => i.id === res.id);
        if (inf && res.transferData?.id) {
          await finalizePayment(inf, { id: campaignId } as any, inf.final_payout, inf.platform_fee_amount, res.transferData.id, 'razorpay_route_batch');
        }
      }
      toast.success(`Successfully distributed payouts to ${influencers.length} influencers!`);
    } catch (error: any) {
      toast.error("Batch Distribution Failed: " + error.message);
    } finally {
      setIsProcessingPayment(null);
    }
  };

  return {
    isProcessingPayment,
    setIsProcessingPayment,
    handleApproveContent,
    handleMerchantFunding,
    handleBatchMerchantFunding,
    handleManualPayout,
    handlePayoutDistribution: handleSystemPayoutDistribution,
    handleBatchPayoutDistribution: handleBatchSystemPayoutDistribution,
    finalizePayment
  };
};

