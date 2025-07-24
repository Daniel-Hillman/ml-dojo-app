
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FlaskConical, Notebook, PlusSquare, Bot, User, Settings } from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarFooter, SidebarContent } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary">
              <Bot className="text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold font-headline">ML Dojo</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/drills" passHref>
                <SidebarMenuButton isActive={isActive('/drills') || pathname.startsWith('/drills/') && !pathname.endsWith('/create')}>
                  <FlaskConical />
                  <span>Practice Drills</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/drills/create" passHref>
                <SidebarMenuButton isActive={isActive('/drills/create')}>
                  <PlusSquare />
                  <span>Custom Drills</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/notes" passHref>
                <SidebarMenuButton isActive={isActive('/notes')}>
                  <Notebook />
                  <span>Notes</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <Separator className="my-2 bg-sidebar-border" />
        <SidebarFooter>
          <SidebarMenu>
             <SidebarMenuItem>
              <SidebarMenuButton>
                 <Avatar className="h-8 w-8">
                  <AvatarImage src="https://placehold.co/40x40" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <span>User</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton>
                <Settings />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 bg-background">
        {children}
      </main>
    </SidebarProvider>
  );
}
