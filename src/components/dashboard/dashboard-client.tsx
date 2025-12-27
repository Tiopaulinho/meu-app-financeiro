
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { addMonths, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { UserProfile, Transaction, Summary } from '@/lib/types';
import { startOfMonth, endOfMonth } from 'date-fns';

import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { FirestorePermissionError } from '@/components/firebase/errors';
import { errorEmitter } from '@/components/firebase/error-emitter';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2 } from 'lucide-react';

import SavingsGoal from '@/components/gamification/savings-goal';
import MonthNavigator from './month-navigator';
import SummaryCard from './summary-card';
import TransactionList from '../transactions/transaction-list';
import TransactionForm from '../transactions/transaction-form';
import Confetti from '../shared/confetti';
import type { SecurityRuleContext } from '@/lib/types';
import { getUserProfile } from '@/lib/actions/user';


interface DashboardClientProps {
  userProfile: UserProfile;
  initialTransactions: Transaction[];
  initialSummary: Summary;
  userId: string;
}

export default function DashboardClient({
  userProfile: initialProfile,
  initialTransactions,
  initialSummary,
  userId,
}: DashboardClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [summary, setSummary] = useState<Summary>(initialSummary);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(initialProfile);
  
  const hasUnpaidExpenses = useMemo(() => {
    return transactions.some(t => !t.isPaid);
  }, [transactions]);
  
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const allPaid = transactions.length > 0 && transactions.every(t => t.isPaid || t.category === 'Savings');
    if (allPaid) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000); // Confetti por 3 segundos
      return () => clearTimeout(timer);
    }
  }, [transactions]);


  const fetchDashboardData = useCallback(async (date: Date) => {
    if (!userId) return;
    setIsLoading(true);
    
    try {
      const startDate = startOfMonth(date);
      const endDate = endOfMonth(date);
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('userId', '==', userId),
        where('dueDate', '>=', startDate),
        where('dueDate', '<=', endDate),
        orderBy('dueDate', 'desc')
      );

      const [querySnapshot, profile] = await Promise.all([
        getDocs(q),
        getUserProfile(userId)
      ]);
      
      const newTransactions: Transaction[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        newTransactions.push({
          id: doc.id,
          ...data,
          date: (data.date as Timestamp).toDate(),
          dueDate: data.dueDate ? (data.dueDate as Timestamp).toDate() : (data.date as Timestamp).toDate(),
        } as Transaction);
      });
      
      setTransactions(newTransactions);
      if (profile) {
        setUserProfile(profile);
      }

      const newSummary = newTransactions.reduce(
        (acc: Summary, t) => {
          if (t.category === 'Savings') {
            acc.totalSaved += t.value;
          } else {
            acc.totalPayable += t.value;
            if (t.isPaid) {
              acc.totalPaid += t.value;
            }
          }
          return acc;
        },
        { totalPayable: 0, totalPaid: 0, remainingBalance: 0, totalSaved: 0 }
      );
      newSummary.remainingBalance = newSummary.totalPayable - newSummary.totalPaid;
      setSummary(newSummary);

    } catch (serverError) {
      console.error(serverError);
      const permissionError = new FirestorePermissionError({
          path: 'transactions', // Simplified path for collection group
          operation: 'list',
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const handleMonthChange = (direction: 'next' | 'prev') => {
    const newDate = direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    setCurrentDate(newDate);
  };
  
  useEffect(() => {
    fetchDashboardData(currentDate);
  }, [fetchDashboardData, currentDate]);

  const handleDataUpdate = () => {
    fetchDashboardData(currentDate);
  };

  const formattedDate = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="grid gap-4">
        <SavingsGoal userProfile={userProfile} monthlySavings={summary.totalSaved} onUpdate={handleDataUpdate} />
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Transações do Mês</CardTitle>
              <p className="text-sm text-muted-foreground">
                Suas despesas e depósitos no cofrinho em {formattedDate}.
              </p>
            </div>
            <Button size="sm" className="ml-auto gap-1 bg-accent hover:bg-accent/90" onClick={() => setIsFormOpen(true)}>
                <PlusCircle className="h-4 w-4" />
                Adicionar
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <TransactionList 
                  transactions={transactions} 
                  userId={userId}
                  onTransactionUpdate={handleDataUpdate}
                />
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
            <MonthNavigator
                currentDate={currentDate}
                onMonthChange={handleMonthChange}
            />
            <SummaryCard summary={summary} />
        </div>
      </div>
      <TransactionForm 
        isOpen={isFormOpen} 
        setIsOpen={setIsFormOpen}
        userId={userId} 
        onTransactionUpdate={handleDataUpdate}
      />
    </>
  );
}
