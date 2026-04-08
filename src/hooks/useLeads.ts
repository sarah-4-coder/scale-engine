/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface MediaKitLead {
  id: string;
  influencer_id: string;
  brand_name: string;
  contact_email: string;
  campaign_type: string;
  budget_range: string;
  brief: string | null;
  status: "pending" | "responded" | "closed";
  created_at: string;
}

export const useLeads = (influencerId: string | null) => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<MediaKitLead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    if (!influencerId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const { data, error } = await supabase
      .from("media_kit_leads" as any)
      .select("*")
      .eq("influencer_id", influencerId)
      .order("created_at", { ascending: false });
      
    if (!error && data) {
      setLeads((data as unknown) as MediaKitLead[]);
    } else if (error) {
      console.error("Error fetching leads:", error);
    }
    setLoading(false);
  }, [influencerId]);

  useEffect(() => {
    if (influencerId) {
      fetchLeads();
    } else {
      setLoading(false);
    }
  }, [influencerId, fetchLeads]);

  const updateStatus = async (leadId: string, status: "responded" | "closed") => {
    const { error } = await supabase
      .from("media_kit_leads" as any)
      .update({ status })
      .eq("id", leadId);
    if (error) {
      toast.error("Failed to update lead status");
    } else {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l));
    }
  };

  const pendingCount = leads.filter(l => l.status === "pending").length;

  return { leads, loading, pendingCount, updateStatus, refetch: fetchLeads };
};

/** Hook that returns just the unread leads count — for nav badges */
export const useLeadsBadge = (influencerId: string | null) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!influencerId) return;
    supabase
      .from("media_kit_leads" as any)
      .select("id", { count: "exact", head: true })
      .eq("influencer_id", influencerId)
      .eq("status", "pending")
      .then(({ count: c }) => setCount(c || 0));
  }, [influencerId]);

  return count;
};
