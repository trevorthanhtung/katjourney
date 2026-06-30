import { supabase } from "../lib/supabase";

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  providerData: { providerId: string }[];
}

/**
 * Maps a Supabase Auth User object to the custom KatUser interface.
 */
export function mapSupabaseUser(sbUser: any): User | null {
  if (!sbUser) return null;

  const isAnonymous =
    sbUser.is_anonymous ||
    !sbUser.app_metadata?.provider ||
    sbUser.app_metadata?.provider === "anonymous";

  const isGoogle =
    sbUser.app_metadata?.provider === "google" ||
    sbUser.identities?.some((id: any) => id.provider === "google");

  return {
    uid: sbUser.id,
    email: sbUser.email || null,
    displayName:
      sbUser.user_metadata?.full_name ||
      sbUser.user_metadata?.name ||
      sbUser.email?.split("@")[0] ||
      "Khách",
    photoURL: sbUser.user_metadata?.avatar_url || null,
    isAnonymous: isAnonymous,
    providerData: isGoogle ? [{ providerId: "google.com" }] : [],
  };
}

/**
 * Maps Supabase authentication errors to user-friendly Vietnamese messages.
 */
export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return "Đã xảy ra lỗi không xác định.";
  if (typeof error === "string") return error;

  const message = error.message || "";
  const status = error.status;

  if (message.includes("Invalid login credentials") || message.includes("invalid_credentials")) {
    return "Thông tin xác thực tài khoản không chính xác, vui lòng thử lại.";
  }
  if (message.includes("Email already in use") || message.includes("User already exists")) {
    return "Địa chỉ email này đã được sử dụng bởi một tài khoản khác.";
  }
  if (
    message.includes("Password should be") ||
    message.includes("Signup requires a valid password")
  ) {
    return "Mật khẩu quá yếu. Mật khẩu cần có ít nhất 6 ký tự.";
  }
  if (message.includes("identity_already_exists") || message.includes("already linked")) {
    return "Tài khoản Google này đã được liên kết với một tài khoản khác.";
  }
  if (status === 429 || message.includes("too many requests")) {
    return "Hệ thống đang quá tải hoặc bạn thao tác quá nhanh. Vui lòng thử lại sau.";
  }

  return message || "Đã xảy ra lỗi trong quá trình xác thực.";
}

/**
 * Signs in anonymously as a Guest.
 */
export async function signInAsGuest(): Promise<User> {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    if (!data.user) throw new Error("Đăng nhập ẩn danh thất bại.");
    return mapSupabaseUser(data.user)!;
  } catch (error: any) {
    console.error("[AuthService] signInAsGuest error:", error);
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/**
 * Signs in using Google OAuth with optional account linking for guest sessions.
 */
export async function signInWithGoogle(): Promise<User> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const currentUser = session?.user;

    if (currentUser && currentUser.is_anonymous) {
      console.log("[AuthService] Linking anonymous guest to Google account...", currentUser.id);

      const { data, error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        // If Google account is already in use by another user record
        if (
          error.message.includes("identity_already_exists") ||
          error.message.includes("already linked")
        ) {
          console.log("[AuthService] Google account already linked, signing in directly...");
          const { error: oAuthError } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: window.location.origin,
              queryParams: { prompt: "select_account" },
            },
          });
          if (oAuthError) throw oAuthError;
          return null as any;
        }
        throw error;
      }
      return null as any;
    } else {
      console.log("[AuthService] Initiating standard Google Sign-In...");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
      return null as any;
    }
  } catch (error: any) {
    console.error("[AuthService] signInWithGoogle error:", error);
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/**
 * Signs out the user. If they are anonymous, deletes their guest account.
 */
export async function signOutUser(): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const currentUser = session?.user;

    if (currentUser && currentUser.is_anonymous) {
      console.log("[AuthService] Deleting anonymous user to clean up database...");
      try {
        await deleteCurrentUser();
      } catch (delErr) {
        console.warn("[AuthService] Self deletion failed, signing out:", delErr);
        await supabase.auth.signOut();
      }
    } else {
      await supabase.auth.signOut();
      console.log("[AuthService] User signed out successfully.");
    }
  } catch (error: any) {
    console.error("[AuthService] signOutUser error:", error);
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/**
 * Updates the display name of the user.
 */
export async function updateUserDisplayName(name: string): Promise<void> {
  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: name,
      },
    });
    if (error) throw error;
    console.log("[AuthService] Display name updated successfully:", name);
  } catch (error: any) {
    console.error("[AuthService] updateUserDisplayName error:", error);
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/**
 * Gets the current logged in user.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return mapSupabaseUser(session?.user);
  } catch (error) {
    console.error("[AuthService] getCurrentUser error:", error);
    return null;
  }
}

/**
 * Observes active authentication state changes.
 */
export function observeAuthState(callback: (user: User | null) => void): () => void {
  // Fire initial state
  supabase.auth.getSession().then(({ data: { session } }) => {
    callback(mapSupabaseUser(session?.user));
  });

  // Listen to changes
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    console.log(`[AuthService] Auth State Changed: ${event}`);
    callback(mapSupabaseUser(session?.user));
  });

  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Registers a new account using Email and Password.
 */
export async function signUpWithEmailAndPassword(
  email: string,
  password: string,
  fullName: string
): Promise<User> {
  try {
    console.log("[AuthService] Registering user with email/password...");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;
    if (!data.user) throw new Error("Đăng ký tài khoản thất bại.");
    return mapSupabaseUser(data.user)!;
  } catch (error: any) {
    console.error("[AuthService] signUpWithEmailAndPassword error:", error);
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/**
 * Signs in using Email and Password.
 */
export async function signInWithEmailAndPassword(email: string, password: string): Promise<User> {
  try {
    console.log("[AuthService] Logging in user with email/password...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (!data.user) throw new Error("Đăng nhập thất bại.");
    return mapSupabaseUser(data.user)!;
  } catch (error: any) {
    console.error("[AuthService] signInWithEmailAndPassword error:", error);
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/**
 * Deletes the current user via secure database RPC function.
 */
export async function deleteCurrentUser(): Promise<void> {
  console.log("[AuthService] Attempting to delete current user...");
  const { error } = await supabase.rpc("delete_user");
  if (error) {
    console.error("[AuthService] RPC delete_user failed, signing out as fallback:", error);
    await supabase.auth.signOut();
  } else {
    await supabase.auth.signOut();
  }
}

/**
 * Ensures an anonymous user session is active.
 */
export async function ensureAnonymousUser(): Promise<any> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session?.user) return session.user;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.user;
}
