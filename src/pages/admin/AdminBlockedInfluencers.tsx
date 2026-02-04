/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AdminNavbar from "@/components/adminNavbar";
import { useAuth } from "@/hooks/useAuth";
import { ShieldCheck, ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* -----------------------
   TYPES
----------------------- */
interface BlockedInfluencer {
  id: string;
  user_id: string;
  full_name: string;
  instagram_profile_url: string;
  phone_number: string;
  email: string;
  blocked_reason: string | null;
  blocked_at: string | null;
}

const AdminBlockedInfluencers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blockedInfluencers, setBlockedInfluencers] = useState<BlockedInfluencer[]>([]);
  const [loading, setLoading] = useState(true);

  /* -----------------------
     FETCH BLOCKED INFLUENCERS
  ----------------------- */
  const fetchBlockedInfluencers = async () => {
    setLoading(true);

    try {
      const { data: profiles } = await supabase
        .from("influencer_profiles")
        .select(
          "id, user_id, full_name, instagram_profile_url, phone_number, blocked_reason, blocked_at"
        )
        .eq("is_blocked", true)
        .order("blocked_at", { ascending: false });

      const typedProfiles = profiles as BlockedInfluencer[] | null;

      const userIds = typedProfiles?.map((p) => p.user_id) || [];
        //@ts-ignore
      const { data: emails } = await supabase.rpc("get_user_emails", {
        user_ids: userIds,
      });
      //@ts-ignore
      const emailMap = new Map(emails?.map((e) => [e.id, e.email]));

      const merged =
        profiles?.map((p) => ({
            //@ts-ignore
          ...p,
          //@ts-ignore
          email: emailMap.get(p.user_id) || "—",
        })) || [];

      setBlockedInfluencers(merged);
    } catch (error) {
      console.error("Error fetching blocked influencers:", error);
      toast.error("Failed to load blocked influencers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedInfluencers();
  }, []);

  /* -----------------------
     UNBLOCK FUNCTION
  ----------------------- */
  const handleUnblock = async (influencer: BlockedInfluencer) => {
    try {
      const { error } = await supabase
        .from("influencer_profiles")
        //@ts-ignore
        .update({
          is_blocked: false,
          blocked_reason: null,
          blocked_at: null,
          blocked_by_user_id: null,
        })
        .eq("id", influencer.id);

      if (error) throw error;

      // Send notification to influencer
      //@ts-ignore
      await supabase.from("notifications").insert({
        user_id: influencer.user_id,
        role: "influencer",
        type: "account_unblocked",
        title: "Account Unblocked",
        message: "Your account has been unblocked. You can now access the platform.",
        is_read: false,
      });

      toast.success("Influencer unblocked successfully");
      fetchBlockedInfluencers(); // Refresh data
    } catch (error) {
      console.error("Error unblocking influencer:", error);
      toast.error("Failed to unblock influencer");
    }
  };

  /* -----------------------
     EXPORT CSV
  ----------------------- */
  const exportCSV = () => {
    if (!blockedInfluencers.length) {
      toast.error("No blocked influencers to export");
      return;
    }

    const csv = [
      [
        "Name",
        "Instagram",
        "Phone",
        "Email",
        "Blocked Reason",
        "Blocked Date",
      ],
      ...blockedInfluencers.map((r) => [
        r.full_name,
        r.instagram_profile_url,
        r.phone_number,
        r.email,
        r.blocked_reason ?? "",
        r.blocked_at ? new Date(r.blocked_at).toLocaleDateString() : "",
      ]),
    ]
      .map((r) => r.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blocked-influencers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <AdminNavbar />
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/influencers")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Blocked Influencers</h1>
              <p className="text-muted-foreground">
                {blockedInfluencers.length} influencer{blockedInfluencers.length !== 1 ? 's' : ''} currently blocked
              </p>
            </div>
          </div>
          <Button onClick={exportCSV} disabled={blockedInfluencers.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>
              Influencers who have been blocked from accessing the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{blockedInfluencers.length}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Total blocked accounts
            </p>
          </CardContent>
        </Card>

        {/* Table */}
        {blockedInfluencers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ShieldCheck className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Blocked Influencers</h3>
              <p className="text-muted-foreground text-center max-w-md">
                There are currently no blocked influencers. When you block an influencer,
                they will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Instagram</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Blocked Reason</TableHead>
                    <TableHead>Blocked Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {blockedInfluencers.map((influencer) => (
                    <TableRow key={influencer.id}>
                      <TableCell className="font-medium">
                        {influencer.full_name}
                      </TableCell>
                      <TableCell>
                        <a
                          href={influencer.instagram_profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline hover:text-primary/80"
                        >
                          View Profile
                        </a>
                      </TableCell>
                      <TableCell>{influencer.phone_number}</TableCell>
                      <TableCell>{influencer.email}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {influencer.blocked_reason || "No reason provided"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(influencer.blocked_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnblock(influencer)}
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Unblock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default AdminBlockedInfluencers;