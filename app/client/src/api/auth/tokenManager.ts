import { getSession, signOut } from 'next-auth/react';

export class TokenManager {
  private static instance: TokenManager;
  private accessToken: string | null = null;

  private constructor() {}

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  public async init(): Promise<void> {
    const session = await getSession();
    if (session?.accessToken) {
      this.accessToken = session.accessToken as string;
    }
  }

  public getAccessTokenSync(): string | null {
    return this.accessToken;
  }

  public async getAccessToken(): Promise<string | null> {
    if (this.accessToken) return this.accessToken;
    const session = await getSession();
    this.accessToken = (session?.accessToken as string) ?? null;
    return this.accessToken;
  }

  public clear(): void {
    this.accessToken = null;
  }

  public async handleAuthFailure(): Promise<void> {
    this.accessToken = null;
    await signOut({ redirect: false });
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
  }
}

export const tokenManager = TokenManager.getInstance();
