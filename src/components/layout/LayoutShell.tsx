"use client";
import { ReactNode } from "react";
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';

export default function LayoutShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const userRole = user?.role || 'student';

  // Define routes that should not have the main layout (Topbar + Sidebar)
  const authRoutes = [
    '/auth/login',
    '/auth/register', 
    '/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/new-password',
    '/auth/verification',
    '/auth/reset-password-verification'
  ];

  // Check if current route is an auth route
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  // If it's an auth route, render children without layout
  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  // Regular layout for all other routes
  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole={userRole} />
      <div className="lg:ml-64">
        <Topbar />
        <main className="pt-4">{children}</main>
      </div>
    </div>
  );
}
