import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // 1. Fetch Influencer and Campaign Info
    const { amount, contractId } = await req.json();

    if (!amount || !contractId) {
      throw new Error('Missing amount or contractId');
    }

    // Get influencer_id and bank details for this contract
    const { data: contract, error: contractErr } = await supabase
      .from('campaign_influencers')
      .select(`
        influencer_id,
        final_payout,
        influencer_profiles!inner (
          full_name,
          razorpay_account_id,
          account_number,
          ifsc_code,
          bank_account_name,
          upi_id
        )
      `)
      .eq('id', contractId)
      .single();

    if (contractErr || !contract) throw new Error('Contract or Influencer not found');

    const influencer = contract.influencer_profiles;
    const payoutAmount = contract.final_payout || 0;

    // Razorpay Keys from edge function environment
    const key_id = Deno.env.get('RAZORPAY_KEY_ID');
    const key_secret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!key_id || !key_secret) {
      throw new Error('Razorpay keys not configured');
    }

    const authHeader = 'Basic ' + btoa(`${key_id}:${key_secret}`);

    let razorpayAccountId = influencer.razorpay_account_id;

    // 2. AUTOMATED ONBOARDING: Create Linked Account if missing
    if (!razorpayAccountId && (influencer.account_number || influencer.upi_id)) {
      console.log(`Creating Razorpay Linked Account for ${influencer.full_name}...`);
      
      const accountPayload: any = {
        type: "route",
        reference_id: `influencer_${contract.influencer_id.substring(0, 8)}`,
        business_type: "individual",
        contact_name: influencer.bank_account_name || influencer.full_name,
        profile: {
          category: "entertainment",
          subcategory: "social_media_influencer",
          addresses: {
             registered: {
                street1: "Influencer Location",
                city: "City",
                state: "ST",
                postal_code: "000000",
                country: "IN"
             }
          }
        }
      };

      // Add Bank Account OR UPI
      if (influencer.account_number && influencer.ifsc_code) {
        accountPayload.legal_name = influencer.bank_account_name || influencer.full_name;
      }

      const accResponse = await fetch('https://api.razorpay.com/v1/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify(accountPayload)
      });

      if (accResponse.ok) {
        const accData = await accResponse.json();
        razorpayAccountId = accData.id;

        // Save to DB
        await supabase
          .from('influencer_profiles')
          .update({ razorpay_account_id: razorpayAccountId })
          .eq('user_id', contract.influencer_id);

        // Link Stakeholder/Bank Account to the new account
        // Note: In production, you'd call /accounts/{id}/stakeholders and /accounts/{id}/bank_accounts
        // For now, we assume the account is created. Full KYC flow is deeper, but this starts the process.
      } else {
        console.error("Failed to create Razorpay account:", await accResponse.text());
      }
    }

    // 3. Create Order with Transfers (Split Payment)
    const orderBody: any = {
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `receipt_${contractId.substring(0, 10)}`,
      notes: {
        contractId,
        userId: user.id
      }
    };

    if (razorpayAccountId && payoutAmount > 0) {
      orderBody.transfers = [
        {
          account: razorpayAccountId,
          amount: Math.round(payoutAmount * 100),
          currency: 'INR',
          on_hold: false
        }
      ];
    }

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(orderBody)
    });

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.json();
      throw new Error(`Razorpay error: ${JSON.stringify(errorData)}`);
    }

    const orderData = await razorpayResponse.json();

    return new Response(JSON.stringify(orderData), {
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
