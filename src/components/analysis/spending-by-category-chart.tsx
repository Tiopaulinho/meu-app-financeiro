'use client';

import * as React from 'react';
import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Transaction } from '@/lib/types';
import { CATEGORIES } from '@/lib/constants';
import { useMemo } from 'react';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface SpendingByCategoryChartProps {
  transactions: Transaction[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#f97316',
  '#14b8a6',
  '#8b5cf6',
  '#ec4899',
  '#64748b'
];

export default function SpendingByCategoryChart({ transactions }: SpendingByCategoryChartProps) {
  const chartData = useMemo(() => {
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);

    const expensesThisMonth = transactions.filter(
      t => isWithinInterval(t.date, { start: currentMonthStart, end: currentMonthEnd })
    );

    if (expensesThisMonth.length === 0) {
      return [];
    }

    const spendingByCategory = expensesThisMonth.reduce((acc, transaction) => {
      const categoryLabel = CATEGORIES.find(c => c.value === transaction.category)?.label ?? transaction.category;
      acc[categoryLabel] = (acc[categoryLabel] || 0) + transaction.value;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(spendingByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  if (chartData.length === 0) {
    return <div className="flex h-48 items-center justify-center text-muted-foreground">Nenhuma despesa este mês.</div>
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          cursor={{ fill: 'hsl(var(--muted))' }}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          labelLine={false}
          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
            const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
            const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
            return (
              <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12px">
                {`${(percent * 100).toFixed(0)}%`}
              </text>
            );
          }}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Legend
            iconSize={10}
            layout="vertical"
            verticalAlign="middle"
            align="right"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
