import { http } from '../http';
import type { LoginRequest, LoginResponse, AuthUser } from './auth.types';

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const res = await http.post<LoginResponse>('/auth/login', data);
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('user', JSON.stringify(res.user));
    return res;
  },

  me(): Promise<AuthUser> {
    return http.get<AuthUser>('/auth/me');
  },

  clearSession(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  },

  logout(): void {
    this.clearSession();
    window.location.href = '/login';
  },

  getStoredUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem('accessToken'));
  },
};
