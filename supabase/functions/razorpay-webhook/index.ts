import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

serve(async (req) => {
  try {
    // 1. Parse raw body and headers
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const secret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');

    if (!secret || !signature) {
      console.error("Missing signature or webhook secret");
      return new Response("Unauthorized", { status: 400 });
    }

    // 2. Cryptographically verify signature
    const expectedSignature = await generateSignature(rawBody, secret);
    
    if (expectedSignature !== signature) {
      console.error("Invalid signature");
      return new Response("Invalid signature", { status: 400 });
    }

    // 3. Process the Event
    const event = JSON.parse(rawBody);

    // We only care when the order is successfully paid and captured
    if (event.event === 'order.paid' || event.event === 'payment.captured') {
      const contractId = event.payload.payment.entity.notes?.contractId;

      if (contractId) {
        // Use SERVICE ROLE KEY to securely update the database without user context
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

        const { error: updateError } = await supabaseAdmin
          .from("campaign_influencers")
          .update({ status: "funded" }) // Officially marking Escrow funded
          .eq("id", contractId);

        if (updateError) {
          console.error("Failed to update contract status:", updateError);
          throw updateError;
        }
        console.log(`Successfully verified and funded contract: ${contractId}`);
      }
    }

    return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
