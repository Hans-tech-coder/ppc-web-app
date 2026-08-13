"use client"

import { AdminGuard } from "@/components/admin-guard"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
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
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        {/* Sidebar */}
        <aside className="w-full md:w-64 border-r border-border/50 bg-card flex flex-col">
          <div className="p-6 border-b border-border/50">
            <h2 className="text-xl font-bold text-primary tracking-tight">PPC Admin</h2>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium",
                    isActive 
                      ? "bg-secondary text-foreground shadow-sm border border-border/50" 
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-border/50 mt-auto">
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

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </AdminGuard>
  )
}
