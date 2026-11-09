import { create } from 'zustand';

interface DataState {
  result: any | null;
  setResult: (data: any) => void;
}

export const useDataStore = create<DataState>((set) => ({
  result: null,
  setResult: (data) => set({ result: data }),
}));
