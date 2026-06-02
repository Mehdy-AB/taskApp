import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

// ── type augmentation ────────────────────────────────────────────────────────

declare module 'next-auth' {
  interface User {
    role: string;
    accessToken: string;
    refreshToken: string;
  }
  interface Session {
    accessToken: string;
    error?: 'RefreshFailed';
    user: DefaultSession['user'] & {
      id: string;
      role: string;
    };
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    role: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExp: number;
    error?: 'RefreshFailed';
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────

function decodeExp(token: string): number {
  try {
    const raw = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return (JSON.parse(atob(raw)) as { exp: number }).exp;
  } catch {
    return Math.floor(Date.now() / 1000) + 15 * 60;
  }
}

// ── config ───────────────────────────────────────────────────────────────────

const API = (process.env.API_URL ?? 'http://localhost:3001') + '/api';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    { type: 'email'    },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const res = await fetch(`${API}/auth/login`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email: credentials.email, password: credentials.password }),
          });
          if (!res.ok) return null;
          const data = await res.json();
          return {
            id:           String(data.user.id),
            email:        data.user.email,
            role:         data.user.role,
            accessToken:  data.accessToken,
            refreshToken: data.refreshToken,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 },

  callbacks: {
    async jwt({ token, user }) {
      // Initial sign-in: store both tokens
      if (user) {
        token.role         = user.role;
        token.accessToken  = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExp = decodeExp(user.accessToken);
        return token;
      }

      // Access token still valid
      if (token.accessTokenExp * 1000 > Date.now()) return token;

      // Access token expired — attempt silent refresh
      try {
        const res = await fetch(`${API}/auth/refresh`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ refreshToken: token.refreshToken }),
        });
        if (!res.ok) throw new Error('refresh failed');
        const data = await res.json() as { accessToken: string };
        return {
          ...token,
          accessToken:    data.accessToken,
          accessTokenExp: decodeExp(data.accessToken),
          error:          undefined,
        };
      } catch {
        return { ...token, error: 'RefreshFailed' as const };
      }
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.id     = token.sub ?? '';
      session.user.role   = token.role;
      if (token.error) session.error = token.error;
      return session;
    },
  },

  pages: { signIn: '/login' },
});
