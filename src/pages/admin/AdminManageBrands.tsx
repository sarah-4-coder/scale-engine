/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  Clock,
  Shield,
} from "lucide-react";
import AdminNavbar from "@/components/adminNavbar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BrandProfile {
  id: string;
  user_id: string;
  company_name: string;
  work_email: string;
  phone_number: string;
  company_website: string | null;
  industry: string | null;
  company_size: string | null;
  description: string | null;
  is_verified: boolean;
  profile_completed: boolean;
  city: string | null;
  state: string | null;
  contact_person_name: string;
  contact_person_designation: string | null;
  created_at: string;
}

const AdminManageBrands = () => {
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<BrandProfile | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("brand_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBrands(data || []);
    } catch (error: any) {
      console.error("Error fetching brands:", error);
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBrand = async (brandId: string, verified: boolean) => {
    try {
      const { error } = await supabase
        .from("brand_profiles")
        .update({ is_verified: verified })
        .eq("id", brandId);

      if (error) throw error;

      toast.success(
        verified ? "Brand verified successfully!" : "Brand rejected"
      );
      fetchBrands();
      setShowDialog(false);
    } catch (error: any) {
      console.error("Error updating brand:", error);
      toast.error("Failed to update brand status");
    }
  };

  const pendingBrands = brands.filter((b) => !b.is_verified);
  const verifiedBrands = brands.filter((b) => b.is_verified);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminNavbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminNavbar />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              Manage Brands & Agencies
            </h1>
            <p className="text-muted-foreground mt-2">
              Review and verify brand accounts
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card/50 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Brands
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{brands.length}</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border-yellow-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-yellow-500 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-yellow-500">
                  {pendingBrands.length}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border-green-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-500 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Verified Brands
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-500">
                  {verifiedBrands.length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="pending" className="relative">
                Pending Review
                {pendingBrands.length > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                  >
                    {pendingBrands.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              {pendingBrands.length === 0 ? (
                <Card className="glass">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      All caught up!
                    </h3>
                    <p className="text-muted-foreground text-center">
                      No brands pending verification
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingBrands.map((brand, index) => (
                    <BrandCard
                      key={brand.id}
                      brand={brand}
                      index={index}
                      onViewDetails={() => {
                        setSelectedBrand(brand);
                        setShowDialog(true);
                      }}
                      onVerify={() => handleVerifyBrand(brand.id, true)}
                      onReject={() => handleVerifyBrand(brand.id, false)}
                      isPending={true}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="verified" className="mt-6">
              {verifiedBrands.length === 0 ? (
                <Card className="glass">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Shield className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      No verified brands yet
                    </h3>
                    <p className="text-muted-foreground text-center">
                      Verified brands will appear here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {verifiedBrands.map((brand, index) => (
                    <BrandCard
                      key={brand.id}
                      brand={brand}
                      index={index}
                      onViewDetails={() => {
                        setSelectedBrand(brand);
                        setShowDialog(true);
                      }}
                      isPending={false}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Brand Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {selectedBrand?.company_name}
            </DialogTitle>
            <DialogDescription>
              Brand account details and verification status
            </DialogDescription>
          </DialogHeader>

          {selectedBrand && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div>
                <Badge
                  variant={selectedBrand.is_verified ? "default" : "secondary"}
                  className={
                    selectedBrand.is_verified
                      ? "bg-green-500/10 text-green-500 border-green-500/30"
                      : "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                  }
                >
                  {selectedBrand.is_verified ? "✓ Verified" : "⏳ Pending"}
                </Badge>
              </div>

              {/* Company Info */}
              <div className="space-y-3">
                <h4 className="font-semibold">Company Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem
                    icon={Building2}
                    label="Company Name"
                    value={selectedBrand.company_name}
                  />
                  <InfoItem
                    icon={Users}
                    label="Company Size"
                    value={selectedBrand.company_size || "Not specified"}
                  />
                  <InfoItem
                    icon={Mail}
                    label="Industry"
                    value={selectedBrand.industry || "Not specified"}
                  />
                  <InfoItem
                    icon={MapPin}
                    label="Location"
                    value={
                      selectedBrand.city && selectedBrand.state
                        ? `${selectedBrand.city}, ${selectedBrand.state}`
                        : "Not specified"
                    }
                  />
                </div>

                {selectedBrand.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Description
                    </p>
                    <p className="text-sm">{selectedBrand.description}</p>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <h4 className="font-semibold">Contact Information</h4>
                <div className="grid grid-cols-1 gap-4">
                  <InfoItem
                    icon={Users}
                    label="Contact Person"
                    value={`${selectedBrand.contact_person_name}${
                      selectedBrand.contact_person_designation
                        ? ` - ${selectedBrand.contact_person_designation}`
                        : ""
                    }`}
                  />
                  <InfoItem
                    icon={Mail}
                    label="Work Email"
                    value={selectedBrand.work_email}
                  />
                  <InfoItem
                    icon={Phone}
                    label="Phone"
                    value={selectedBrand.phone_number}
                  />
                  {selectedBrand.company_website && (
                    <InfoItem
                      icon={Globe}
                      label="Website"
                      value={selectedBrand.company_website}
                      isLink
                    />
                  )}
                </div>
              </div>

              {/* Actions */}
              {!selectedBrand.is_verified && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleVerifyBrand(selectedBrand.id, true)}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Verify Brand
                  </Button>
                  <Button
                    onClick={() => handleVerifyBrand(selectedBrand.id, false)}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper Components
interface BrandCardProps {
  brand: BrandProfile;
  index: number;
  onViewDetails: () => void;
  onVerify?: () => void;
  onReject?: () => void;
  isPending: boolean;
}

const BrandCard = ({
  brand,
  index,
  onViewDetails,
  onVerify,
  onReject,
  isPending,
}: BrandCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <Card className="glass hover:border-primary/30 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {brand.company_name}
            </CardTitle>
            <CardDescription className="mt-1">
              {brand.industry || "Industry not specified"} •{" "}
              {brand.company_size || "Size not specified"}
            </CardDescription>
          </div>
          <Badge
            variant={isPending ? "secondary" : "default"}
            className={
              isPending
                ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                : "bg-green-500/10 text-green-500 border-green-500/30"
            }
          >
            {isPending ? "Pending" : "Verified"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{brand.work_email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{brand.phone_number}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{brand.contact_person_name}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{new Date(brand.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onViewDetails} variant="outline" className="flex-1">
            View Details
          </Button>
          {isPending && onVerify && onReject && (
            <>
              <Button
                onClick={onVerify}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify
              </Button>
              <Button onClick={onReject} variant="destructive" size="icon">
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

interface InfoItemProps {
  icon: any;
  label: string;
  value: string;
  isLink?: boolean;
}

const InfoItem = ({ icon: Icon, label, value, isLink }: InfoItemProps) => (
  <div>
    <div className="flex items-center gap-2 text-muted-foreground mb-1">
      <Icon className="h-4 w-4" />
      <span className="text-xs">{label}</span>
    </div>
    {isLink ? (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary hover:underline"
      >
        {value}
      </a>
    ) : (
      <p className="text-sm font-medium">{value}</p>
    )}
  </div>
);

export default AdminManageBrands;