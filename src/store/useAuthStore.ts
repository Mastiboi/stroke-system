import { create } from "zustand";
import { Session } from "@supabase/supabase-js";

export type UserRole = "EMO" | "CLINICIAN" | "RADIOLOGIST";

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  fcm_token?: string | null;
}

interface AuthState {
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  profile: null,
  isLoading: true,
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  signOut: async () => {
    set({ isLoading: true });
    const { supabase } = await import("../lib/supabase");
    await supabase.auth.signOut();
    set({ session: null, profile: null, isLoading: false });
  },
}));
