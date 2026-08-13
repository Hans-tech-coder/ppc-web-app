"use client"

import { useEffect, useState, use, useRef } from "react"
import { useRouter } from "next/navigation"
import { doc, getDoc, collection, query, where, getDocs, runTransaction } from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import { signInAnonymously } from "firebase/auth"
import { auth, db, storage } from "@/lib/firebase"
import { Session } from "@/app/admin/sessions/page"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GCashModal } from "@/components/public/gcash-modal"
import { MapModal } from "@/components/public/map-modal"
import { useAlert } from "@/components/alert-provider"
import { cn, formatTime } from "@/lib/utils"
import { CalendarDays, Clock, MapPin, Loader2, Info } from "lucide-react"

export default function RegisterPage(props: { params: Promise<{ sessionId: string }> }) {
  const params = use(props.params);
  const router = useRouter()
  const { showAlert } = useAlert()
  
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [refNumber, setRefNumber] = useState("")
  const [file, setFile] = useState<File | null>(null)
  
  // Pricing logic state
  const [isMember, setIsMember] = useState(false)
  const [checkingMember, setCheckingMember] = useState(false)
  const [priceToPay, setPriceToPay] = useState(0)

  // Transitions Refs
  const btnTextRef = useRef<HTMLSpanElement>(null)
  const gcashWrapRef = useRef<HTMLDivElement>(null)
  const gcashInputRef = useRef<HTMLInputElement>(null)
  const [gcashError, setGcashError] = useState("Reference number is already used.")
  const [showSuccess, setShowSuccess] = useState(false)

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

  const triggerErrorShake = (message: string) => {
    const wrap = gcashWrapRef.current
    const input = gcashInputRef.current
    if (!wrap || !input) return
    
    setGcashError(message)
    wrap.classList.add("is-error")
    input.classList.add("is-error")
    
    input.classList.remove("is-shaking")
    void input.offsetWidth
    input.classList.add("is-shaking")
    
    setTimeout(() => input.classList.remove("is-shaking"), 280)
    
    if ((wrap as any)._revertTimer) clearTimeout((wrap as any)._revertTimer);
    (wrap as any)._revertTimer = setTimeout(() => {
      (wrap as any)._revertTimer = null
      wrap.classList.remove("is-error")
      input.classList.remove("is-error")
    }, 3280)
  }

  const handleGcashChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRefNumber(e.target.value)
    const wrap = gcashWrapRef.current
    const input = gcashInputRef.current
    if (wrap && input) {
      if ((wrap as any)._revertTimer) {
        clearTimeout((wrap as any)._revertTimer);
        (wrap as any)._revertTimer = null
      }
      wrap.classList.remove("is-error")
      input.classList.remove("is-error")
    }
  }

  // 1. Fetch Session Details
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const docRef = doc(db, "sessions", params.sessionId)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as Session
          setSession(data)
          setPriceToPay(data.nonMemberPrice) // Default to non-member
        }
      } catch (err) {
        console.error("Error fetching session:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchSession()
  }, [params.sessionId])

  // 2. Check Membership Status on Blur
  const checkMembership = async () => {
    if (!session) return;
    
    const hasValidContact = contactNumber && contactNumber.length >= 10;
    const hasValidEmail = email && email.includes('@');
    
    if (!hasValidContact && !hasValidEmail) return;
    
    setCheckingMember(true)
    try {
      const membersRef = collection(db, "members")
      const snap = await getDocs(membersRef)
      
      let foundMember = false;
      
      for (const doc of snap.docs) {
        const data = doc.data()
        const memberEmail = (data.email || "").toLowerCase().trim()
        const inputEmail = (email || "").toLowerCase().trim()
        const memberContact = (data.contactNumber || "").replace(/[^0-9]/g, '')
        const inputContact = (contactNumber || "").replace(/[^0-9]/g, '')
        
        if (hasValidContact && memberContact && memberContact === inputContact) {
          foundMember = true;
          break;
        }
        
        if (hasValidEmail && memberEmail && memberEmail === inputEmail) {
          foundMember = true;
          break;
        }
      }
      
      if (foundMember) {
        setIsMember(true)
        setPriceToPay(session.memberPrice)
      } else {
        setIsMember(false)
        setPriceToPay(session.nonMemberPrice)
      }
    } catch (err) {
      console.error("Error checking membership:", err)
    } finally {
      setCheckingMember(false)
    }
  }

  // 3. Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session || !file || !refNumber || !name || (!contactNumber && !email)) return;

    setSubmitting(true)
    try {
      // Step A: Ensure we have Anonymous Auth to upload to Storage
      if (!auth.currentUser) {
        await signInAnonymously(auth)
      }

      // Step B: Upload Proof to Firebase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `proofs/${crypto.randomUUID()}.${fileExt}`
      const storageRef = ref(storage, fileName)
      
      const uploadResult = await uploadBytesResumable(storageRef, file)
      const downloadURL = await getDownloadURL(uploadResult.ref)

      // Step C: Run Firestore Transaction
      const registrationId = await runTransaction(db, async (transaction) => {
        const sessionRef = doc(db, "sessions", session.id)
        const sessionDoc = await transaction.get(sessionRef)
        
        if (!sessionDoc.exists()) throw new Error("Session does not exist!")
        const sessionData = sessionDoc.data() as Session
        
        // Validation: Still open?
        if ((sessionData.status && sessionData.status !== "OPEN") || sessionData.registeredCount >= sessionData.maxPlayers) {
          throw new Error("Sorry, this session is now full or closed.")
        }

        const refDocRef = doc(db, "reference_numbers", refNumber)
        const refDoc = await transaction.get(refDocRef)
        
        // Validation: Duplicate GCash reference?
        if (refDoc.exists()) {
          throw new Error("Reference number already used.")
        }

        // Action 1: Create the lock for the reference number
        transaction.set(refDocRef, {
          usedAt: new Date().toISOString(),
          sessionId: session.id
        })

        // Action 2: Increment the session registration count
        transaction.update(sessionRef, {
          registeredCount: sessionData.registeredCount + 1,
          status: (sessionData.registeredCount + 1) >= sessionData.maxPlayers ? "FULL" : "OPEN"
        })

        // Action 3: Create the Registration Document
        const newRegRef = doc(collection(db, "registrations"))
        transaction.set(newRegRef, {
          sessionId: session.id,
          venueName: session.venueName,
          date: session.date,
          name: name,
          email: email,
          contactNumber: contactNumber,
          isMember: isMember,
          pricePaid: priceToPay,
          referenceNumber: refNumber,
          proofUrl: downloadURL,
          status: "PENDING",
          createdAt: new Date().toISOString()
        })

        return newRegRef.id // Return the generated unguessable ID
      })

      // Success! Swap text, show checkmark, and wait before redirecting
      setShowSuccess(true)
      swapBtnText("Registered!")
      
      setTimeout(() => {
        router.push(`/status/${registrationId}`)
      }, 1500)
      
    } catch (error: any) {
      if (error.message === "Reference number already used.") {
        triggerErrorShake(error.message)
      } else {
        showAlert({
          title: "Registration Failed",
          description: error.message || "An error occurred during submission. Please try again."
        })
      }
      setSubmitting(false)
    }
  }

  // Return early if the session is found but not open, to simplify the main return
  const isSessionClosed = session && ((session.status && session.status !== "OPEN") || session.registeredCount >= session.maxPlayers);

  if (isSessionClosed && !loading) {
    return (
      <div className="max-w-md mx-auto py-24 px-6 text-center">
        <h2 className="text-2xl font-bold mb-2 text-primary">Session Full</h2>
        <p className="text-muted-foreground mb-6">Sorry, this session is no longer accepting registrations.</p>
        <Button onClick={() => router.push("/")}>
          Back to Home
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("t-skel w-full", !loading && "is-revealed")}>
      {/* 1. The Skeleton Layer */}
      <div className="t-skel-skeleton is-pulsing flex justify-center py-12 px-4">
        <Card className="w-full max-w-3xl h-[600px] bg-muted/20 border-border/50 rounded-2xl flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/30" />
            <span className="mt-4 text-sm text-muted-foreground/50">Loading registration...</span>
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
          <CardTitle className="text-2xl text-primary">Register for Open Play</CardTitle>
          <CardDescription>Fill out the form and upload your GCash payment proof to secure your spot.</CardDescription>
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
              <div className="flex items-center gap-3 text-muted-foreground mt-4">
                <Info className="h-4 w-4 text-primary" />
                <div className="bg-primary/10 text-primary px-3 py-2 rounded-md font-medium text-lg w-full">
                  Amount to Pay: ₱{priceToPay}
                  {checkingMember && <Loader2 className="h-4 w-4 animate-spin inline ml-2" />}
                  {!checkingMember && isMember && <span className="text-xs ml-2 opacity-80">(Member Rate)</span>}
                  {!checkingMember && !isMember && (contactNumber.length > 9 || email.includes('@')) && <span className="text-xs ml-2 opacity-80">(Non-Member Rate)</span>}
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <GCashModal />
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
                <Label htmlFor="email">Email Address {!contactNumber && "*"}</Label>
                <Input 
                  id="email" 
                  required={!contactNumber}
                  type="email"
                  placeholder="juan@example.com"
                  className="bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={checkMembership}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Number {!email && "*"}</Label>
                <Input 
                  id="contact" 
                  required={!email}
                  type="tel"
                  placeholder="09123456789"
                  className="bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/50"
                  value={contactNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setContactNumber(val);
                  }}
                  onBlur={checkMembership}
                />
                <p className="text-xs text-muted-foreground">Used to verify your member discount.</p>
              </div>

              <div className="t-input-wrap space-y-2" ref={gcashWrapRef}>
                <Label htmlFor="refNumber">GCash Reference Number *</Label>
                <div className="t-input rounded-md border border-muted-foreground/20 bg-muted/30 transition-colors overflow-hidden focus-within:ring-1 focus-within:ring-primary/50" ref={gcashInputRef}>
                  <Input 
                    id="refNumber" 
                    placeholder="000 000 000 000"
                    required
                    value={refNumber}
                    onChange={handleGcashChange}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  />
                </div>
                {gcashError && <p className="t-error-msg text-xs text-destructive font-medium m-0">{gcashError}</p>}
                <p className="text-xs text-muted-foreground">
                  Make sure you have correctly input the GCash reference number before submitting.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="proof">Upload Proof of Payment (Image) *</Label>
                <Input 
                  id="proof" 
                  type="file" 
                  accept="image/*"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/50 file:text-foreground file:bg-transparent file:border-0 file:text-sm file:font-medium file:mr-4 hover:file:text-primary cursor-pointer pt-2.5 h-12 text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground">Max file size: 5MB</p>
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
                    Submit Registration
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
