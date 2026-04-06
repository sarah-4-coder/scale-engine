import { create } from 'zustand';

interface RosterStore {
  rosterData: any[];
  selectedInfluencers: any[];
  setRosterData: (data: any[]) => void;
  setSelectedInfluencers: (influencers: any[]) => void;
  clearSelection: () => void;
  clearRoster: () => void;
}

export const useRosterStore = create<RosterStore>((set) => ({
  rosterData: [],
  selectedInfluencers: [],
  setRosterData: (data) => set({ rosterData: data }),
  setSelectedInfluencers: (influencers) => set({ selectedInfluencers: influencers }),
  clearSelection: () => set({ selectedInfluencers: [] }),
  clearRoster: () => set({ rosterData: [], selectedInfluencers: [] }),
}));
