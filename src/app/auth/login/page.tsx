'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Eye, EyeOff } from 'lucide-react';
import { validateLogin } from '@/utils/validateLogin';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate form data
    const validation = validateLogin({ email, password, rememberMe });
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(email, password, rememberMe);
      if (success) {
        // Get user role from auth context and redirect accordingly
        const userRole = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).role : 'student';
        const dashboardPath = `/dashboard/${userRole.toLowerCase()}`;
        console.log('🔄 Redirecting to:', dashboardPath);
        router.push(dashboardPath);
      } else {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email.trim().length >= 5 && password.trim().length >= 1;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F7FAFF] via-[#EEF4FF] to-white" />
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-secondary/10 blur-3xl" />

      <div className="relative grid grid-cols-1 lg:grid-cols-2 min-h-screen">
      {/* Illustration Panel */}
      <div className="relative hidden lg:flex items-center justify-center p-10 bg-gradient-to-br from-primary-light to-white">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true" />
        <div className="max-w-xl w-full">
          <img
            src="/bus-login.png"
            alt="School bus illustration"
            className="w-full h-auto drop-shadow-2xl"
          />
          {/* Floating cards for creative touch */}
          <div className="mt-10 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/80 backdrop-blur-xl border border-white/40 p-4 shadow-md">
              <p className="text-sm text-text-secondary">Real-time trips</p>
              <p className="text-lg font-semibold text-text-primary">Track bus statuses</p>
            </div>
            <div className="rounded-xl bg-white/80 backdrop-blur-xl border border-white/40 p-4 shadow-md">
              <p className="text-sm text-text-secondary">Smart payments</p>
              <p className="text-lg font-semibold text-text-primary">Cash & bank methods</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Login Form */}
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30 shadow-[0_0_0_1px_rgba(255,255,255,0.25)]">
          <Card className="shadow-xl border border-white/40 bg-white/80 backdrop-blur-xl rounded-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription className="text-base">Enter your credentials to access your dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-text-primary mb-2">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-text-primary mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <span className="text-sm text-text-secondary">Remember me</span>
                  </label>
                </div>

                {error && (
                  <div className="text-error text-sm bg-red-50 border border-red-200 p-4 rounded-lg">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading || !isFormValid}>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/auth/forgot-password" className="text-sm text-primary hover:text-primary-hover font-medium">
                  Forgot your password?
                </Link>
              </div>

              <p className="mt-4 text-center text-xs text-text-muted">
                By continuing, you agree to our Terms and Privacy Policy.
              </p>

              <div className="mt-6 text-center">
                <span className="text-sm text-text-muted">Don&apos;t have an account? </span>
                <Link href="/register" className="text-sm text-primary hover:text-primary-hover font-medium">
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>
          </div>

          
        </div>
      </div>
      </div>
    </div>
  );
} 