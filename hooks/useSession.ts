"use client";

import { useCallback, useEffect, useState } from "react";
import { clearSession, getSession, setSession, type SessionUser } from "@/lib/session";

export function useSession() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    setUser(getSession());
  }, []);

  const login = useCallback((sessionUser: SessionUser) => {
    setSession(sessionUser);
    setUser(sessionUser);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return { user, login, logout };
}
