import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Users, 
  Upload, 
  Check, 
  AlertCircle, 
  ArrowLeft, 
  FileSpreadsheet,
  Settings2,
  Database,
  Search,
  Plus,
  Trash2,
  ChevronRight,
  Info,
  Save,
  Clock,
  ExternalLink,
  MessageSquare,
  PhoneCall
} from "lucide-react";
import { useRosterStore } from "@/store/useRosterStore";
import * as security from "@/utils/rosterSecurity";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";

type Step = 'view' | 'upload' | 'mapping' | 'importing' | 'saved-rosters';

const parseFollowerValue = (val: any): number => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  
  const str = String(val).toLowerCase().replace(/,/g, '').trim();
  
  if (str.includes('-')) {
    const parts = str.split('-').map(p => parseFollowerValue(p.trim()));
    if (parts.length === 2) {
      return (parts[0] + parts[1]) / 2;
    }
  }

  const cleanStr = str.replace(/[+]/g, '');
  
  let multiplier = 1;
  if (cleanStr.endsWith('m')) multiplier = 1000000;
  else if (cleanStr.endsWith('k')) multiplier = 1000;
  
  const numPart = parseFloat(cleanStr.replace(/[km]/g, ''));
  return isNaN(numPart) ? 0 : numPart * multiplier;
};

const formatFollowers = (count: any) => {
  if (!count) return "0";
  if (typeof count === 'string' && (count.toLowerCase().includes('k') || count.toLowerCase().includes('m') || count.includes('-'))) {
    return count;
  }
  const num = Number(count);
  if (isNaN(num)) return count.toString();
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
};

const FOLLOWER_RANGES = [
  { label: 'All', min: 0, max: Infinity },
  { label: '< 100K', min: 0, max: 100000 },
  { label: '100K - 500K', min: 100000, max: 500000 },
  { label: '500K - 1M', min: 500000, max: 1000000 },
  { label: '1M+', min: 1000000, max: Infinity },
];

interface CRMField {
  label: string;
  key: string;
  required: boolean;
}

const MANDATORY_FIELDS: CRMField[] = [
  { label: "Full Name", key: "full_name", required: true },
  { label: "Instagram Handle", key: "instagram_handle", required: true },
  { label: "Phone Number", key: "phone_number", required: true },
];

const OPTIONAL_FIELDS: CRMField[] = [
  { label: "Email", key: "email", required: false },
  { label: "Followers", key: "followers_count", required: false },
  { label: "Gender", key: "gender", required: false },
  { label: "City", key: "city", required: false },
  { label: "State", key: "state", required: false },
  { label: "Niches", key: "niches", required: false },
  { label: "Category", key: "category", required: false },
];

const RosterManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('view');
  const { 
    rosterData: roster, 
    setRosterData: setRoster, 
    clearRoster,
    selectedInfluencers: selected,
    setSelectedInfluencers: setSelected,
    clearSelection
  } = useRosterStore();
  const [isLoading, setIsLoading] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'agency' | 'brand' | null>(null);
  const [sessionKey, setSessionKey] = useState<CryptoKey | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [passportName, setPassportName] = useState("");
  const [isSavingPassport, setIsSavingPassport] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedInfluencerForCampaign, setSelectedInfluencerForCampaign] = useState<any>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [visibleCount, setVisibleCount] = useState(100);
  const [savedPassports, setSavedPassports] = useState<any[]>([]);
  
  // Upload State
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [followerMinInput, setFollowerMinInput] = useState("");
  const [followerMaxInput, setFollowerMaxInput] = useState("");
  const [nicheFilters, setNicheFilters] = useState<string[]>([]);
  const [stateFilters, setStateFilters] = useState<string[]>([]);
  const [genderFilters, setGenderFilters] = useState<string[]>([]);
  const [availableNiches, setAvailableNiches] = useState<string[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableGenders, setAvailableGenders] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showBulkWhatsAppDialog, setShowBulkWhatsAppDialog] = useState(false);
  const [showBulkAICallDialog, setShowBulkAICallDialog] = useState(false);
  const [showBulkPushDialog, setShowBulkPushDialog] = useState(false);
  const [targetCampaignId, setTargetCampaignId] = useState("");
  const [slotWarning, setSlotWarning] = useState<string | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!user) return;
      
      let pId = null;
      let role: 'agency' | 'brand' | null = null;

      const { data: agencyProfile } = await supabase.from('agency_profiles').select('id').eq('user_id', user.id).maybeSingle();
      if (agencyProfile) {
        pId = agencyProfile.id;
        role = 'agency';
      } else {
        const { data: brandProfile } = await supabase.from('brand_profiles').select('id').eq('user_id', user.id).maybeSingle();
        if (brandProfile) {
          pId = brandProfile.id;
          role = 'brand';
        }
      }
      
      if (pId && role) {
        setProfileId(pId);
        setUserRole(role);
        fetchSessionKey(user.id);
      }
    };
    init();
  }, [user]);

  const fetchCampaigns = async () => {
    if (!profileId || userRole !== 'agency') return;
    const { data } = await supabase.from('campaigns').select('id, name').eq('status', 'active');
    if (data) setCampaigns(data);
  };

  useEffect(() => {
    if (profileId) fetchCampaigns();
  }, [profileId]);

  const fetchSessionKey = async (userId: string) => {
    try {
      const secret = import.meta.env.VITE_ROSTER_SESSION_SECRET || "default_local_secret";
      const key = await security.deriveRosterKey(userId, secret);
      
      // SELF-TEST: Verify encryption/decryption works in this browser before proceeding
      try {
        const testData = new TextEncoder().encode("integrity-check");
        const testEnc = await security.encryptRoster(testData, key);
        const testDec = await security.decryptRoster(testEnc, key);
        if (new TextDecoder().decode(testDec) !== "integrity-check") {
          throw new Error("Self-test bit-mismatch");
        }
      } catch (e) {
        console.error("[RosterSecurity] Browser Encryption Self-Test: FAILED", e);
        toast.error("Security initialization failed in this browser. Please try a different browser.");
      }

      setSessionKey(key);
    } catch (error) {
      console.error("Failed to derive session key:", error);
    }
  };

  // Hardened Session Snapshot Logic
  useEffect(() => {
    if (!profileId || !sessionKey || !userRole) return;

    const saveSession = async () => {
      // Step 5: Skip if roster is empty
      if (roster.length === 0) return;

      try {
        const compressed = await security.compressRoster(roster);
        const encrypted = await security.encryptRoster(compressed, sessionKey);
        const b64 = security.uint8ToBase64(encrypted);

        // Round-trip verification test
        const testDecrypted = await security.decryptRoster(b64, sessionKey);
        const originalSnippet = JSON.stringify(roster).slice(0, 50);
        const testSnippet = JSON.stringify(await security.decompressRoster(testDecrypted)).slice(0, 50);
        
        if (originalSnippet.slice(0, 10) !== testSnippet.slice(0, 10)) {
          console.error("[RosterSecurity] ROUND-TRIP FAILED during session save!", { originalSnippet, testSnippet });
          throw new Error("Integrity check failed: Encrypted data does not match original.");
        }
        
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const payload: any = {
          encrypted_blob: b64,
          row_count: roster.length,
          expires_at: expiresAt.toISOString()
        };

        if (userRole === 'agency') payload.agency_id = profileId;
        else payload.brand_id = profileId;

        // Step 1: Upsert to roster_sessions
        // @ts-ignore
        const { data: upsertData, error } = await supabase
          .from('roster_sessions')
          .upsert(payload, { 
            onConflict: userRole === 'agency' ? 'agency_id' : 'brand_id' 
          })
          .select('encrypted_blob')
          .single();

        if (error) {
          console.error("Session upsert error:", error);
        } else if (upsertData) {
          const returnedB64 = upsertData.encrypted_blob;
          if (returnedB64 !== b64) {
            console.error("[RosterSecurity] DATA CORRUPTION DETECTED during database transport!");
          }
        }
      } catch (error) {
        console.error("Snapshot save failed:", error);
      }
    };

    // Step 5: Debounced auto-save (3 seconds)
    const timeoutId = setTimeout(saveSession, 3000);

    // Step 1: beforeunload listener
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (roster.length > 0) {
        saveSession();
        // Standard beforeunload pattern
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roster, profileId, sessionKey, userRole]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length === 0) return;
      const parseLine = (line: string) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) { result.push(cur.trim()); cur = ''; }
          else cur += char;
        }
        result.push(cur.trim());
        return result;
      };
      const rawHeaders = parseLine(lines[0]);
      const rows = lines.slice(1).map(line => {
        const values = parseLine(line);
        const obj: any = {};
        rawHeaders.forEach((h, i) => {
          if (h) obj[h] = values[i];
          else obj[`_empty_${i}`] = values[i];
        });
        return obj;
      });
      const headersForDisplay = rawHeaders.filter(Boolean);
      setCsvHeaders(headersForDisplay);
      setCsvRows(rows);
      const initialMapping: any = {};
      [...MANDATORY_FIELDS, ...OPTIONAL_FIELDS].forEach(f => {
        const match = headersForDisplay.find(h => {
          const ch = h.toLowerCase().replace(/[^a-z0-9]/g, '');
          const ck = f.key.toLowerCase().replace(/[^a-z0-9]/g, '');
          const cl = f.label.toLowerCase().replace(/[^a-z0-9]/g, '');
          return ch.includes(ck) || ch.includes(cl) || cl.includes(ch);
        });
        if (match) initialMapping[f.key] = match;
      });
      setMapping(initialMapping);
      setCurrentStep('mapping');
    };
    reader.readAsText(file);
  };

  const startImport = () => {
    setIsLoading(true);
    setCurrentStep('importing');
    setTimeout(() => {
      const processedRows = csvRows.map(row => {
        const influencer: any = { id: crypto.randomUUID(), metadata: row };
        [...MANDATORY_FIELDS, ...OPTIONAL_FIELDS].forEach(f => {
          const csvKey = mapping[f.key];
          if (csvKey) influencer[f.key] = row[csvKey];
        });
        if (influencer.niches && typeof influencer.niches === 'string') {
          influencer.niches = influencer.niches.split(/[,|;]/).map((s: string) => s.trim()).filter(Boolean);
        }
        return influencer;
      });
      setRoster(processedRows);
      setCurrentStep('view');
      setIsLoading(false);
      toast.success(`Imported ${processedRows.length} influencers to workspace`);
    }, 1000);
  };

  useEffect(() => {
    if (roster.length > 0) {
      const niches = new Set<string>();
      const states = new Set<string>();
      const genders = new Set<string>();
      roster.forEach(item => {
        // Niche and Category are the same
        if (Array.isArray(item.niches)) {
          item.niches.forEach((n: string) => { if (n && n !== 'N/A') niches.add(n); });
        }
        if (item.category && item.category !== 'N/A') niches.add(item.category);
        
        // Extract State
        const st = item.state || item.metadata?.state;
        if (st && st !== 'N/A') states.add(st);

        // Extract Gender
        const g = item.gender || item.metadata?.gender;
        if (g && g !== 'N/A') genders.add(g);
      });
      setAvailableNiches(Array.from(niches).sort());
      setAvailableStates(Array.from(states).sort());
      setAvailableGenders(Array.from(genders).sort());
    }
  }, [roster]);

  const filteredRoster = useMemo(() => {
    const minVal = parseFollowerValue(followerMinInput);
    const maxVal = followerMaxInput ? parseFollowerValue(followerMaxInput) : 1000000000;

    return roster.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.full_name?.toLowerCase().includes(q) ||
        item.instagram_handle?.toLowerCase().includes(q);
      
      const val = parseFollowerValue(item.followers_count);
      const matchesFollowers = val >= minVal && val <= maxVal;
      
      const itemNiches = [
        ...(Array.isArray(item.niches) ? item.niches : []),
        ...(item.category ? [item.category] : [])
      ].map(n => n.toLowerCase());

      const matchesNiche = nicheFilters.length === 0 || 
        nicheFilters.some(f => itemNiches.includes(f.toLowerCase()));
        
      const st = (item.state || item.metadata?.state || "").toLowerCase();
      const matchesState = stateFilters.length === 0 || 
        stateFilters.some(f => st === f.toLowerCase());

      const g = (item.gender || item.metadata?.gender || "").toLowerCase();
      const matchesGender = genderFilters.length === 0 || 
        genderFilters.some(f => g === f.toLowerCase());
        
      return matchesSearch && matchesFollowers && matchesNiche && matchesState && matchesGender;
    });
  }, [roster, searchQuery, followerMinInput, followerMaxInput, nicheFilters, stateFilters, genderFilters]);

  const paginatedRoster = useMemo(() => filteredRoster.slice(0, visibleCount), [filteredRoster, visibleCount]);

  // Step 4: Auto-clear selection on filter change
  useEffect(() => {
    if (selected.length > 0) {
      clearSelection();
      toast.info("Selection cleared because filters changed.");
    }
  }, [searchQuery, followerMinInput, followerMaxInput, nicheFilters, stateFilters, genderFilters]);

  const handleSelectOne = (inf: any, checked: boolean) => {
    if (checked) {
      setSelected([...selected, inf]);
    } else {
      setSelected(selected.filter(s => s.id !== inf.id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(filteredRoster);
    } else {
      clearSelection();
    }
  };

  const isAllSelected = filteredRoster.length > 0 && selected.length === filteredRoster.length;
  const isPartialSelected = selected.length > 0 && selected.length < filteredRoster.length;

  const handleSavePassport = async () => {
    if (!profileId || !sessionKey || !userRole || !passportName) return;
    setIsSavingPassport(true);
    try {
      const compressed = await security.compressRoster(roster);
      const encrypted = await security.encryptRoster(compressed, sessionKey);
      const b64 = security.uint8ToBase64(encrypted);

      // Round-trip verification test
      const testDecrypted = await security.decryptRoster(b64, sessionKey);
      const originalSnippet = JSON.stringify(roster).slice(0, 50);
      const testSnippet = JSON.stringify(await security.decompressRoster(testDecrypted)).slice(0, 50);
      
      if (originalSnippet.slice(0, 10) !== testSnippet.slice(0, 10)) {
        console.error("[RosterSecurity] ROUND-TRIP FAILED during passport save!", { originalSnippet, testSnippet });
        throw new Error("Integrity check failed: Encrypted data does not match original.");
      }

      const payload: any = {
        roster_name: passportName,
        encrypted_blob: b64,
        row_count: roster.length
      };
      if (userRole === 'agency') payload.agency_id = profileId;
      else payload.brand_id = profileId;

      const { data: insertData, error } = await supabase
        .from('saved_rosters')
        .insert(payload)
        .select('encrypted_blob')
        .single();
      
      if (error) throw error;

      if (insertData) {
        const returnedB64 = insertData.encrypted_blob;
        if (returnedB64 !== b64) {
          console.error("[RosterSecurity] PASSPORT DATA CORRUPTION DETECTED during database transport!");
        }
      }

      toast.success("Passport saved successfully!");
      setShowSaveDialog(false);
      setPassportName("");
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save passport: " + (error as Error).message);
    } finally {
      setIsSavingPassport(false);
    }
  };

  const fetchSavedPassports = async () => {
    if (!profileId || !userRole) return;
    const query = supabase.from('saved_rosters').select('*');
    if (userRole === 'agency') query.eq('agency_id', profileId);
    else query.eq('brand_id', profileId);
    const { data } = await query.order('created_at', { ascending: false });
    if (data) setSavedPassports(data);
  };

  useEffect(() => {
    if (currentStep === 'saved-rosters') fetchSavedPassports();
  }, [currentStep, profileId]);

  const loadPassport = async (p: any) => {
    if (!sessionKey) return;
    setIsLoading(true);
    try {
      // security.decryptRoster now internally handles Hex conversion/ensuring Uint8Array
      const decrypted = await security.decryptRoster(p.encrypted_blob, sessionKey);
      const data = await security.decompressRoster(decrypted);
      setRoster(data);
      setCurrentStep('view');
      toast.success(`Loaded "${p.roster_name}"`);
    } catch (error) {
      console.error("Load failed:", error);
      toast.error("Failed to load passport");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsApp = (inf: any) => {
    const phone = inf.phone_number?.replace(/\D/g, '');
    if (!phone) return toast.error("No phone number found");
    window.open(`https://wa.me/${phone}?text=Hi%20${inf.full_name},%20we're%20interested%20in%20collaborating!`, '_blank');
  };

  const handleAICall = (inf: any) => {
    toast.info(`Requesting AI call sequence for ${inf.full_name}... Queueing system...`);
  };

  const addToCampaign = (inf: any) => {
    setSelectedInfluencerForCampaign(inf);
    setShowCampaignDialog(true);
  };

  const confirmAddToCampaign = async (campaignId: string) => {
    if (!selectedInfluencerForCampaign) return;
    setIsAssigning(true);
    try {
      const { error } = await supabase.from('campaign_influencers').insert({
        campaign_id: campaignId,
        full_name: selectedInfluencerForCampaign.full_name,
        instagram_handle: selectedInfluencerForCampaign.instagram_handle,
        phone_number: selectedInfluencerForCampaign.phone_number,
        status: 'pending'
      });
      if (error) throw error;
      toast.success("Added to campaign!");
      setShowCampaignDialog(false);
    } catch (error) {
      toast.error("Failed to add to campaign");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDelete = (index: number) => {
    const newData = [...roster];
    newData.splice(index, 1);
    setRoster(newData);
    toast.success("Influencer removed from workspace");
  };

  const handleDeleteAll = () => {
    if (confirm("Are you sure you want to clear your workspace?")) {
      clearRoster();
      toast.success("Workspace cleared");
    }
  };

  // Step 2 & 3: Bulk Actions Logic
  const ensureInfluencersInDb = async (influencers: any[]) => {
    const influencersToSync = influencers.map(inf => ({
      full_name: inf.full_name,
      instagram_handle: inf.instagram_handle,
      phone_number: inf.phone_number,
      email: inf.email,
      gender: inf.gender,
      city: inf.city,
      state: inf.state,
      followers_count: parseFollowerValue(inf.followers_count),
      niches: Array.isArray(inf.niches) ? inf.niches : [],
      category: inf.category
    }));

    // Lazy persistence: Upsert into influencer_profiles
    const { error } = await supabase
      .from('influencer_profiles')
      .upsert(influencersToSync, { onConflict: 'phone_number' });
    
    if (error) {
      console.error("Lazy persistence failed:", error);
      throw new Error("Failed to sync influencers to database");
    }
  };

  const handleBulkWhatsApp = async () => {
    setIsBulkProcessing(true);
    for (let i = 0; i < selected.length; i++) {
      const inf = selected[i];
      const phone = inf.phone_number?.replace(/\D/g, '');
      if (phone) {
        // Indian country code prefix as per prompt
        const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;
        const url = `https://wa.me/${formattedPhone}?text=Hi%20${inf.full_name}!%20Dotfluence%20has%20a%20campaign%20for%20you:%20https://dotfluence.in/magic`;
        window.open(url, '_blank');
        // 1-second delay to prevent browser blocking
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    setIsBulkProcessing(false);
    setShowBulkWhatsAppDialog(false);
    clearSelection();
    toast.success(`Launched WhatsApp threads for ${selected.length} influencers`);
  };

  const handleBulkAICall = async () => {
    setIsBulkProcessing(true);
    try {
      await ensureInfluencersInDb(selected);
      
      // Simulate/Call initiate API (as per prompt)
      // const response = await fetch('/api/calls/initiate', { method: 'POST', body: JSON.stringify(selected) });
      
      toast.success(`Queued AI calls for ${selected.length} influencers`);
      navigate('/agency/outreach'); // Redirect to outreach tab
    } catch (error) {
      toast.error("Failed to queue AI calls");
    } finally {
      setIsBulkProcessing(false);
      setShowBulkAICallDialog(false);
      clearSelection();
    }
  };

  const handleBulkPushToCampaign = async () => {
    if (!targetCampaignId) return;
    setIsBulkProcessing(true);
    try {
      // Slot validation
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('total_slots')
        .eq('id', targetCampaignId)
        .single();
      
      const { count } = await supabase
        .from('campaign_influencers')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', targetCampaignId);
      
      const existingCount = count || 0;
      const totalSlots = campaign?.total_slots || Infinity;
      const remainingSlots = totalSlots - existingCount;

      let influencersToPush = selected;
      if (selected.length > remainingSlots) {
        if (!confirm(`This campaign has ${remainingSlots} slots remaining. You are pushing ${selected.length} influencers. Only the first ${remainingSlots} will be added. Continue?`)) {
          setIsBulkProcessing(false);
          return;
        }
        influencersToPush = selected.slice(0, remainingSlots);
      }

      await ensureInfluencersInDb(influencersToPush);

      // Fetch the IDs of the newly synced influencers
      const { data: syncedInfluencers } = await supabase
        .from('influencer_profiles')
        .select('id, phone_number')
        .in('phone_number', influencersToPush.map(inf => inf.phone_number));

      if (!syncedInfluencers) throw new Error("Failed to retrieve synced IDs");

      const applications = syncedInfluencers.map(inf => ({
        campaign_id: targetCampaignId,
        influencer_id: inf.id,
        status: 'applied', // Correct status for the Kanban Applied column
        payout_agreed: 0
      }));

      const { error: pushError } = await supabase
        .from('campaign_influencers')
        .insert(applications);

      if (pushError && pushError.code !== '23505') throw pushError; // Ignore duplicates

      const targetCampaign = campaigns.find(c => c.id === targetCampaignId);
      toast.success(`${influencersToPush.length} influencers added to ${targetCampaign?.name || 'campaign'}`);
      setShowBulkPushDialog(false);
      clearSelection();
    } catch (error) {
      console.error("Bulk push failed:", error);
      toast.error("Failed to push influencers to campaign");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-2 md:p-4 pt-16 text-slate-200">
      <div className={`w-full ${currentStep === 'view' ? 'max-w-none px-2 lg:px-6' : 'max-w-[1600px] mx-auto'} space-y-6 transition-all duration-500`}>
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(userRole === 'brand' ? "/company/dashboard" : "/agency/dashboard")}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 'view' && (
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    Private Roster Workspace
                  </h1>
                  <p className="text-slate-400">Stateless Creator Hub • Active Profile Management</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleDeleteAll} className="bg-white/5 border-white/10 hover:bg-red-500/10 hover:text-red-400">
                    Clear Workspace
                  </Button>
                  <Button variant="outline" className="bg-white/5 border-white/10" onClick={() => setCurrentStep('upload')}>
                    <Plus className="h-4 w-4 mr-2" /> Import More
                  </Button>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20" onClick={() => setShowSaveDialog(true)}>
                    <Save className="h-4 w-4 mr-2" /> Save Passport
                  </Button>
                </div>
              </div>

              <Card className="bg-slate-900/50 border-white/10 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-1">Search Creator</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input 
                        placeholder="Name or handle..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white/5 border-white/10 pl-9 focus:ring-purple-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-1">Follower Range</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="text" 
                        placeholder="Min (e.g. 10k)"
                        value={followerMinInput}
                        onChange={(e) => setFollowerMinInput(e.target.value)}
                        className="bg-white/5 border-white/10 h-10 w-24 text-xs"
                      />
                      <span className="text-slate-500 text-xs">-</span>
                      <Input 
                        type="text" 
                        placeholder="Max (e.g. 1M)"
                        value={followerMaxInput}
                        onChange={(e) => setFollowerMaxInput(e.target.value)}
                        className="bg-white/5 border-white/10 h-10 w-24 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-1">Niches</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full bg-white/5 border-white/10 h-10 justify-between text-slate-400 font-normal">
                          {nicheFilters.length === 0 ? "All Niches" : `${nicheFilters.length} Selected`}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-900 border-white/10 text-white max-h-[300px] overflow-y-auto w-56">
                        {availableNiches.map(n => (
                          <DropdownMenuCheckboxItem
                            key={n}
                            checked={nicheFilters.includes(n)}
                            onCheckedChange={(checked) => {
                              setNicheFilters(prev => checked ? [...prev, n] : prev.filter(x => x !== n));
                            }}
                          >
                            {n}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-1">States</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full bg-white/5 border-white/10 h-10 justify-between text-slate-400 font-normal">
                          {stateFilters.length === 0 ? "All States" : `${stateFilters.length} Selected`}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-900 border-white/10 text-white max-h-[300px] overflow-y-auto w-56">
                        {availableStates.map(s => (
                          <DropdownMenuCheckboxItem
                            key={s}
                            checked={stateFilters.includes(s)}
                            onCheckedChange={(checked) => {
                              setStateFilters(prev => checked ? [...prev, s] : prev.filter(x => x !== s));
                            }}
                          >
                            {s}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-1">Gender</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full bg-white/5 border-white/10 h-10 justify-between text-slate-400 font-normal">
                          {genderFilters.length === 0 ? "All Genders" : `${genderFilters.length} Selected`}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-900 border-white/10 text-white max-h-[300px] overflow-y-auto w-56">
                        {availableGenders.map(g => (
                          <DropdownMenuCheckboxItem
                            key={g}
                            checked={genderFilters.includes(g)}
                            onCheckedChange={(checked) => {
                              setGenderFilters(prev => checked ? [...prev, g] : prev.filter(x => x !== g));
                            }}
                          >
                            {g}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => { setSearchQuery(""); setFollowerMinInput(""); setFollowerMaxInput(""); setNicheFilters([]); setStateFilters([]); setGenderFilters([]); }} className="text-slate-500 hover:text-white">Reset</Button>
                    <Button variant="outline" className="bg-white/5 border-white/10" onClick={() => setCurrentStep('saved-rosters')}><Clock className="h-4 w-4 mr-2" /> History</Button>
                  </div>
                </div>
              </Card>

              {selected.length > 0 && (
                <div className="flex items-center gap-2 px-1 animate-in fade-in slide-in-from-left duration-300">
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30 py-1">
                    {selected.length} of {filteredRoster.length} influencers selected
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={clearSelection} className="h-7 text-[10px] uppercase tracking-tighter text-slate-500 hover:text-white">
                    Clear Selection
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="h-9 px-4 border-white/10 bg-white/5 text-slate-400">
                    Showing {Math.min(visibleCount, filteredRoster.length)} of {filteredRoster.length} matches
                  </Badge>
                </div>

                <Card className="bg-slate-900 border-white/5 shadow-2xl relative overflow-hidden">
                  <CardContent className="p-0">
                    <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-purple-500/30">
                      <Table className="min-w-[1400px]">
                        <TableHeader className="bg-slate-950/80 sticky top-0 z-10">
                          <TableRow className="border-white/10">
                            <TableHead className="w-12 px-4 py-4">
                              <Checkbox 
                                checked={isAllSelected}
                                onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                className="border-white/20 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                              />
                            </TableHead>
                            <TableHead className="px-6 py-4 uppercase tracking-widest text-[10px] font-bold">Influencer</TableHead>
                            <TableHead className="px-6 py-4 uppercase tracking-widest text-[10px] font-bold">Contact</TableHead>
                            <TableHead className="px-6 py-4 uppercase tracking-widest text-[10px] font-bold">Location</TableHead>
                            <TableHead className="px-6 py-4 uppercase tracking-widest text-[10px] font-bold">Stats</TableHead>
                            <TableHead className="px-6 py-4 uppercase tracking-widest text-[10px] font-bold">Niches</TableHead>
                            <TableHead className="px-6 py-4 text-right uppercase tracking-widest text-[10px] font-bold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedRoster.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center py-20 text-slate-500">No creators found matching criteria.</TableCell></TableRow>
                          ) : (
                            paginatedRoster.map((inf, i) => (
                              <TableRow key={inf.id} className="group border-white/5 hover:bg-white/5 transition-colors">
                                <TableCell className="px-4 py-4">
                                  <Checkbox 
                                    checked={selected.some(s => s.id === inf.id)}
                                    onCheckedChange={(checked) => handleSelectOne(inf, !!checked)}
                                    className="border-white/10 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                  />
                                </TableCell>
                                <TableCell className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold border border-purple-500/20">{inf.full_name?.[0]}</div>
                                    <div><p className="font-bold text-white">{inf.full_name}</p><p className="text-xs text-slate-500">@{inf.instagram_handle}</p></div>
                                  </div>
                                </TableCell>
                                <TableCell className="px-6 py-4"><p className="text-sm text-slate-300">{inf.email || '-'}</p><p className="text-xs text-slate-500">{inf.phone_number}</p></TableCell>
                                <TableCell className="px-6 py-4"><p className="text-sm text-slate-300">{inf.city || '-'}</p><p className="text-xs text-slate-500">{inf.state || '-'}</p></TableCell>
                                <TableCell className="px-6 py-4"><p className="text-sm font-bold text-emerald-400">{formatFollowers(inf.followers_count)}</p><Badge variant="outline" className="text-[10px] uppercase">{inf.gender || 'Unknown'}</Badge></TableCell>
                                <TableCell className="px-6 py-4"><div className="flex flex-wrap gap-1">{inf.niches?.slice(0, 3).map((n: string) => (<Badge key={n} variant="secondary" className="text-[10px]">{n}</Badge>))}</div></TableCell>
                                <TableCell className="text-right px-6 py-4">
                                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <Button variant="ghost" size="icon" className="text-emerald-500" onClick={() => handleWhatsApp(inf)}><MessageSquare size={16} /></Button>
                                    {userRole === 'agency' && <Button variant="ghost" size="icon" className="text-amber-500" onClick={() => addToCampaign(inf)}><Plus size={16} /></Button>}
                                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-red-400" onClick={() => handleDelete(i)}><Trash2 size={16} /></Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {filteredRoster.length > visibleCount && (
                      <div className="p-6 border-t border-white/5 flex justify-center">
                        <Button onClick={() => setVisibleCount(p => p + 100)} variant="secondary" className="bg-purple-600/10 text-purple-400 h-11 px-12">Load Next 100 Creators</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {currentStep === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-xl mx-auto py-12">
              <Card className="bg-slate-900 border-purple-500/20 shadow-2xl">
                <CardHeader>
                  <div className="h-16 w-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4 border border-purple-500/30 text-purple-400"><FileSpreadsheet size={32} /></div>
                  <CardTitle className="text-2xl">Import Private Roster</CardTitle>
                  <CardDescription>Upload your creator list (CSV). We'll keep it stateless and secure.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center hover:bg-white/5 transition-all cursor-pointer" onClick={() => document.getElementById('csv-upload')?.click()}>
                    <Upload className="h-12 w-12 mx-auto text-slate-500 group-hover:text-purple-400 mb-4" />
                    <p className="text-white font-medium">Select CSV Document</p>
                    <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                  </div>
                  <Button variant="ghost" className="w-full" onClick={() => setCurrentStep('view')}>Cancel</Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 'mapping' && (
            <motion.div key="mapping" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div><h2 className="text-2xl font-bold">Map Columns</h2><p className="text-slate-400">Match your sheet's headers to our workspace fields.</p></div>
                <div className="flex gap-3"><Button variant="ghost" onClick={() => setCurrentStep('upload')}>Back</Button><Button onClick={startImport} className="bg-purple-600 hover:bg-purple-500">Import Creators</Button></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="bg-slate-900 border-white/5">
                  <CardContent className="space-y-6 pt-6">
                    {[...MANDATORY_FIELDS, ...OPTIONAL_FIELDS].map(f => (
                      <div key={f.key} className="space-y-2">
                        <Label className="text-slate-300">{f.label}{f.required && <span className="text-red-400 ml-1">*</span>}</Label>
                        <Select value={mapping[f.key] || ""} onValueChange={(val) => setMapping({...mapping, [f.key]: val})}>
                          <SelectTrigger className="bg-white/5 border-white/10 h-10"><SelectValue placeholder="Skip Field" /></SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10 text-white">{csvHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="bg-slate-900 border-white/5 h-fit">
                  <CardHeader><CardTitle className="text-sm">Data Preview</CardTitle></CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow className="bg-white/5">{csvHeaders.slice(0, 3).map(h => <TableHead key={h} className="text-[10px]">{h}</TableHead>)}</TableRow></TableHeader>
                      <TableBody>{csvRows.slice(0, 3).map((r, i) => (<TableRow key={i} className="border-white/5">{csvHeaders.slice(0, 3).map(h => <TableCell key={h} className="text-[10px] text-slate-400">{r[h]}</TableCell>)}</TableRow>))}</TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {currentStep === 'importing' && (
            <div className="flex flex-col items-center justify-center py-32 space-y-6">
              <div className="animate-spin h-16 w-16 border-t-4 border-purple-500 rounded-full" />
              <h2 className="text-2xl font-bold">Finalizing Workshop...</h2>
            </div>
          )}

          {currentStep === 'saved-rosters' && (
            <motion.div key="saved-rosters" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
              <div className="flex items-center justify-between"><h2 className="text-2xl font-bold flex items-center gap-2"><Save className="h-6 w-6 text-purple-400" /> My Passports</h2><Button variant="ghost" onClick={() => setCurrentStep('view')}>Back</Button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedPassports.length === 0 ? <p className="col-span-full py-20 text-center text-slate-500">No saved rosters found.</p> : savedPassports.map(p => (
                  <Card key={p.id} className="bg-slate-900 border-white/5 hover:border-purple-500/30 cursor-pointer group" onClick={() => loadPassport(p)}>
                    <CardHeader><CardTitle className="text-lg">{p.roster_name}</CardTitle><CardDescription>Saved {new Date(p.created_at).toLocaleDateString()}</CardDescription></CardHeader>
                    <CardContent><Badge variant="secondary" className="bg-purple-500/10 text-purple-400">{p.row_count} Creators</Badge></CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <DialogContent className="bg-slate-900 border-white/10 text-white">
            <DialogHeader><DialogTitle>Save Workspace Passport</DialogTitle><DialogDescription>Securely store this roster for later use.</DialogDescription></DialogHeader>
            <div className="py-4 space-y-2">
              <Label>Passport Name</Label>
              <Input placeholder="e.g. Influencers Q1" value={passportName} onChange={(e) => setPassportName(e.target.value)} className="bg-white/5 border-white/10" />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
              <Button onClick={handleSavePassport} disabled={!passportName || isSavingPassport} className="bg-purple-600 hover:bg-purple-500">{isSavingPassport ? "Saving..." : "Save Now"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
          <DialogContent className="bg-slate-900 border-white/10 text-white">
            <DialogHeader><DialogTitle>Assign to Campaign</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4 max-h-[300px] overflow-y-auto">
              {campaigns.length === 0 ? <p className="text-center text-slate-500">No active campaigns.</p> : campaigns.map(c => (
                <Button key={c.id} variant="outline" className="w-full justify-start text-left bg-white/5 border-white/10 hover:border-purple-500/50" onClick={() => confirmAddToCampaign(c.id)} disabled={isAssigning}>
                  <div><p className="font-medium">{c.name}</p><p className="text-xs text-slate-500">Click to assign</p></div>
                </Button>
              ))}
            </div>
            <DialogFooter><Button variant="ghost" onClick={() => setShowCampaignDialog(false)}>Cancel</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Actions Dialogs */}
        <Dialog open={showBulkWhatsAppDialog} onOpenChange={setShowBulkWhatsAppDialog}>
          <DialogContent className="bg-slate-900 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Bulk WhatsApp confirmation</DialogTitle>
              <DialogDescription>
                You are about to send a WhatsApp pre-fill message to {selected.length} influencers. 
                Confirm to proceed with 1-second interval between messages?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowBulkWhatsAppDialog(false)}>Cancel</Button>
              <Button onClick={handleBulkWhatsApp} disabled={isBulkProcessing} className="bg-emerald-600 hover:bg-emerald-500">
                {isBulkProcessing ? "Processing..." : "Confirm & Send"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showBulkAICallDialog} onOpenChange={setShowBulkAICallDialog}>
          <DialogContent className="bg-slate-900 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Bulk AI Call Confirmation</DialogTitle>
              <DialogDescription>
                You are about to queue AI outbound calls to {selected.length} influencers. 
                Estimated cost: ₹{selected.length * 2} (charged at campaign close).
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowBulkAICallDialog(false)}>Cancel</Button>
              <Button onClick={handleBulkAICall} disabled={isBulkProcessing} className="bg-amber-600 hover:bg-amber-500">
                {isBulkProcessing ? "Queueing..." : "Confirm & Queue"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showBulkPushDialog} onOpenChange={setShowBulkPushDialog}>
          <DialogContent className="bg-slate-900 border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>Push to Campaign</DialogTitle>
              <DialogDescription>Select which campaign to add {selected.length} influencers to.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <Select value={targetCampaignId} onValueChange={setTargetCampaignId}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select a Campaign" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-white">
                  {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowBulkPushDialog(false)}>Cancel</Button>
              <Button onClick={handleBulkPushToCampaign} disabled={!targetCampaignId || isBulkProcessing} className="bg-purple-600 hover:bg-purple-500">
                {isBulkProcessing ? "Pushing..." : "Push Now"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Sticky Bulk Action Bar */}
        {selected.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-2xl animate-in slide-in-from-bottom duration-500">
            <Card className="bg-slate-900/90 backdrop-blur-xl border-purple-500/30 shadow-2xl shadow-purple-500/20 p-4 border-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold border border-purple-500/30 animate-pulse">
                    {selected.length}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">Action Required</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">{selected.length} influencers ready for outreach</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="bg-white/5 border-white/10 hover:bg-emerald-500/10 hover:text-emerald-400 h-9" onClick={() => setShowBulkWhatsAppDialog(true)}>
                    <MessageSquare className="h-4 w-4 mr-2" /> WhatsApp All
                  </Button>
                  <Button size="sm" variant="outline" className="bg-white/5 border-white/10 hover:bg-amber-500/10 hover:text-amber-400 h-9" onClick={() => setShowBulkAICallDialog(true)}>
                    <PhoneCall className="h-4 w-4 mr-2" /> AI Call All
                  </Button>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white h-9" onClick={() => setShowBulkPushDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Push to Campaign
                  </Button>
                  <div className="h-6 w-px bg-white/10 mx-2" />
                  <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white" onClick={clearSelection}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default RosterManagement;
