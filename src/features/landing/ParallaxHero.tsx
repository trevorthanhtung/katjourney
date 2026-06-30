import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { LandingHeader } from "./LandingHeader";

export function ParallaxHero({ onEnterApp }: { onEnterApp: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  return (
    <section ref={containerRef} className="relative h-[100svh] overflow-hidden bg-kat-bg">
      <LandingHeader onEnterApp={onEnterApp} />

      <motion.div style={{ y, scale }} className="absolute inset-0 w-full h-full">
        {/* High quality travel image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=2068&auto=format&fit=crop')",
          }}
        />
        {/* Dark gradient for text readability */}
        <div className="absolute inset-0 bg-black/30" />
        {/* Top gradient for header */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
        {/* Bottom gradient for smooth transition to next section */}
        <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-[#f8f9fa] to-transparent" />
      </motion.div>

      <motion.div
        style={{ opacity }}
        className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 pt-12 pointer-events-none"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <span className="px-5 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em]">
            Your Next Adventure Awaits
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl md:text-8xl lg:text-[130px] font-extrabold text-white tracking-tighter leading-[0.95]"
          style={{ textShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
        >
          Travel lighter.
          <br />
          <span className="text-white/90 italic font-medium">Remember clearer.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 text-xl text-white/90 max-w-2xl font-medium"
        >
          The smartest travel companion that brings your timeline, expenses, and packing lists into
          one beautiful space.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        >
          <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/70">
            Scroll down
          </span>
          <div className="w-[2px] h-16 bg-gradient-to-b from-white/70 to-transparent rounded-full"></div>
        </motion.div>
      </motion.div>
    </section>
  );
}
