import { motion, useMotionValue, useSpring } from "framer-motion";
import { MouseEvent as ReactMouseEvent, useRef } from "react";

export function CallToAction({ onEnterApp }: { onEnterApp: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring physics for the magnetic button
  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate distance from center (max pull is 20px)
    const distanceX = (e.clientX - centerX) * 0.2;
    const distanceY = (e.clientY - centerY) * 0.2;

    x.set(distanceX);
    y.set(distanceY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <section className="relative w-full py-40 bg-[#f8f9fa] overflow-hidden flex flex-col items-center justify-center text-center z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 px-4"
      >
        <h2 className="text-6xl md:text-8xl font-extrabold mb-8 text-slate-900 tracking-tighter">
          Ready to explore?
        </h2>
        <p className="text-xl md:text-2xl text-slate-500 font-medium mb-16 max-w-2xl mx-auto leading-relaxed">
          Join thousands of travelers who have already upgraded their journey.
        </p>

        {/* Magnetic Button Area */}
        <div
          ref={ref}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="inline-block p-12 -m-12" // Extra padding to catch mouse earlier
        >
          <motion.button
            style={{ x: springX, y: springY }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEnterApp}
            className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-bold text-xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex items-center gap-4 mx-auto"
          >
            Start your journey
            <span className="bg-white text-slate-900 rounded-full p-1">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </motion.button>
        </div>
      </motion.div>

      {/* Footer minimal */}
      <div className="absolute bottom-8 w-full text-center text-sm font-medium text-slate-400">
        <p>© 2026 KAT Journey. All rights reserved.</p>
      </div>
    </section>
  );
}
