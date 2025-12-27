
import type { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Transaction {
  id: string;
  userId: string;
  description: string;
  value: number;
  category: string;
  date: Date;
  dueDate: Date;
  isPaid: boolean;
  isRecurring: boolean;
  installmentIndex: string | null;
  groupId: string | null;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  xp: number;
  level: number;
  streak: number; // monthly savings streak
  lastSavingsDate: Timestamp;
  savingsGoal: number; // Total savings goal for the current "battle pass" cycle (e.g., 10000)
  totalSavings: number; // Total accumulated savings within the current cycle
  savingsCycle: number; // The current "battle pass" cycle/season
}

export interface Summary {
  totalPayable: number;
  totalPaid: number;
  remainingBalance: number;
  totalSaved: number;
}

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};
