import { HeroSection } from "@/components/blocks/hero-section-9";
import { SessionsList } from "@/components/public/sessions-list";
import { Footer } from "@/components/blocks/footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      <div className="flex-1 pb-24">
        <HeroSection />
        <section className="scroll-mt-32 mt-20" id="sessions">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            Upcoming <span className="text-gradient-primary">Open Plays</span>
          </h2>
          <SessionsList />
        </section>
      </div>
      <Footer />
    </div>
  );
}
