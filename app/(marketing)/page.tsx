import { CtaSection } from "@/components/landing/CtaSection";
import { FaqSection } from "@/components/landing/FaqSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PartnersSection } from "@/components/landing/PartnersSection";
import { FeaturesGridSection } from "@/components/landing/FeaturesGridSection";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <PartnersSection />
      <FeaturesGridSection />
      <HowItWorksSection />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <CtaSection />
    </>
  );
}
