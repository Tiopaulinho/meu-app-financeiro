'use client';

import { useState } from 'react';
import type { Transaction } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { updateTransactionStatus, deleteTransaction, updateTransaction } from '@/services/transactions.client';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, ArrowDownCircle, MoreVertical, Edit, AlertTriangle, Save, XCircle, PiggyBank, ArrowUpCircle } from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format, parse } from 'date-fns';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';


interface TransactionItemProps {
  transaction: Transaction;
  userId: string;
  onStatusChange: () => void;
}

type DeleteScope = 'single' | 'all';

export default function TransactionItem({ transaction, userId, onStatusChange }: TransactionItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteScope, setDeleteScope] = useState<DeleteScope>('single');

  // State for inline editing
  const [editedDescription, setEditedDescription] = useState(transaction.description);
  const [editedValue, setEditedValue] = useState(transaction.value.toString());
  const [editedCategory, setEditedCategory] = useState(transaction.category);
  const [editedDueDate, setEditedDueDate] = useState(format(transaction.dueDate, 'dd/MM/yyyy'));


  const { toast } = useToast();

  const handleCheckedChange = async (checked: boolean) => {
    if (transaction.category === 'Savings') return;
    setIsLoading(true);
    const result = await updateTransactionStatus(transaction.id, checked, userId);
    if (result.success) {
      onStatusChange();
      if(checked) {
        toast({
          title: 'Boa!',
          description: 'Despesa marcada como paga.',
        });
      }
    } else {
      toast({
        title: 'Ops!',
        description: result.error || 'Houve um problema ao atualizar a transação.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteTransaction(transaction.id, userId, deleteScope, transaction.groupId);
    if (result.success) {
      toast({ title: 'Sucesso!', description: 'Transação excluída.' });
      onStatusChange(); // Recarrega a lista
    } else {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
    }
    setIsDeleting(false);
    setIsAlertOpen(false);
  };

  const handleSave = async () => {
      setIsLoading(true);
      const dueDateObject = parse(editedDueDate, 'dd/MM/yyyy', new Date());

      if (isNaN(dueDateObject.getTime())) {
          toast({ title: 'Erro', description: 'Data de vencimento inválida.', variant: 'destructive' });
          setIsLoading(false);
          return;
      }

      const payload = {
        description: editedDescription,
        value: parseFloat(editedValue),
        category: editedCategory,
        dueDate: dueDateObject,
      }

      const result = await updateTransaction(transaction.id, userId, payload);

      if (result.success) {
        toast({ title: 'Sucesso!', description: 'Transação atualizada.' });
        onStatusChange();
        setIsEditing(false);
      } else {
        toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      }
      setIsLoading(false);
  };

  const handleCancel = () => {
      setIsEditing(false);
      // Reset state to original transaction values
      setEditedDescription(transaction.description);
      setEditedValue(transaction.value.toString());
      setEditedCategory(transaction.category);
      setEditedDueDate(format(transaction.dueDate, 'dd/MM/yyyy'));
  };
  

  const openConfirmation = (scope: DeleteScope) => {
    setDeleteScope(scope);
    setIsAlertOpen(true);
  }

  const categoryLabel = CATEGORIES.find(c => c.value === transaction.category)?.label ?? transaction.category;
  const isGrouped = !!transaction.groupId;
  const isSavings = transaction.category === 'Savings';

  const isOverdue = !isSavings && !transaction.isPaid && new Date(transaction.dueDate) < new Date();

  if (isEditing) {
    return (
        <div className="flex items-center gap-4 rounded-lg border border-primary p-3 transition-all bg-card">
            <div className="grid gap-2 flex-1">
                <Input 
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="font-medium"
                />
                 <div className="flex items-center gap-2">
                    <Select value={editedCategory} onValueChange={setEditedCategory}>
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Input 
                      value={editedDueDate}
                      onChange={(e) => setEditedDueDate(e.target.value)}
                      placeholder="DD/MM/AAAA"
                      className="h-8 text-xs w-[120px]"
                    />
                 </div>
            </div>
             <Input 
                type="number"
                value={editedValue}
                onChange={(e) => setEditedValue(e.target.value)}
                className="font-semibold text-right w-24 h-8"
              />
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={handleSave} disabled={isLoading}>
                 {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4" />}
              </Button>
               <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleCancel} disabled={isLoading}>
                 <XCircle className="h-4 w-4" />
              </Button>
            </div>
        </div>
    );
  }


  return (
    <>
      <div
        className={cn(
          'flex items-center gap-4 rounded-lg border p-3 transition-all',
          transaction.isPaid ? 'bg-muted/50' : 'bg-card',
          isOverdue && 'border-destructive'
        )}
      >
        <div className="flex items-center justify-center gap-3">
            {isSavings ? <ArrowUpCircle className="h-5 w-5 text-emerald-500" /> : <ArrowDownCircle className="h-5 w-5 text-red-500" />}

            {isLoading ? <Loader2 className="h-5 w-5 animate-spin"/> :
              isSavings ? <div className="w-5 h-5" /> :
              <Checkbox
                  id={`paid-${transaction.id}`}
                  checked={transaction.isPaid}
                  onCheckedChange={handleCheckedChange}
                  className="h-5 w-5"
              />
            }
        </div>
        <div className="grid gap-1 flex-1">
          <p className={cn("font-medium", transaction.isPaid && !isSavings && 'line-through text-muted-foreground')}>
            {transaction.description}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant={isSavings ? "default" : "secondary"} className={isSavings ? 'bg-emerald-600' : ''}>{categoryLabel}</Badge>
              {transaction.installmentIndex && <Badge variant="outline"> {transaction.installmentIndex}</Badge>}
              {transaction.isRecurring && <Badge variant="outline">Recorrente</Badge>}
              {!isSavings && <span>Vencimento: {format(transaction.dueDate, 'dd/MM/yyyy')}</span>}
          </div>
           {isOverdue && (
            <div className="flex items-center gap-1 text-destructive text-xs font-semibold">
                <AlertTriangle className="h-3 w-3" />
                <span>Vencido</span>
            </div>
           )}
        </div>
        <div className={cn(
          "font-semibold text-right",
          isSavings ? 'text-emerald-600' : 'text-foreground',
          transaction.isPaid && !isSavings && 'line-through text-muted-foreground'
          )}>
          {isSavings ? '+' : '-'}{formatCurrency(transaction.value)}
        </div>
        <div className="flex items-center">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Editar</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => openConfirmation('single')} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Excluir esta</span>
                    </DropdownMenuItem>
                    {isGrouped && (
                        <DropdownMenuItem onSelect={() => openConfirmation('all')} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Excluir todas</span>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

       <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteScope === 'single'
                ? 'Esta ação não pode ser desfeita. Isso excluirá permanentemente esta transação.'
                : 'Isso excluirá permanentemente TODAS as transações relacionadas a este grupo (recorrências/parcelas).'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
