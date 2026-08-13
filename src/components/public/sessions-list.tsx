"use client"

import { useEffect, useState } from "react"
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Session } from "@/app/admin/sessions/page"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn, formatTime } from "@/lib/utils"
import { CalendarDays, Clock, MapPin, Users } from "lucide-react"
import Link from "next/link"

export function SessionsList() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch OPEN and FULL sessions
    const q = query(
      collection(db, "sessions"), 
      where("status", "in", ["OPEN", "FULL"]),
      orderBy("date", "asc")
    )
    
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

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading available sessions...</div>
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No open play sessions available at the moment. Please check back later!
      </div>
    )
  }

  return (
    <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto px-6 relative z-10" id="sessions">
      {sessions.map((session) => {
        const isFull = session.registeredCount >= session.maxPlayers;
        
        return (
          <Card key={session.id} className="flex flex-col bg-zinc-900/50 border-zinc-800/50 backdrop-blur-md hover:border-primary/50 transition-colors duration-300 w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] max-w-sm">
            <CardHeader className="space-y-4">
              <div className="flex flex-col items-start gap-3 w-full">
                <CardTitle className="text-xl font-bold text-white leading-tight">
                  {session.venueName}
                </CardTitle>
                <span className="text-sm font-bold px-3 py-1 rounded-full bg-primary/20 text-primary whitespace-nowrap shadow-[0_0_10px_rgba(0,255,68,0.2)]">
                  ₱{session.memberPrice} - ₱{session.nonMemberPrice}
                </span>
              </div>
              <CardDescription className="flex items-center gap-2 text-zinc-400">
                <CalendarDays className="h-4 w-4 text-primary" />
                {new Date(session.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-3">
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Clock className="h-4 w-4 text-primary" />
                <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <Users className="h-4 w-4 text-primary" />
                <span>{session.registeredCount} / {session.maxPlayers} Players</span>
              </div>
            </CardContent>
            <CardFooter>
              {isFull ? (
                <Link 
                  href={`/waitlist/${session.id}`}
                  className={cn(buttonVariants({ variant: "default" }), "w-full font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors")}
                >
                  Session Full (Join Waitlist)
                </Link>
              ) : (
                <Link 
                  href={`/register/${session.id}`}
                  className={cn(buttonVariants({ variant: "neon" }), "w-full font-bold")}
                >
                  Register Now
                </Link>
              )}
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
