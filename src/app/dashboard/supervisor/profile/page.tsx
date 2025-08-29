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
  Star,
  Users,
  Bus,
  Route as RouteIcon,
  MapPin,
  Calendar,
  UserCheck,
  Shield
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { userAPI } from '@/lib/api';

interface SupervisorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  assignedBusId: string;
  assignedRouteId: string;
  assignedStudents: string[];
  assignedDrivers: string[];
}

export default function SupervisorProfilePage() {
  const [profile, setProfile] = useState<SupervisorProfile | null>(null);
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

  // Fetch supervisor profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 Fetching supervisor profile from global API...');
        
        const stored = localStorage.getItem('user');
        const supervisorId = stored ? JSON.parse(stored).id : '';
        if (!supervisorId) {
          setIsLoading(false);
          return;
        }
        const response = await userAPI.getById(supervisorId);
        
        if (response) {
          console.log('📊 Supervisor data loaded:', response);
          setProfile(response);
          setFormData({
            name: response.name || response.fullName || '',
            email: response.email || '',
            phone: response.phone || response.phoneNumber || ''
          });
          setLastRefresh(new Date());
          console.log('✅ Supervisor profile loaded successfully');
        } else {
          throw new Error('Failed to fetch profile');
        }
      } catch (error) {
        console.error('❌ Failed to fetch supervisor profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Please select an image smaller than 5MB');
      return;
    }

    try {
      setIsUploadingImage(true);
      console.log('📸 Uploading new avatar to global API...');

      // Convert image to base64 for storage
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        
        // Update supervisor avatar in global API
        const response = await userAPI.update(profile.id, {
          avatar: base64Image
        });

        if (response) {
          console.log('✅ Avatar updated successfully:', response);
          setProfile(response);
          alert('Profile picture updated successfully!');
        }
      };
      
      reader.readAsDataURL(file);
      
    } catch (error) {
      console.error('❌ Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Trigger file input
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      console.log('💾 Saving supervisor profile to global API...');

      const updated = await userAPI.update(profile.id, { name: formData.name, email: formData.email, phoneNumber: formData.phone });
      if (updated) {
        console.log('✅ Profile updated successfully:', updated);
        setProfile({ ...profile, ...updated } as any);
        setIsEditing(false);
        setLastRefresh(new Date());
        
        // Trigger profile update event for Topbar
        localStorage.setItem('profileUpdated', Date.now().toString());
        window.dispatchEvent(new Event('storage'));
        
        // Also dispatch custom event for immediate update
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedProfile }));
        
        alert('Profile updated successfully!');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('❌ Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || ''
    });
    setIsEditing(false);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'active': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Active' },
      'inactive': { color: 'bg-slate-50 text-slate-700 border-slate-200', text: 'Inactive' },
      'suspended': { color: 'bg-red-50 text-red-700 border-red-200', text: 'Suspended' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    
    return (
      <Badge className={`${config.color} border font-medium px-3 py-1`}>
        {config.text}
      </Badge>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get avatar display
  const getAvatarDisplay = () => {
    if (!profile) return null;
    
    if (profile.avatar && profile.avatar.startsWith('data:image')) {
      // Base64 image
      return (
        <img 
          src={profile.avatar} 
          alt={profile.name}
          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
        />
      );
    } else if (profile.avatar && profile.avatar.startsWith('/avatars/')) {
      // File path image
      return (
        <img 
          src={profile.avatar} 
          alt={profile.name}
          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/avatars/default.jpg';
          }}
        />
      );
    } else {
      // Default avatar
      return (
        <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
          <User className="w-16 h-16 text-white" />
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg text-slate-600 font-medium">Loading profile...</p>
          <p className="text-sm text-slate-500 mt-2">Fetching data from global API</p>
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
          <p className="text-sm text-slate-500">Unable to load supervisor profile</p>
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
                Supervisor Profile
              </h1>
              <p className="text-slate-600 mt-1">Manage your personal information and preferences</p>
              <p className="text-xs text-slate-500 mt-1">
                Last updated: {lastRefresh.toLocaleTimeString()} • Data from global API
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="border-slate-200 hover:bg-slate-100 px-4 py-2 rounded-lg"
                  >
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
                  
                  {/* Image Upload Button */}
                  <Button
                    onClick={handleImageClick}
                    disabled={isUploadingImage}
                    size="sm"
                    className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-white border-2 border-blue-500 hover:bg-blue-50 shadow-lg"
                  >
                    {isUploadingImage ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    ) : (
                      <Camera className="w-4 h-4 text-blue-600" />
                    )}
                  </Button>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900">{profile.name}</CardTitle>
                <CardDescription className="text-slate-600">Bus Supervisor</CardDescription>
                <div className="mt-2">
                  {getStatusBadge(profile.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-600">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{profile.assignedStudents?.length || 0} students assigned</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-slate-600">
                    <Bus className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Bus {profile.assignedBusId || 'Not assigned'}</span>
                  </div>
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
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="border-slate-200 rounded-lg"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                        <User className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-900">{profile.name}</span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Email</label>
                    {isEditing ? (
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="border-slate-200 rounded-lg"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-900">{profile.email}</span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Phone</label>
                    {isEditing ? (
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="border-slate-200 rounded-lg"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                        <Phone className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-900">{profile.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Role</label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <Shield className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-900 capitalize">{profile.role}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignment Information */}
            <Card className="bg-white border-0 shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <RouteIcon className="w-5 h-5 text-emerald-600" />
                  Current Assignment
                </CardTitle>
                <CardDescription>Your current bus and route assignment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Assigned Bus</label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <Bus className="w-4 h-4 text-orange-500" />
                      <span className="text-slate-900">
                        {profile.assignedBusId ? `Bus ${profile.assignedBusId}` : 'Not assigned'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Assigned Route</label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="text-slate-900">
                        {profile.assignedRouteId ? `Route ${profile.assignedRouteId}` : 'Not assigned'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Assigned Students</label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-slate-900">{profile.assignedStudents?.length || 0} students</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Assigned Drivers</label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <User className="w-4 h-4 text-green-500" />
                      <span className="text-slate-900">{profile.assignedDrivers?.length || 0} drivers</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card className="bg-white border-0 shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-purple-600" />
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
                      <span className="text-slate-900">{formatDate(profile.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-2 block">Last Updated</label>
                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-900">{formatDate(profile.updatedAt)}</span>
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
          <p className="text-emerald-700 text-xs">
            Profile data is live and synchronized with global API • Last refresh: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}
