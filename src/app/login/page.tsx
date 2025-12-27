import LoginForm from '@/components/auth/login-form';
import LoginButton from '@/components/auth/login-button';
import Logo from '@/components/shared/logo';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
            <Logo />
            <h1 className="mt-4 text-2xl font-bold font-headline text-foreground">
            Bem-vindo ao LN Expense Manager
            </h1>
            <p className="mt-2 text-muted-foreground">
            Faça login para gamificar suas finanças e alcançar seus objetivos.
            </p>
        </div>
        <div className="mt-8">
          <LoginForm />
          <div className="my-6 flex items-center">
            <Separator className="flex-1" />
            <span className="mx-4 text-xs uppercase text-muted-foreground">OU</span>
            <Separator className="flex-1" />
          </div>
          <LoginButton />
        </div>
      </div>
    </div>
  );
}
