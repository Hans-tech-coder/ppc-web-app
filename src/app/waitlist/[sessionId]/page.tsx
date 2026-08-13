"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Session } from "@/app/admin/sessions/page"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAlert } from "@/components/alert-provider"
import { CalendarDays, Clock, MapPin, Loader2 } from "lucide-react"

export default function WaitlistPage(props: { params: Promise<{ sessionId: string }> }) {
  const params = use(props.params);
  const router = useRouter()
  const { showAlert } = useAlert()
  
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  
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

      router.push(`/waitlist-success`)
      
    } catch (error: any) {
      console.error("Submission error:", error)
      showAlert({
        title: "Waitlist Failed",
        description: error.message || "An error occurred during submission. Please try again."
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="text-center py-24">Loading session details...</div>
  if (!session) return <div className="text-center py-24 text-red-500">Session not found.</div>
  
  // If the session isn't full, send them back to the registration page to register normally!
  if (session.status === "OPEN" && session.registeredCount < session.maxPlayers) {
    router.replace(`/register/${session.id}`)
    return <div className="text-center py-24">Redirecting to registration...</div>
  }

  return (
    <div className="max-w-xl mx-auto py-12 px-6">
      <Card>
        <CardHeader className="bg-muted/50 border-b border-dashed text-center">
          <CardTitle className="text-2xl text-primary">Join the Waitlist</CardTitle>
          <CardDescription>
            This session is currently full. Join the waitlist, and if a slot opens up, we will contact you immediately!
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Session Details</h3>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{session.venueName}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span>{new Date(session.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{session.startTime} - {session.endTime}</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input 
                id="name" 
                required
                placeholder="Juan dela Cruz"
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number (For Messenger) *</Label>
              <Input 
                id="contact" 
                required
                type="tel"
                placeholder="09123456789"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Please provide an active number linked to your Messenger.</p>
            </div>

            <Button type="submit" className="w-full mt-4" size="lg" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Join Waitlist
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
