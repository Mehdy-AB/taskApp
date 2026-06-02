'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/src/lib/use-theme';

export default function LoginPage() {
  const router          = useRouter();
  const { isDark, toggle } = useTheme();

  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', { email, password, redirect: false });

      // next-auth v5: wrong credentials throw CredentialsSignin before we get here,
      // but handle the returned-error case too just in case.
      if (result?.error) {
        setError('Wrong email or password.');
        return;
      }

      router.replace('/home');
    } catch (err: unknown) {
      const type = (err as { type?: string })?.type;
      const name = err instanceof Error ? err.name : '';

      if (type === 'CredentialsSignin' || name === 'CredentialsSignin') {
        setError('Wrong email or password.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F8F9FF] dark:bg-slate-950 transition-colors flex items-center justify-center px-4">

      {/* Theme toggle — top-right corner */}
      <button
        suppressHydrationWarning
        onClick={toggle}
        className="absolute top-4 right-4 w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </button>

      <div className="relative w-full max-w-md">

        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#364dff] to-[#667aff] shadow-lg transform -skew-y-2 sm:-rotate-3 rounded-3xl opacity-80" />

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="relative bg-white dark:bg-slate-900 px-8 py-10 rounded-3xl shadow-xl transition-colors"
        >

          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#364dff] to-[#667aff] flex items-center justify-center text-white shadow-md shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              Employee<span className="text-[#364dff] font-extrabold">Directory</span>
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">Welcome back</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Sign in to your account to continue.</p>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">

            {/* Email */}
            <div className="relative">
              <input
                id="email"
                type="email"
                placeholder="Email address"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="peer w-full h-11 border-b-2 border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 text-sm placeholder-transparent focus:outline-none focus:border-[#364dff] dark:focus:border-[#667aff] transition-colors"
              />
              <label
                htmlFor="email"
                className="absolute left-0 -top-4 text-slate-500 dark:text-slate-400 text-xs transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-2.5 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-[#364dff] dark:peer-focus:text-[#667aff]"
              >
                Email address
              </label>
            </div>

            {/* Password */}
            <div className="relative">
              <input
                id="password"
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="peer w-full h-11 border-b-2 border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 text-sm placeholder-transparent focus:outline-none focus:border-[#364dff] dark:focus:border-[#667aff] transition-colors"
              />
              <label
                htmlFor="password"
                className="absolute left-0 -top-4 text-slate-500 dark:text-slate-400 text-xs transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-2.5 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-[#364dff] dark:peer-focus:text-[#667aff]"
              >
                Password
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#364dff] to-[#667aff] text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:opacity-90 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              )}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}
