import { motion } from "framer-motion";
import Globe from "react-globe.gl";
import { useEffect, useRef } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { LandingHeader } from "./LandingHeader";

export function HeroSection({ onEnterApp }: { onEnterApp: () => void }) {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const globeEl = useRef<any>(null);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      globeEl.current.controls().enableZoom = false;
    }
  }, []);

  return (
    <section className="relative w-full h-[100svh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-sky-50 to-kat-bg dark:from-[#0a1124] dark:to-[#030d2e]">
      <LandingHeader onEnterApp={onEnterApp} />

      {/* Decorative Clouds/Blur */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-white/60 to-transparent dark:from-black/40 pointer-events-none z-10" />

      {/* Globe Background */}
      <div className="absolute inset-0 opacity-80 dark:opacity-60 pointer-events-none flex items-center justify-center translate-y-[20%] md:translate-y-[15%]">
        <Globe
          ref={globeEl}
          width={isDesktop ? 1100 : 700}
          height={isDesktop ? 1100 : 700}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundColor="rgba(0,0,0,0)"
        />
      </div>

      {/* Content */}
      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center mt-12">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-kat-surface/40 backdrop-blur-md border border-slate-200/60 shadow-sm"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-kat-primary animate-pulse"></span>
          <span className="text-xs font-bold uppercase tracking-widest text-kat-text">
            Your Journey, Beautifully Tracked
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
          className="text-6xl md:text-8xl lg:text-[100px] font-extrabold tracking-tight text-kat-text mb-6 leading-[1.05]"
          style={{ textShadow: "0 10px 30px rgba(0,0,0,0.05)" }}
        >
          Plan less. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-kat-primary to-kat-blue">
            Experience more.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
          className="text-xl md:text-2xl text-slate-600 dark:text-kat-muted max-w-2xl mb-12 font-medium drop-shadow-sm"
        >
          KAT Journey is the smartest travel companion that brings your timeline, expenses, and
          packing lists into one beautiful space.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25, delay: 0.3 }}
          onClick={onEnterApp}
          className="px-10 py-5 bg-kat-primary text-white rounded-full font-bold text-xl shadow-[0_8px_30px_rgba(0,191,183,0.3)] hover:shadow-[0_12px_40px_rgba(0,191,183,0.5)] hover:-translate-y-1 transition-all flex items-center gap-3 cursor-pointer"
        >
          Start Your Journey
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 12H19M19 12L12 5M19 12L12 19"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.button>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-20"
      >
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-500 dark:text-kat-muted">
          Scroll down
        </span>
        <div className="w-[2px] h-16 bg-gradient-to-b from-slate-400 dark:from-kat-muted to-transparent rounded-full"></div>
      </motion.div>
    </section>
  );
}
