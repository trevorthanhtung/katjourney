import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

export function LandingHeader({ onEnterApp }: { onEnterApp: () => void }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      className="absolute top-0 left-0 right-0 z-50 px-6 md:px-12 py-8 flex items-center justify-between pointer-events-none"
    >
      <div className="flex items-center gap-3">
        <img
          src="/asset/logo.png"
          alt="KAT Journey Logo"
          className="h-10 w-10 object-contain drop-shadow-lg"
        />
        <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-md">
          KAT Journey
        </h1>
      </div>

      <button
        onClick={onEnterApp}
        className="pointer-events-auto px-6 py-3 bg-white/90 hover:bg-white backdrop-blur-md text-slate-900 rounded-full font-bold text-sm transition-transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2"
      >
        Start Journey
        <HugeiconsIcon icon={ArrowRight01Icon} className="w-4 h-4" />
      </button>
    </motion.header>
  );
}
