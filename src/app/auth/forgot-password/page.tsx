'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardTitle, CardHeader } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Mail, ArrowLeft } from 'lucide-react';
import { authAPI } from '@/lib/api';

function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  
  // Get email from URL if available (for resend functionality)
  useEffect(() => {
    const urlEmail = searchParams.get('email');
    if (urlEmail) {
      setEmail(urlEmail);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      console.log('📧 Sending forgot password request for:', email);
      const data = await authAPI.forgotPassword({ email });

      if (data && data.success) {
        // Show success message
        showToast({ 
          type: 'success', 
          title: 'Email Sent!', 
          message: 'Password reset instructions have been sent to your email.' 
        });
        
        // Redirect to verification page with email
        router.push(`/auth/reset-password-verification?email=${encodeURIComponent(email)}`);
      } else {
        setError(data?.error || 'Failed to send reset email. Please try again.');
        showToast({ 
          type: 'error', 
          title: 'Error!', 
          message: data?.error || 'Failed to send reset email. Please try again.' 
        });
      }
      
    } catch (err) {
      console.error('Failed to send reset email:', err);
      setError('Failed to send reset email. Please try again.');
      showToast({ 
        type: 'error', 
        title: 'Error!', 
        message: 'Failed to send reset email. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/auth/login');
  };



  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Forgot Password?
          </CardTitle>
          <CardDescription className="text-gray-600">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}

            <Button 
              type="submit" 
              disabled={isLoading || !email}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBackToLogin}
                className="flex items-center gap-2 mx-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  );
}
