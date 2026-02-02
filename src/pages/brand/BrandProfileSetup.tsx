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

const BrandProfileSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);

  // Form state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [designation, setDesignation] = useState("");

  useEffect(() => {
    const fetchExistingProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("brand_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setExistingProfile(data);
        // Pre-fill existing data
        setPhoneNumber(data.phone_number || "");
        setCompanyWebsite(data.company_website || "");
        setIndustry(data.industry || "");
        setCompanySize(data.company_size || "");
        setDescription(data.description || "");
        setCity(data.city || "");
        setState(data.state || "");
        setDesignation(data.contact_person_designation || "");
      }
    };

    fetchExistingProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!user) {
      toast.error("Not authenticated");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("brand_profiles")
        .update({
          phone_number: phoneNumber,
          company_website: companyWebsite,
          industry: industry,
          company_size: companySize,
          description: description,
          city: city,
          state: state,
          contact_person_designation: designation,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Profile completed! 🎉");
      navigate("/brand/dashboard");
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.message || "Failed to update profile");
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
            <h1 className="text-3xl font-bold">Complete Your Brand Profile</h1>
            <p className="text-muted-foreground mt-2">
              Help us understand your company better
            </p>
            {existingProfile && !existingProfile.is_verified && (
              <div className="mt-4 inline-block px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⏳ Your account is pending verification by our admin team
                </p>
              </div>
            )}
          </div>

          {/* Form */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Contact Details</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="space-y-2">
                      <Label htmlFor="designation">Your Designation</Label>
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