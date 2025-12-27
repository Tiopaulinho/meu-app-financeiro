'use client';
import type { User } from 'firebase/auth';
import type { UserProfile } from '@/lib/types';
import Header from './header';

interface AppLayoutProps {
  user: User;
  userProfile: UserProfile;
  children: React.ReactNode;
}

export default function AppLayout({ user, userProfile, children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header user={user} userProfile={userProfile} />
      {children}
    </div>
  );
}
