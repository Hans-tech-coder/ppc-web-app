"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { SessionForm } from "@/components/admin/session-form"
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

      <div className="rounded-md border">
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
                <TableCell colSpan={6} className="text-center h-24">Loading...</TableCell>
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
                  <TableCell>{session.startTime} - {session.endTime}</TableCell>
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

      <SessionForm 
        isOpen={isFormOpen} 
        onClose={handleCloseForm} 
        initialData={editingSession} 
      />
    </div>
  )
}
