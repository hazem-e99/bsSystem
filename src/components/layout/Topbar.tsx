'use client';

import { useState, useEffect } from 'react';
import { Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { notificationAPI, settingsAPI, studentProfileAPI, userAPI } from '@/lib/api';
import { formatDate, getRelativeTime } from '@/utils/formatDate';
import { Badge } from '@/components/ui/Badge';

export const Topbar = () => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [systemLogo, setSystemLogo] = useState('/logo.png');
  const [systemName, setSystemName] = useState('University Bus Management System');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');

  // Fetch system settings (logo and name)
  useEffect(() => {
    const fetchSystemSettings = async () => {
      try {
        const settings = await settingsAPI.get();
        setSystemLogo(settings?.logo || '/logo.png');
        setSystemName(settings?.systemName || 'University Bus Management System');
      } catch (error: any) {
        // Ignore 404s silently
        if (error?.message?.includes('404')) {
          setSystemLogo('/logo.png');
          setSystemName('University Bus Management System');
          return;
        }
        console.error('Failed to fetch system settings:', error);
      }
    };

    fetchSystemSettings();
  }, []);

  // Fetch user profile data (including avatar) from db.json
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        // Fetch profile for all user types from db.json
        const profile = await userAPI.getById(user.id);
        if (profile) {
          setUserProfile(profile);
          console.log('👤 User profile loaded from db.json:', profile);
        }
      } catch (error) {
        console.error('Failed to fetch user profile from db.json:', error);
        // Use user context data as fallback
        setUserProfile({
          id: user.id,
          name: user.fullName || user.name,
          email: user.email,
          role: user.role,
          avatar: null
        });
      }
    };

    fetchUserProfile();

    // Listen for profile updates from other components
    const handleProfileUpdate = () => {
      console.log('🔄 Profile update detected, refreshing user profile...');
      fetchUserProfile();
    };

    // Listen for storage events (when profile is updated)
    window.addEventListener('storage', handleProfileUpdate);
    
    // Also listen for custom events
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('storage', handleProfileUpdate);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [user]);

  // Fetch notifications for the current user
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      
      try {
        setIsLoadingNotifications(true);
        const userNotifications = await notificationAPI.getByUser(user.id);
        setNotifications(userNotifications);
      } catch (error: any) {
        // Ignore 404s silently
        if (error?.message?.includes('404')) {
          setNotifications([]);
        } else {
          console.error('Failed to fetch notifications:', error);
          setNotifications([]);
        }
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    fetchNotifications();
  }, [user]);

  // Update notifications when they change
  useEffect(() => {
    if (notifications.length > 0) {
      // Re-fetch notifications to ensure count is accurate
      const refreshNotifications = async () => {
        if (!user) return;
        try {
          const userNotifications = await notificationAPI.getByUser(user.id);
          setNotifications(userNotifications);
        } catch (error) {
          console.error('Failed to refresh notifications:', error);
        }
      };
      
      refreshNotifications();
    }
  }, [notifications.filter((n: any) => !n.read).length, user]);

  const userNotifications = notifications || [];
  const unreadCount = userNotifications.filter((n: any) => !n.read).length;

  const handleLogout = () => {
    logout();
  };

  const handleNotificationClick = async (notification: any) => {
    if (!user) return;
    
    try {
      // Mark notification as read in the database
      await notificationAPI.markAsRead(notification.id);
      
      // Update local state to mark notification as read
      setNotifications(prev => 
        prev.map((n: any) => 
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
      
      // Close notifications dropdown
      setShowNotifications(false);
      
      // Navigate to action URL if provided; otherwise, go to role-specific notifications page
      const fallbackUrl = user.role === 'supervisor'
        ? '/dashboard/supervisor/notifications'
        : user.role === 'student'
          ? '/dashboard/student/notifications'
          : '/';
      const target = notification.actionUrl || fallbackUrl;
      window.location.href = target;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Still mark as read locally and navigate
      setNotifications(prev => 
        prev.map((n: any) => 
          n.id === notification.id ? { ...n, read: true } : n
        )
      );
      setShowNotifications(false);
      
      // Navigate to action URL if provided; otherwise, go to role-specific notifications page
      const fallbackUrl = user.role === 'supervisor'
        ? '/dashboard/supervisor/notifications'
        : user.role === 'student'
          ? '/dashboard/student/notifications'
          : '/';
      const target = notification.actionUrl || fallbackUrl;
      window.location.href = target;
    }
  };

  const handleClearAllRead = async () => {
    if (!user) return;
    
    try {
      // Clear all read notifications from the database
      const result = await notificationAPI.clearReadNotifications(user.id);
      
      if (result && result.success) {
        // Update local state to remove read notifications
        setNotifications(prev => prev.filter((n: any) => !n.read));
        
        // Close notifications dropdown
        setShowNotifications(false);
        
        console.log(`Cleared ${result.deletedCount} read notifications`);
      } else {
        // Fallback: manually clear read notifications from local state
        setNotifications(prev => prev.filter((n: any) => !n.read));
        setShowNotifications(false);
        console.log('Used fallback method to clear read notifications');
      }
    } catch (error) {
      console.error('Failed to clear read notifications:', error);
      // Fallback: manually clear read notifications from local state
      setNotifications(prev => prev.filter((n: any) => !n.read));
      setShowNotifications(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      // Mark all notifications as read in the database
      const result = await notificationAPI.markAllAsRead(user.id);
      
      if (result && result.success) {
        // Update local state to mark all notifications as read
        setNotifications(prev => prev.map((n: any) => ({ ...n, read: true })));
        
        // Close notifications dropdown
        setShowNotifications(false);
        
        console.log(`Marked ${result.updatedCount} notifications as read`);
      } else {
        // Fallback: manually mark all notifications as read in local state
        setNotifications(prev => prev.map((n: any) => ({ ...n, read: true })));
        setShowNotifications(false);
        console.log('Used fallback method to mark all notifications as read');
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      // Fallback: manually mark all notifications as read in local state
      setNotifications(prev => prev.map((n: any) => ({ ...n, read: true })));
      setShowNotifications(false);
    }
  };

  // Get user avatar - use profile avatar if available, otherwise fallback to initial
  const getUserAvatar = () => {
    if (userProfile?.avatar) {
      // Check if it's a base64 image or file path
      if (userProfile.avatar.startsWith('data:image')) {
        return userProfile.avatar; // Base64 image
      } else if (userProfile.avatar.startsWith('/avatars/')) {
        return userProfile.avatar; // File path
      }
    }
    return null;
  };

  // Get user display name - use profile name if available, otherwise fallback to user context
  const getUserDisplayName = () => {
    if (userProfile?.name) {
      return userProfile.name;
    }
    return user?.name || 'User';
  };

  const displayNotifications = (notifFilter === 'all' ? userNotifications : userNotifications.filter((n: any) => !n.read));
  const fallbackUrl = user?.role === 'supervisor' ? '/dashboard/supervisor/notifications' : user?.role === 'student' ? '/dashboard/student/notifications' : '/';

  return (
    <div className="bg-white border-b border-border px-6 py-4 w-full shadow-sm">
      <div className="flex items-center justify-between">
        {/* Logo and System Name - positioned after sidebar space */}
        <div className="flex items-center space-x-4 ml-0 lg:ml-64">
          <div className="flex items-center space-x-3 group cursor-pointer hover:bg-card-hover p-2 rounded-lg transition-all duration-200">
            <div className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center overflow-hidden rounded-lg shadow-sm group-hover:shadow-md transition-all duration-200">
              {systemLogo ? (
                <img 
                  src={systemLogo} 
                  alt="System Logo" 
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-primary to-primary-hover rounded-lg flex items-center justify-center group-hover:from-primary-hover group-hover:to-primary transition-all duration-200">
                  <span className="text-sm lg:text-lg font-bold text-white">B</span>
                </div>
              )}
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base lg:text-lg font-bold text-text-primary truncate max-w-48 lg:max-w-none group-hover:text-primary transition-colors duration-200">
                {systemName}
              </h1>
              <p className="text-xs text-text-muted hidden lg:block group-hover:text-text-secondary transition-colors duration-200">
                Bus Management System
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Notifications and User Menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 text-text-muted hover:text-text-primary hover:bg-card-hover rounded-lg transition-all duration-200"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-warning text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-[26rem] bg-white rounded-xl shadow-2xl border border-border z-50 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-border bg-gradient-to-r from-card-hover to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-text-primary">Notifications</h3>
                      <Badge color="secondary" className="text-xs">{unreadCount} new</Badge>
                    </div>
                    {userNotifications.length > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setNotifFilter('all')}
                          className={`text-xs px-3 py-1 rounded-full border transition ${notifFilter === 'all' ? 'bg-primary text-white border-primary' : 'text-text-secondary hover:bg-card-hover border-border'}`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setNotifFilter('unread')}
                          className={`text-xs px-3 py-1 rounded-full border transition ${notifFilter === 'unread' ? 'bg-primary text-white border-primary' : 'text-text-secondary hover:bg-card-hover border-border'}`}
                        >
                          Unread
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* List */}
                <div className="max-h-96 overflow-y-auto">
                  {displayNotifications.length > 0 ? (
                    displayNotifications.map((notification: any) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-border-light hover:bg-card-hover cursor-pointer transition-colors duration-200 ${
                          !notification.read ? 'bg-primary-light/30 border-l-4 border-l-primary' : ''
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={`mt-1 w-9 h-9 rounded-lg flex items-center justify-center shadow-sm ${
                            notification.type === 'booking' ? 'bg-primary/10 text-primary' :
                            notification.type === 'announcement' ? 'bg-secondary/10 text-secondary' :
                            'bg-warning/10 text-warning'
                          }`}>
                            <Bell className="w-4 h-4" />
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <p className={`text-sm font-semibold truncate pr-3 ${!notification.read ? 'text-primary' : 'text-text-primary'}`}>{notification.title || 'Notification'}</p>
                              {!notification.read && (
                                <span className="mt-1 inline-block w-2 h-2 rounded-full bg-primary" />
                              )}
                            </div>
                            {notification.message && (
                              <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{notification.message}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-[11px] text-text-muted">
                              <span>{getRelativeTime(notification.createdAt || notification.date || (notification.timestamp ? new Date(notification.timestamp) : new Date()))}</span>
                              {notification.stopName && <span>• Pickup: {notification.stopName}</span>}
                              {notification.busId && <span>• Bus: {notification.busId}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-text-muted">
                      <div className="mx-auto w-12 h-12 rounded-full bg-card-hover flex items-center justify-center mb-3">
                        <Bell className="w-5 h-5" />
                      </div>
                      <p className="text-sm">No notifications to show</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-border bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs px-3 py-1 rounded-md bg-primary text-white hover:bg-primary-hover transition"
                    >
                      Mark all read
                    </button>
                    <button
                      onClick={handleClearAllRead}
                      className="text-xs px-3 py-1 rounded-md bg-secondary text-white hover:bg-secondary-hover transition"
                    >
                      Clear read
                    </button>
                  </div>
                  <a href={fallbackUrl} className="text-xs px-3 py-1 rounded-md border border-border hover:bg-card-hover transition">View all</a>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2.5 text-text-muted hover:text-text-primary hover:bg-card-hover rounded-lg transition-all duration-200"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary-hover rounded-full flex items-center justify-center shadow-md overflow-hidden">
                {getUserAvatar() ? (
                  <img 
                    src={getUserAvatar()} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold text-white">
                    {getUserDisplayName().charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="hidden md:block text-sm font-semibold text-text-primary">
                {getUserDisplayName()}
              </span>
              <User className="h-4 w-4" />
            </button>

            {/* User dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-lg border border-border z-50">
                <div className="py-2">
                  <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-card-hover to-white">
                    <p className="text-sm font-semibold text-text-primary">{getUserDisplayName()}</p>
                    <p className="text-xs text-text-muted capitalize">{user?.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm text-text-secondary hover:bg-card-hover hover:text-text-primary flex items-center space-x-2 transition-colors duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowNotifications(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </div>
  );
};

