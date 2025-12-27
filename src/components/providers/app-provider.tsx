'use client';

import { AuthProvider } from '@/components/providers/auth-provider';
import { FirebaseErrorListener } from '../firebase/FirebaseErrorListener';

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <FirebaseErrorListener />
    </AuthProvider>
  );
}
