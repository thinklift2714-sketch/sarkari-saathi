"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  age?: number | null;
  gender?: string | null;
  marital_status?: string | null;
  state?: string;
  district?: string | null;
  village_or_town?: string | null;
  occupation?: string | null;
  annual_income?: number | null;
  family_size?: number;
  has_bank_account?: boolean;
  landholding?: number | null;
  is_onboarded?: boolean;
  members?: any[];
}

interface AuthContextType {
  user: User | { id: string; email?: string; phone?: string; user_metadata?: any } | null;
  session: Session | null;
  token: string | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  showAuthModal: boolean;
  setShowAuthModal: (open: boolean) => void;
  showOnboardingModal: boolean;
  setShowOnboardingModal: (open: boolean) => void;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithPhone: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>;
  verifyPhoneOtp: (phoneNumber: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  devSignIn: (name: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  updateLocalProfile: (newProf: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  token: null,
  profile: null,
  loading: true,
  isConfigured: false,
  showAuthModal: false,
  setShowAuthModal: () => {},
  showOnboardingModal: false,
  setShowOnboardingModal: () => {},
  signInWithGoogle: async () => ({}),
  signInWithPhone: async () => ({ success: false }),
  verifyPhoneOtp: async () => ({ success: false }),
  devSignIn: async () => ({ success: false }),
  signOut: async () => {},
  deleteAccount: async () => ({ success: false }),
  refreshProfile: async () => {},
  updateLocalProfile: () => {},
});

const TOKEN_KEY = "sarkari_saathi_token";
const USER_KEY = "sarkari_saathi_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState<boolean>(false);
  const isConfigured = isSupabaseConfigured();

  // Helper to fetch user profile using token
  const loadProfile = useCallback(async (authToken: string) => {
    try {
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        // If user is logged in but hasn't onboarded, prompt onboarding
        if (data && !data.is_onboarded && (!data.name || data.name.trim() === "")) {
          setShowOnboardingModal(true);
        }
      }
    } catch (e) {
      console.warn("Failed to load user profile:", e);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (isConfigured) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data.session && mounted) {
            setSession(data.session);
            setUser(data.session.user);
            setToken(data.session.access_token);
            localStorage.setItem(TOKEN_KEY, data.session.access_token);
            await loadProfile(data.session.access_token);
          }
        } catch (e) {
          console.warn("Supabase session restore failed:", e);
        }
      } else {
        // Local dev session restore
        try {
          const savedToken = localStorage.getItem(TOKEN_KEY);
          const savedUser = localStorage.getItem(USER_KEY);
          if (savedToken && savedUser && mounted) {
            setToken(savedToken);
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            await loadProfile(savedToken);
          }
        } catch (_) {}
      }

      if (mounted) setLoading(false);
    }

    initAuth();

    // Listen to Supabase auth state changes if configured
    if (isConfigured) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          if (!mounted) return;
          if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
            setToken(currentSession.access_token);
            localStorage.setItem(TOKEN_KEY, currentSession.access_token);
            await loadProfile(currentSession.access_token);
          } else {
            setSession(null);
            setUser(null);
            setToken(null);
            setProfile(null);
            localStorage.removeItem(TOKEN_KEY);
          }
        }
      );

      return () => {
        mounted = false;
        authListener.subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, [isConfigured, loadProfile]);

  // Google OAuth Sign In
  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    if (!isConfigured) {
      return {
        error:
          "Supabase क्रेडेंशियल्स कॉन्फ़िगर नहीं हैं। कृपया .env में NEXT_PUBLIC_SUPABASE_URL और NEXT_PUBLIC_SUPABASE_ANON_KEY दर्ज करें।",
      };
    }
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) return { error: error.message };
      return {};
    } catch (e: any) {
      return { error: e.message || "Google लॉगिन विफल रहा" };
    }
  };

  // Mobile OTP Sign In (+91 Indian numbers)
  const signInWithPhone = async (
    phoneNumber: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Clean and validate Indian 10-digit number
    const cleaned = phoneNumber.replace(/\D/g, "");
    let formattedPhone = "";
    if (cleaned.length === 10) {
      formattedPhone = `+91${cleaned}`;
    } else if (cleaned.length === 12 && cleaned.startsWith("91")) {
      formattedPhone = `+${cleaned}`;
    } else {
      return {
        success: false,
        error: "कृपया एक मान्य 10-अंकों का भारतीय मोबाइल नंबर दर्ज करें।",
      };
    }

    if (!isConfigured) {
      return {
        success: false,
        error:
          "Supabase SMS गेटवे कॉन्फ़िगर नहीं है। कृपया Supabase डैशबोर्ड में Twilio या SMS प्रदाता जोड़ें अथवा नीचे 'डेवलपमेंट टेस्ट लॉगिन' चुनें।",
      };
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: "sms",
        },
      });

      if (error) {
        return {
          success: false,
          error:
            error.message.includes("SMS provider") ||
            error.message.includes("gateway") ||
            error.message.includes("unsupported")
              ? "Supabase प्रोजेक्ट में SMS गेटवे सक्षम नहीं है। कृपया Supabase Auth Settings में Twilio/MessageBird क्रेडेंशियल्स दर्ज करें।"
              : error.message,
        };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "OTP भेजने में त्रुटि हुई।" };
    }
  };

  // Verify Phone OTP
  const verifyPhoneOtp = async (
    phoneNumber: string,
    otp: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleaned = phoneNumber.replace(/\D/g, "");
    const formattedPhone = cleaned.startsWith("91") ? `+${cleaned}` : `+91${cleaned}`;

    if (!isConfigured) {
      return { success: false, error: "Supabase सेवा उपलब्ध नहीं है।" };
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp.trim(),
        type: "sms",
      });

      if (error) {
        return { success: false, error: error.message || "गलत OTP दर्ज किया गया है।" };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setToken(data.session.access_token);
        localStorage.setItem(TOKEN_KEY, data.session.access_token);
        await loadProfile(data.session.access_token);
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "OTP सत्यापन विफल रहा।" };
    }
  };

  // Dev Session Sign In (For offline / fast evaluation with unique isolated user accounts)
  const devSignIn = async (
    name: string,
    phone?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch("/api/auth/dev-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "नागरिक",
          phone: phone || "+919876543210",
        }),
      });

      if (!res.ok) throw new Error("Dev session creation failed");
      const data = await res.json();

      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      await loadProfile(data.access_token);
      setShowAuthModal(false);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "लॉगिन विफल रहा" };
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      if (isConfigured) {
        await supabase.auth.signOut();
      }
    } catch (_) {}

    setUser(null);
    setSession(null);
    setToken(null);
    setProfile(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  // Delete Account
  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    if (!token) return { success: false, error: "लॉगिन नहीं हैं" };
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("खाता हटाने में त्रुटि हुई");
      await signOut();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const refreshProfile = async () => {
    if (token) {
      await loadProfile(token);
    }
  };

  const updateLocalProfile = (newProf: UserProfile) => {
    setProfile(newProf);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        token,
        profile,
        loading,
        isConfigured,
        showAuthModal,
        setShowAuthModal,
        showOnboardingModal,
        setShowOnboardingModal,
        signInWithGoogle,
        signInWithPhone,
        verifyPhoneOtp,
        devSignIn,
        signOut,
        deleteAccount,
        refreshProfile,
        updateLocalProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

