
'use client';

import { Sidebar } from '@/components/ui/sidebar';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 bg-background">
        <div className="border-b border-border/50 px-6 py-3">
          <Breadcrumbs />
        </div>
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
