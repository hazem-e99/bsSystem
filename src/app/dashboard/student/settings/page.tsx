'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { 
  User, 
  Save,
  Camera,
  CheckCircle,
  AlertCircle,
  X,
  Upload
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { studentProfileAPI, studentAvatarAPI, subscriptionPlansAPI, busAPI } from '@/lib/api';
import { formatDate } from '@/utils/formatDate';

export default function StudentSettingsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profile, setProfile] = useState<unknown>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [plans, setPlans] = useState<unknown[]>([]);
  const [buses, setBuses] = useState<unknown[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank'>('bank');
  const [assignBusId, setAssignBusId] = useState<string>('');
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  
  // Load profile data on component mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        setIsLoadingProfile(true);
        const profileData = await studentProfileAPI.getProfile(user.id);
        if (profileData) {
          setProfile(profileData);
        }
        // Load plans and buses
        try {
          const [p, bResponse] = await Promise.all([
            subscriptionPlansAPI.getAll().catch(() => []),
            busAPI.getAll().catch(() => ({ data: [] })),
          ]);
          setPlans(p || []);
          setBuses(bResponse?.data || []);
        } catch {
          console.warn('Failed to load plans/buses', e);
        }
      } catch {
        console.error('Failed to load profile:', error);
        showToast({
          type: 'error',
          title: 'Error!',
          message: 'Failed to load profile data. Please try again.'
        });
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user, showToast]);

  // Check for changes
  useEffect(() => {
    if (!profile) return;
    
    const hasProfileChanges = 
      profile.name !== user?.name ||
      profile.email !== user?.email ||
      profile.phone !== user?.phone ||
      profile.year !== user?.year;
    
    setHasChanges(hasProfileChanges);
  }, [profile, user]);

  const handleInputChange = (field: string, value: string | number) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile || !user) return;

    try {
      setIsLoading(true);
      const result = await studentAvatarAPI.uploadAvatar(user.id, selectedFile);
      
      if (result.success) {
        // Update local profile state
        setProfile(prev => ({
          ...prev,
          avatar: result.avatar
        }));
        
        setSelectedFile(null);
        
        showToast({
          type: 'success',
          title: 'Success!',
          message: 'Profile photo updated successfully!'
        });
      }
    } catch (error: unknown) {
      console.error('Failed to upload avatar:', error);
      showToast({
        type: 'error',
        title: 'Error!',
        message: error.message || 'Failed to upload photo. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const result = await studentAvatarAPI.removeAvatar(user.id);
      
      if (result.success) {
        // Update local profile state
        setProfile(prev => ({
          ...prev,
          avatar: null
        }));
        
        showToast({
          type: 'success',
          title: 'Success!',
          message: 'Profile photo removed successfully!'
        });
      }
    } catch (error: unknown) {
      console.error('Failed to remove avatar:', error);
      showToast({
        type: 'error',
        title: 'Error!',
        message: error.message || 'Failed to remove photo. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleProfileUpdate = async () => {
    if (!profile || !user) return;
    
    setIsLoading(true);
    try {
      const updatedProfile = await studentProfileAPI.updateProfile(user.id, {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        year: profile.year
      });

      if (updatedProfile) {
        showToast({
          type: 'success',
          title: 'Success!',
          message: 'Profile updated successfully!'
        });
        setHasChanges(false);
        
        // Update user context if needed
        // You might want to update the user context here
      } else {
        throw new Error('Failed to update profile');
      }
    } catch {
      console.error('Failed to update profile:', error);
      showToast({
        type: 'error',
        title: 'Error!',
        message: 'Failed to update profile. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscriptionUpdate = async () => {
    if (!user || !selectedPlan) return;
    try {
      setSubscriptionLoading(true);
      const response = await subscriptionPlansAPI.create({
        studentId: user.id,
        planId: selectedPlan.id,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + selectedPlan.duration * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      });
      if (response) {
        setProfile((prev: User) => ({ ...prev, subscriptionStatus: 'active', subscriptionPlan: selectedPlan }));
        showToast({ type: 'success', title: 'Success!', message: 'Subscription updated' });
      }
    } catch {
      console.error(e);
      showToast({ type: 'error', title: 'Error!', message: 'Failed to update subscription' });
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleAssignBus = async () => {
    if (!user || !assignBusId) return;
    try {
      setSubscriptionLoading(true);
      const response = await busAPI.update(assignBusId, {
        assignedStudents: [...(selectedBus?.assignedStudents || []), user.id]
      });
      if (response) {
        showToast({ type: 'success', title: 'Success!', message: 'Bus assigned successfully' });
      }
    } catch (e: unknown) {
      showToast({ type: 'error', title: 'Error!', message: e.message || 'Failed to assign bus' });
    } finally {
      setSubscriptionLoading(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto shadow-lg"></div>
            <p className="mt-6 text-gray-600 text-lg font-medium">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium mb-2">Failed to load profile</h3>
            <p className="text-gray-500">Unable to load your profile data</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-2xl mx-auto p-6 space-y-8">
        {/* Header with modern design */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-primary-hover rounded-2xl shadow-lg mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-primary to-gray-700 bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-lg text-gray-600 max-w-prose mx-auto">
            Manage your personal information and customize your profile to make it uniquely yours
          </p>
        </div>

        {/* Profile Settings Card with modern design */}
        <div className="relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-3xl blur-3xl"></div>
          
          <Card className="relative bg-white/80 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
            {/* Card header with gradient */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 p-8">
              <CardTitle className="flex items-center space-x-3 text-2xl font-bold text-gray-900">
                <div className="p-3 bg-gradient-to-r from-primary to-primary-hover rounded-xl shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <span>Profile Information</span>
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 mt-2">
                Update your personal information and contact details to keep your profile current
              </CardDescription>
            </div>
            
            <CardContent className="p-8 space-y-8">
              {/* Profile Photo with enhanced design */}
              <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
                <div className="relative group">
                  <div className="w-32 h-32 bg-gradient-to-r from-primary to-primary-hover rounded-full flex items-center justify-center shadow-2xl overflow-hidden ring-4 ring-white ring-offset-4 ring-offset-gray-50 group-hover:ring-primary/30 transition-all duration-300">
                    {profile.avatar ? (
                      <img 
                        src={profile.avatar} 
                        alt="Profile" 
                        className="w-32 h-32 rounded-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-white">
                        {profile.name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  {/* Upload indicator */}
                  {selectedFile && (
                    <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
                      <div className="bg-white rounded-full p-2 shadow-lg">
                        <Upload className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={openFileDialog}
                      disabled={isLoading}
                      className="bg-white hover:bg-primary hover:text-white border-2 border-primary/20 hover:border-primary transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Change Photo
                    </Button>
                    {profile.avatar && (
                      <Button 
                        variant="outline" 
                        size="lg"
                        onClick={handleAvatarRemove}
                        disabled={isLoading}
                        className="bg-white hover:bg-red-500 hover:text-white border-2 border-red-200 hover:border-red-500 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <X className="w-5 h-5 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {/* File preview and upload with modern design */}
                  {selectedFile && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border-2 border-green-200 shadow-lg">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Upload className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Selected File</h4>
                          <p className="text-sm text-gray-600">{selectedFile.name}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <Button 
                          size="lg"
                          onClick={handleAvatarUpload}
                          disabled={isLoading}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                        >
                          {isLoading ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Uploading...</span>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-5 h-5 mr-2" />
                              Upload Photo
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="lg"
                          onClick={() => setSelectedFile(null)}
                          disabled={isLoading}
                          className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>JPG, PNG or GIF. Max size 2MB.</span>
                  </div>
                </div>
              </div>

              {/* Profile Form with modern grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 group-hover:text-primary transition-colors duration-200">
                      Full Name *
                    </label>
                    <Input
                      value={profile.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 text-lg"
                    />
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 group-hover:text-primary transition-colors duration-200">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      value={profile.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email"
                      className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 text-lg"
                    />
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 group-hover:text-primary transition-colors duration-200">
                      Phone Number
                    </label>
                    <Input
                      value={profile.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                      className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300 text-lg"
                    />
                  </div>
                </div>
                
                <div className="space-y-6">
                  
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 group-hover:text-primary transition-colors duration-200">
                      Year of Study
                    </label>
                    <Select
                      value={profile.year?.toString() || '1'}
                      onChange={(e) => handleInputChange('year', parseInt(e.target.value))}
                      options={[
                        { value: '1', label: '1st Year' },
                        { value: '2', label: '2nd Year' },
                        { value: '3', label: '3rd Year' },
                        { value: '4', label: '4th Year' },
                        { value: '5', label: '5th Year' },
                        { value: '6', label: '6th Year' }
                      ]}
                      className="h-12 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-300"
                    />
                  </div>
                  
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 group-hover:text-primary transition-colors duration-200">
                      Student ID
                    </label>
                    <Input
                      value={profile.studentId || ''}
                      placeholder="Student ID"
                      className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                      disabled
                    />
                                         <div className="text-xs text-gray-500 mt-2 flex items-center space-x-2">
                       <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                       <span>Student ID cannot be changed</span>
                     </div>
                  </div>
                </div>
              </div>

              

              {/* Account Info with modern design */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Account Information</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/60 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-sm text-gray-500 mb-1">Member since</p>
                    <p className="font-semibold text-gray-900">{formatDate(profile.createdAt)}</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-4 backdrop-blur-sm">
                    <p className="text-sm text-gray-500 mb-1">Last updated</p>
                    <p className="font-semibold text-gray-900">{formatDate(profile.updatedAt)}</p>
                  </div>
                </div>
              </div>

              
              
              {/* Save Button with modern design */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  {hasChanges ? (
                    <>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-yellow-600">You have unsaved changes</span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-600">All changes saved</span>
                    </>
                  )}
                </div>
                
                <Button 
                  onClick={handleProfileUpdate} 
                  disabled={isLoading || !hasChanges}
                  className="min-w-[140px] h-12 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:transform-none disabled:shadow-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
