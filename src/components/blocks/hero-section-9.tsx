"use client"

import * as React from "react"
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Button, buttonVariants } from '@/components/ui/button'
import { Users, TrendingUp, Calendar as CalendarIcon } from 'lucide-react'
import Image from 'next/image'

export const HeroSection = () => {
    return (
        <div className="relative">
            <header>
                <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl rounded-full border border-zinc-800 bg-zinc-950/80 backdrop-blur-md md:relative md:top-6">
                    <div className="px-6 py-3 lg:py-4">
                        <div className="flex items-center justify-between">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2">
                                <Image src="/ppc-logo.png" alt="Paniqui Pickleball Club Logo" width={40} height={40} className="w-10 h-10 object-contain" />
                                <span className="font-bold text-lg hidden sm:block text-white">Paniqui Pickleball</span>
                            </Link>

                            <Link href="/admin/login" className={cn(buttonVariants({ size: "sm", variant: "neon" }), "rounded-full px-4 font-medium")}>
                                <span>Admin Login</span>
                            </Link>
                        </div>
                    </div>
                </nav>
            </header>

            <main>
                <div
                    aria-hidden
                    className="z-[0] absolute inset-0 pointer-events-none isolate opacity-60 contain-strict">
                    {/* Skynexa-style glow effects */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[120px] opacity-50 mix-blend-screen" />
                    <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] opacity-30 mix-blend-screen" />
                    <div className="absolute top-1/3 -right-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] opacity-30 mix-blend-screen" />
                </div>

                <section className="relative z-10 overflow-hidden pt-36 pb-20 lg:pt-48 lg:pb-32">
                    <div className="relative mx-auto max-w-5xl px-6">
                        <div className="relative z-10 mx-auto max-w-3xl text-center">
                            <h1 className="text-balance text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl mb-6">
                                <span className="text-white">Building strong & impactful </span>
                                <span className="text-gradient-primary">pickleball community</span>
                            </h1>
                            <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400 font-medium">
                                Join the premier pickleball club in Paniqui. Connect with players, 
                                reserve your spot for open plays, and elevate your game on the courts.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <a href="https://forms.gle/ziKdZ9eqM8fRVaDy7" target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ size: "lg", variant: "neon" }), "w-full sm:w-auto text-lg font-bold px-8 h-14 rounded-full")}>
                                    Join Us
                                </a>
                                <Link href="#sessions" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "w-full sm:w-auto text-lg font-semibold px-8 h-14 rounded-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors")}>
                                    View Schedule
                                </Link>
                            </div>
                        </div>

                        {/* Social Proof Stats */}
                        <div className="mt-20 pt-10 border-t border-zinc-800/50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-sm">
                                    <div className="bg-primary/10 p-3 rounded-full mb-4">
                                        <TrendingUp className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-1">750+</h3>
                                    <p className="text-sm text-zinc-400 font-medium text-center">Facebook Page Followers</p>
                                </div>
                                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-sm">
                                    <div className="bg-primary/10 p-3 rounded-full mb-4">
                                        <Users className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-1">45+</h3>
                                    <p className="text-sm text-zinc-400 font-medium text-center">Active Members</p>
                                </div>
                                <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/50 backdrop-blur-sm">
                                    <div className="bg-primary/10 p-3 rounded-full mb-4">
                                        <CalendarIcon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-1">3x</h3>
                                    <p className="text-sm text-zinc-400 font-medium text-center">Weekly Open Plays</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}
