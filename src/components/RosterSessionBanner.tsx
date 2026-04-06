import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRosterStore } from "@/store/useRosterStore";
import { supabase } from "@/integrations/supabase/client";
import * as security from "@/utils/rosterSecurity";
import { Button } from "@/components/ui/button";
import { Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const RosterSessionBanner = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setRosterData } = useRosterStore();
  const [session, setSession] = useState<any>(null);
  const [sessionKey, setSessionKey] = useState<CryptoKey | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!user) return;

      // Deriving key
      try {
        const secret = import.meta.env.VITE_ROSTER_SESSION_SECRET || "default_local_secret";
        const key = await security.deriveRosterKey(user.id, secret);
        setSessionKey(key);

        // Fetch session
        const { data: agencyProfile } = await supabase.from('agency_profiles').select('id').eq('user_id', user.id).maybeSingle();
        const { data: brandProfile } = await supabase.from('brand_profiles').select('id').eq('user_id', user.id).maybeSingle();
        
        const pId = agencyProfile?.id || brandProfile?.id;
        const role = agencyProfile ? 'agency' : brandProfile ? 'brand' : null;

        if (pId && role) {
          // @ts-ignore
          const query = supabase
            .from('roster_sessions')
            .select('*')
            .gt('expires_at', new Date().toISOString());
          
          if (role === 'agency') query.eq('agency_id', pId);
          else query.eq('brand_id', pId);

          const { data, error } = await query.maybeSingle();
          if (data && !error) {
            setSession(data);
            setIsVisible(true);
          }
        }
      } catch (err) {
        console.error("Session init failed:", err);
      }
    };

    init();
  }, [user]);

  const handleResume = async () => {
    if (!session || !sessionKey) return;
    try {
      // security.decryptRoster now internally handles Hex conversion/ensuring Uint8Array
      const decrypted = await security.decryptRoster(session.encrypted_blob, sessionKey);
      const data = await security.decompressRoster(decrypted);
      
      setRosterData(data);
      
      // Delete session
      await deleteSession();
      
      setIsVisible(false);
      toast.success("Roster session restored!");
      
      // Redirect to roster
      const role = session.agency_id ? 'agency' : 'company';
      navigate(`/${role}/roster`);
    } catch (error) {
      console.error("Resume failed:", error);
      // Clean up on failure as per Step 5
      await deleteSession();
      setIsVisible(false);
      toast.error("Previous session could not be restored. Please re-upload your roster.");
    }
  };

  const handleDiscard = async () => {
    await deleteSession();
    setIsVisible(false);
  };

  const deleteSession = async () => {
    if (!session) return;
    // @ts-ignore
    const query = supabase.from('roster_sessions').delete();
    if (session.agency_id) query.eq('agency_id', session.agency_id);
    else query.eq('brand_id', session.brand_id);
    await query;
  };

  if (!isVisible || !session) return null;

  return (
    <div className="w-full bg-purple-600/95 text-white py-2 px-4 flex items-center justify-between shadow-lg sticky top-0 z-[100] animate-in slide-in-from-top duration-500">
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 animate-pulse" />
        <div className="text-sm">
          <span className="font-bold">Unsaved Session Found:</span> You have a roster with {session.row_count} influencers from {new Date(session.created_at).toLocaleDateString()}.
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={handleDiscard} className="text-white/80 hover:text-white hover:bg-white/10">
          Discard
        </Button>
        <Button size="sm" onClick={handleResume} className="bg-white text-purple-600 hover:bg-slate-100 font-bold px-6">
          Resume Session
        </Button>
      </div>
    </div>
  );
};
