"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, LogIn } from "lucide-react"

function LoginContent() {
    const { signInWithGoogle, user, isAdmin, loading } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!loading && user) {
            if (isAdmin) {
                router.push('/admin')
            } else {
                setError("Your account is not authorized as an admin. Please contact the system administrator.")
            }
        }
    }, [user, isAdmin, loading, router])

    useEffect(() => {
        if (searchParams.get('error') === 'unauthorized') {
            setError("You do not have permission to access the admin dashboard.")
        }
    }, [searchParams])

    const handleLogin = async () => {
        try {
            setError(null)
            await signInWithGoogle()
        } catch (e: any) {
            setError(e.message || "Failed to sign in. Please try again.")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-950/50">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-2xl text-primary">Admin Access</CardTitle>
                    <CardDescription>
                        Sign in to manage PPC Open Play sessions
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-destructive-foreground bg-destructive/20 rounded-md flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    
                    <Button 
                        size="lg" 
                        className="w-full" 
                        onClick={handleLogin}
                        disabled={loading}
                    >
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign in with Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <LoginContent />
        </Suspense>
    )
}
