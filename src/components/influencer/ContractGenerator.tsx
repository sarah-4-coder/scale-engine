/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Check,
  Loader2,
  Shield,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useInfluencerTheme } from "@/theme/useInfluencerTheme";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useContract } from "@/hooks/useContracts";
import { genAI } from "@/lib/gemini";

interface ContractGeneratorProps {
  campaignId: string;
  influencerId: string;
  campaignName: string;
  finalPayout: number;
  deliverables: string;
  timeline: string;
}

/**
 * AI-Generated Smart Contract Component
 *
 * Features:
 * - Generates contracts using Gemini API
 * - Displays "Payment Secured by Dotfluence Escrow" messaging
 * - Allows influencers to review and digitally sign
 * - Downloads contract as PDF
 */
export const ContractGenerator = ({
  campaignId,
  influencerId,
  campaignName,
  finalPayout,
  deliverables,
  timeline,
}: ContractGeneratorProps) => {
  const { theme } = useInfluencerTheme();
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);

  // Fetch existing contract if available
  const { data: existingContract } = useContract(campaignId, influencerId) as {
    data: { contract_text: string; status: string } | null;
  };

  // Load existing contract on mount
  useEffect(() => {
    if (existingContract) {
      setContract(existingContract.contract_text);
      setSigned(existingContract.status === "signed");
    }
  }, [existingContract]);

  const generateContract = async () => {
    setLoading(true);
    try {
      // Fetch influencer profile data
      const { data: profile, error: profileError } = (await supabase
        .from("influencer_profiles")
        .select("*")
        .eq("id", influencerId)
        .single()) as { data: any; error: any };

      if (profileError || !profile) {
        console.error("Profile error:", profileError);
        throw new Error("Influencer profile not found");
      }

      // Get user email from auth
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("User error:", userError);
        throw new Error("User not found");
      }

      const influencerEmail = user.email;
      const influencerName = profile.full_name || user.email;
      const instagramHandle = profile.instagram_handle;

      console.log("Generating contract for:", {
        name: influencerName,
        email: influencerEmail,
        handle: instagramHandle,
      });

      // Get Gemini API key from environment
      const GEMINI_API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY;

      if (!GEMINI_API_KEY) {
        throw new Error(
          "Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.\n\n" +
            "Get your API key from: https://ai.google.dev/gemini-api/docs/api-key",
        );
      }

      // Call Gemini API to generate contract
      // Call Gemini using official SDK
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Generate a professional influencer marketing contract with the following details:

Campaign Name: ${campaignName}
Influencer Name: ${influencerName}
Influencer Email: ${influencerEmail}
Instagram Handle: @${instagramHandle}
Payment Amount: ₹${finalPayout}
Deliverables: ${deliverables}
Timeline: ${timeline}

Include:
1. Clear payment terms stating "Payment is secured by Dotfluence Escrow"
2. Deliverable requirements
3. Timeline and deadlines
4. Content usage rights
5. Termination clauses

Make it professional but concise (max 500 words).
Format in clear sections with proper headings.`,
              },
            ],
          },
        ],
      });

      const contractText = response.text;

      if (!contractText) {
        throw new Error("Failed to generate contract text");
      }

      setContract(contractText);

      // Save contract to database
      const { error: insertError } = await supabase.from("contracts").insert({
        campaign_id: campaignId,
        influencer_id: influencerId,
        contract_text: contractText,
        status: "pending_signature",
        created_at: new Date().toISOString(),
      } as any);

      if (insertError) {
        console.error("Database insert error:", insertError);
        throw new Error("Failed to save contract to database");
      }

      toast.success("Contract generated successfully!");
    } catch (error) {
      console.error("Error generating contract:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate contract. Please try again.";
      toast.error(errorMessage, {
        duration: 5000,
        description:
          error instanceof Error && error.message.includes("API key")
            ? "Contact your administrator to configure the API key."
            : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const signContract = async () => {
    try {
      // Update contract status
      const { error: contractError } = await supabase
        .from("contracts")
        //@ts-ignore
        .update({
          status: "signed",
          signed_at: new Date().toISOString(),
        } as any)
        .eq("campaign_id", campaignId)
        .eq("influencer_id", influencerId);

      if (contractError) {
        throw contractError;
      }

      // Update campaign status
      const { error: campaignError } = await supabase
        .from("campaign_influencers")
        //@ts-ignore
        .update({ contract_signed: true })
        .eq("campaign_id", campaignId)
        .eq("influencer_id", influencerId);

      if (campaignError) {
        throw campaignError;
      }

      setSigned(true);
      toast.success("Contract signed successfully! 🎉");
    } catch (error) {
      console.error("Error signing contract:", error);
      toast.error("Failed to sign contract. Please try again.");
    }
  };

  const downloadContract = () => {
    if (!contract) return;

    const blob = new Blob([contract], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contract_${campaignName.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Contract downloaded!");
  };

  // Check if API key is configured
  const apiKeyConfigured = !!import.meta.env.VITE_GEMINI_API_KEY;

  return (
    <Card className={`${theme.card} ${theme.radius}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <FileText className={`h-6 w-6 ${theme.accent}`} />
          <div>
            <CardTitle>Smart Contract</CardTitle>
            <CardDescription>
              AI-generated, legally binding agreement
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* API Key Warning */}
        {!apiKeyConfigured && !contract && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
          >
            <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-yellow-400 font-medium mb-1">
                AI Contract Generation Not Configured
              </p>
              <p className="text-xs text-yellow-400/80">
                Contact your administrator to set up the Gemini API key.
              </p>
            </div>
          </motion.div>
        )}

        {/* Escrow Security Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30"
        >
          <Shield className="h-5 w-5 text-green-400" />
          <p className="text-sm text-green-400 font-medium">
            Payment Secured by Dotfluence Escrow
          </p>
        </motion.div>

        {/* Contract Display */}
        {contract ? (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-lg bg-white/5 border border-white/10 max-h-96 overflow-y-auto ${theme.text}`}
            >
              <pre className="text-xs whitespace-pre-wrap font-mono">
                {contract}
              </pre>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={downloadContract}
                variant="outline"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>

              {!signed ? (
                <Button
                  onClick={signContract}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Sign Contract
                </Button>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500/20 text-green-400">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">Contract Signed</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Button
            onClick={generateContract}
            disabled={loading || !apiKeyConfigured}
            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Contract...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                {apiKeyConfigured
                  ? "Generate Contract"
                  : "Configuration Required"}
              </>
            )}
          </Button>
        )}

        {/* Info Text */}
        <p className="text-xs text-white/50 text-center">
          This contract is AI-generated and legally binding once signed
        </p>
      </CardContent>
    </Card>
  );
};
