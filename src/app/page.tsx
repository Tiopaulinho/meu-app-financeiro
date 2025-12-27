'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { getUserProfile, checkAndUpdateStreakOnLogin } from '@/lib/actions/user';
import DashboardClient from '@/components/dashboard/dashboard-client';
import type { UserProfile, Transaction } from '@/lib/types';
import { useEffect, useState } from 'react';
import Logo from '@/components/shared/logo';
import AppLayout from '@/components/layout/app-layout';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    userProfile: UserProfile;
  } | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      router.replace('/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      await checkAndUpdateStreakOnLogin(user.uid);
      const userProfile = await getUserProfile(user.uid);

      if (!userProfile) {
        // This might happen if Firestore profile creation is slow.
        // Let's refresh to try again.
        setTimeout(() => router.refresh(), 1000);
        return;
      }
      
      setData({ userProfile });
      setLoading(false);
    };

    fetchData();
  }, [user, authLoading, router]);

  if (authLoading || loading || !data || !user) {
    return (
       <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
           <div className="flex flex-col items-center gap-4">
               <Logo className="h-12 w-12 animate-pulse" />
               <p className="text-muted-foreground">Carregando seu painel...</p>
           </div>
       </div>
    );
  }

  // Set initial empty state for transactions and summary, they will be fetched in DashboardClient
  const initialTransactions: Transaction[] = [];
  const initialSummary = { totalPayable: 0, totalPaid: 0, remainingBalance: 0, totalSaved: 0 };

  return (
    <AppLayout user={user} userProfile={data.userProfile}>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <DashboardClient
          userProfile={data.userProfile}
          initialTransactions={initialTransactions}
          initialSummary={initialSummary}
          userId={user.uid}
        />
      </main>
    </AppLayout>
  );
}
