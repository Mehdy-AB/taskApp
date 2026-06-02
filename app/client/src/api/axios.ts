import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

// ── error type ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: Record<string, unknown>,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function toApiError(err: AxiosError): ApiError {
  const body = (err.response?.data ?? {}) as Record<string, unknown>;
  const msg  = (Array.isArray(body.message) ? body.message[0] : body.message as string)
             ?? err.message
             ?? 'Request failed';
  return new ApiError(err.response?.status ?? 0, body, msg);
}

// ── token state — set by <AuthSync> ──────────────────────────────────────────

let _token: string | null = null;
let _onUnauthorized: (() => void) | null = null;

export function setToken(token: string | null) { _token = token; }
export function setUnauthorizedHandler(fn: () => void) { _onUnauthorized = fn; }

// ── authAxios — public endpoints (login / refresh), no bearer token ──────────

export const authAxios = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

authAxios.interceptors.response.use(
  res => res,
  (err: AxiosError) => Promise.reject(toApiError(err)),
);

// ── apiAxios — protected endpoints ───────────────────────────────────────────

export const apiAxios = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach bearer token on every outgoing request
apiAxios.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_token) config.headers.Authorization = `Bearer ${_token}`;
  return config;
});

// 401 handling: ask next-auth to refresh server-side, then retry
// Multiple simultaneous 401s are queued — only one refresh fires.
let _isRefreshing = false;
const _queue: Array<{
  resolve: (token: string) => void;
  reject:  (err: unknown) => void;
}> = [];

function flushQueue(token: string | null, err: unknown) {
  _queue.splice(0).forEach(({ resolve, reject }) =>
    token ? resolve(token) : reject(err),
  );
}

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

apiAxios.interceptors.response.use(
  res => res,
  async (err: AxiosError) => {
    const original = err.config as RetryableConfig | undefined;

    if (err.response?.status !== 401 || original?._retried || !original) {
      return Promise.reject(toApiError(err));
    }

    // Queue this request while a refresh is already in progress
    if (_isRefreshing) {
      return new Promise<string>((resolve, reject) =>
        _queue.push({ resolve, reject }),
      ).then(token => {
        original._retried = true;
        original.headers.Authorization = `Bearer ${token}`;
        return apiAxios(original);
      });
    }

    original._retried = true;
    _isRefreshing = true;

    try {
      // getSession() hits /api/auth/session → JWT callback runs server-side →
      // calls /auth/refresh if expired → updates the encrypted cookie → returns
      // the session with a fresh accessToken.
      const { getSession } = await import('next-auth/react');
      const session = await getSession() as Record<string, unknown> | null;
      const newToken = session?.accessToken as string | undefined;

      if (!newToken || session?.error === 'RefreshFailed') {
        throw new Error('Session refresh failed');
      }

      setToken(newToken);
      flushQueue(newToken, null);
      original.headers.Authorization = `Bearer ${newToken}`;
      return apiAxios(original);
    } catch (refreshErr) {
      flushQueue(null, refreshErr);
      _onUnauthorized?.();
      return Promise.reject(toApiError(err));
    } finally {
      _isRefreshing = false;
    }
  },
);
