import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Globe, Users, MapPin, Briefcase, Mail, Phone, User as UserIcon, Save } from "lucide-react";
import BrandNavbar from "@/components/BrandNavbar";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const BrandProfile = () => {
  const { user } = useAuth();
  const { activeBrandId, brands, fetchWorkspaces } = useWorkspace();
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [designation, setDesignation] = useState("");

  useEffect(() => {
    const brand = brands.find(b => b.id === activeBrandId);
    if (brand) {
      setCompanyName(brand.company_name || "");
      setWorkEmail(brand.work_email || "");
      setPhoneNumber(brand.phone_number || "");
      setCompanyWebsite(brand.company_website || "");
      setIndustry(brand.industry || "");
      setCompanySize(brand.company_size || "");
      setDescription(brand.description || "");
      setCity(brand.city || "");
      setState(brand.state || "");
      setContactPersonName(brand.contact_person_name || "");
      setDesignation(brand.contact_person_designation || "");
    }
    setFetching(false);
  }, [activeBrandId, brands]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBrandId) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("brand_profiles")
        .update({
          company_name: companyName,
          work_email: workEmail,
          phone_number: phoneNumber,
          company_website: companyWebsite,
          industry: industry,
          company_size: companySize,
          description: description,
          city: city,
          state: state,
          contact_person_name: contactPersonName,
          contact_person_designation: designation,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeBrandId);

      if (error) throw error;
      toast.success("Profile updated successfully!");
      await fetchWorkspaces();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const industries = [
    "Technology", "Fashion & Apparel", "Food & Beverage", "Health & Wellness",
    "Beauty & Cosmetics", "Travel & Tourism", "Finance & Banking", "E-commerce",
    "Entertainment", "Education", "Real Estate", "Automotive", "Sports & Fitness",
    "Home & Lifestyle", "Other"
  ];

  const companySizes = [
    "1-10 employees", "11-50 employees", "51-200 employees", "201-500 employees", "500+ employees"
  ];

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
    "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
    "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
    "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
  ];

  if (fetching) {
    return (
      <div className="min-h-screen bg-background">
        <BrandNavbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BrandNavbar />
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Workplace Settings</h1>
            <p className="text-muted-foreground">Manage your brand profile and company information.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Navigation/Info */}
              <div className="space-y-6">
                <Card className="glass overflow-hidden">
                  <div className="h-24 bg-gradient-to-r from-blue-600 to-purple-600" />
                  <CardContent className="pt-0 -mt-8 flex flex-col items-center text-center">
                    <div className="h-16 w-16 rounded-2xl bg-background border-4 border-background shadow-xl flex items-center justify-center mb-4">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="font-bold text-lg">{companyName || "Your Brand"}</h2>
                    <p className="text-sm text-muted-foreground">{industry || "General Industry"}</p>
                    
                    <div className="w-full pt-4 mt-4 border-t border-white/5 space-y-2">
                         <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" /> {workEmail}
                         </div>
                         <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" /> {city}, {state}
                         </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Form Sections */}
              <div className="md:col-span-2 space-y-6">
                {/* Basic Info Section */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="text-lg">Company Basics</CardTitle>
                    <CardDescription>Essential identification details.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Company Name</Label>
                        <Input value={companyName} onChange={e => setCompanyName(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Work Email</Label>
                        <Input type="email" value={workEmail} onChange={e => setWorkEmail(e.target.value)} required />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" placeholder="https://..." value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Industry</Label>
                        <Select value={industry} onValueChange={setIndustry}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Company Size</Label>
                        <Select value={companySize} onValueChange={setCompanySize}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {companySizes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Section */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Person</CardTitle>
                    <CardDescription>Primary point of contact for this brand.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" value={contactPersonName} onChange={e => setContactPersonName(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Designation</Label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input className="pl-9" value={designation} onChange={e => setDesignation(e.target.value)} />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input className="pl-9" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* DescriptionSection */}
                <Card className="glass">
                  <CardHeader>
                    <CardTitle className="text-lg">Description & Location</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tell us about your brand</Label>
                      <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input value={city} onChange={e => setCity(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Select value={state} onValueChange={setState}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-4">
                  <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90 min-w-[150px]">
                    {isLoading ? "Saving..." : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default BrandProfile;
