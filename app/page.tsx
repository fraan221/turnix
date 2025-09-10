import Link from "next/link";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { CtaSection } from "@/components/landing/CtaSection";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        <HeroSection />
        <ProblemSection />
        <BenefitsSection />
        <PricingSection />
        <CtaSection />
        <FaqSection />
      </main>

      <footer className="w-full py-6 text-xs text-center text-muted-foreground">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p>
            © {new Date().getFullYear()} Turnix. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-primary">
              Política de Privacidad
            </Link>
            <Link href="/cookie-policy" className="hover:text-primary">
              Política de Cookies
            </Link>
            <Link href="/terms-of-service" className="hover:text-primary">
              Términos de Servicio
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
