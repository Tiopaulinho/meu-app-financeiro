'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MonthNavigatorProps {
  currentDate: Date;
  onMonthChange: (direction: 'next' | 'prev') => void;
}

export default function MonthNavigator({ currentDate, onMonthChange }: MonthNavigatorProps) {
  return (
    <Card>
        <CardContent className="p-4 flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => onMonthChange('prev')}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold font-headline text-center capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h3>
            <Button variant="outline" size="icon" onClick={() => onMonthChange('next')}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </CardContent>
    </Card>
  );
}
