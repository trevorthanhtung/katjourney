import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { classNames } from "../../../utils/helpers";

export interface TabItem {
  id: string;
  label: string;
  icon: any;
}

interface SharedTripMobileNavProps {
  areBarsVisible: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  indicatorStyle: { left: number; width: number };
  tabsList: TabItem[];
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  setButtonRef: (tabId: string) => (el: HTMLButtonElement | null) => void;
}

export function SharedTripMobileNav({
  areBarsVisible,
  containerRef,
  indicatorStyle,
  tabsList,
  activeTab,
  setActiveTab,
  setButtonRef,
}: SharedTripMobileNavProps) {
  return (
    <nav
      className={`fixed left-1/2 z-50 w-[calc(100%-2rem)] max-w-[480px] -translate-x-1/2 rounded-[26px] glass-panel-nav shadow-floating-premium lg:hidden transition-transform duration-300 ease-in-out ${
        areBarsVisible ? "translate-y-0" : "translate-y-[calc(100%+2.5rem)]"
      }`}
      style={{ bottom: "calc(0.5rem + var(--safe-bottom))" }}
    >
      <div
        ref={containerRef}
        className="relative flex h-[56px] min-[390px]:h-[60px] items-center justify-between px-2"
      >
        {/* Active Indicator Slide Pill */}
        {indicatorStyle.width > 0 && (
          <div
            className="absolute top-[6px] bottom-[6px] rounded-full bg-white dark:bg-slate-800 transition-[left,width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] shadow-[0_2px_8px_rgba(3,13,46,0.06)] border border-slate-200/45 dark:border-slate-700/50"
            style={{
              left: `${indicatorStyle.left}px`,
              width: `${indicatorStyle.width}px`,
            }}
          />
        )}
        {tabsList.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={setButtonRef(tab.id)}
              onClick={() => setActiveTab(tab.id)}
              className={classNames(
                "relative flex items-center justify-center rounded-full transition-[color,background-color,width,padding,gap,transform] duration-200 ease-out overflow-hidden motion-press z-10",
                isActive
                  ? "text-kat-dark px-2.5 min-[340px]:px-3 min-[390px]:px-5 h-[40px] min-[340px]:h-[44px] min-[390px]:h-[48px] gap-1 min-[340px]:gap-1.5 min-[390px]:gap-2 font-extrabold"
                  : "text-kat-dark opacity-50 hover:opacity-75 w-10 min-[340px]:w-11 min-[390px]:w-12 h-10 min-[340px]:h-11 min-[390px]:h-12"
              )}
            >
              <HugeiconsIcon
                icon={IconComponent}
                className={classNames(
                  "shrink-0 transition-transform duration-200 ease-out",
                  isActive ? "scale-105" : "scale-100",
                  "h-[18px] w-[18px] min-[340px]:h-[19px] min-[340px]:w-[19px] min-[390px]:h-[22px] min-[390px]:w-[22px]"
                )}
              />
              {isActive && (
                <span className="text-[10px] min-[340px]:text-[12px] min-[390px]:text-[13px] font-bold whitespace-nowrap">
                  {tab.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
