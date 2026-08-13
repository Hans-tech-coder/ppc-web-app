"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { doc, getDoc, collection, query, where, onSnapshot, updateDoc, runTransaction, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Session } from "@/app/admin/sessions/page"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn, formatTime } from "@/lib/utils"
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableBody
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Loader2, ExternalLink, Image as ImageIcon, MapPin, CalendarDays, Clock, Users, MessageSquare } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useAlert } from "@/components/alert-provider"

interface Registration {
  id: string;
  sessionId: string;
  venueName: string;
  date: string;
  name: string;
  email: string;
  contactNumber: string;
  isMember: boolean;
  pricePaid: number;
  referenceNumber: string;
  proofUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "ACTION_REQUIRED";
  adminMessage?: string;
  createdAt: string;
}

interface WaitlistEntry {
  id: string;
  sessionId: string;
  venueName: string;
  date: string;
  name: string;
  email: string;
  contactNumber: string;
  createdAt: string;
  status: string;
}

export default function SessionDashboard(props: { params: Promise<{ sessionId: string }> }) {
  const params = use(props.params);
  const router = useRouter()
  
  const [session, setSession] = useState<Session | null>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"registrations" | "waitlist">("registrations")
  const [messagingReg, setMessagingReg] = useState<Registration | null>(null)
  const [messageContent, setMessageContent] = useState("")
  const [isMessageSending, setIsMessageSending] = useState(false)
  const { showAlert } = useAlert()

  // Fetch Session Data & Real-time Registrations/Waitlist
  useEffect(() => {
    let unsubSession: () => void;
    let unsubRegs: () => void;
    let unsubWaitlist: () => void;

    const setupListeners = async () => {
      // 1. Listen to Session changes
      const sessionRef = doc(db, "sessions", params.sessionId);
      unsubSession = onSnapshot(sessionRef, (docSnap) => {
        if (docSnap.exists()) {
          setSession({ id: docSnap.id, ...docSnap.data() } as Session)
        } else {
          setSession(null)
        }
      })

      // 2. Listen to Registrations
      const regsQuery = query(collection(db, "registrations"), where("sessionId", "==", params.sessionId));
      unsubRegs = onSnapshot(regsQuery, (snap) => {
        const regs: Registration[] = [];
        snap.forEach(doc => regs.push({ id: doc.id, ...doc.data() } as Registration));
        // Sort by created at descending
        regs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRegistrations(regs);
      })

      // 3. Listen to Waitlist
      const waitlistQuery = query(collection(db, "waitlist"), where("sessionId", "==", params.sessionId));
      unsubWaitlist = onSnapshot(waitlistQuery, (snap) => {
        const wl: WaitlistEntry[] = [];
        snap.forEach(doc => wl.push({ id: doc.id, ...doc.data() } as WaitlistEntry));
        // First Come First Served -> Sort by created at ascending
        wl.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setWaitlist(wl);
        setLoading(false);
      })
    }

    setupListeners();

    return () => {
      if (unsubSession) unsubSession();
      if (unsubRegs) unsubRegs();
      if (unsubWaitlist) unsubWaitlist();
    }
  }, [params.sessionId])

  const handleApprove = async (regId: string) => {
    if (!confirm("Are you sure you want to approve this registration?")) return;
    try {
      await updateDoc(doc(db, "registrations", regId), { status: "APPROVED" });
    } catch (err: any) {
      console.error(err)
      showAlert({
        title: "Action Failed",
        description: err.message || "Error approving registration."
      })
    }
  }

  const handleReject = async (reg: Registration) => {
    if (!confirm("Are you sure you want to REJECT this registration? This will open up a slot in the session.")) return;
    
    try {
      await runTransaction(db, async (transaction) => {
        const sessionRef = doc(db, "sessions", reg.sessionId);
        const sessionDoc = await transaction.get(sessionRef);
        
        if (!sessionDoc.exists()) throw new Error("Session not found");
        
        const sessionData = sessionDoc.data() as Session;
        const newCount = Math.max(0, sessionData.registeredCount - 1);
        const newStatus = newCount >= sessionData.maxPlayers ? "FULL" : "OPEN";
        
        // Decrement session count
        transaction.update(sessionRef, {
          registeredCount: newCount,
          status: newStatus
        });
        
        // Update registration status
        transaction.update(doc(db, "registrations", reg.id), { status: "REJECTED" });

        // Free the GCash reference lock so the player can re-use it if needed
        if (reg.referenceNumber) {
          transaction.delete(doc(db, "reference_numbers", reg.referenceNumber));
        }
      })
    } catch (err: any) {
      console.error(err);
      showAlert({
        title: "Action Failed",
        description: err.message || "Error rejecting registration."
      })
    }
  }

  const handleSendMessage = async () => {
    if (!messagingReg || !messageContent.trim()) return;
    
    setIsMessageSending(true);
    try {
      await updateDoc(doc(db, "registrations", messagingReg.id), {
        status: "ACTION_REQUIRED",
        adminMessage: messageContent.trim()
      });
      setMessagingReg(null);
      setMessageContent("");
    } catch (err: any) {
      console.error(err);
      showAlert({
        title: "Message Failed",
        description: err.message || "Error sending message."
      })
    } finally {
      setIsMessageSending(false);
    }
  }

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  if (!session) {
    return <div className="p-8 text-center text-red-500">Session not found.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/sessions" className={cn(buttonVariants({ variant: "outline", size: "icon" }))}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Session</h1>
          <p className="text-muted-foreground mt-1">Review registrations and manage the waitlist.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Session Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{session.venueName}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span>{new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-semibold">
              <Users className="h-4 w-4 text-primary" />
              <span>{session.registeredCount} / {session.maxPlayers} Players</span>
            </div>
            <div className="pt-2 border-t mt-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  session.status === 'OPEN' ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
                  session.status === 'FULL' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                  'bg-red-500/20 text-red-700 dark:text-red-400'
              }`}>
                {session.status}
              </span>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-3 space-y-6">
          <div className="flex space-x-1 border-b">
            <button
              onClick={() => setActiveTab("registrations")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "registrations" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              Registrations ({registrations.length})
            </button>
            <button
              onClick={() => setActiveTab("waitlist")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "waitlist" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              Waitlist ({waitlist.length})
            </button>
          </div>

          {activeTab === "registrations" && (
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Proof</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        No registrations yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    registrations.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell>
                          <div className="font-medium">{reg.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            {reg.isMember && <span className="bg-primary/20 text-primary px-1.5 rounded uppercase text-[10px]">Member</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{reg.contactNumber}</div>
                          <div className="text-xs text-muted-foreground">{reg.email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">₱{reg.pricePaid}</div>
                          <div className="text-xs text-muted-foreground truncate w-24" title={reg.referenceNumber}>Ref: {reg.referenceNumber}</div>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}>
                                <ImageIcon className="h-3 w-3 mr-2" />
                                View
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Proof of Payment</DialogTitle>
                              </DialogHeader>
                              <div className="mt-4">
                                <img src={reg.proofUrl} alt="Payment Proof" className="w-full rounded-md object-contain max-h-[60vh]" />
                                <div className="mt-4 text-sm flex justify-between">
                                  <span className="text-muted-foreground">Ref Number:</span>
                                  <span className="font-medium">{reg.referenceNumber}</span>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              reg.status === 'APPROVED' ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
                              reg.status === 'REJECTED' ? 'bg-red-500/20 text-red-700 dark:text-red-400' :
                              reg.status === 'ACTION_REQUIRED' ? 'bg-orange-500/20 text-orange-700 dark:text-orange-400' :
                              'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                          }`}>
                            {reg.status === 'ACTION_REQUIRED' ? 'ACTION REQ.' : reg.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {(reg.status === 'PENDING' || reg.status === 'ACTION_REQUIRED') && (
                            <>
                              <Button variant="default" size="sm" onClick={() => handleApprove(reg.id)}>Approve</Button>
                              <Button variant="outline" size="sm" onClick={() => {
                                setMessagingReg(reg)
                                setMessageContent(reg.adminMessage || "")
                              }}>
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Message
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleReject(reg)}>Reject</Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {activeTab === "waitlist" && (
            <div className="rounded-md border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Joined At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waitlist.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                        Waitlist is empty.
                      </TableCell>
                    </TableRow>
                  ) : (
                    waitlist.map((entry, idx) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{entry.name}</TableCell>
                        <TableCell>
                          <div className="text-sm">{entry.contactNumber}</div>
                          <div className="text-xs text-muted-foreground">{entry.email}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <Dialog open={!!messagingReg} onOpenChange={(open) => !open && setMessagingReg(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Message Player</DialogTitle>
                <DialogDescription>
                  Send a message to {messagingReg?.name}. They will see this on their status page. Their status will be updated to "ACTION REQUIRED".
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <Textarea 
                  placeholder="e.g. Hi! The screenshot you uploaded is blurry. Can you please send the reference number to our FB Page?"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setMessagingReg(null)}>Cancel</Button>
                <Button onClick={handleSendMessage} disabled={isMessageSending || !messageContent.trim()}>
                  {isMessageSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Message
                </Button>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </div>
    </div>
  )
}
