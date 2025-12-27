'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { User } from 'firebase/auth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { UserProfile } from '@/lib/types';
import Logo from '@/components/shared/logo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User as UserIcon, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';


interface HeaderProps {
  user: User;
  userProfile: UserProfile;
}

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/analysis', label: 'Análise' },
  { href: '/trophies', label: 'Troféus' },
];

export default function Header({ user, userProfile }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const defaultAvatar = PlaceHolderImages.find(img => img.id === 'default-avatar');

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
       <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
            <Logo />
            <span className="font-headline text-xl font-semibold hidden md:inline-block">LN Expense Manager</span>
        </div>
        <nav className="hidden md:flex items-center gap-4">
            {navItems.map(item => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "text-sm font-medium transition-colors hover:text-primary",
                        pathname === item.href ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    {item.label}
                </Link>
            ))}
        </nav>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                    src={userProfile.photoURL ?? defaultAvatar?.imageUrl ?? ''} 
                    alt={userProfile.displayName ?? 'Usuário'}
                    data-ai-hint={defaultAvatar?.imageHint ?? ''}
                />
                <AvatarFallback>
                  {userProfile.displayName?.charAt(0) ?? 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userProfile.displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userProfile.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/trophies')}>
              <Trophy className="mr-2 h-4 w-4" />
              <span>Meus Troféus</span>
            </DropdownMenuItem>
             <DropdownMenuItem disabled>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
