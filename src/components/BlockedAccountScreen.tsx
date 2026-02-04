import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Mail, LogOut } from "lucide-react";
import { toast } from "sonner";

const BlockedAccountScreen = () => {
  const { user, signOut } = useAuth();
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlockedStatus = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from("influencer_profiles")
          .select("blocked_reason")
          .eq("user_id", user.id)
          .eq("is_blocked", true)
          .single<{ blocked_reason: string | null }>();

        if (error) {
          console.error("Error fetching blocked status:", error);
          return;
        }

        if (data) {
          setBlockedReason(data.blocked_reason || "No reason provided");
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlockedStatus();
  }, [user?.id]);

  const handleContactAdmin = () => {
    window.location.href = "mailto:marketing@dotfluence.in";
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-red-200 shadow-xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="flex justify-center">
              <div className="p-4 bg-red-100 rounded-full">
                <ShieldAlert className="h-16 w-16 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-red-600">
              Account Blocked
            </CardTitle>
            <CardDescription className="text-base">
              Your account has been temporarily suspended
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Reason Section */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-semibold text-red-900 mb-2">Reason for Blocking:</h3>
              <p className="text-red-700">{blockedReason}</p>
            </div>

            {/* Information Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">What does this mean?</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>You cannot access campaigns or apply to new opportunities</li>
                <li>Your profile is not visible to brands</li>
                <li>Any ongoing campaigns have been paused</li>
                <li>You need to resolve this issue to regain access</li>
              </ul>
            </div>

            {/* Contact Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">
                Need to resolve this issue?
              </h3>
              <p className="text-blue-700 mb-4">
                Please contact our admin team to discuss your account status and
                resolve any issues.
              </p>
              <Button
                onClick={handleContactAdmin}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="mr-2 h-4 w-4" />
               marketing@dotfluence.in
              </Button>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col gap-3">
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>

            {/* Footer Note */}
            <div className="text-center text-sm text-muted-foreground pt-4 border-t">
              <p>
                If you believe this is a mistake, please reach out to our support
                team immediately.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default BlockedAccountScreen;