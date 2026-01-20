import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const CreateCampaign = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nichesInput, setNichesInput] = useState("");
  const [deliverables, setDeliverables] = useState("");
  const [timeline, setTimeline] = useState("");
  const [basePayout, setBasePayout] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const niches = nichesInput
      .split(",")
      .map((n) => n.trim().toLowerCase())
      .filter(Boolean);

    if (niches.length === 0) {
      toast.error("Enter at least one niche");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("campaigns").insert({
      name,
      description,
      niches,
      deliverables,
      timeline,
      base_payout: Number(basePayout),
    });

    if (error) {
      console.error(error);
      toast.error("Failed to create campaign");
      setLoading(false);
      return;
    }

    toast.success("Campaign created");
    navigate("/admin", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl p-6 space-y-6">
        <h1 className="text-2xl font-bold">Create Campaign</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Campaign Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <Label>Niches (comma separated)</Label>
            <Input
              placeholder="fashion, beauty, lifestyle"
              value={nichesInput}
              onChange={(e) => setNichesInput(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Deliverables</Label>
            <Textarea value={deliverables} onChange={(e) => setDeliverables(e.target.value)} required />
          </div>

          <div>
            <Label>Timeline</Label>
            <Input value={timeline} onChange={(e) => setTimeline(e.target.value)} required />
          </div>

          <div>
            <Label>Base Payout (₹)</Label>
            <Input type="number" value={basePayout} onChange={(e) => setBasePayout(e.target.value)} required />
          </div>

          <Button className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Campaign"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaign;
