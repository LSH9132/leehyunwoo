import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './utils/jwt';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  // 로그인 페이지에서 이미 로그인된 경우 메인으로 리다이렉트
  if (request.nextUrl.pathname === '/login' && token) {
    try {
      verifyToken(token);
      return NextResponse.redirect(new URL('/', request.url));
    } catch (error) {
      request.cookies.delete('auth_token');
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login']
}; 