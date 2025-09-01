import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Handle logout routing
  if (pathname === '/logout') {
    // Allow access to logout page
    return NextResponse.next();
  }
  
  // Handle dashboard routing
  if (pathname === '/dashboard') {
    // Get user from cookie
    const userCookie = request.cookies.get('user');
    
    if (userCookie) {
      try {
        const user = JSON.parse(decodeURIComponent(userCookie.value));
        const role = user.role?.toLowerCase() || 'student';
        const redirectUrl = `/dashboard/${role}`;
        
        console.log('🔄 Middleware redirecting to:', redirectUrl);
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      } catch (error: unknown) {
        console.error('Error parsing user cookie:', error);
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    } else {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  // Handle case sensitivity issues
  if (pathname.includes('/dashboard/Student')) {
    return NextResponse.redirect(new URL(pathname.replace('/Student', '/student'), request.url));
  }
  
  if (pathname.includes('/dashboard/Admin')) {
    return NextResponse.redirect(new URL(pathname.replace('/Admin', '/admin'), request.url));
  }
  
  if (pathname.includes('/dashboard/Supervisor')) {
    return NextResponse.redirect(new URL(pathname.replace('/Supervisor', '/supervisor'), request.url));
  }
  
  if (pathname.includes('/dashboard/Driver')) {
    return NextResponse.redirect(new URL(pathname.replace('/Driver', '/driver'), request.url));
  }
  
  if (pathname.includes('/dashboard/Movement-manager')) {
    return NextResponse.redirect(new URL(pathname.replace('/Movement-manager', '/movement-manager'), request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/logout',
    '/dashboard',
    '/dashboard/:path*',
  ],
};
