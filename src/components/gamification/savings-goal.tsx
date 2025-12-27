'use client';

import type { UserProfile } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Flame, Star, Target, Trophy, Settings } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { LEVELS, BATTLE_PASS_GOAL } from '@/lib/constants';
import { Button } from '../ui/button';
import ManageSavingsForm from './manage-savings-form';
import { useState } from 'react';

interface SavingsGoalProps {
  userProfile: UserProfile;
  monthlySavings: number; // This is the sum of "cofrinho" transactions for the current month.
  onUpdate: () => void;
}

export default function SavingsGoal({ userProfile, monthlySavings, onUpdate }: SavingsGoalProps) {
  const { xp, level, streak, totalSavings, savingsCycle } = userProfile;
  const [isManageFormOpen, setIsManageFormOpen] = useState(false);

  // XP Progress Calculation
  const currentLevelData = LEVELS.find(l => l.level === level) ?? LEVELS[0];
  const nextLevelIndex = LEVELS.findIndex(l => l.level === level) + 1;
  const nextLevelData = LEVELS[nextLevelIndex < LEVELS.length ? nextLevelIndex : LEVELS.length - 1];

  const xpForNextLevel = nextLevelData ? nextLevelData.xpRequired - currentLevelData.xpRequired : 0;
  const xpProgressInLevel = xp - currentLevelData.xpRequired;
  const xpProgressPercentage = nextLevelData && xpForNextLevel > 0 ? (xpProgressInLevel / xpForNextLevel) * 100 : 100;
  
  // Battle Pass (Total Savings) Progress Calculation
  const savingsProgressPercentage = BATTLE_PASS_GOAL > 0 ? (totalSavings / BATTLE_PASS_GOAL) * 100 : 0;

  return (
    <>
    <Card className="p-4 space-y-4 relative">
        <div className="absolute top-2 right-2">
            <Button variant="ghost" size="icon" onClick={() => setIsManageFormOpen(true)}>
                <Settings className="w-5 h-5 text-muted-foreground" />
            </Button>
        </div>
        {/* Battle Pass Goal Section */}
        <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
                <Trophy className="w-6 h-6 text-primary" />
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Passe de Batalha Financeiro (Ciclo {savingsCycle})</p>
                    <p className="text-xl font-bold font-headline">{formatCurrency(BATTLE_PASS_GOAL)}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">Progresso Total</p>
                <p className="text-xl font-bold font-headline text-emerald-600">{formatCurrency(totalSavings)}</p>
            </div>
        </div>
        <div>
            <Progress value={savingsProgressPercentage} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2 text-center">
               {BATTLE_PASS_GOAL - totalSavings > 0 ? `${formatCurrency(BATTLE_PASS_GOAL - totalSavings)} restantes para completar o passe!` : "Passe de Batalha completo! 🎉"}
            </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
             {/* Level Section */}
            <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-yellow-400" fill="currentColor" />
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Nível {level}</p>
                    <p className="text-lg font-bold font-headline">{currentLevelData.name}</p>
                </div>
            </div>
             {/* XP Section */}
            <div className="flex flex-col justify-center">
                 <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-muted-foreground">Progresso de Nível</p>
                    <p className="text-sm font-semibold">
                        {Math.floor(xp)} / {nextLevelData ? nextLevelData.xpRequired : 'Max'} EP
                    </p>
                </div>
                <Progress value={xpProgressPercentage} className="h-2" />
                 <p className="text-xs text-muted-foreground mt-1 text-center">
                    {nextLevelData && nextLevelData.level > level ? `${Math.ceil(nextLevelData.xpRequired - xp)} EP para Nv. ${nextLevelData.level}` : "Nível máximo do passe!"}
                </p>
            </div>
            {/* Streak Section */}
            <div className="flex items-center gap-3 justify-end">
                <Flame className="w-8 h-8 text-orange-500" fill="currentColor" />
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Sequência</p>
                    <p className="text-lg font-bold font-headline">{streak} {streak === 1 ? 'mês' : 'meses'}</p>
                </div>
            </div>
        </div>
    </Card>
    <ManageSavingsForm 
        isOpen={isManageFormOpen}
        setIsOpen={setIsManageFormOpen}
        userId={userProfile.uid}
        currentTotalSavings={userProfile.totalSavings}
        onUpdate={onUpdate}
    />
    </>
  );
}
