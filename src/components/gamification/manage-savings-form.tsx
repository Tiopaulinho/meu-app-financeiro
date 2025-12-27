'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

import { updateTotalSavings } from '@/lib/actions/user';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const formSchema = z.object({
  newTotal: z.coerce.number().min(0, "O valor não pode ser negativo."),
});

type FormValues = z.infer<typeof formSchema>;

interface ManageSavingsFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  userId: string;
  currentTotalSavings: number;
  onUpdate: () => void;
}

export default function ManageSavingsForm({
  isOpen,
  setIsOpen,
  userId,
  currentTotalSavings,
  onUpdate,
}: ManageSavingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newTotal: currentTotalSavings,
    },
  });

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      const result = await updateTotalSavings(userId, values.newTotal);
      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: 'Saldo do cofrinho atualizado.',
        });
        setIsOpen(false);
        onUpdate();
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Não foi possível atualizar o saldo.',
          variant: 'destructive',
        });
      }
    });
  };
  
  const handleResetSavings = () => {
      startTransition(async () => {
        const result = await updateTotalSavings(userId, 0);
        if (result.success) {
            toast({
            title: 'Sucesso!',
            description: 'Seu progresso no Passe de Batalha foi zerado.',
            });
            setIsOpen(false);
            onUpdate();
        } else {
            toast({
            title: 'Erro',
            description: result.error || 'Não foi possível zerar o saldo.',
            variant: 'destructive',
            });
        }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Cofrinho</DialogTitle>
          <DialogDescription>
            Ajuste o valor total do seu cofrinho para o Passe de Batalha. Esta ação não afeta suas transações individuais.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newTotal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Novo Saldo Total do Cofrinho</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className='flex-col gap-2 sm:flex-row'>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isPending}>Zerar Progresso</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação zerará seu progresso no Passe de Batalha. Isso não pode ser desfeito.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetSavings} disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Sim, zerar progresso
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
