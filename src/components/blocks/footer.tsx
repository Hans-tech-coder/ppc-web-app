import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/50 bg-zinc-950 pt-16 pb-8 text-zinc-400 relative z-10">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Brand & Contact */}
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/ppc-logo.png" alt="Paniqui Pickleball Club Logo" width={40} height={40} className="w-10 h-10 object-contain" />
            <span className="font-bold text-xl text-white">Paniqui Pickleball</span>
          </Link>
          <p className="max-w-md text-sm leading-relaxed">
            Building a strong and impactful pickleball community in Paniqui. Join us on the courts!
          </p>
          <div className="flex space-x-4">
            <a 
              href="https://www.facebook.com/profile.php?id=61580691321216" 
              target="_blank" 
              rel="noopener noreferrer"
              className="rounded-full border border-zinc-800 p-2 text-zinc-400 hover:border-primary/50 hover:text-primary transition-colors"
              aria-label="Facebook"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between border-t border-zinc-800/50 pt-8 text-sm md:flex-row">
          <p>© {new Date().getFullYear()} Paniqui Pickleball Club. All rights reserved.</p>
          <div className="mt-4 flex space-x-6 md:mt-0">
            <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
