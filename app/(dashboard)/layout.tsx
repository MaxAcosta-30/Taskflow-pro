// =============================================================
//  app/(dashboard)/layout.tsx
// =============================================================

import { Sidebar }     from '@/components/shared/sidebar'
import { SocketInit }  from '@/components/shared/socket-init'
import { TopBar }      from '@/components/shared/topbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <SocketInit />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
