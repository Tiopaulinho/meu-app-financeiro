'use client';

import { db } from '@/lib/firebase/config'; // Use a config de cliente geral
import {
  collection,
  writeBatch,
  doc,
  updateDoc,
  Timestamp,
  deleteDoc,
  query,
  where,
  getDocs,
  orderBy,
} from 'firebase/firestore';
import { addMonths } from 'date-fns';
import type { SecurityRuleContext, Transaction } from '@/lib/types';
import { recordSavings } from '@/lib/actions/user'; // Ações de usuário podem permanecer como server actions
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { errorEmitter } from '@/components/firebase/error-emitter';
import { FirestorePermissionError } from '@/components/firebase/errors';

const addTransactionSchema = z.object({
  description: z.string().min(1, 'A descrição é obrigatória.'),
  customDescription: z.string().optional(),
  details: z.string().optional(),
  value: z.coerce.number().positive('O valor deve ser um número positivo.'),
  category: z.string().min(1, 'A categoria é obrigatória.'),
  dueDate: z.date(),
  frequency: z.enum(['single', 'installments', 'recurring']).optional(),
  installments: z.coerce.number().min(2, 'Deve ter pelo menos 2 parcelas.').optional(),
}).refine(
  data => {
    if (data.description === 'Outra') {
      return !!data.customDescription && data.customDescription.length >= 2;
    }
    return true;
  },
  {
    message: 'A descrição personalizada deve ter pelo menos 2 caracteres.',
    path: ['customDescription'],
  }
);


const updateTransactionSchema = z.object({
  description: z.string().min(1, "A descrição é obrigatória."),
  value: z.coerce.number().positive("O valor deve ser um número positivo."),
  category: z.string().min(1, "A categoria é obrigatória."),
  dueDate: z.date(),
});


export async function addTransaction(userId: string, values: z.input<typeof addTransactionSchema>): Promise<{ success?: string; error?: string }> {
  if (!userId) {
    return { error: 'Usuário não autenticado.' };
  }
  
  const validatedFields = addTransactionSchema.safeParse(values);

  if (!validatedFields.success) {
    const errorString = JSON.stringify(validatedFields.error.flatten().fieldErrors, null, 2);
    return {
      error: "Campos inválidos! " + errorString,
    };
  }

  const { description, customDescription, details, value, category, frequency, installments, dueDate } = validatedFields.data;

  const finalBaseDescription = description === 'Outra' ? customDescription! : description;
  const finalDescription = details ? `${finalBaseDescription} - ${details}` : finalBaseDescription;
  const now = new Date();


  const transactionData = {
    userId,
    description: finalDescription,
    value,
    category,
  };
  
  try {
    const batch = writeBatch(db);
    const dateToUse = dueDate instanceof Date ? dueDate : now;
    
    const isSavings = category === 'Savings';

    if (frequency === 'single') {
      const docRef = doc(collection(db, "transactions"));
      const newTransaction: Omit<Transaction, 'id'> = {
        ...transactionData,
        date: Timestamp.fromDate(now),
        dueDate: Timestamp.fromDate(dateToUse),
        isPaid: isSavings, // Savings are "paid" by default
        isRecurring: false,
        installmentIndex: null,
        groupId: null,
      };
      batch.set(docRef, newTransaction);
       if (isSavings) {
          await recordSavings(userId, value);
      }
    } else if (frequency === 'installments' && installments && installments > 0) {
        const groupId = uuidv4();
        const installmentValue = value / installments;

        for (let i = 0; i < installments; i++) {
            const installmentDueDate = addMonths(dateToUse, i);
            const docRef = doc(collection(db, "transactions"));
            const newTransaction: Omit<Transaction, 'id'> = {
                ...transactionData,
                value: installmentValue,
                date: Timestamp.fromDate(now),
                dueDate: Timestamp.fromDate(installmentDueDate),
                isPaid: false,
                isRecurring: false,
                installmentIndex: `${i + 1}/${installments}`,
                groupId,
            };
            batch.set(docRef, newTransaction);
        }
    } else if (frequency === 'recurring') {
        const groupId = uuidv4();
        
        for (let i = 0; i < 12; i++) {
            const recurringDueDate = addMonths(dateToUse, i);
            const docRef = doc(collection(db, "transactions"));
            const newTransaction: Omit<Transaction, 'id'> = {
                ...transactionData,
                date: Timestamp.fromDate(now),
                dueDate: Timestamp.fromDate(recurringDueDate),
                isPaid: false,
                isRecurring: true,
                installmentIndex: null,
                groupId,
            };
            batch.set(docRef, newTransaction);
        }
    }

    await batch.commit();
    
    return { success: 'Transação adicionada com sucesso!' };

  } catch (error: any) {
    console.error("Erro ao adicionar transação:", error);
    const permissionError = new FirestorePermissionError({
        path: 'transactions',
        operation: 'create',
        requestResourceData: transactionData,
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);

    if (error.code === 'permission-denied') {
        return { error: 'Você não tem permissão para adicionar esta transação.' };
    }
    return { error: 'Falha ao adicionar transação.' };
  }
}

export async function updateTransaction(transactionId: string, userId: string, values: z.input<typeof updateTransactionSchema>): Promise<{ success?: string; error?: string }> {
    if (!userId) {
        return { error: 'Usuário não autenticado.' };
    }

    const validatedFields = updateTransactionSchema.safeParse(values);

    if (!validatedFields.success) {
      console.log(validatedFields.error.flatten().fieldErrors);
        return { error: 'Campos inválidos.' };
    }
    
    const { description, value, category, dueDate } = validatedFields.data;
    
    const transactionRef = doc(db, 'transactions', transactionId);

    const dataToUpdate = {
        description,
        value,
        category,
        dueDate: Timestamp.fromDate(dueDate),
    };

    try {
        await updateDoc(transactionRef, dataToUpdate);
        return { success: 'Transação atualizada com sucesso!' };
    } catch (error: any) {
        console.error('Erro ao atualizar despesa:', error);
        const permissionError = new FirestorePermissionError({
            path: transactionRef.path,
            operation: 'update',
            requestResourceData: { ...dataToUpdate, userId },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        return { error: 'Falha ao atualizar a despesa.' };
    }
}


export async function updateTransactionStatus(transactionId: string, isPaid: boolean, userId: string): Promise<{ success: boolean, error?: string }> {
    if (!userId) {
        return { success: false, error: 'Usuário não autenticado.' };
    }
    const transactionRef = doc(db, 'transactions', transactionId);
    
    try {
        await updateDoc(transactionRef, { isPaid });
        
        // No XP awarded for just paying bills anymore
        // if (isPaid) {
        //     await awardXp(userId);
        // }

        return { success: true };
    } catch (error: any) {
        console.error('Erro ao atualizar status da despesa:', error);
        const permissionError = new FirestorePermissionError({
            path: transactionRef.path,
            operation: 'update',
            requestResourceData: { isPaid, userId }, 
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        return { success: false, error: 'Falha ao atualizar a despesa.' };
    }
}


export async function deleteTransaction(
  transactionId: string,
  userId: string,
  scope: 'single' | 'all',
  groupId?: string | null
): Promise<{ success: boolean; error?: string }> {
  if (!userId) {
    return { success: false, error: 'Usuário não autenticado.' };
  }

  const transactionsRef = collection(db, 'transactions');

  try {
    if (scope === 'all' && groupId) {
      const batch = writeBatch(db);
      const q = query(transactionsRef, where('groupId', '==', groupId), where('userId', '==', userId));
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return { success: false, error: 'Nenhuma despesa encontrada para este grupo.' };
      }
      querySnapshot.forEach(document => {
        batch.delete(document.ref);
      });
      await batch.commit();

    } else {
      const transactionRef = doc(db, 'transactions', transactionId);
      await deleteDoc(transactionRef);
    }
    return { success: true };
  } catch (error: any) {
    console.error('Erro ao excluir despesa:', error);
    const permissionError = new FirestorePermissionError({
        path: `transactions/${scope === 'all' && groupId ? groupId : transactionId}`,
        operation: 'delete',
        requestResourceData: { userId },
    } satisfies SecurityRuleContext);
    errorEmitter.emit('permission-error', permissionError);
    return { success: false, error: 'Falha ao excluir a despesa. Verifique suas permissões.' };
  }
}

export async function getAllTransactions(
    userId: string,
  ): Promise<Transaction[]> {
    if (!userId) return [];
  
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    try {
      const querySnapshot = await getDocs(q);
      const transactions: Transaction[] = [];
      querySnapshot.forEach(doc => {
          const data = doc.data();
          transactions.push({
          id: doc.id,
          ...data,
          date: (data.date as Timestamp).toDate(),
          dueDate: data.dueDate ? (data.dueDate as Timestamp).toDate() : (data.date as Timestamp).toDate(),
          } as Transaction);
      });
  
      return transactions;
    } catch (serverError) {
      const permissionError = new FirestorePermissionError({
          path: transactionsRef.path,
          operation: 'list',
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
      throw new Error('Permissão negada ao buscar despesas.');
    }
  }
