'use client';

import { createContext, useEffect, useState, ReactNode, useContext } from 'react';
import { onIdTokenChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getOrCreateUserProfile } from '@/lib/actions/user';
import { useRouter, usePathname } from 'next/navigation';
import Logo from '../shared/logo';
import type { UserProfile } from '@/lib/types';


interface AuthContextType {
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        
        // Ensure user profile is created on the client side after login.
        const plainUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        await getOrCreateUserProfile(plainUser);

      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    const isAuthPage = pathname === '/login';

    // If user is not logged in and not on an authentication page, redirect to login
    if (!user && !isAuthPage) {
      router.replace('/login');
    }

    // If user is logged in and on an authentication page, redirect to home
    if (user && isAuthPage) {
      router.replace('/');
    }
  }, [user, loading, pathname, router]);

  if (loading && pathname === '/login') {
     return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <Logo className="h-12 w-12" />
                <div className="space-y-2 text-center">
                    <p className="text-muted-foreground">Autenticando...</p>
                </div>
            </div>
        </div>
     )
  }

    // For protected routes, show a full-screen loader
    if (loading && pathname !== '/login') {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Logo className="h-12 w-12 animate-pulse" />
                    <p className="text-muted-foreground">Carregando...</p>
                </div>
            </div>
        );
    }
  
  // Prevent rendering children on auth pages when auth state is not yet determined or mismatched
  if (!loading) {
    const isAuthPage = pathname === '/login';
    if (!user && !isAuthPage) {
      return null; 
    }
    if (user && isAuthPage) {
      return null;
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
