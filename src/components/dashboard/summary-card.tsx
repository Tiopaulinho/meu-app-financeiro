'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import type { Summary } from '@/lib/types';
import { PiggyBank } from 'lucide-react';

interface SummaryCardProps {
  summary: Summary;
}

export default function SummaryCard({ summary }: SummaryCardProps) {
  const { totalPayable, totalPaid, remainingBalance, totalSaved } = summary;
  const progressPercentage = totalPayable > 0 ? (totalPaid / totalPayable) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo Mensal</CardTitle>
        <CardDescription>Sua visão geral financeira para este mês.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30">
          <div className='flex items-center gap-3'>
            <PiggyBank className="h-6 w-6 text-emerald-600" />
            <span className="text-emerald-800 dark:text-emerald-300 font-medium">Cofrinho do Mês</span>
          </div>
          <span className="text-xl font-bold font-headline text-emerald-600">{formatCurrency(totalSaved)}</span>
        </div>

        <div className="space-y-2 pt-2">
            <div className="flex justify-between items-baseline">
                <span className="text-muted-foreground">Total Pago</span>
                <span className="text-lg font-bold font-headline text-green-600">{formatCurrency(totalPaid)}</span>
            </div>
            <div className="flex justify-between items-baseline">
                <span className="text-muted-foreground">Restante a Pagar</span>
                <span className="text-md font-semibold text-orange-600">{formatCurrency(remainingBalance)}</span>
            </div>
            <div className="flex justify-between items-baseline">
                <span className="text-muted-foreground">Total de Despesas</span>
                <span className="text-md font-semibold">{formatCurrency(totalPayable)}</span>
            </div>
        </div>

        <div className="pt-2">
            <div className='flex justify-between text-xs text-muted-foreground mb-1'>
                <span>Progresso de Pagamentos</span>
                <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="w-full h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
