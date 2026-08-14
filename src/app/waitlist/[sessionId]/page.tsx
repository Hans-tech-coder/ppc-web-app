"use client"

import { useEffect, useState, use, useRef } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Session } from "@/app/admin/sessions/page"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapModal } from "@/components/public/map-modal"
import { useAlert } from "@/components/alert-provider"
import { cn, formatTime } from "@/lib/utils"
import { CalendarDays, Clock, MapPin, Loader2 } from "lucide-react"

export default function WaitlistPage(props: { params: Promise<{ sessionId: string }> }) {
  const params = use(props.params);
  const router = useRouter()
  const { showAlert } = useAlert()
  
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  
  const btnTextRef = useRef<HTMLSpanElement>(null)

  const swapBtnText = (next: string) => {
    const el = btnTextRef.current
    if (!el) return
    el.classList.add("is-exit")
    setTimeout(() => {
      el.textContent = next
      el.classList.remove("is-exit")
      el.classList.add("is-enter-start")
      void el.offsetHeight
      el.classList.remove("is-enter-start")
    }, 150)
  }
  
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const docRef = doc(db, "sessions", params.sessionId)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Session
          setSession(data)
        }
      } catch (err) {
        console.error("Error fetching session:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [params.sessionId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !name || !contactNumber) return;

    setSubmitting(true)
    try {
      await addDoc(collection(db, "waitlist"), {
        sessionId: session.id,
        venueName: session.venueName,
        date: session.date,
        name: name,
        email: email,
        contactNumber: contactNumber,
        createdAt: new Date().toISOString(), // Critical for First-Come First-Served sorting
        status: "WAITING"
      })

      setShowSuccess(true)
      swapBtnText("Waitlisted!")
      
      setTimeout(() => {
        router.push(`/waitlist-success`)
      }, 1500)
      
    } catch (error: any) {
      console.error("Submission error:", error)
      showAlert({
        title: "Waitlist Failed",
        description: error.message || "An error occurred during submission. Please try again."
      })
      setSubmitting(false)
    }
  }

  const isSessionOpen = session && (session.status === "OPEN" && session.registeredCount < session.maxPlayers);

  if (isSessionOpen && !loading) {
    router.replace(`/register/${session.id}`)
    return <div className="text-center py-24">Redirecting to registration...</div>
  }

  return (
    <div className={cn("t-skel w-full", !loading && "is-revealed")}>
      {/* 1. The Skeleton Layer */}
      <div className="t-skel-skeleton is-pulsing flex justify-center py-12 px-4">
        <Card className="w-full max-w-3xl h-[600px] bg-muted/20 border-border/50 rounded-2xl flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/30" />
            <span className="mt-4 text-sm text-muted-foreground/50">Loading session...</span>
        </Card>
      </div>

      {/* 2. The Content Layer */}
      <div className="t-skel-content">
        {!loading && !session ? (
          <div className="text-center py-24 text-red-500">Session not found.</div>
        ) : session ? (
          <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
            <Card className="rounded-2xl border-border/50">
              <CardHeader className="border-b border-dashed border-border/50">
                <CardTitle className="text-2xl text-primary">Join the Waitlist</CardTitle>
                <CardDescription>
                  This session is currently full. Join the waitlist, and if a slot opens up, we will contact you immediately!
                </CardDescription>
              </CardHeader>
              
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-border/50">
                {/* Session Details */}
                <div className="p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Session Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3 text-muted-foreground">
                      <MapPin className="h-4 w-4 mt-1 shrink-0" />
                      <div className="flex flex-col items-start">
                        <span className="text-foreground">{session.venueName}</span>
                        <MapModal venueId={session.venueId} venueName={session.venueName} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      <span className="text-foreground">
                        {new Date(session.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-foreground">{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Registration Form */}
                <div className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input 
                        id="name" 
                        required
                        placeholder="Juan dela Cruz"
                        className="bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/50"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email"
                        placeholder="juan@example.com"
                        className="bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/50"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact">Contact Number *</Label>
                      <Input 
                        id="contact" 
                        required
                        type="tel"
                        placeholder="09123456789"
                        className="bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/50"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Please provide an active number linked to your Messenger.</p>
                    </div>

                    <Button type="submit" className="w-full mt-4 flex items-center justify-center gap-2 overflow-hidden relative" size="lg" disabled={submitting || showSuccess}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="t-success-check" data-state={showSuccess ? "in" : "out"} aria-hidden="true">
                          <svg viewBox="0 0 48 48" fill="none" className="w-6 h-6 stroke-white stroke-2">
                            <path d="M12 24L20 32L36 16" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </div>
                      
                      <div className={cn("flex items-center gap-2 transition-opacity duration-300", showSuccess ? "opacity-0" : "opacity-100")}>
                        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        <span className="t-text-swap font-medium" ref={btnTextRef}>
                          Join Waitlist
                        </span>
                      </div>
                    </Button>
                  </form>
                </div>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  )
}
