import { MarketingNavbar } from "@/components/marketing/navbar";
import { Hero } from "@/components/marketing/hero";
import { TrustStrip } from "@/components/marketing/trust";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Integrations } from "@/components/marketing/integrations";
import { Services } from "@/components/marketing/services";
import { Steps } from "@/components/marketing/steps";
import { Videos } from "@/components/marketing/videos";
import { Pricing } from "@/components/marketing/pricing";
import { Faq } from "@/components/marketing/faq";
import { MarketingFooter } from "@/components/marketing/footer";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNavbar />
      <main className="flex-1">
        <Hero />
        <TrustStrip />
        <HowItWorks />
        <Integrations />
        <Services />
        <Steps />
        <Videos />
        <Pricing />
        <Faq />
      </main>
      <MarketingFooter />
    </div>
  );
}
