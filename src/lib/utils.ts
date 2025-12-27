import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { isSameDay, isYesterday as isYesterdayFns, startOfDay, isSameMonth as isSameMonthFns, subMonths as subMonthsFns } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    ...options,
  }).format(amount);
}

export function isToday(date: Date): boolean {
  return isSameDay(startOfDay(date), startOfDay(new Date()));
}

export function isYesterday(date: Date): boolean {
  return isYesterdayFns(startOfDay(date));
}

export function isSameMonth(date1: Date, date2: Date): boolean {
  return isSameMonthFns(date1, date2);
}

export function subMonths(date: Date, amount: number): Date {
  return subMonthsFns(date, amount);
}
