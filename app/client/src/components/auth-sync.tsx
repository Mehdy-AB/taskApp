'use client';

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { setToken, setUnauthorizedHandler } from '@/src/api/http';

export function AuthSync() {
  const { data: session } = useSession();

  useEffect(() => {
    // Push the backend JWT into the http module on every session change
    setToken((session as any)?.accessToken ?? null);

    // Refresh token itself expired or refresh call failed — force sign-out
    if ((session as any)?.error === 'RefreshFailed') {
      signOut({ callbackUrl: '/login' });
    }
  }, [session]);

  useEffect(() => {
    // Register the signOut callback so http module can trigger it on 401
    setUnauthorizedHandler(() => signOut({ callbackUrl: '/login' }));
  }, []);

  return null;
}
