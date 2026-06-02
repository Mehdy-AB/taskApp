import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isAuthenticated = !!req.auth;
  const { pathname }    = req.nextUrl;

  const isLoginPage = pathname === '/login';
  const isAuthApi   = pathname.startsWith('/api/auth');

  if (isAuthApi) return NextResponse.next();

  if (!isAuthenticated && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\..*).*)', '/'],
};
