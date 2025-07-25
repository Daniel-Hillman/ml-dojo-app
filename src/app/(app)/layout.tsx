
'use client';

import { Sidebar } from '@/components/ui/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 bg-background">
        {children}
      </main>
    </div>
  );
}
