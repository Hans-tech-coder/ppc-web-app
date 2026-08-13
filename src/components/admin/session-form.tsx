"use client"

import { useState, useEffect } from "react"
import { doc, addDoc, updateDoc, collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Session } from "@/app/admin/sessions/page"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAlert } from "@/components/alert-provider"
import { Loader2 } from "lucide-react"

interface SessionFormProps {
  isOpen: boolean
  onClose: () => void
  initialData: Session | null
}

interface VenueOption {
  id: string
  name: string
}

export function SessionForm({ isOpen, onClose, initialData }: SessionFormProps) {
  const [loading, setLoading] = useState(false)
  const [venues, setVenues] = useState<VenueOption[]>([])
  const { showAlert } = useAlert()
  
  const [formData, setFormData] = useState<Partial<Session>>({
    venueId: "",
    date: new Date().toISOString().split('T')[0],
    startTime: "18:00",
    endTime: "22:00",
    maxPlayers: 20,
    memberPrice: 50,
    nonMemberPrice: 100,
    status: 'OPEN'
  })

  // Fetch venues for the dropdown
  useEffect(() => {
    const fetchVenues = async () => {
      const snapshot = await getDocs(collection(db, "venues"))
      const v: VenueOption[] = []
      snapshot.forEach(doc => {
        v.push({ id: doc.id, name: doc.data().name })
      })
      setVenues(v)
    }
    if (isOpen) {
      fetchVenues()
    }
  }, [isOpen])

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        venueId: venues.length > 0 ? venues[0].id : "",
        date: new Date().toISOString().split('T')[0],
        startTime: "18:00",
        endTime: "22:00",
        maxPlayers: 20,
        memberPrice: 50,
        nonMemberPrice: 100,
        status: 'OPEN',
        registeredCount: 0
      })
    }
  }, [initialData, isOpen, venues])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.venueId) {
      showAlert({
        title: "Validation Error",
        description: "Please select a venue."
      })
      return
    }

    setLoading(true)

    try {
      const selectedVenue = venues.find(v => v.id === formData.venueId)
      
      const newMaxPlayers = Number(formData.maxPlayers)
      const currentRegisteredCount = formData.registeredCount || 0
      
      let newStatus = formData.status || 'OPEN'
      if (newStatus === 'FULL' && currentRegisteredCount < newMaxPlayers) {
        newStatus = 'OPEN'
      } else if (newStatus === 'OPEN' && currentRegisteredCount >= newMaxPlayers) {
        newStatus = 'FULL'
      }

      const dataToSave = {
        venueId: formData.venueId,
        venueName: selectedVenue?.name || "Unknown Venue",
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        maxPlayers: newMaxPlayers,
        memberPrice: Number(formData.memberPrice),
        nonMemberPrice: Number(formData.nonMemberPrice),
        status: newStatus,
        registeredCount: currentRegisteredCount
      }

      if (initialData?.id) {
        const docRef = doc(db, "sessions", initialData.id)
        await updateDoc(docRef, dataToSave)
      } else {
        await addDoc(collection(db, "sessions"), dataToSave)
      }
      onClose()
    } catch (error: any) {
      console.error("Error saving session:", error)
      showAlert({
        title: "Error",
        description: error.message || "Failed to save session."
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Session' : 'Schedule Session'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          
          <div className="space-y-2">
            <Label htmlFor="venue">Venue *</Label>
            <Select 
              value={formData.venueId || ""} 
              onValueChange={(val) => setFormData({...formData, venueId: val ?? undefined})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select venue" />
              </SelectTrigger>
              <SelectContent>
                {venues.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input 
              id="date" 
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input 
                id="startTime" 
                type="time"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input 
                id="endTime" 
                type="time"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({...formData, endTime: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxPlayers">Max Players (Capacity) *</Label>
            <Input 
              id="maxPlayers" 
              type="number" 
              min="1"
              required
              value={formData.maxPlayers}
              onChange={(e) => setFormData({...formData, maxPlayers: parseInt(e.target.value)})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="memberPrice">Member Price (₱) *</Label>
              <Input 
                id="memberPrice" 
                type="number" 
                min="0"
                required
                value={formData.memberPrice}
                onChange={(e) => setFormData({...formData, memberPrice: parseInt(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nonMemberPrice">Non-Member Price (₱) *</Label>
              <Input 
                id="nonMemberPrice" 
                type="number" 
                min="0"
                required
                value={formData.nonMemberPrice}
                onChange={(e) => setFormData({...formData, nonMemberPrice: parseInt(e.target.value)})}
              />
            </div>
          </div>

          {initialData && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(val: any) => setFormData({...formData, status: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">OPEN</SelectItem>
                  <SelectItem value="FULL">FULL</SelectItem>
                  <SelectItem value="CLOSED">CLOSED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4 border-t border-dashed">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Session
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
