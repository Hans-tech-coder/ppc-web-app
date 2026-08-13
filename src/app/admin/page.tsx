"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Session } from "@/app/admin/sessions/page"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableBody
} from "@/components/ui/table"
import { CalendarDays, Clock, Users, ArrowRight, AlertCircle, CheckCircle2, PhilippinePeso, Clock4 } from "lucide-react"

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
  status: "PENDING" | "APPROVED" | "REJECTED" | "ACTION_REQUIRED" | "CANCELLED";
  createdAt: string;
}

export default function AdminDashboard() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [needsAttentionRegs, setNeedsAttentionRegs] = useState<Registration[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [nonMemberRevenue, setNonMemberRevenue] = useState(0)
  const [totalWaitlisted, setTotalWaitlisted] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Fetch Active Sessions
    const sessionsQuery = query(
      collection(db, "sessions"),
      where("status", "in", ["OPEN", "FULL"]),
      orderBy("date", "asc")
    )

    const unsubSessions = onSnapshot(sessionsQuery, (snap) => {
      const s: Session[] = []
      snap.forEach(doc => s.push({ id: doc.id, ...doc.data() } as Session))
      setSessions(s)
    })

    // 2. Fetch Registrations for Revenue and Needs Attention
    const regsQuery = query(collection(db, "registrations"))
    const unsubRegs = onSnapshot(regsQuery, (snap) => {
      let revenue = 0
      let nonMemRevenue = 0
      const attention: Registration[] = []
      
      snap.forEach(doc => {
        const reg = { id: doc.id, ...doc.data() } as Registration
        
        if (reg.status === "APPROVED") {
          revenue += reg.pricePaid
          if (!reg.isMember) {
            nonMemRevenue += 50
          }
        }
        
        if (reg.status === "PENDING" || reg.status === "ACTION_REQUIRED") {
          attention.push(reg)
        }
      })
      
      // Sort attention needed by oldest first
      attention.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      
      setTotalRevenue(revenue)
      setNonMemberRevenue(nonMemRevenue)
      setNeedsAttentionRegs(attention)
    })

    // 3. Fetch Total Waitlist count
    const waitlistQuery = query(collection(db, "waitlist"))
    const unsubWaitlist = onSnapshot(waitlistQuery, (snap) => {
      setTotalWaitlisted(snap.size)
      setLoading(false)
    })

    return () => {
      unsubSessions()
      unsubRegs()
      unsubWaitlist()
    }
  }, [])

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading dashboard data...</div>
  }

  const pendingCount = needsAttentionRegs.filter(r => r.status === "PENDING").length;
  const actionReqCount = needsAttentionRegs.filter(r => r.status === "ACTION_REQUIRED").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to the Paniqui Pickleball Club Admin Dashboard.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border-border/50 shadow-sm p-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <PhilippinePeso className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱{totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-2 space-y-1">
              <div className="flex justify-between">
                <span>Base Revenue:</span>
                <span className="font-medium text-foreground">₱{(totalRevenue - nonMemberRevenue).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Non-Member Fees:</span>
                <span className="font-medium text-foreground">₱{nonMemberRevenue.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 shadow-sm p-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Open or Full sessions</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 shadow-sm p-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertCircle className={`h-4 w-4 ${needsAttentionRegs.length > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{needsAttentionRegs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingCount} Pending, {actionReqCount} Action Req.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/50 shadow-sm p-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Waitlisted</CardTitle>
            <Clock4 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWaitlisted}</div>
            <p className="text-xs text-muted-foreground mt-1">Players waiting for slots</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col rounded-2xl border-border/50 shadow-sm p-2">
          <CardHeader>
            <CardTitle>Needs Attention</CardTitle>
            <CardDescription>Registrations awaiting your review or action.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {needsAttentionRegs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mb-2 text-green-500/50" />
                <p>All caught up!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {needsAttentionRegs.slice(0, 5).map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell className="font-medium">{reg.name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(reg.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${
                            reg.status === 'ACTION_REQUIRED' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30' :
                            'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30'
                        }`}>
                          {reg.status === 'ACTION_REQUIRED' ? 'ACTION REQ.' : 'PENDING'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/sessions/${reg.sessionId}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                          Review
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {needsAttentionRegs.length > 5 && (
              <div className="text-center mt-4 pt-4 border-t text-sm text-muted-foreground">
                + {needsAttentionRegs.length - 5} more across your sessions
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col rounded-2xl border-border/50 shadow-sm p-2">
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>Your next scheduled open plays.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <p>No active sessions.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Fill Rate</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.slice(0, 5).map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>
                        <div className="font-medium">
                          {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-xs text-muted-foreground">{session.startTime}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs truncate max-w-[100px]" title={session.venueName}>
                        {session.venueName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium">{session.registeredCount}/{session.maxPlayers}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/sessions/${session.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                          Manage
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {sessions.length > 5 && (
              <div className="flex justify-center mt-4 pt-4 border-t">
                <Link href="/admin/sessions" className="text-sm text-primary hover:underline inline-flex items-center">
                  View all sessions <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
