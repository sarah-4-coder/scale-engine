import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MagicLinkEntry = () => {
  const { hash } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    handleMagicLink();
  }, [hash]);

  const handleMagicLink = async () => {
    try {
      // 1. Fetch the stub details by hash
      const { data: stub, error } = await supabase
        .from("invitation_stubs")
        .select(`
          *,
          campaign:campaigns(*)
        `)
        .eq("unique_hash", hash)
        .single();

      if (error || !stub) {
        toast.error("Invalid or expired magic link");
        navigate("/");
        return;
      }

      if (stub.status !== 'pending') {
        toast.info("This invitation has already been claimed.");
        navigate("/");
        return;
      }

      // 2. Store context for redirect after OTP
      sessionStorage.setItem("invited_via", "magic_link");
      sessionStorage.setItem("invitation_hash", hash || "");
      sessionStorage.setItem("campaign_context_slug", stub.campaign?.slug || "");
      sessionStorage.setItem("invited_phone", stub.phone_number);

      // 3. Redirect to the Campaign Apply page 
      toast.success(`You've been invited to ${stub.campaign?.name || 'a new campaign'}!`);
      navigate(`/apply/${stub.campaign_id}`);

    } catch (error) {
      console.error("Magic link processing error:", error);
      toast.error("Process failed. Please try again.");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-background">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary shadow-lg"></div>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Accessing your invitation...</h2>
        <p className="text-muted-foreground">Preparing your campaign dashboard.</p>
      </div>
    </div>
  );
};

export default MagicLinkEntry;
