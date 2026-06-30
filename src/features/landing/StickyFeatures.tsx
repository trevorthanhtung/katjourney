import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, Wallet01Icon, Task01Icon } from "@hugeicons/core-free-icons";

const FEATURES = [
  {
    id: "timeline",
    title: "Visual Timeline",
    description: "Map your journey day by day with stunning clarity.",
    icon: Calendar01Icon,
    color: "bg-white",
    textColor: "text-slate-900",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "expenses",
    title: "Smart Budgeting",
    description: "Track every penny. Split costs. Stay relaxed.",
    icon: Wallet01Icon,
    color: "bg-white",
    textColor: "text-slate-900",
    image:
      "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=2070&auto=format&fit=crop",
  },
  {
    id: "packing",
    title: "Ultimate Checklist",
    description: "Never forget a charger or passport again.",
    icon: Task01Icon,
    color: "bg-white",
    textColor: "text-slate-900",
    image:
      "https://images.unsplash.com/photo-1553531384-411a247cad04?q=80&w=2080&auto=format&fit=crop",
  },
];

export function StickyFeatures() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Calculate transforms for each card to create the stacking effect
  // Container is 250vh, so scroll distance is 150vh.
  // Card 2 comes in from 0.1 to 0.45
  // Card 3 comes in from 0.55 to 0.9

  // Card 1: always on screen, scales down as others appear
  const scale1 = useTransform(scrollYProgress, [0, 0.45, 0.9], [1, 0.95, 0.9]);
  const y1 = useTransform(scrollYProgress, [0, 0.45, 0.9], ["0%", "-2%", "-4%"]);

  // Card 2: starts offscreen at 120%, moves to 0% by 0.45, then moves up slightly by 0.9
  const scale2 = useTransform(scrollYProgress, [0.45, 0.9], [1, 0.95]);
  const y2 = useTransform(scrollYProgress, [0.1, 0.45, 0.9], ["120%", "0%", "-2%"]);

  // Card 3: starts offscreen at 120%, stays there until 0.55, then moves to 0% by 0.9
  const y3 = useTransform(scrollYProgress, [0, 0.55, 0.9], ["120%", "120%", "0%"]);

  const cardsTransforms = [
    { scale: scale1, y: y1, zIndex: 10 },
    { scale: scale2, y: y2, zIndex: 20 },
    { scale: 1, y: y3, zIndex: 30 },
  ];

  return (
    <section className="bg-[#f8f9fa] pt-32 relative z-20">
      <div className="text-center mb-16 px-6">
        <h2 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tighter mb-4">
          Everything you need.
        </h2>
        <p className="text-xl md:text-2xl text-slate-500 font-medium">Nothing you don't.</p>
      </div>

      <div ref={containerRef} className="relative h-[250vh]">
        <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden px-4 md:px-8">
          <div className="relative w-full max-w-5xl h-[75vh]">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.id}
                style={{
                  ...cardsTransforms[i],
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                }}
                className={`rounded-[2rem] md:rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-slate-200/50 ${feat.color} flex flex-col md:flex-row overflow-hidden origin-top`}
              >
                <div className="w-full md:w-[45%] p-10 md:p-16 flex flex-col justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-8 text-slate-700">
                    <HugeiconsIcon icon={feat.icon} className="w-7 h-7" />
                  </div>
                  <h3 className="text-4xl md:text-5xl font-extrabold mb-4 text-slate-900 tracking-tight">
                    {feat.title}
                  </h3>
                  <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed">
                    {feat.description}
                  </p>
                </div>
                <div className="w-full md:w-[55%] h-full relative">
                  <img
                    src={feat.image}
                    className="absolute inset-0 w-full h-full object-cover"
                    alt=""
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
