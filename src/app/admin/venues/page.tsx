"use client"

import { useEffect, useState } from "react"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { VenueForm } from "@/components/admin/venue-form"
import { Button } from "@/components/ui/button"
import { Table, TableCell, TableHead, TableHeader, TableRow, TableBody } from "@/components/ui/table"
import { Plus, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

interface Venue {
  id: string;
  name: string;
  address: string;
  mapsLink?: string;
  courts: number;
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)

  useEffect(() => {
    const q = query(collection(db, "venues"), orderBy("name"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const venuesData: Venue[] = []
      snapshot.forEach((doc) => {
        venuesData.push({ id: doc.id, ...doc.data() } as Venue)
      })
      setVenues(venuesData)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleEdit = (venue: Venue) => {
    setEditingVenue(venue)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingVenue(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Venues</h1>
          <p className="text-muted-foreground mt-2">
            Manage locations for open play sessions.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Venue
        </Button>
      </div>

      <div className={cn("rounded-md border t-skel relative overflow-hidden", !loading && "is-revealed")}>
        
        {/* Skeleton Layer */}
        <div className="t-skel-skeleton is-pulsing pointer-events-none p-4 space-y-4 bg-card">
          <div className="flex gap-4 border-b pb-4">
            <div className="h-4 w-32 bg-muted rounded"></div>
            <div className="h-4 w-48 bg-muted rounded"></div>
            <div className="h-4 w-16 bg-muted rounded ml-auto"></div>
            <div className="h-4 w-16 bg-muted rounded"></div>
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 border-b pb-4">
              <div className="h-4 w-32 bg-muted/60 rounded"></div>
              <div className="h-4 w-48 bg-muted/60 rounded"></div>
              <div className="h-4 w-16 bg-muted/60 rounded ml-auto"></div>
              <div className="h-4 w-16 bg-muted/60 rounded"></div>
            </div>
          ))}
        </div>

        {/* Content Layer */}
        <div className="t-skel-content">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Courts</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-48 opacity-0">Loading...</TableCell>
                </TableRow>
              ) : venues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  No venues found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              venues.map((venue) => (
                <TableRow key={venue.id}>
                  <TableCell className="font-medium">{venue.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[200px] md:max-w-[400px]">{venue.address}</span>
                      {venue.mapsLink && (
                        <a href={venue.mapsLink} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          <MapPin className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{venue.courts}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(venue)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
            </TableBody>
          </Table>
        </div>
      </div>

      <VenueForm 
        isOpen={isFormOpen} 
        onClose={handleCloseForm} 
        initialData={editingVenue} 
      />
    </div>
  )
}
