import { create } from 'zustand';

interface LocationStore {
    lat: number | null;
    lng: number | null;
    locationName: string | null;
    nearestDealer: { id: string; name: string; distance: number } | null;
    isLocating: boolean;
    error: string | null;

    setLocation: (lat: number, lng: number, name?: string) => void;
    setNearestDealer: (dealer: { id: string; name: string; distance: number }) => void;
    setLocating: (v: boolean) => void;
    setError: (e: string | null) => void;
    reset: () => void;
}

export const useLocationStore = create<LocationStore>((set) => ({
    lat: null,
    lng: null,
    locationName: null,
    nearestDealer: null,
    isLocating: false,
    error: null,

    setLocation: (lat, lng, name) => set({ lat, lng, locationName: name ?? null }),
    setNearestDealer: (dealer) => set({ nearestDealer: dealer }),
    setLocating: (v) => set({ isLocating: v }),
    setError: (e) => set({ error: e }),
    reset: () =>
        set({ lat: null, lng: null, locationName: null, nearestDealer: null, error: null }),
}));
