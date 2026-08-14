import { MarketingNavbar } from "@/components/marketing/navbar";
import { Hero } from "@/components/marketing/hero";
import { TrustStrip } from "@/components/marketing/trust";
import { HowLeadsArrive } from "@/components/marketing/how-it-works";
import { Integrations } from "@/components/marketing/integrations";
import { Services } from "@/components/marketing/services";
import { Steps } from "@/components/marketing/steps";
import { WhyUs } from "@/components/marketing/why-us";
import { Videos } from "@/components/marketing/videos";
import { Pricing } from "@/components/marketing/pricing";
import { Faq } from "@/components/marketing/faq";
import { Cta } from "@/components/marketing/cta";
import { MarketingFooter } from "@/components/marketing/footer";
import { StickyCta } from "@/components/marketing/sticky-cta";
import { RouteMessages } from "@/i18n/route-messages";

export default function LandingPage() {
  return (
    <RouteMessages namespaces={["landing"]}>
      <div className="min-h-screen gradient-bg overflow-x-hidden">
        <MarketingNavbar />
        <main id="main" tabIndex={-1}>
          <Hero />
          <TrustStrip />
          <HowLeadsArrive />
          <Integrations />
          <Services />
          <Steps />
          <WhyUs />
          <Videos />
          <Pricing />
          <Faq />
          <Cta />
        </main>
        <MarketingFooter />
        <StickyCta />
      </div>
    </RouteMessages>
  );
}
