"use client";
import { createContext, useContext } from "react";
import type { AccountUser } from "@/lib/auth/user";
export type Account = { user: AccountUser; guest: boolean; apiFetch: typeof fetch; signOut: () => Promise<void> };
export const AccountContext = createContext<Account | null>(null);
export const useAccount = () => useContext(AccountContext);
