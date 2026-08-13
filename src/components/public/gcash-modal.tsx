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
import Image from "next/image"
import { QrCode } from "lucide-react"

export function GCashModal() {
  return (
    <Dialog>
      <DialogTrigger 
        render={
          <Button 
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_15px_rgba(34,197,94,0.3)] transition-all hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] border border-primary/20 gap-2" 
            type="button"
          />
        }
      >
        <QrCode className="h-5 w-5" />
        View GCash QR & Details
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>GCash Payment Details</DialogTitle>
          <DialogDescription>
            Scan the QR code or send payment to the number below.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4 p-4">
          <div className="relative w-64 h-64 border rounded-xl overflow-hidden shadow-sm">
            <Image 
              src="/gcash-qr.png" 
              alt="GCash QR Code" 
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
          <div className="text-center space-y-1">
            <p className="text-lg font-mono font-semibold tracking-wider text-primary">
              09622894832
            </p>
            <p className="text-sm text-muted-foreground">
              Please save your reference number or screenshot after paying.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
