import { ParallaxHero } from "./ParallaxHero";
import { StickyFeatures } from "./StickyFeatures";
import { CallToAction } from "./CallToAction";

interface LandingPageProps {
  onEnterApp: () => void;
}

export function LandingPage({ onEnterApp }: LandingPageProps) {
  return (
    <div className="bg-[#f8f9fa] min-h-screen text-slate-900 selection:bg-slate-200">
      <ParallaxHero onEnterApp={onEnterApp} />
      <StickyFeatures />
      <CallToAction onEnterApp={onEnterApp} />
    </div>
  );
}
