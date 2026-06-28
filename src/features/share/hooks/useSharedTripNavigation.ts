import { useState, useRef, useEffect, useCallback } from "react";

export function useSharedTripNavigation(data: any, currentUser: any) {
  const [activeTab, setActiveTab] = useState<string>("");
  const [checklistSubTab, setChecklistSubTab] = useState<"checklist" | "documents">("checklist");
  const [hasInitializedTab, setHasInitializedTab] = useState(false);

  // Bottom Navigation Bar animation system
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    if (data && !hasInitializedTab) {
      const hasChecklist = Boolean(data.includeChecklist);
      const hasDocuments = Boolean(data.includeDocuments);

      if (hasChecklist) {
        setChecklistSubTab("checklist");
      } else if (hasDocuments) {
        setChecklistSubTab("documents");
      }

      // Default active tab initialization (always default to "activities" which is always visible)
      setActiveTab("activities");
      setHasInitializedTab(true);
    }
  }, [data, hasInitializedTab, currentUser]);

  const updateIndicator = useCallback(() => {
    if (!activeTab) {
      setIndicatorStyle({ left: 0, width: 0 });
      return;
    }
    const activeButton = buttonsRef.current[activeTab];
    const container = containerRef.current;
    if (activeButton && container) {
      const rect = activeButton.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setIndicatorStyle({
        left: rect.left - containerRect.left,
        width: rect.width,
      });
    }
  }, [activeTab]);

  useEffect(() => {
    updateIndicator();
    const timer = setTimeout(updateIndicator, 60);

    window.addEventListener("resize", updateIndicator);
    return () => {
      window.removeEventListener("resize", updateIndicator);
      clearTimeout(timer);
    };
  }, [updateIndicator]);

  const setButtonRef = useCallback(
    (tabName: string) => (el: HTMLButtonElement | null) => {
      buttonsRef.current[tabName] = el;
    },
    []
  );

  return {
    activeTab,
    setActiveTab,
    checklistSubTab,
    setChecklistSubTab,
    indicatorStyle,
    containerRef,
    setButtonRef,
  };
}
