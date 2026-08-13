"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation } from "lucide-react"

interface MapModalProps {
  venueName: string
  address?: string
  mapsLink?: string
}

export function MapModal({ venueName, address, mapsLink }: MapModalProps) {
  // If we don't have a specific maps link, we'll try to search Google Maps by name
  const googleMapsUrl = mapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || venueName)}`
  
  // Create an embed URL
  const queryText = address ? `${venueName}, ${address}` : venueName
  // The +(Label) syntax forces the iframe to pin a specific label rather than a vague region
  const embedQuery = `${encodeURIComponent(queryText)}+(${encodeURIComponent(venueName)})`
  const embedUrl = `https://maps.google.com/maps?width=100%25&height=600&hl=en&q=${embedQuery}&t=&z=16&ie=UTF8&iwloc=B&output=embed`

  return (
    <Dialog>
      <DialogTrigger 
        render={<button type="button" className="text-xs text-primary/80 hover:text-primary hover:underline transition-colors mt-0.5" />}
      >
        Get Directions
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-background">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {venueName}
          </DialogTitle>
          <DialogDescription>
            {address || "Location details"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="w-full h-[300px] bg-muted relative">
          <iframe 
            src={embedUrl}
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0"
          ></iframe>
        </div>

        <div className="p-6 pt-4 bg-muted/30 border-t flex justify-end">
          <Button 
            className="gap-2"
            nativeButton={false}
            render={<a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" />}
          >
            <Navigation className="h-4 w-4" />
            Open in Google Maps
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
