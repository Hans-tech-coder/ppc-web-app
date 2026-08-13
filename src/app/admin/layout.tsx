"use client"

import { AdminGuard } from "@/components/admin-guard"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LayoutDashboard, MapPin, CalendarDays, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, signOut } = useAuth()
  const pathname = usePathname()

  // Don't show sidebar on login page
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/venues', label: 'Venues', icon: MapPin },
    { href: '/admin/sessions', label: 'Sessions', icon: CalendarDays },
  ]

  return (
    <AdminGuard>
      <div className="min-h-[100dvh] flex flex-col bg-background pb-[calc(env(safe-area-inset-bottom)+64px)] md:pb-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border/50 bg-card sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <Image src="/ppc-logo.png" alt="PPC Logo" width={32} height={32} className="rounded-md object-contain" />
            <h2 className="text-lg font-bold text-primary tracking-tight">Admin</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={() => signOut()} className="text-muted-foreground hover:text-foreground h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 border-r border-border/50 bg-card flex-col fixed inset-y-0 left-0 z-40">
          <div className="p-6 border-b border-border/50 flex items-center gap-3">
            <Image src="/ppc-logo.png" alt="PPC Logo" width={40} height={40} className="rounded-md object-contain" />
            <h2 className="text-xl font-bold text-primary tracking-tight">Admin</h2>
          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-sm font-medium",
                    isActive 
                      ? "bg-secondary text-foreground shadow-sm border border-border/50" 
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-border/50">
            <div className="mb-4 px-2">
              <p className="text-xs text-muted-foreground truncate" title={user?.email || ''}>
                {user?.email}
              </p>
            </div>
            <Button 
              variant="outline" 
              className="w-full justify-start text-muted-foreground"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border/50 bg-card z-50 flex items-center justify-around px-2 py-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 min-w-[64px] transition-colors rounded-lg",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "fill-primary/20")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 md:pl-[17rem] w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </AdminGuard>
  )
}
