"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email?: string | null;
  avatar_url?: string | null;
  age?: number | null;
  gender?: string | null;
  marital_status?: string | null;
  state?: string;
  district?: string | null;
  village_or_town?: string | null;
  pincode?: string | null;
  occupation?: string | null;
  employment_status?: string | null;
  annual_income?: number | null;
  monthly_income?: number | null;
  family_size?: number;
  owns_agricultural_land?: boolean;
  landholding?: number | null;
  is_bpl?: boolean;
  caste_category?: string | null;
  has_disability?: boolean;
  disability_percentage?: number | null;
  education_level?: string | null;
  education_status?: string | null;
  course_or_degree?: string | null;
  institution_type?: string | null;
  academic_marks?: number | null;
  has_aadhaar?: boolean;
  has_bank_account?: boolean;
  has_income_certificate?: boolean;
  has_domicile_certificate?: boolean;
  has_ration_card?: boolean;
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
  signInWithEmail: (email: string, password?: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string; url?: string }>;
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
  signInWithEmail: async () => ({ success: false }),
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
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

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
      const res = await fetch(`${API_BASE}/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        // If user logged in with Google/OAuth and profile name is default/empty, sync Google metadata
        const savedUserStr = localStorage.getItem(USER_KEY);
        if (savedUserStr) {
          try {
            const parsedUser = JSON.parse(savedUserStr);
            const meta = parsedUser.user_metadata || {};
            const googleName = meta.full_name || meta.name;
            const googleAvatar = meta.avatar_url || meta.picture;
            if (googleName && (!data.name || data.name === "नागरिक" || data.name === "नया नागरिक")) {
              data.name = googleName;
            }
            if (googleAvatar && !data.avatar_url) {
              data.avatar_url = googleAvatar;
            }
            if (parsedUser.email && !data.email) {
              data.email = parsedUser.email;
            }
          } catch (_) {}
        }
        setProfile(data);
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

  // Google OAuth Sign In using official Supabase Auth & Google Account Chooser
  const signInWithGoogle = async (): Promise<{ error?: string; url?: string }> => {
    if (!isConfigured) {
      return {
        error:
          "Supabase क्रेडेंशियल्स कॉन्फ़िगर नहीं हैं। कृपया frontend/.env.local में NEXT_PUBLIC_SUPABASE_URL और NEXT_PUBLIC_SUPABASE_ANON_KEY दर्ज करें।",
      };
    }

    try {
      const origin =
        typeof window !== "undefined" && window.location.origin
          ? window.location.origin
          : "http://localhost:3000";
      const redirectTo = `${origin}/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            prompt: "select_account",
          },
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        return { error: error.message };
      }

      return { url: data?.url };
    } catch (e: any) {
      return { error: e.message || "Google लॉगिन प्रारंभ करने में विफल" };
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

  // Sign in or Sign up with any Email address
  const signInWithEmail = async (
    email: string,
    password?: string,
    name?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      return { success: false, error: "कृपया एक मान्य ईमेल पता दर्ज करें (उदा. yourname@gmail.com)" };
    }

    try {
      if (isConfigured) {
        // Try Supabase Auth first if configured
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password || "SarkariSaathi@2026",
        });

        if (error) {
          // If login fails, try signing up the user
          const signUpRes = await supabase.auth.signUp({
            email: cleanEmail,
            password: password || "SarkariSaathi@2026",
            options: {
              data: { name: name || cleanEmail.split("@")[0] },
            },
          });

          if (!signUpRes.error && signUpRes.data.session) {
            setSession(signUpRes.data.session);
            setUser(signUpRes.data.session.user);
            setToken(signUpRes.data.session.access_token);
            localStorage.setItem(TOKEN_KEY, signUpRes.data.session.access_token);
            await loadProfile(signUpRes.data.session.access_token);
            setShowAuthModal(false);
            return { success: true };
          }
        } else if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          setToken(data.session.access_token);
          localStorage.setItem(TOKEN_KEY, data.session.access_token);
          await loadProfile(data.session.access_token);
          setShowAuthModal(false);
          return { success: true };
        }
      }

      // Standalone backend email authentication with deterministic UUID isolation
      const res = await fetch(`${API_BASE}/auth/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          password: password || "",
          name: name || "",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "ईमेल प्रमाणीकरण विफल रहा");
      }

      const data = await res.json();
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));

      await loadProfile(data.access_token);
      setShowAuthModal(false);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "ईमेल लॉगिन विफल रहा।" };
    }
  };

  // Dev Session Sign In (For offline / fast evaluation with unique isolated user accounts)
  const devSignIn = async (
    name: string,
    phone?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/dev-session`, {
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
      const res = await fetch(`${API_BASE}/auth/delete-account`, {
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
        signInWithEmail,
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
