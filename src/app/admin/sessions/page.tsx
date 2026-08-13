"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { SessionForm } from "@/components/admin/session-form"
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
import { Plus } from "lucide-react"

export interface Session {
  id: string;
  venueId: string;
  venueName: string;
  date: string; // ISO string for simplicity in UI, converted to Timestamp in DB if needed, but string YYYY-MM-DD is easier for queries here initially
  startTime: string;
  endTime: string;
  maxPlayers: number;
  registeredCount: number;
  memberPrice: number;
  nonMemberPrice: number;
  status: 'OPEN' | 'FULL' | 'CLOSED';
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<Session | null>(null)

  useEffect(() => {
    const q = query(collection(db, "sessions"), orderBy("date", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsData: Session[] = []
      snapshot.forEach((doc) => {
        sessionsData.push({ id: doc.id, ...doc.data() } as Session)
      })
      setSessions(sessionsData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleEdit = (session: Session) => {
    setEditingSession(session)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingSession(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground mt-2">
            Schedule and manage open play games.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Session
        </Button>
      </div>

      <div className={cn("md:rounded-md md:border t-skel relative md:overflow-hidden", !loading && "is-revealed")}>
        
        {/* Skeleton Layer */}
        <div className="t-skel-skeleton is-pulsing pointer-events-none p-4 space-y-4 bg-card">
          <div className="flex gap-4 border-b pb-4">
            <div className="h-4 w-24 bg-muted rounded"></div>
            <div className="h-4 w-32 bg-muted rounded hidden md:block"></div>
            <div className="h-4 w-48 bg-muted rounded hidden md:block"></div>
            <div className="h-4 w-16 bg-muted rounded ml-auto"></div>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 border-b pb-4">
              <div className="h-4 w-24 bg-muted/60 rounded"></div>
              <div className="h-4 w-32 bg-muted/60 rounded hidden md:block"></div>
              <div className="h-4 w-48 bg-muted/60 rounded hidden md:block"></div>
              <div className="h-4 w-16 bg-muted/60 rounded ml-auto"></div>
            </div>
          ))}
        </div>

        {/* Desktop Table Layout */}
        <div className="t-skel-content hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead className="text-right">Players</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-48 opacity-0">Loading...</TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No sessions found. Schedule one to get started.
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">
                    {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </TableCell>
                  <TableCell>{formatTime(session.startTime)} - {formatTime(session.endTime)}</TableCell>
                  <TableCell>{session.venueName}</TableCell>
                  <TableCell className="text-right">
                    {session.registeredCount} / {session.maxPlayers}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        session.status === 'OPEN' ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
                        session.status === 'FULL' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                        'bg-red-500/20 text-red-700 dark:text-red-400'
                    }`}>
                      {session.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Link href={`/admin/sessions/${session.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                      Manage
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(session)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card Layout */}
        <div className="t-skel-content md:hidden py-2 -mx-4 px-4 md:mx-0 md:px-0">
          {loading ? (
             <div className="text-center h-48 opacity-0">Loading...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center h-24 text-muted-foreground pt-8">
              No sessions found. Schedule one to get started.
            </div>
          ) : (
            <div className="grid gap-4">
              {sessions.map((session) => (
                <div key={session.id} className="bg-card border rounded-xl p-4 shadow-sm flex flex-col gap-3 relative">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h3 className="font-semibold text-base">
                        {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </h3>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        {formatTime(session.startTime)} - {formatTime(session.endTime)}
                      </div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        session.status === 'OPEN' ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
                        session.status === 'FULL' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                        'bg-red-500/20 text-red-700 dark:text-red-400'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  
                  <div className="bg-muted/30 rounded-lg p-3 text-sm flex flex-col gap-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Venue</span>
                      <span className="font-medium text-right">{session.venueName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Players</span>
                      <span className="font-medium text-right">{session.registeredCount} / {session.maxPlayers}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Link href={`/admin/sessions/${session.id}`} className={cn(buttonVariants({ variant: "default", size: "sm" }), "flex-1 rounded-lg h-9")}>
                      Manage
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(session)} className="flex-1 rounded-lg h-9">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <SessionForm 
        isOpen={isFormOpen} 
        onClose={handleCloseForm} 
        initialData={editingSession} 
      />
    </div>
  )
}
