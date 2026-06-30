import React from "react";
import { motion } from "framer-motion";
import { classNames } from "../../utils/helpers";

export interface SegmentedControlOption<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  layoutIdPrefix: string;
  className?: string;
  pillClassName?: string;
  buttonClassName?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layoutIdPrefix,
  className,
  pillClassName,
  buttonClassName,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={classNames(
        "flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl",
        className
      )}
      role="tablist"
    >
      {options.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={classNames(
              "relative flex-1 flex items-center justify-center py-2 px-3 text-[13px] sm:text-[14px] font-bold rounded-[12px] transition-colors duration-200 z-0 select-none motion-press whitespace-nowrap",
              isActive
                ? "text-kat-dark dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
              buttonClassName
            )}
            style={{
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {isActive && (
              <motion.div
                layoutId={`${layoutIdPrefix}-active-pill`}
                className={classNames(
                  "absolute inset-0 bg-white dark:bg-slate-700 shadow-[0_2px_8px_rgba(3,13,46,0.06)] rounded-[12px] -z-10",
                  pillClassName
                )}
                initial={false}
                transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.4 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {option.icon && (
                <span className={classNames(isActive ? "opacity-100" : "opacity-70")}>
                  {option.icon}
                </span>
              )}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
