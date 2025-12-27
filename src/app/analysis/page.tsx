'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import AppLayout from '@/components/layout/app-layout';
import type { UserProfile, Transaction } from '@/lib/types';
import { getUserProfile } from '@/lib/actions/user';
import { getAllTransactions } from '@/services/transactions.client';
import Logo from '@/components/shared/logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import SpendingByCategoryChart from '@/components/analysis/spending-by-category-chart';
import { Loader2 } from 'lucide-react';

export default function AnalysisPage() {
  const { user, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      const [profile, trans] = await Promise.all([
        getUserProfile(user.uid),
        getAllTransactions(user.uid),
      ]);
      setUserProfile(profile);
      setTransactions(trans);
      setLoading(false);
    };

    fetchData();
  }, [user, authLoading]);

  const expenseTransactions = transactions.filter(t => !t.isRecurring || t.date); // Simple filter, assuming all are expenses

  if (authLoading || loading || !user || !userProfile) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-12 w-12 animate-pulse" />
          <p className="text-muted-foreground">Carregando sua análise...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout user={user} userProfile={userProfile}>
      <main className="flex-1 space-y-4 p-4 md:p-8">
        <h1 className="text-3xl font-bold tracking-tight">Análise de Despesas</h1>
        {expenseTransactions.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Sem dados suficientes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Parece que você ainda não tem despesas. Adicione algumas no seu
                Dashboard para começar a ver as análises.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
                <CardDescription>
                  Como seus gastos estão distribuídos este mês.
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                 <SpendingByCategoryChart transactions={expenseTransactions} />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
