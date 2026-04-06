/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Globe, Users, MapPin, Briefcase } from "lucide-react";

import { useWorkspace } from "@/contexts/WorkspaceContext";

const BrandProfileSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeBrandId, brands, fetchWorkspaces } = useWorkspace();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

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
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    const fetchExistingProfile = async () => {
      if (!user) return;

      if (activeBrandId) {
        setIsEditMode(true);
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
          setLogoUrl(brand.logo_url || "");
        }
      } else {
        setIsEditMode(false);
        // Reset form for new brand
        setCompanyName("");
        setWorkEmail("");
        setPhoneNumber("");
        setCompanyWebsite("");
        setIndustry("");
        setCompanySize("");
        setDescription("");
        setCity("");
        setState("");
        setContactPersonName("");
        setDesignation("");
        setLogoUrl("");
      }
    };

    fetchExistingProfile();
  }, [user, activeBrandId, brands]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!user) {
      toast.error("Not authenticated");
      setIsLoading(false);
      return;
    }

    try {
      // Get agency ID if it exists
      const { data: agency } = await supabase
        .from("agency_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const profileData = {
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
        logo_url: logoUrl,
        profile_completed: true,
        agency_id: agency?.id || null, // Link to agency if applicable
        updated_at: new Date().toISOString(),
      };

      if (isEditMode && activeBrandId) {
        const { error } = await supabase
          .from("brand_profiles")
          .update(profileData)
          .eq("id", activeBrandId);

        if (error) throw error;
        toast.success("Profile updated! 🎉");
      } else {
        const { error } = await supabase
          .from("brand_profiles")
          .insert([{ ...profileData, user_id: user.id }]);

        if (error) throw error;
        toast.success("New brand workspace created! 🎉");
      }

      await fetchWorkspaces(); // Refresh workspace list
      navigate("/company/dashboard");
    } catch (error: any) {
      console.error("Profile setup error:", error);
      toast.error(error.message || "Failed to save profile");
    } finally {
      setIsLoading(false);
    }
  };

  const industries = [
    "Technology",
    "Fashion & Apparel",
    "Food & Beverage",
    "Health & Wellness",
    "Beauty & Cosmetics",
    "Travel & Tourism",
    "Finance & Banking",
    "E-commerce",
    "Entertainment",
    "Education",
    "Real Estate",
    "Automotive",
    "Sports & Fitness",
    "Home & Lifestyle",
    "Other",
  ];

  const companySizes = [
    "1-10 employees",
    "11-50 employees",
    "51-200 employees",
    "201-500 employees",
    "500+ employees",
  ];

  const indianStates = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
  ];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <Building2 className="h-12 w-12 mx-auto text-primary mb-4" />
            <h1 className="text-3xl font-bold">
              {isEditMode ? "Edit Brand Profile" : "Onboard New Client Brand"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {isEditMode 
                ? "Update your company information" 
                : "Create a new workspace for your client"}
            </p>
          </div>

          {/* Form */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Basic Identification</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <Input
                        id="companyName"
                        placeholder="Acme Corp"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="workEmail">Work Email *</Label>
                      <Input
                        id="workEmail"
                        type="email"
                        placeholder="contact@acme.com"
                        value={workEmail}
                        onChange={(e) => setWorkEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="logoUrl">Brand Logo URL</Label>
                      <Input
                        id="logoUrl"
                        placeholder="https://..."
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Contact Details</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label htmlFor="contactPersonName">Contact Person Name *</Label>
                       <Input
                         id="contactPersonName"
                         type="text"
                         placeholder="John Doe"
                         value={contactPersonName}
                         onChange={(e) => setContactPersonName(e.target.value)}
                         required
                       />
                     </div>

                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber">Phone Number *</Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="designation">Contact Person Designation</Label>
                      <Input
                        id="designation"
                        type="text"
                        placeholder="Marketing Manager"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Company Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Company Details</h3>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyWebsite">
                      <Globe className="inline h-4 w-4 mr-1" />
                      Company Website
                    </Label>
                    <Input
                      id="companyWebsite"
                      type="url"
                      placeholder="https://www.company.com"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry *</Label>
                      <Select value={industry} onValueChange={setIndustry} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industries.map((ind) => (
                            <SelectItem key={ind} value={ind}>
                              {ind}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companySize">
                        <Users className="inline h-4 w-4 mr-1" />
                        Company Size
                      </Label>
                      <Select
                        value={companySize}
                        onValueChange={setCompanySize}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {companySizes.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Company Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Tell us about your company, products, and target audience..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Location</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        type="text"
                        placeholder="Mumbai"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Select value={state} onValueChange={setState}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {indianStates.map((st) => (
                            <SelectItem key={st} value={st}>
                              {st}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span> Saving...
                    </span>
                  ) : (
                    "Complete Profile"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default BrandProfileSetup;