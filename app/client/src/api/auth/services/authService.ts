// Stub — will call real backend endpoints when Phase 1 (NestJS auth) is ready

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    displayName: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    imageUrl?: string;
    permissions: string[];
  };
}

export const authService = {
  async login(_data: LoginRequest): Promise<AuthResponse> {
    throw new Error('authService.login: backend not connected yet');
  },

  async refreshToken(_token: string): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number }> {
    throw new Error('authService.refreshToken: backend not connected yet');
  },
};
