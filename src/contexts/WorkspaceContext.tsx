import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WorkspaceContextType {
  activeBrandId: string | null;
  setActiveBrandId: (id: string | null) => void;
  brands: any[];
  isLoading: boolean;
  isAgency: boolean;
  fetchWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeBrandId, setActiveBrandId] = useState<string | null>(null);
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAgency, setIsAgency] = useState(false);

  const fetchWorkspaces = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Check if user has agency role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const agencyStatus = roleData && roleData.length > 0 && (roleData[0] as any).role === 'agency';
      setIsAgency(!!agencyStatus);

      // 2. Fetch brands
      let fetchedBrands: any[] = [];
      if (agencyStatus) {
        // If agency, fetch brands they manage
        const { data: agencyProfile } = await supabase
          .from('agency_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (agencyProfile) {
          const { data: agencyBrands } = await supabase
            .from('brand_profiles')
            .select('*')
            .eq('agency_id', (agencyProfile as any).id);
          fetchedBrands = agencyBrands || [];
        }
      } else {
        // If brand, fetch their own brand
        const { data: ownBrand } = await supabase
          .from('brand_profiles')
          .select('*')
          .eq('user_id', user.id);
        fetchedBrands = ownBrand || [];
      }

      setBrands(fetchedBrands);

      // 3. Set default active brand if none selected
      if (fetchedBrands.length > 0 && !activeBrandId) {
        const storedBrandId = localStorage.getItem("active_brand_id");
        const isValidStoredId = fetchedBrands.some(b => b.id === storedBrandId);
        setActiveBrandId(isValidStoredId ? storedBrandId : fetchedBrands[0].id);
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // Persist active brand selection
  useEffect(() => {
    if (activeBrandId) {
      localStorage.setItem("active_brand_id", activeBrandId);
    }
  }, [activeBrandId]);

  return (
    <WorkspaceContext.Provider value={{ activeBrandId, setActiveBrandId, brands, isLoading, isAgency, fetchWorkspaces }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
