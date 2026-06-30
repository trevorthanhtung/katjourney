import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { classNames } from "../../utils/helpers";
import { HugeiconsIcon } from "@hugeicons/react";

export const NavButton = React.forwardRef<
  HTMLButtonElement,
  {
    isActive: boolean;
    onClick: () => void;
    icon: any;
    label: string;
    layoutIdPrefix?: string;
    compact?: boolean;
  }
>(({ isActive, onClick, icon: Icon, label, layoutIdPrefix = "nav", compact = false }, ref) => {
  return (
    <motion.button
      ref={ref}
      layout
      onClick={onClick}
      aria-label={`Đi tới ${label}`}
      className={classNames(
        "relative flex items-center justify-center rounded-full z-10 motion-press",
        isActive
          ? classNames(
              "text-kat-dark h-[40px] min-[340px]:h-[44px] min-[390px]:h-[48px] font-extrabold",
              compact
                ? "px-2.5 min-[340px]:px-3 min-[390px]:px-3.5 gap-1 min-[340px]:gap-1"
                : "px-2.5 min-[340px]:px-3 min-[390px]:px-5 gap-1 min-[340px]:gap-1.5 min-[390px]:gap-2"
            )
          : "text-kat-dark opacity-50 hover:opacity-75 w-10 min-[340px]:w-11 min-[390px]:w-12 h-10 min-[340px]:h-11 min-[390px]:h-12"
      )}
      transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.4 }}
    >
      {isActive && (
        <motion.div
          layoutId={`${layoutIdPrefix}-indicator`}
          className="absolute inset-0 rounded-full bg-white dark:bg-slate-800 shadow-[0_2px_8px_rgba(3,13,46,0.06)] border border-slate-200/45 dark:border-slate-700/50"
          initial={false}
          transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.4 }}
          style={{ zIndex: -1 }}
        />
      )}
      <motion.div
        layout="position"
        className="shrink-0 relative z-10 flex items-center justify-center"
      >
        {React.isValidElement(Icon) ? (
          // If it's inline svg
          <div
            className={classNames(
              "transition-transform duration-200 ease-out",
              isActive ? "scale-105" : "scale-100",
              "flex items-center justify-center [&>svg]:w-[18px] [&>svg]:h-[18px] min-[340px]:[&>svg]:w-[19px] min-[340px]:[&>svg]:h-[19px] min-[390px]:[&>svg]:w-[22px] min-[390px]:[&>svg]:h-[22px]"
            )}
          >
            {Icon}
          </div>
        ) : (
          // If it's a hugeicon or icon object
          <HugeiconsIcon
            icon={Icon}
            className={classNames(
              "transition-transform duration-200 ease-out",
              isActive ? "scale-105" : "scale-100",
              "h-[18px] w-[18px] min-[340px]:h-[19px] min-[340px]:w-[19px] min-[390px]:h-[22px] min-[390px]:w-[22px]"
            )}
          />
        )}
      </motion.div>
      <AnimatePresence mode="popLayout">
        {isActive && (
          <motion.span
            layout="position"
            initial={{ opacity: 0, filter: "blur(4px)", scale: 0.8 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, filter: "blur(4px)", scale: 0.8 }}
            transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.4 }}
            className="text-[10px] min-[340px]:text-[12px] min-[390px]:text-[13px] font-bold whitespace-nowrap z-10"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
});
NavButton.displayName = "NavButton";
