'use client';

import { FlaskConical, Users, PlusSquare, User, Settings, Key, BookOpen, Play } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/use-mobile';
import { Separator } from './separator';
import { GlobalSearch } from '@/components/GlobalSearch';
import { ThemeToggle } from '@/components/ThemeToggle';
import { QuickAccess } from '@/components/RecentlyUsed';

export function Sidebar() {
  const pathname = usePathname();
  const isMobile = useMobile();

  const navLinks = [
    { href: '/playground', icon: Play, label: 'Code Playground', featured: true },
    { href: '/drills', icon: FlaskConical, label: 'Practice Drills' },
    { href: '/drills/create', icon: PlusSquare, label: 'Custom Drills' },
    { href: '/learn', icon: BookOpen, label: 'Code Examples' },
    { href: '/community', icon: Users, label: 'Community' },
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
          {[...navLinks.slice(0, 4), ...footerLinks.slice(0, 2)].map(({ href, icon: Icon, label, featured }) => (
            <Link key={label} href={href} className="flex-1">
              <div
                className={cn(
                  'flex flex-col items-center gap-1 p-2 transition-colors rounded-md',
                   pathname.startsWith(href) ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
                   featured && 'bg-blue-50 text-blue-700'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium font-code7x5">{label.split(' ')[0]}</span>
                {featured && <div className="w-1 h-1 bg-blue-500 rounded-full"></div>}
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
          {/* Global Search */}
          <div className="px-4 mb-4">
            <GlobalSearch className="w-full" />
          </div>
          
          <nav className="grid items-start gap-1 px-4 text-sm font-medium">
            {navLinks.map(({ href, icon: Icon, label, featured }) => (
              <Link
                key={label}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10 font-code7x5',
                  pathname.startsWith(href) && 'bg-primary/10 text-primary',
                  featured && 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 text-blue-700 hover:from-blue-100 hover:to-purple-100'
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
                {featured && (
                  <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    New
                  </span>
                )}
              </Link>
            ))}
          </nav>
          
          {/* Quick Access */}
          <div className="mt-6">
            <QuickAccess />
          </div>
        </div>
        <div className="mt-auto p-4">
           <Separator className="my-2 bg-border" />
           
           {/* Theme Toggle */}
           <div className="flex justify-center mb-4">
             <ThemeToggle />
           </div>
           
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
