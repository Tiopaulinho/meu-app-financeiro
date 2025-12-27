'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import AppLayout from '@/components/layout/app-layout';
import type { UserProfile } from '@/lib/types';
import { getUserProfile } from '@/lib/actions/user';
import Logo from '@/components/shared/logo';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, Star } from 'lucide-react';
import { LEVELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


const TROPHY_COLORS = {
    unlocked: "text-yellow-400 fill-yellow-400",
    locked: "text-muted-foreground/50",
};

export default function TrophiesPage() {
  const { user, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      const profile = await getUserProfile(user.uid);
      setUserProfile(profile);
      setLoading(false);
    };

    fetchData();
  }, [user, authLoading]);

  if (authLoading || loading || !user || !userProfile) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-12 w-12 animate-pulse" />
          <p className="text-muted-foreground">Carregando seus troféus...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout user={user} userProfile={userProfile}>
      <main className="flex-1 space-y-4 p-4 md:p-8">
        <h1 className="text-3xl font-bold tracking-tight">Galeria de Troféus</h1>
        <p className="text-muted-foreground">
            Continue economizando para desbloquear todos os troféus e se tornar uma lenda!
        </p>

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 pt-6">
            <TooltipProvider>
                {LEVELS.slice(0, 10).map((level, index) => {
                    const isUnlocked = userProfile.level >= level.level;
                    return (
                    <Tooltip key={index}>
                        <TooltipTrigger asChild>
                            <Card className={cn("flex flex-col items-center justify-center p-6 text-center", isUnlocked ? "bg-card" : "bg-muted/60")}>
                                <Star className={cn("h-16 w-16 mb-4", isUnlocked ? TROPHY_COLORS.unlocked : TROPHY_COLORS.locked)} />
                                <CardTitle className="text-lg">{isUnlocked ? level.name : "Bloqueado"}</CardTitle>
                                {isUnlocked && <CardDescription>Nível {level.level}</CardDescription>}
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Requer {level.xpRequired} EP para desbloquear</p>
                        </TooltipContent>
                    </Tooltip>
                    );
                })}
            </TooltipProvider>
        </div>
      </main>
    </AppLayout>
  );
}
