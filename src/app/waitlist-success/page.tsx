"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function WaitlistSuccessPage() {
  return (
    <div className="max-w-2xl mx-auto py-24 px-6">
      <Card>
        <CardHeader className="text-center border-b border-dashed pb-8">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-muted mb-4 text-green-500 bg-opacity-10">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <CardTitle className="text-3xl">Waitlist Joined!</CardTitle>
          <CardDescription className="text-base mt-2">
            You have successfully been added to the waitlist.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 text-center space-y-4">
          <p className="text-muted-foreground">
            If a player cancels and a slot opens up, we will immediately reach out to you via Messenger or text using the contact number you provided. 
          </p>
          <p className="text-sm font-medium">
            Slots are given on a strict first-come, first-served basis.
          </p>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-dashed p-6 bg-muted/20">
          <Link href="/" className={cn(buttonVariants({ variant: "default" }))}>
            Back to Home
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
