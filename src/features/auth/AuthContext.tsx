import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../../lib/supabaseClient";
import { resolveDisplayName } from "../../domain/displayName";
import { shouldShowAuthLoading } from "../../domain/authLoading";

const FALLBACK_DISPLAY_NAME = "Trainer";
const FALLBACK_AVATAR = "https://api.dicebear.com/7.x/bottts/svg";

export interface AuthUser {
  uid: string;
  id: string;
  email?: string;
  /** 'student' khi Edge Function đặt app_metadata.role = 'student' (Phase 4); còn lại là giáo viên. */
  role: 'teacher' | 'student';
}

interface UserProfile {
  displayName: string;
  photoURL: string;
  email?: string;
}

interface SignUpResult {
  needsEmailConfirmation: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName: string) => Promise<SignUpResult>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (displayName: string, photoURL: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getMetadataProfile = (usr: SupabaseUser): UserProfile => ({
  displayName: resolveDisplayName(usr.user_metadata?.display_name, usr.user_metadata?.full_name),
  photoURL: usr.user_metadata?.photo_url || usr.user_metadata?.avatar_url || FALLBACK_AVATAR,
  email: usr.email || ""
});

const toAuthUser = (usr: SupabaseUser): AuthUser => ({
  uid: usr.id,
  id: usr.id,
  email: usr.email || "",
  role: usr.app_metadata?.role === "student" ? "student" : "teacher"
});

const normalizeAuthError = (message?: string) => {
  const raw = message || "";
  const lower = raw.toLowerCase();
  if (lower.includes("invalid login credentials")) return "Tên đăng nhập/email hoặc mật khẩu không chính xác.";
  if (lower.includes("banned")) return "Tài khoản này hiện không đăng nhập được. Hãy hỏi giáo viên của bạn.";
  if (lower.includes("email not confirmed")) return "Email chưa được xác nhận. Vui lòng mở email Supabase đã gửi và bấm link xác nhận.";
  if (lower.includes("already registered") || lower.includes("already exists")) return "Địa chỉ Email này đã được sử dụng.";
  if (lower.includes("password")) return "Mật khẩu không hợp lệ hoặc quá yếu (cần tối thiểu 6 ký tự).";
  if (lower.includes("email")) return "Địa chỉ Email không hợp lệ.";
  return raw || "Có lỗi xảy ra khi xác thực.";
};

const ensureProfile = async (usr: SupabaseUser): Promise<UserProfile> => {
  const fallback = getMetadataProfile(usr);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      user_id: usr.id,
      email: usr.email || "",
      display_name: fallback.displayName,
      photo_url: fallback.photoURL,
      last_login_at: now,
      updated_at: now
    }, { onConflict: "user_id" })
    .select("email, display_name, photo_url")
    .single();

  if (error) {
    console.error("Error syncing Supabase profile:", error);
    return fallback;
  }

  return {
    displayName: data.display_name || fallback.displayName,
    photoURL: data.photo_url || fallback.photoURL,
    email: data.email || fallback.email
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUidRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const syncSessionUser = async (usr: SupabaseUser | null) => {
      if (!isMounted) return;
      const nextUid = usr?.id ?? null;
      // Cùng một người dùng (quay lại tab, làm mới token): cập nhật âm thầm, không hiện loading.
      if (shouldShowAuthLoading(currentUidRef.current, nextUid)) setLoading(true);
      currentUidRef.current = nextUid;

      if (!usr) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const nextUser = toAuthUser(usr);
      // Giữ nguyên tham chiếu nếu không đổi, để các effect phụ thuộc `user` không chạy lại.
      setUser((prev) => (prev && prev.uid === nextUser.uid && prev.email === nextUser.email && prev.role === nextUser.role ? prev : nextUser));
      setProfile(getMetadataProfile(usr));

      const syncedProfile = await ensureProfile(usr);
      if (!isMounted) return;
      setProfile(syncedProfile);
      setLoading(false);
    };

    supabase.auth.getSession()
      .then(({ data }) => syncSessionUser(data.session?.user || null))
      .catch((error) => {
        console.error("Error reading Supabase session:", error);
        if (isMounted) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSessionUser(session?.user || null);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const assertConfigured = () => {
    if (!isSupabaseConfigured) {
      throw new Error("Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY. Vui lòng kiểm tra Environment Variables trên Vercel.");
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    assertConfigured();
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      console.error("Supabase email login failure:", error);
      throw new Error(normalizeAuthError(error.message));
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName: string): Promise<SignUpResult> => {
    assertConfigured();
    const defaultAvatar = "https://api.dicebear.com/7.x/adventurer/svg?seed=" + encodeURIComponent(displayName || "Sỹ Phu");
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          display_name: displayName || FALLBACK_DISPLAY_NAME,
          photo_url: defaultAvatar
        }
      }
    });

    if (error) {
      console.error("Supabase email sign up failure:", error);
      throw new Error(normalizeAuthError(error.message));
    }

    if (data.user && data.session) {
      await ensureProfile(data.user);
    }

    return { needsEmailConfirmation: !data.session };
  };

  const signInWithGoogle = async () => {
    assertConfigured();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) {
      console.error("Supabase Google sign in failure:", error);
      alert("Đăng nhập Google thất bại. Vui lòng kiểm tra Google Provider và Redirect URLs trong Supabase Auth.");
      throw error;
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updateUserProfile = async (displayName: string, photoURL: string) => {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        display_name: displayName,
        photo_url: photoURL
      }
    });

    if (error) {
      console.error("Failed to update Supabase auth profile:", error);
      throw error;
    }

    if (!data.user) return;

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        user_id: data.user.id,
        email: data.user.email || "",
        display_name: displayName,
        photo_url: photoURL,
        updated_at: new Date().toISOString()
      }, { onConflict: "user_id" });

    if (profileError) {
      console.error("Failed to update Supabase profile row:", profileError);
      throw profileError;
    }

    setProfile((prev) => prev ? { ...prev, displayName, photoURL } : { displayName, photoURL });
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      loginWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      logout,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
