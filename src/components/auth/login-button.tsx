'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, UserCredential } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';


const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
      <path fill="currentColor" d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-65.8 64.4c-21.5-20.5-49.9-32.5-82.1-32.5-60.3 0-109.4 49.2-109.4 109.4s49.1 109.4 109.4 109.4c53.3 0 97.4-37.4 104.9-86.4H248v-72.2h239.1c1.3 12.8 2.3 25.9 2.3 39.4z"></path>
    </svg>
  );

export default function LoginButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // O AuthProvider cuidará da criação do perfil e do redirecionamento
      router.push('/');
    } catch (error) {
      console.error('Erro ao entrar com Google: ', error);
      toast({
        title: 'Falha no login',
        description: 'Houve um problema ao fazer seu login. Por favor, tente novamente.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      disabled={isLoading}
      className="w-full bg-white text-gray-800 hover:bg-gray-100 shadow-md border-gray-200 border"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <GoogleIcon />
      )}
      Entrar com o Google
    </Button>
  );
}
