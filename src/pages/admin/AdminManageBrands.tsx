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
  ExternalLink
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
import { cn } from "@/lib/utils";

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
        .update({ is_verified: verified } as any)
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <AdminNavbar />

      <main className="container mx-auto px-4 py-8">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                  <Building2 className="h-6 w-6 text-primary" />
               </div>
               <h1 className="text-3xl font-extrabold tracking-tight">Partner Brands & Agencies</h1>
            </div>
            <p className="text-muted-foreground">Review and verify businesses joining the DotFluence network</p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { label: "Total Partners", value: brands.length, icon: Users, color: "text-primary" },
              { label: "Pending Verification", value: pendingBrands.length, icon: Clock, color: "text-amber-500" },
              { label: "Verified Network", value: verifiedBrands.length, icon: Shield, color: "text-emerald-500" },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-card/40 backdrop-blur-md border-border/40 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                       <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                       <stat.icon className={cn("h-4 w-4", stat.color)} />
                    </div>
                    <p className={cn("text-3xl font-black", stat.color)}>{stat.value}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Tabs Control */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="bg-card/30 backdrop-blur-md border border-border/40 p-1 rounded-full w-full max-w-md">
              <TabsTrigger value="pending" className="rounded-full px-8 py-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                Pending Review {pendingBrands.length > 0 && `(${pendingBrands.length})`}
              </TabsTrigger>
              <TabsTrigger value="verified" className="rounded-full px-8 py-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                Verified Partners
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingBrands.length === 0 ? (
                <Card className="bg-card/20 border-dashed border-border/50 py-20">
                  <CardContent className="flex flex-col items-center justify-center">
                    <div className="p-4 rounded-full bg-emerald-500/10 mb-4">
                       <CheckCircle className="h-10 w-10 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-1">Queue is Clear</h3>
                    <p className="text-muted-foreground">All brands have been reviewed.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            <TabsContent value="verified" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Brand Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl bg-card/90 backdrop-blur-2xl border-border/40 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {selectedBrand?.company_name}
            </DialogTitle>
            <DialogDescription>Detailed profile and verification status</DialogDescription>
          </DialogHeader>

          {selectedBrand && (
            <div className="space-y-8 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Core Identity</h4>
                    <div className="space-y-3">
                       <InfoItem icon={Building2} label="Industry" value={selectedBrand.industry || "Not specified"} />
                       <InfoItem icon={Users} label="Team Size" value={selectedBrand.company_size || "Not specified"} />
                       <InfoItem icon={MapPin} label="Location" value={`${selectedBrand.city || "-"}, ${selectedBrand.state || "-"}`} />
                    </div>
                  </div>

                  <div>
                     <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Company Bio</h4>
                     <p className="text-sm leading-relaxed text-muted-foreground/90 bg-muted/30 p-4 rounded-xl border border-border/20">
                        {selectedBrand.description || "No description provided."}
                     </p>
                  </div>
                </div>

                <div className="space-y-6">
                   <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Point of Contact</h4>
                      <div className="space-y-3">
                         <InfoItem icon={Users} label="Name" value={selectedBrand.contact_person_name} />
                         <InfoItem icon={Mail} label="Email" value={selectedBrand.work_email} />
                         <InfoItem icon={Phone} label="Contact" value={selectedBrand.phone_number} />
                         {selectedBrand.company_website && (
                           <InfoItem icon={Globe} label="Website" value={selectedBrand.company_website} isLink />
                         )}
                      </div>
                   </div>

                   <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-2 mb-2">
                         <Clock className="h-4 w-4 text-primary" />
                         <span className="text-xs font-bold text-primary italic">Joined Platform</span>
                      </div>
                      <p className="text-lg font-bold">{new Date(selectedBrand.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                   </div>
                </div>
              </div>

              {!selectedBrand.is_verified && (
                <div className="flex gap-4 pt-6 border-t border-border/40">
                  <Button
                    onClick={() => handleVerifyBrand(selectedBrand.id, true)}
                    className="flex-1 rounded-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle className="mr-2 h-5 w-5" /> Verify Account
                  </Button>
                  <Button
                    onClick={() => handleVerifyBrand(selectedBrand.id, false)}
                    variant="ghost"
                    className="flex-1 rounded-full h-12 text-rose-500 hover:bg-rose-500/10 font-bold"
                  >
                    <XCircle className="mr-2 h-5 w-5" /> Deny Access
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

// Sub-components
const BrandCard = ({ brand, index, onViewDetails, onVerify, onReject, isPending }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <Card className="bg-card/40 backdrop-blur-md border-border/40 hover:border-primary/20 transition-all group overflow-hidden shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors flex items-center gap-2">
              {brand.company_name}
            </CardTitle>
            <div className="flex gap-2 text-[10px] uppercase font-bold tracking-tighter text-muted-foreground">
               <span>{brand.industry || "General"}</span>
               <span>•</span>
               <span>{brand.company_size || "SME"}</span>
            </div>
          </div>
          <Badge variant="outline" className={cn("rounded-full border-none px-3 font-bold text-[10px]", 
            isPending ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
          )}>
            {isPending ? "Review Pending" : "Official Partner"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                 <Mail className="h-3.5 w-3.5" /> {brand.work_email}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                 <Users className="h-3.5 w-3.5" /> {brand.contact_person_name}
              </div>
           </div>
           <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                 <MapPin className="h-3.5 w-3.5" /> {brand.city || "N/A"}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground/80">
                 <Clock className="h-3.5 w-3.5" /> {new Date(brand.created_at).toLocaleDateString()}
              </div>
           </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onViewDetails} variant="soft" className="flex-1 bg-primary/5 hover:bg-primary/10 text-primary border-none rounded-xl font-bold">
            Full Profile
          </Button>
          {isPending && onVerify && (
            <Button onClick={onVerify} className="bg-emerald-500 hover:bg-emerald-600 font-bold rounded-xl shadow-lg shadow-emerald-500/10 h-10 w-10 p-0">
               <CheckCircle className="h-5 w-5" />
            </Button>
          )}
          {isPending && onReject && (
            <Button variant="ghost" onClick={onReject} className="text-rose-500 hover:bg-rose-500/10 h-10 w-10 p-0 rounded-xl">
               <XCircle className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const InfoItem = ({ icon: Icon, label, value, isLink }: any) => (
  <div className="flex flex-col gap-1">
    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
       <Icon className="h-3 w-3" /> {label}
    </span>
    {isLink ? (
      <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary hover:underline flex items-center gap-1">
        {value} <ExternalLink className="h-3 w-3" />
      </a>
    ) : (
      <span className="text-sm font-semibold">{value}</span>
    )}
  </div>
);

export default AdminManageBrands;