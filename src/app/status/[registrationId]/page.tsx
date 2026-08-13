"use client"

import { useEffect, useState, use } from "react"
import { doc, getDoc, updateDoc, collection, runTransaction } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { CheckCircle2, Clock, XCircle, AlertCircle, MapPin, CalendarDays, Loader2, Link as LinkIcon, Copy, MessageSquare } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAlert } from "@/components/alert-provider"

interface Registration {
  id: string;
  sessionId: string;
  venueName: string;
  date: string;
  name: string;
  contactNumber: string;
  pricePaid: number;
  referenceNumber: string;
  proofUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "ACTION_REQUIRED";
  adminMessage?: string;
  createdAt: string;
}

export default function StatusPage(props: { params: Promise<{ registrationId: string }> }) {
  const params = use(props.params);
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [copied, setCopied] = useState(false)
  const { showAlert } = useAlert()

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    const fetchRegistration = async () => {
      try {
        const docRef = doc(db, "registrations", params.registrationId)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          setRegistration({ id: docSnap.id, ...docSnap.data() } as Registration)
        }
      } catch (err) {
        console.error("Error fetching registration:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchRegistration()
  }, [params.registrationId])

  const handleCancel = async () => {
    if (!registration) return;
    if (!confirm("Are you sure you want to cancel? This action cannot be undone.")) return;
    
    setCancelling(true)
    try {
      // In a real app, you might want to run a transaction here to decrement the session's registeredCount.
      // However, since refunds might be needed or waitlists processed, it's safer to just mark it cancelled
      // and let the Admin dashboard highlight it so the admin can manually resolve it and free the slot.
      // For phase 1, we just update the status to CANCELLED. The slot remains "taken" until the admin 
      // processes the cancellation on their end (or we can free it automatically). 
      // Let's free it automatically so the system is self-healing!

      await runTransaction(db, async (transaction) => {
        const sessionRef = doc(db, "sessions", registration.sessionId)
        const sessionDoc = await transaction.get(sessionRef)
        
        const regRef = doc(db, "registrations", registration.id)
        const regDoc = await transaction.get(regRef)

        if (!sessionDoc.exists() || !regDoc.exists()) throw new Error("Document not found");
        
        const currentRegStatus = regDoc.data().status;
        if (currentRegStatus === "CANCELLED") return; // Already cancelled

        // Update Registration
        transaction.update(regRef, { status: "CANCELLED" })

        // Update Session (Free up a slot)
        const currentCount = sessionDoc.data().registeredCount;
        transaction.update(sessionRef, {
          registeredCount: Math.max(0, currentCount - 1),
          status: "OPEN" // Always reopen if someone cancels, it might not be full anymore
        })

        // Free the GCash reference lock so they can re-use it if needed
        if (regDoc.data().referenceNumber) {
          transaction.delete(doc(db, "reference_numbers", regDoc.data().referenceNumber))
        }
      })

      setRegistration({...registration, status: "CANCELLED"})
      showAlert({
        title: "Registration Cancelled",
        description: "Your registration has been successfully cancelled. A slot has been opened up for others."
      })
    } catch (error: any) {
      console.error("Error cancelling:", error)
      showAlert({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel registration."
      })
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <div className="text-center py-24">Loading your registration status...</div>
  if (!registration) return <div className="text-center py-24 text-red-500">Registration not found. Ensure you have the correct link.</div>

  const StatusIcon = {
    PENDING: Clock,
    APPROVED: CheckCircle2,
    REJECTED: XCircle,
    CANCELLED: AlertCircle,
    ACTION_REQUIRED: AlertCircle,
  }[registration.status]

  const statusColor = {
    PENDING: "text-yellow-500",
    APPROVED: "text-green-500",
    REJECTED: "text-red-500",
    CANCELLED: "text-muted-foreground",
    ACTION_REQUIRED: "text-orange-500",
  }[registration.status]

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <Card>
        <CardHeader className="text-center border-b border-dashed pb-8">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-muted mb-4 ${statusColor} bg-opacity-10`}>
            <StatusIcon className={`w-8 h-8 ${statusColor}`} />
          </div>
          <CardTitle className="text-3xl">
            {registration.status === "PENDING" && "Registration Pending"}
            {registration.status === "APPROVED" && "Registration Approved"}
            {registration.status === "REJECTED" && "Registration Rejected"}
            {registration.status === "CANCELLED" && "Registration Cancelled"}
            {registration.status === "ACTION_REQUIRED" && "Action Required"}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {registration.status === "PENDING" && "We are reviewing your payment. Please check back later."}
            {registration.status === "APPROVED" && "You're all set! See you on the courts."}
            {registration.status === "REJECTED" && "There was an issue with your payment. Please contact the admin."}
            {registration.status === "CANCELLED" && "You have cancelled this registration."}
            {registration.status === "ACTION_REQUIRED" && "The admin has requested additional information."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          
          {registration.adminMessage && (
            <div className="bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-400 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Message from Admin
              </h3>
              <p className="text-sm whitespace-pre-wrap">{registration.adminMessage}</p>
            </div>
          )}

          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold border-b border-dashed pb-2 mb-3">Session Details</h3>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{registration.venueName}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>{new Date(registration.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold border-b border-dashed pb-2 mb-3">Your Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Name</span>
                <span className="font-medium">{registration.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Contact</span>
                <span className="font-medium">{registration.contactNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Amount Paid</span>
                <span className="font-medium">₱{registration.pricePaid}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Reference No.</span>
                <span className="font-medium">{registration.referenceNumber}</span>
              </div>
            </div>
            
            <div className="pt-2">
              <a 
                href={registration.proofUrl} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center text-sm text-primary hover:underline"
              >
                <LinkIcon className="h-3 w-3 mr-1" />
                View Proof of Payment
              </a>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row justify-between border-t border-dashed p-6 bg-muted/20 gap-4">
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}>
            Back to Home
          </Link>
          
          {(registration.status === "PENDING" || registration.status === "APPROVED" || registration.status === "ACTION_REQUIRED") && (
            <Button 
              variant="destructive" 
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full sm:w-auto"
            >
              {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel Registration
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <div className="text-center mt-6 flex flex-col items-center gap-2">
        <p className="text-sm text-muted-foreground">Save this link to check your status later.</p>
        <Button variant="secondary" size="sm" onClick={handleCopyLink} className="w-fit">
          {copied ? <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? "Link Copied!" : "Copy Link"}
        </Button>
      </div>
    </div>
  )
}
