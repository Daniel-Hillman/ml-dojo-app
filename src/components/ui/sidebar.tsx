'use client';

import { FlaskConical, Users, PlusSquare, User, Settings, Key } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/use-mobile';
import { Separator } from './separator';

export function Sidebar() {
  const pathname = usePathname();
  const isMobile = useMobile();

  const navLinks = [
    { href: '/drills', icon: FlaskConical, label: 'Practice Drills' },
    { href: '/drills/create', icon: PlusSquare, label: 'Custom Drills' },
    { href: '/community', icon: Users, label: 'Community' },
    { href: '/test-genkit', icon: FlaskConical, label: 'Test AI' },
    { href: '/test-languages', icon: FlaskConical, label: 'Test Languages' },
  ];

  const footerLinks = [
    { href: '/api-keys', icon: Key, label: 'Personal API' },
    { href: '/profile', icon: User, label: 'Profile' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm">
        <div className="flex justify-around py-1">
          {[...navLinks, ...footerLinks].map(({ href, icon: Icon, label }) => (
            <Link key={label} href={href} className="flex-1">
              <div
                className={cn(
                  'flex flex-col items-center gap-1 p-2 transition-colors rounded-md',
                   pathname.startsWith(href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium font-code7x5">{label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex flex-col w-64 shrink-0 h-screen border-r bg-background/80 backdrop-blur-sm">
        <div className="flex items-center h-16 px-6 border-b">
          <Link href="/" className="flex items-center font-semibold">
            <span className="text-2xl font-aurora text-green-400 tracking-wider">OmniCode</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid items-start gap-1 px-4 text-sm font-medium">
            {navLinks.map(({ href, icon: Icon, label }) => (
              <Link
                key={label}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10 font-code7x5',
                  pathname.startsWith(href) && 'bg-primary/10 text-primary'
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4">
           <Separator className="my-2 bg-border" />
           <nav className="grid items-start gap-1 px-4 text-sm font-medium">
                {footerLinks.map(({ href, icon: Icon, label }) => (
                  <Link
                    key={label}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10 font-code7x5',
                      pathname.startsWith(href) && 'bg-primary/10 text-primary'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                ))}
            </nav>
        </div>
    </div>
  );
}
