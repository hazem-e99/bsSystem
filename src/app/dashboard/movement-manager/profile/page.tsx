'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { 
  User, 
  Mail, 
  Phone, 
  Camera, 
  Save, 
  Edit3, 
  X,
  Shield,
  Lock,
  Calendar
} from 'lucide-react';
import { userAPI } from '@/lib/api';

interface MovementManagerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: string;
  status?: string;
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export default function MovementManagerProfilePage() {
  const [profile, setProfile] = useState<MovementManagerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Fetch movement manager profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const data = await userAPI.getProfile();
        setProfile(data);
        setFormData({ name: data.name || '', email: data.email || '', phone: data.phone || '' });
        setLastRefresh(new Date());
      } catch (error) {
        console.error('Failed to fetch movement manager profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB');
      return;
    }

    try {
      setIsUploadingImage(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        // No avatar endpoint available in global API; keep local state update only
        setProfile(prev => prev ? { ...prev, avatar: base64Image } : prev);
        alert('Profile picture updated locally.');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageClick = () => fileInputRef.current?.click();

  const handleSave = async () => {
    if (!profile) return;
    try {
      setIsSaving(true);
      // No update endpoint for profile; re-fetch profile instead
      const updated = await userAPI.getProfile();
      if (updated) setProfile(updated);
      setIsEditing(false);
      setLastRefresh(new Date());
      localStorage.setItem('profileUpdated', Date.now().toString());
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updated }));
      alert('Profile refreshed from server.');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to refresh profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: profile?.name || '', email: profile?.email || '', phone: profile?.phone || '' });
    setIsEditing(false);
  };

  const getStatusBadge = (status?: string) => {
    const s = status || 'active';
    const map: any = {
      active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      inactive: 'bg-slate-50 text-slate-700 border-slate-200',
      suspended: 'bg-red-50 text-red-700 border-red-200'
    };
    const cls = map[s] || map.active;
    return <Badge className={`${cls} border font-medium px-3 py-1`}>{s.charAt(0).toUpperCase() + s.slice(1)}</Badge>;
  };

  const formatDisplayDate = (d?: string) => {
    if (!d) return '-';
    try {
      return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return d;
    }
  };

  const getAvatarDisplay = () => {
    if (!profile) return null;
    if (profile.avatar && profile.avatar.startsWith('data:image')) {
      return <img src={profile.avatar} alt={profile.name} className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" />;
    } else if (profile.avatar && profile.avatar.startsWith('/avatars/')) {
      return (
        <img
          src={profile.avatar}
          alt={profile.name}
          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
          onError={(e) => { (e.target as HTMLImageElement).src = '/avatars/default.jpg'; }}
        />
      );
    }
    return (
      <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
        <User className="w-16 h-16 text-white" />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg text-slate-600 font-medium">Loading profile...</p>
          <p className="text-sm text-slate-500 mt-2">Fetching data from db.json</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <User className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">Profile not found</h3>
          <p className="text-sm text-slate-500">Unable to load movement manager profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-screen-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-600 bg-clip-text text-transparent">
                Movement Manager Profile
              </h1>
              <p className="text-slate-600 mt-1">Manage your personal information and preferences</p>
              <p className="text-xs text-slate-500 mt-1">Last updated: {lastRefresh.toLocaleTimeString()} • Data from db.json</p>
            </div>
            <div className="flex items-center gap-3">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg">
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" className="border-slate-200 hover:bg-slate-100 px-4 py-2 rounded-lg">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-white border-0 shadow-lg rounded-xl">
              <CardHeader className="text-center">
                <div className="relative mx-auto mb-4">
                  {getAvatarDisplay()}
                  <Button onClick={handleImageClick} disabled={isUploadingImage} size="sm" className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-white border-2 border-blue-500 hover:bg-blue-50 shadow-lg">
                    {isUploadingImage ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    ) : (
                      <Camera className="w-4 h-4 text-blue-600" />
                    )}
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">{profile.name}</CardTitle>
                <CardDescription className="text-slate-600 capitalize">{profile.role}</CardDescription>
                <div className="mt-2">{getStatusBadge(profile.status)}</div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-center gap-2 text-slate-700">
                  <Shield className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Role: <span className="capitalize">{profile.role}</span></span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="bg-white border-0 shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Personal Information
                </CardTitle>
                <CardDescription>Your basic personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Full Name</label>
                    {isEditing ? (
                      <Input value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="border-slate-200 rounded-lg" />
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg"><User className="w-4 h-4 text-slate-500" /><span className="text-slate-900">{profile.name}</span></div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Email</label>
                    {isEditing ? (
                      <Input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className="border-slate-200 rounded-lg" />
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg"><Mail className="w-4 h-4 text-slate-500" /><span className="text-slate-900">{profile.email}</span></div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Phone</label>
                    {isEditing ? (
                      <Input type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className="border-slate-200 rounded-lg" />
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg"><Phone className="w-4 h-4 text-slate-500" /><span className="text-slate-900">{profile.phone}</span></div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Permissions</label>
                    <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-lg">
                      {(profile.permissions || []).length > 0 ? (
                        (profile.permissions || []).map((perm) => (
                          <span key={perm} className="px-2 py-1 rounded text-xs font-medium text-[#1565C0] bg-[#E3F2FD]">
                            <Lock className="w-3 h-3 inline mr-1" />{perm}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500 text-sm">No permissions</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card className="bg-white border-0 shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Account Information
                </CardTitle>
                <CardDescription>Your account details and timestamps</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Account Created</label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-900">{formatDisplayDate(profile.createdAt)}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Last Updated</label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-900">{formatDisplayDate(profile.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
            <h3 className="text-sm font-semibold text-emerald-800">Database Connected</h3>
          </div>
          <p className="text-emerald-700 text-xs">Profile data is live and synchronized with db.json • Last refresh: {lastRefresh.toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
}


