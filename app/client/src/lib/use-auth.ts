'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/src/api/auth/auth.service';
import type { AuthUser } from '@/src/api/auth/auth.types';

function isTokenExpired(token: string): boolean {
  try {
    const raw = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(raw)) as { exp: number };
    return exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = authService.getToken();

    if (!token || isTokenExpired(token)) {
      authService.clearSession();
      router.replace('/login');
      return;
    }

    setUser(authService.getStoredUser());
    setReady(true);
  }, [router]);

  return { user, ready, logout: () => authService.logout() };
}
