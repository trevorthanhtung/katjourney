import { motion } from "framer-motion";

const features = [
  {
    title: "Your Timeline, Reimagined",
    description:
      "Build your itinerary intuitively. Add flights, stays, and activities. Let AI suggest the optimal routes between your points of interest.",
    align: "left",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </svg>
    ),
  },
  {
    title: "Split Costs Seamlessly",
    description:
      "Who paid for dinner? Who booked the hotel? Track every expense and let the smart calculator figure out exactly who owes what.",
    align: "right",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <line x1="2" x2="22" y1="10" y2="10" />
      </svg>
    ),
  },
  {
    title: "Never Forget Anything",
    description:
      "Collaborative packing lists ensure your group brings everything needed. Check things off as they go into the suitcase.",
    align: "left",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m9 11 3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
];

export function StoryFeatures() {
  return (
    <section className="relative w-full py-32 bg-kat-surface dark:bg-kat-surface/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Everything in one place
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
            className="text-lg text-kat-muted max-w-2xl mx-auto"
          >
            Stop switching between spreadsheets, messaging apps, and notes. We unified the travel
            experience.
          </motion.p>
        </div>

        <div className="space-y-32">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${feature.align === "right" ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-12 md:gap-24`}
            >
              {/* Image / Graphic Placeholder */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-200px" }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="w-full md:w-1/2 aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-br from-kat-border to-kat-bg dark:from-kat-border/20 dark:to-kat-bg border border-kat-border/50 overflow-hidden relative shadow-xl"
              >
                <div className="absolute inset-0 flex items-center justify-center text-kat-muted opacity-20">
                  <svg
                    width="120"
                    height="120"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>
              </motion.div>

              {/* Text */}
              <motion.div
                initial={{ opacity: 0, x: feature.align === "left" ? 30 : -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-200px" }}
                transition={{ type: "spring", stiffness: 200, damping: 25, delay: 0.1 }}
                className="w-full md:w-1/2 flex flex-col items-start"
              >
                <div className="w-12 h-12 rounded-2xl bg-kat-primary/10 text-kat-primary flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-3xl font-bold mb-4">{feature.title}</h3>
                <p className="text-lg text-kat-muted leading-relaxed">{feature.description}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
