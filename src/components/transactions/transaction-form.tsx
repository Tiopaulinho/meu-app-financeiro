'use client';

import { useState, useTransition, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Sparkles } from 'lucide-react';
import { format, parse } from 'date-fns';

import { addTransaction } from '@/services/transactions.client';
import { categorizeTransaction } from '@/ai/flows/categorize-transactions';
import { CATEGORIES, COMMON_DESCRIPTIONS } from '@/lib/constants';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '../ui/textarea';

const formSchema = z.object({
  description: z.string().min(1, "Por favor, selecione ou digite uma descrição."),
  customDescription: z.string().optional(),
  details: z.string().optional(),
  value: z.coerce.number().positive("O valor deve ser um número positivo."),
  category: z.string().min(1, "Por favor, selecione uma categoria."),
  dueDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Formato de data inválido. Use DD/MM/AAAA.'),
  frequency: z.enum(["single", "installments", "recurring"]).optional(),
  installments: z.coerce.number().min(2, "Deve ter pelo menos 2 parcelas.").optional(),
}).refine(data => {
    if (data.description === 'Outra') {
        return !!data.customDescription && data.customDescription.length >= 2;
    }
    return true;
}, {
    message: "A descrição personalizada deve ter pelo menos 2 caracteres.",
    path: ["customDescription"],
});


type FormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  userId: string;
  onTransactionUpdate: () => void;
}

export default function TransactionForm({ 
    isOpen, 
    setIsOpen, 
    userId, 
    onTransactionUpdate,
}: TransactionFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.input<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      customDescription: '',
      details: '',
      value: 0,
      category: '',
      frequency: 'single',
      dueDate: format(new Date(), 'dd/MM/yyyy'),
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        description: '',
        customDescription: '',
        details: '',
        value: 0,
        category: '',
        frequency: 'single',
        dueDate: format(new Date(), 'dd/MM/yyyy'),
      });
    }
  }, [isOpen, form]);

  const watchDescription = form.watch('description');
  const watchCategory = form.watch('category');
  const watchFrequency = form.watch('frequency');

   useEffect(() => {
    if (watchDescription === 'Depósito Cofrinho') {
      form.setValue('category', 'Savings');
    }
   }, [watchDescription, form]);

   useEffect(() => {
    if (watchCategory === 'Savings') {
      form.setValue('frequency', 'single');
    }
   }, [watchCategory, form]);


  const handleSuggestion = async () => {
    const description = form.getValues('description');
    const customDescription = form.getValues('customDescription');
    const suggestionBase = description === 'Outra' ? customDescription : description;

    if (!suggestionBase || suggestionBase.length < 3) {
        toast({
            title: "Descrição muito curta",
            description: "Por favor, digite uma descrição mais longa para a sugestão.",
            variant: "destructive"
        });
        return;
    }
    setIsSuggesting(true);
    try {
      const result = await categorizeTransaction({ description: suggestionBase });
      if (result.category) {
        const foundCategory = CATEGORIES.find(c => c.value === result.category || c.label === result.category);
        if (foundCategory) {
            form.setValue('category', foundCategory.value, { shouldValidate: true });
            toast({
                title: "Categoria sugerida!",
                description: `Sugerimos a categoria "${foundCategory.label}".`,
            });
        } else {
             toast({
                title: "Categoria não encontrada",
                description: `A categoria sugerida "${result.category}" não é uma opção válida.`,
                variant: "destructive"
            });
        }
      }
    } catch (error) {
      console.error("Falha na sugestão de categoria:", error);
      toast({
        title: "Erro na Sugestão",
        description: "Não foi possível sugerir uma categoria no momento.",
        variant: "destructive",
      });
    } finally {
      setIsSuggesting(false);
    }
  };
  
  const onSubmit = (values: z.input<typeof formSchema>) => {
    startTransition(async () => {
      const validatedFields = formSchema.safeParse(values);
      if (!validatedFields.success) {
          console.error(validatedFields.error.flatten().fieldErrors);
          toast({ title: 'Erro de validação', description: 'Por favor, verifique os campos.', variant: 'destructive' });
          return;
      }
      
      const { description, customDescription, details } = validatedFields.data;
      const finalBaseDescription = description === 'Outra' ? customDescription! : description;
      const finalDescription = details ? `${finalBaseDescription} - ${details}` : finalBaseDescription;
      
      const dueDateObject = parse(validatedFields.data.dueDate, 'dd/MM/yyyy', new Date());
      if (isNaN(dueDateObject.getTime())) {
          form.setError('dueDate', { message: 'Formato de data inválido.' });
          return;
      }

      const result = await addTransaction(userId, {
          ...validatedFields.data,
          description: finalDescription,
          dueDate: dueDateObject,
      });

      if (result.success) {
        toast({
          title: 'Sucesso!',
          description: result.success,
        });
        form.reset();
        setIsOpen(false);
        onTransactionUpdate();
      } else if (result.error) {
        toast({
          title: 'Erro',
          description: result.error,
          variant: 'destructive',
        });
      }
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Transação</DialogTitle>
          <DialogDescription>
            Preencha os campos para adicionar uma despesa ou um depósito no cofrinho.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma descrição" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COMMON_DESCRIPTIONS.map(desc => (
                        <SelectItem key={desc.value} value={desc.value}>
                          {desc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchDescription === 'Outra' && (
                <FormField
                control={form.control}
                name="customDescription"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Descrição Personalizada</FormLabel>
                    <FormControl>
                        <Input placeholder="ex: Compras no mercado" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            )}

            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalhes (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Adicione mais detalhes sobre a transação"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                        <Input placeholder="DD/MM/AAAA" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 items-end">
                <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                        <FormLabel>Valor</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                        <FormLabel>Categoria</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={watchDescription === 'Depósito Cofrinho'}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {CATEGORIES.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button type="button" variant="outline" size="icon" onClick={handleSuggestion} disabled={isSuggesting || watchCategory === 'Savings'}>
                                {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Sugerir Categoria com IA</p>
                        </TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
            </div>
            
            {watchCategory !== 'Savings' && (<FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Frequência</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="single" /></FormControl>
                        <FormLabel className="font-normal">Única</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="installments" /></FormControl>
                        <FormLabel className="font-normal">Parcelada</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="recurring" /></FormControl>
                        <FormLabel className="font-normal">Recorrente</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />)}
            
            {watchFrequency === 'installments' && (
                <FormField
                control={form.control}
                name="installments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Parcelas</FormLabel>
                    <FormControl>
                      <Input type="number" min="2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <DialogFooter>
                <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90">
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar Transação
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
