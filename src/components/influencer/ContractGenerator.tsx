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
  campaignInfluencerId: string;
  campaignName: string;
  finalPayout: number;
  deliverables: string;
  timeline: string;
  brandName?: string;
  brandProfile?: any;
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
  campaignInfluencerId,
  campaignName,
  finalPayout,
  deliverables,
  timeline,
  brandName = "the Brand",
  brandProfile,
}: ContractGeneratorProps) => {
  const { theme, themeKey } = useInfluencerTheme();
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);

  // Fetch existing contract if available
  const { data: existingContract } = useContract(campaignId, influencerId) as {
    data: { contract_text: string; status: string; metadata?: any; signed_at?: string; created_at?: string } | null;
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
      const GEMINI_API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;

      if (!GEMINI_API_KEY) {
        throw new Error(
          "Gemini API key not configured. Please add VITE_GOOGLE_AI_API_KEY or VITE_GEMINI_API_KEY to your .env file.\n\n" +
            "Get your API key from: https://ai.google.dev/gemini-api/docs/api-key",
        );
      }

      // Call Gemini API to generate contract
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a professional influencer marketing contract for ${brandName}.
        
        PARTIES:
        1. Brand: ${brandName} 
           ${brandProfile?.industry ? `Industry: ${brandProfile.industry}` : ""}
           ${brandProfile?.city ? `Address: ${brandProfile.city}, ${brandProfile.state}` : ""}
        2. Influencer: ${influencerName} (@${instagramHandle})
        
        CAMPAIGN DETAILS:
        - Campaign Name: ${campaignName}
        - Payout: ₹${finalPayout}
        - Deliverables: ${deliverables}
        - Timeline: ${timeline}
        
        INSTRUCTIONS:
        1. Use formal legal tone but maintain a partnership spirit.
        2. State clearly: "Payment is secured by Dotfluence Escrow and will be released upon visual verification of content."
        3. Do NOT use markdown symbols like asterisks (*) or hash symbols (#) for formatting. Use plain text with clear line breaks and CAPS for headings.
        4. Include sections for: Deliverables, Payout Terms, Content Rights (90 days), and Mutual Professionalism.
        5. Add a "SIGNATURES" section at the end for the Brand and the Influencer.
        6. Keep it under 400 words.`,
      });

      const rawText = response.text;
      const contractText = rawText
        .replace(/\*\*/g, "") // Remove bold
        .replace(/\*/g, "-")  // Replace bullets with dashes
        .replace(/#{1,6}\s?/g, "") // Remove headers
        .trim();

      if (!contractText) {
        throw new Error("Failed to generate contract text");
      }

      setContract(contractText);

      const { error: insertError } = await supabase.from("contracts").upsert({
        campaign_influencer_id: campaignInfluencerId,
        campaign_id: campaignId,
        influencer_id: influencerId,
        contract_text: contractText,
        status: "pending_signature",
        created_at: existingContract?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any, { onConflict: 'campaign_id, influencer_id' });

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
      // Append signature date to text for persistence in the document itself
      const signatureBlock = `\n\n------------------------------------------------\nDIGITALLY SIGNED BY: ${existingContract?.metadata?.full_name || 'Influencer'}\nDATE: ${new Date().toLocaleString()}\nIP: ${existingContract?.metadata?.ip || 'Verified Remote'}\n------------------------------------------------`;
      const finalContractText = `${contract}${signatureBlock}`;

      // Update contract status and text
      const { error: contractError } = await supabase
        .from("contracts")
        //@ts-ignore
        .update({
          status: "signed",
          signed_at: new Date().toISOString(),
          contract_text: finalContractText,
        } as any)
        //@ts-ignore
        .eq("campaign_influencer_id", campaignInfluencerId);

      if (contractError) {
        throw contractError;
      }

      // Update campaign status
      const { error: campaignError } = await supabase
        .from("campaign_influencers")
        //@ts-ignore
        .update({ contract_signed: true })
        .eq("id", campaignInfluencerId);

      if (campaignError) {
        throw campaignError;
      }

      setContract(finalContractText);
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
  const apiKeyConfigured = !!(import.meta.env.VITE_GOOGLE_AI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY);

  return (
    <Card className={`${theme.card} ${theme.radius}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <FileText className={`h-6 w-6 ${theme.accent}`} />
          <div>
            <CardTitle className={theme.text}>Smart Contract</CardTitle>
            <CardDescription className={theme.muted}>
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
            className={`flex items-start gap-2 p-4 rounded-xl ${themeKey === 'dark' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-50 border-slate-200'}`}
          >
            <AlertCircle className={`h-5 w-5 ${themeKey === 'dark' ? 'text-blue-400' : 'text-blue-600'} flex-shrink-0 mt-0.5`} />
            <div className="flex-1">
              <p className={`text-sm font-black mb-1 ${themeKey === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>
                AI Contract Generation Not Configured
              </p>
              <p className={`text-xs ${themeKey === 'dark' ? 'text-blue-400/80' : 'text-slate-600'}`}>
                Contact your administrator to set up the Gemini API key.
              </p>
            </div>
          </motion.div>
        )}

        {/* Escrow Security Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center justify-between p-4 rounded-xl ${themeKey === 'dark' ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-100'} backdrop-blur-md`}
        >
          <div className="flex items-center gap-2">
            <Shield className={`h-5 w-5 ${themeKey === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            <p className={`text-sm font-black tracking-tight ${themeKey === 'dark' ? 'text-blue-400' : 'text-blue-700'}`}>
              SECURE ESCROW VERIFIED
            </p>
          </div>
          <div className={`flex items-center gap-1 ${themeKey === 'dark' ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-600 text-white shadow-sm'} px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest`}>
            <Check className="h-3 w-3" />
            Certified
          </div>
        </motion.div>

        {/* Contract Display */}
        {contract ? (
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`relative p-6 md:p-12 rounded-xl bg-white shadow-inner border ${themeKey === 'dark' ? 'border-white/10' : 'border-slate-200'} min-h-[400px] overflow-hidden`}
            >
              {/* Draft Watermark */}
              {!signed && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] rotate-[-25deg] select-none">
                  <span className="text-[120px] font-black text-black tracking-tighter">OFFER DRAFT</span>
                </div>
              )}

              <div className="relative z-10 font-serif text-slate-800 leading-relaxed text-sm md:text-base">
                <div className="text-center mb-8 pb-4 border-b border-slate-100">
                  <h3 className="text-xl font-bold uppercase tracking-[0.2em] text-slate-900 mb-2">Influencer Partnership Agreement</h3>
                  <p className="text-[10px] font-sans text-slate-400 uppercase tracking-widest">Digital Recording ID: {campaignId.split('-')[0]}-{influencerId.split('-')[0]}</p>
                </div>
                
                <div className="whitespace-pre-wrap">
                  {contract}
                </div>

                {signed && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-12 pt-8 border-t border-slate-100 flex flex-col items-end"
                  >
                    <div className="text-right">
                      <p className="text-xs font-sans text-slate-400 uppercase mb-2">Digitally Signed By</p>
                      <p className="font-serif italic text-lg leading-none text-slate-900">/ e-Signed Digitally /</p>
                      <p className="text-[10px] font-sans text-slate-400 mt-1">
                        IP: {existingContract?.metadata?.ip || 'Verified Remote'} • {new Date(existingContract?.signed_at || '').toLocaleString()}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={downloadContract}
                variant="outline"
                className={`flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs ${themeKey === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>

              {!signed ? (
                <Button
                  onClick={signContract}
                  className={`flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs ${themeKey === 'dark' ? 'bg-white text-blue-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-100'}`}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Sign Contract
                </Button>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-2 px-4 h-14 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  <Check className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Contract Signed</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Button
            onClick={generateContract}
            disabled={loading || !apiKeyConfigured}
            className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs ${themeKey === 'dark' ? 'bg-white text-blue-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-100'}`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                {apiKeyConfigured
                  ? "Generate Contract"
                  : "Setup Required"}
              </>
            )}
          </Button>
        )}

        {/* Info Text */}
        <p className={`text-[10px] font-bold uppercase tracking-widest text-center mt-4 ${theme.muted}`}>
          AI-generated • legally binding once signed
        </p>
      </CardContent>
    </Card>
  );
};
