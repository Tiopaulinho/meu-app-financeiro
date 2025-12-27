import type { Transaction } from '@/lib/types';
import TransactionItem from './transaction-item';

interface TransactionListProps {
  transactions: Transaction[];
  userId: string;
  onTransactionUpdate: () => void;
}

export default function TransactionList({ transactions, userId, onTransactionUpdate }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Nenhuma transação para este mês.</p>
        <p className="text-sm text-muted-foreground">Adicione uma para começar!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((transaction) => (
        <TransactionItem 
            key={transaction.id} 
            transaction={transaction}
            userId={userId}
            onStatusChange={onTransactionUpdate}
        />
      ))}
    </div>
  );
}
