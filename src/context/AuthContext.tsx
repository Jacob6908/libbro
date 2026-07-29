import { createContext } from "react";
import type { User, AuthError, AuthResponse } from "@supabase/supabase-js";

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signInWithEmail: (
    email: string,
    password: string
  ) => Promise<{ data: AuthResponse["data"]; error: AuthError | null }>;
  signUpWithEmail: (
    email: string,
    password: string
  ) => Promise<{ data: AuthResponse["data"]; error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (
    email: string
  ) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  resendConfirmationEmail: (
    email: string
  ) => Promise<{ error: AuthError | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
