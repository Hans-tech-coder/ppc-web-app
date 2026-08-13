"use client"

import { useState, useEffect } from "react"
import { doc, addDoc, updateDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAlert } from "@/components/alert-provider"
import { Loader2 } from "lucide-react"

interface VenueData {
  id?: string
  name: string
  address: string
  mapsLink?: string
  courts: number
}

interface VenueFormProps {
  isOpen: boolean
  onClose: () => void
  initialData: VenueData | null
}

export function VenueForm({ isOpen, onClose, initialData }: VenueFormProps) {
  const [loading, setLoading] = useState(false)
  const { showAlert } = useAlert()
  
  const [formData, setFormData] = useState<Partial<VenueData>>({
    name: "",
    address: "",
    mapsLink: "",
    courts: 1
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({ name: "", address: "", mapsLink: "", courts: 1 })
    }
  }, [initialData, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const dataToSave = {
        name: formData.name,
        address: formData.address,
        mapsLink: formData.mapsLink || null,
        courts: Number(formData.courts)
      }

      if (initialData?.id) {
        const docRef = doc(db, "venues", initialData.id)
        await updateDoc(docRef, dataToSave)
      } else {
        await addDoc(collection(db, "venues"), dataToSave)
      }
      onClose()
    } catch (error: any) {
      console.error("Error saving venue:", error)
      showAlert({
        title: "Error",
        description: error.message || "Failed to save venue. Check permissions."
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Venue' : 'Add Venue'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Venue Name *</Label>
            <Input 
              id="name" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Paniqui Tennis Court"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input 
              id="address" 
              required
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              placeholder="Complete address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mapsLink">Google Maps Link (Optional)</Label>
            <Input 
              id="mapsLink" 
              type="url"
              value={formData.mapsLink}
              onChange={(e) => setFormData({...formData, mapsLink: e.target.value})}
              placeholder="https://maps.google.com/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="courts">Number of Courts *</Label>
            <Input 
              id="courts" 
              type="number" 
              min="1"
              required
              value={formData.courts}
              onChange={(e) => setFormData({...formData, courts: parseInt(e.target.value) || 1})}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-dashed">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Venue
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
