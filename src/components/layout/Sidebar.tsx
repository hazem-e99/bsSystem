'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Users, 
  Bus, 
  CreditCard, 
  BarChart3, 
  Settings,
  Menu,
  X,
  Calendar,
  Bell,
  User,
  LayoutDashboard,
  BookOpen
} from 'lucide-react';
import { UserRole } from '@/types/user';

interface SidebarProps {
  userRole: UserRole;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

const navigationItems = {
  admin: [
    { name: 'Dashboard', href: '/dashboard/admin', icon: Home, disabled: true },
    { name: 'Users', href: '/dashboard/admin/users', icon: Users },
    { name: 'Buses', href: '/dashboard/admin/buses', icon: Bus },
    { name: 'Trips', href: '/trips', icon: Calendar },
    { name: 'Trip Bookings', href: '/dashboard/admin/trip-bookings', icon: BookOpen },
    { name: 'Plans', href: '/dashboard/admin/plans', icon: CreditCard },
    { name: 'Subscriptions', href: '/dashboard/admin/subscriptions', icon: LayoutDashboard, disabled: true },
    { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings, disabled: true },
  ],
  student: [
    { name: 'Dashboard', href: '/dashboard/student', icon: Home, disabled: true },
    { name: 'Bookings', href: '/dashboard/student/bookings', icon: Calendar },
    { name: 'Notifications', href: '/dashboard/student/notifications', icon: Bell, disabled: true },
    { name: 'Subscription', href: '/dashboard/student/subscription', icon: CreditCard },
    { name: 'Profile', href: '/dashboard/student/settings', icon: Settings, disabled: true },
  ],
  supervisor: [
    { name: 'Dashboard', href: '/dashboard/supervisor', icon: Home },
    { name: 'Reports', href: '/dashboard/supervisor/reports', icon: BarChart3 },
    { name: 'Notifications', href: '/dashboard/supervisor/notifications', icon: Bell },
    { name: 'Profile', href: '/dashboard/supervisor/profile', icon: User },
  ],
  'movement-manager': [
    { name: 'Dashboard', href: '/dashboard/movement-manager', icon: Home },
    { name: 'Trips Management', href: '/trips', icon: Calendar },
    { name: 'Buses', href: '/dashboard/movement-manager/buses', icon: Bus },
    { name: 'Profile', href: '/dashboard/movement-manager/profile', icon: User },
  ],
  driver: [
    { name: 'Dashboard', href: '/dashboard/driver', icon: Home },
    { name: 'Notifications', href: '/dashboard/driver/notifications', icon: Bell },
    { name: 'Profile', href: '/dashboard/driver/profile', icon: User },
  ],
};

export const Sidebar = ({ userRole }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const items = navigationItems[userRole] || [];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg border border-border hover:shadow-md transition-all duration-200"
      >
        {isOpen ? <X className="h-6 w-6 text-text-primary" /> : <Menu className="h-6 w-6 text-text-primary" />}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-white to-card-hover shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-border',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-border bg-gradient-to-r from-primary to-primary-hover">
            <h1 className="text-xl font-bold text-white">Bus System</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {items.map((item: NavigationItem) => {
              const isActive = pathname === item.href;
              const isDisabled = item.disabled;
              
              if (isDisabled) {
                return (
                  <div
                    key={item.name}
                    className={cn(
                      'flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                      'text-text-muted cursor-not-allowed opacity-50 bg-gray-100'
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5 text-text-muted" />
                    {item.name}
                    <span className="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                      قريباً
                    </span>
                  </div>
                );
              }
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-primary-light text-primary shadow-sm border border-primary/20'
                      : 'text-text-secondary hover:bg-card-hover hover:text-primary hover:shadow-sm'
                  )}
                >
                  <item.icon className={cn(
                    "mr-3 h-5 w-5 transition-colors duration-200",
                    isActive ? "text-primary" : "text-text-muted group-hover:text-primary"
                  )} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-border bg-gradient-to-r from-card-hover to-white">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary-hover rounded-full flex items-center justify-center shadow-md">
                <span className="text-sm font-semibold text-white">
                  {userRole.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-text-primary capitalize">
                  {userRole}
                </p>
                <p className="text-xs text-text-muted">Active User</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
