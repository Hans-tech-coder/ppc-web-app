"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export const AdminGuard = ({ children }: { children: React.ReactNode }) => {
    const { user, isAdmin, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/admin/login')
            } else if (!isAdmin) {
                // User logged in but not in whitelist
                router.push('/admin/login?error=unauthorized')
            }
        }
    }, [user, isAdmin, loading, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!user || !isAdmin) {
        return null // Will redirect in useEffect
    }

    return <>{children}</>
}
