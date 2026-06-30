import { Transition, Variants } from "framer-motion";

// --- SPRING PRESETS (Snappy/Professional Focus) ---

/**
 * Very fast, no bounce. Ideal for UI elements that need to feel immediate and decisive.
 */
export const springSnappy: Transition = {
  type: "tween",
  ease: [0.16, 1, 0.3, 1],
  duration: 0.25,
};

/**
 * Slightly softer snappy spring, good for page transitions or larger layout shifts
 * where immediate snapping might be too jarring.
 */
export const springSmooth: Transition = {
  type: "tween",
  ease: [0.25, 1, 0.5, 1],
  duration: 0.35,
};

/**
 * Fast spring specifically tuned for micro-interactions (hover, tap on cards/buttons).
 */
export const springInteraction: Transition = {
  type: "tween",
  ease: [0.16, 1, 0.3, 1],
  duration: 0.2,
};

// --- TWEEN PRESETS ---

export const tweenStandard: Transition = {
  type: "tween",
  ease: [0.23, 1, 0.32, 1], // Equivalent to --motion-ease-out
  duration: 0.2,
};

export const tweenFast: Transition = {
  type: "tween",
  ease: [0.23, 1, 0.32, 1],
  duration: 0.15,
};

// --- COMMON VARIANTS ---

/**
 * Standard page transition variants
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.99,
    filter: "blur(4px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: springSmooth,
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.99,
    filter: "blur(4px)",
    transition: tweenFast,
  },
};

/**
 * Modal & Sheet Variants
 */
export const modalOverlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: tweenStandard },
  exit: { opacity: 0, transition: tweenFast },
};

export const modalContentVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 16 },
  animate: { opacity: 1, scale: 1, y: 0, transition: springSnappy },
  exit: { opacity: 0, scale: 0.96, y: 12, transition: tweenFast },
};

export const sheetContentVariants: Variants = {
  initial: { opacity: 0, y: "100%" },
  animate: { opacity: 1, y: 0, transition: springSnappy },
  exit: { opacity: 0, y: "100%", transition: tweenFast },
};

/**
 * List Stagger Variants
 */
export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const listItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springSnappy,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: tweenFast,
  },
};
