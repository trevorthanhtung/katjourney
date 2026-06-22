import { useState, useEffect } from "react";
import type { User } from "../services/authService";
import { observeAuthState } from "../services/authService";

export interface UseAuthResult {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  provider: "google" | "guest" | null;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = observeAuthState((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const isAuthenticated = !!user;
  
  let provider: "google" | "guest" | null = null;
  if (user) {
    if (user.isAnonymous) {
      provider = "guest";
    } else {
      const isGoogle = user.providerData.some((p) => p.providerId === "google.com");
      provider = isGoogle ? "google" : null;
    }
  }

  return {
    user,
    loading,
    isAuthenticated,
    provider,
  };
}
