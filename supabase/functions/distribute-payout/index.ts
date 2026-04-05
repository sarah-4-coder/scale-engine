import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { contractId, batchIds } = await req.json();

    const key_id = Deno.env.get('RAZORPAY_KEY_ID');
    const key_secret = Deno.env.get('RAZORPAY_KEY_SECRET');
    const razorpayx_acc = Deno.env.get('RAZORPAYX_ACCOUNT_NUMBER'); // Required for Payouts

    if (!key_id || !key_secret) {
      throw new Error('Razorpay keys not configured');
    }

    const authHeader = 'Basic ' + btoa(`${key_id}:${key_secret}`);

    const processPayout = async (id: string) => {
      const { data: contract, error: contractErr } = await supabase
        .from('campaign_influencers')
        .select(`
          id,
          influencer_id,
          net_payout,
          funding_status,
          influencer_profiles!inner (
            full_name,
            instagram_handle,
            upi_id,
            account_number,
            ifsc_code,
            bank_account_name
          )
        `)
        .eq('id', id)
        .single();

      if (contractErr || !contract) throw new Error(`Contract ${id} not found`);
      if (contract.funding_status !== 'funded' && contract.funding_status !== 'settled') {
        throw new Error(`Contract ${id} is not funded.`);
      }

      const influencer = contract.influencer_profiles;
      const amount = contract.net_payout || 0;

      // --- RAZORPAYX PAYOUT FLOW (Direct to Bank/UPI) ---

      // 1. Create/Get Contact
      const contactResponse = await fetch('https://api.razorpay.com/v1/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
        body: JSON.stringify({
          name: influencer.full_name,
          email: `${influencer.instagram_handle.replace(/[^a-zA-Z0-9]/g, '')}@dotfluence.internal`,
          type: "vendor",
          reference_id: contract.influencer_id.substring(0, 8)
        })
      });

      if (!contactResponse.ok) {
        const err = await contactResponse.text();
        console.error("Contact creation failed:", err);
      }
      const contactData = await contactResponse.json();
      const contactId = contactData.id;

      // 2. Create Fund Account (UPI or Bank)
      let fundAccountPayload: any = {
        contact_id: contactId,
        account_type: influencer.upi_id ? "vpa" : "bank_account",
      };

      if (influencer.upi_id) {
        fundAccountPayload.vpa = { address: influencer.upi_id };
      } else {
        fundAccountPayload.bank_account = {
          name: influencer.bank_account_name || influencer.full_name,
          ifsc: influencer.ifsc_code,
          account_number: influencer.account_number
        };
      }

      const faResponse = await fetch('https://api.razorpay.com/v1/fund_accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
        body: JSON.stringify(fundAccountPayload)
      });

      if (!faResponse.ok) {
        const err = await faResponse.json();
        throw new Error(`Failed to create fund account: ${JSON.stringify(err)}`);
      }
      const faData = await faResponse.json();
      const fundAccountId = faData.id;

      // 3. Create Payout
      const payoutPayload: any = {
        account_number: razorpayx_acc || "REPLACE_WITH_YOUR_RAZORPAYX_ACC", // Fallback for testing visibility
        fund_account_id: fundAccountId,
        amount: Math.round(amount * 100),
        currency: "INR",
        mode: influencer.upi_id ? "UPI" : "IMPS",
        purpose: "payout",
        queue_if_low_balance: true,
        reference_id: id.substring(0, 8)
      };

      const payoutResponse = await fetch('https://api.razorpay.com/v1/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
        body: JSON.stringify(payoutPayload)
      });

      if (!payoutResponse.ok) {
        const err = await payoutResponse.json();
        throw new Error(`Razorpay payout error: ${JSON.stringify(err)}`);
      }

      const payoutData = await payoutResponse.json();
      return { id, transferData: { id: payoutData.id } }; // Match earlier format
    };

    let results = [];
    if (contractId) {
      results.push(await processPayout(contractId));
    } else if (batchIds) {
      for (const id of batchIds) {
        results.push(await processPayout(id));
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
