import { authAxios } from '../axios';
import type { LoginRequest, LoginResponse, AuthUser } from './auth.types';

export const authService = {
  login(data: LoginRequest): Promise<LoginResponse> {
    return authAxios.post<LoginResponse>('/auth/login', data).then(r => r.data);
  },

  me(): Promise<AuthUser> {
    return authAxios.get<AuthUser>('/auth/me').then(r => r.data);
  },
};
