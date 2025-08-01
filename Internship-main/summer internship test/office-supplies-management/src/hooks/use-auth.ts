'use client';

import { useState } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting login with:', email);
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('Login result:', result);

      if (result?.error) {
        console.error('Login error:', result.error);
        setError('Invalid email or password. Please check your credentials and try again.');
        return false;
      } else {
        console.log('Login successful, redirecting to dashboard');
        // Use window.location.href for more reliable navigation after authentication
        // This avoids RSC-related navigation issues
        window.location.href = '/dashboard';
        return true;
      }
    } catch (error) {
      console.error('Login exception:', error);
      setError('An error occurred during authentication. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut({ redirect: false });
      // Use window.location.href for consistent navigation behavior
      window.location.href = '/auth/signin';
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to log out. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    logout,
    isLoading,
    error,
  };
}