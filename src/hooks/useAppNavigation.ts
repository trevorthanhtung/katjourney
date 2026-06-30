import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { useViewTransition } from "./useViewTransition";

type TabType = "home" | "timeline" | "expenses" | "checklist" | "more";
type MoreSectionType =
  "overview" | "journal" | "packing" | "wrapped" | "settings" | "members" | "documents";

export function useAppNavigation() {
  const { startViewTransition } = useViewTransition();
  const [, startTransition] = useTransition();

  const [activeTab, setActiveTabInternal] = useState<TabType>(() => {
    const saved = localStorage.getItem("kat_active_tab");
    return (saved as any) || "home";
  });
  const setActiveTab = useCallback((tab: TabType) => {
    startTransition(() => {
      setActiveTabInternal(tab);
    });
  }, []);

  const [moreSection, setMoreSection] = useState<MoreSectionType>(() => {
    const saved = localStorage.getItem("kat_more_section");
    return (saved as any) || "overview";
  });

  const [selectedTripId, setSelectedTripId] = useState<number | null>(() => {
    const saved = localStorage.getItem("kat_selected_trip_id");
    return saved ? Number(saved) : null;
  });

  const [isManagingTrips, setIsManagingTrips] = useState<boolean>(() => {
    const savedTripId = localStorage.getItem("kat_selected_trip_id");
    const savedManaging = localStorage.getItem("kat_is_managing_trips");
    if (savedTripId && savedManaging === "false") return false;
    return true;
  });

  const [isViewingArchive, setIsViewingArchive] = useState<boolean>(() => {
    return localStorage.getItem("kat_is_viewing_archive") === "true";
  });

  // Local Storage Sync
  useEffect(() => localStorage.setItem("kat_active_tab", activeTab), [activeTab]);
  useEffect(() => localStorage.setItem("kat_more_section", moreSection), [moreSection]);
  useEffect(() => {
    if (selectedTripId !== null)
      localStorage.setItem("kat_selected_trip_id", String(selectedTripId));
    else localStorage.removeItem("kat_selected_trip_id");
  }, [selectedTripId]);
  useEffect(
    () => localStorage.setItem("kat_is_managing_trips", String(isManagingTrips)),
    [isManagingTrips]
  );
  useEffect(
    () => localStorage.setItem("kat_is_viewing_archive", String(isViewingArchive)),
    [isViewingArchive]
  );

  // History State Sync
  const isPopStateRef = useRef(false);
  const lastHistoryStateRef = useRef<any>(null);
  const historyDepthRef = useRef(0);

  useEffect(() => {
    const view = isViewingArchive
      ? "archive"
      : isManagingTrips || !selectedTripId
        ? "manager"
        : "trip";
    const initialState = { view, tripId: selectedTripId, activeTab, moreSection };
    window.history.replaceState(initialState, "");
    lastHistoryStateRef.current = initialState;

    const handlePopState = (event: PopStateEvent) => {
      if (event.state?.isModal) return;
      const state = event.state;
      if (!state) return;

      const prevState = lastHistoryStateRef.current;
      const viewChanged = prevState?.view !== state.view;
      const tripChanged = prevState?.tripId !== state.tripId;
      const tabChanged = prevState?.activeTab !== state.activeTab;
      const sectionChanged = prevState?.moreSection !== state.moreSection;

      if (prevState && !viewChanged && !tripChanged && !tabChanged && !sectionChanged) {
        return;
      }

      isPopStateRef.current = true;

      startViewTransition(() => {
        if (state.view === "manager") {
          setIsManagingTrips(true);
          setIsViewingArchive(false);
          setSelectedTripId(null);
        } else if (state.view === "archive") {
          setIsViewingArchive(true);
          setIsManagingTrips(false);
          setSelectedTripId(null);
        } else if (state.view === "trip") {
          setIsManagingTrips(false);
          setIsViewingArchive(false);
          if (state.tripId !== undefined) setSelectedTripId(state.tripId);
          if (state.activeTab !== undefined) setActiveTab(state.activeTab);
          if (state.moreSection !== undefined) setMoreSection(state.moreSection);
        }
      });
      lastHistoryStateRef.current = state;
      setTimeout(() => {
        isPopStateRef.current = false;
      }, 0);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [startViewTransition, setActiveTab]);

  useEffect(() => {
    if (isPopStateRef.current) return;
    const view = isViewingArchive
      ? "archive"
      : isManagingTrips || !selectedTripId
        ? "manager"
        : "trip";
    const currentState = { view, tripId: selectedTripId, activeTab, moreSection };
    const prevState = lastHistoryStateRef.current;
    if (!prevState) return;

    const viewChanged = prevState.view !== currentState.view;
    const tripChanged = prevState.tripId !== currentState.tripId;
    const tabChanged = prevState.activeTab !== currentState.activeTab;
    const sectionChanged = prevState.moreSection !== currentState.moreSection;

    if (!viewChanged && !tripChanged && !tabChanged && !sectionChanged) return;

    const goingBackToManager =
      viewChanged && currentState.view === "manager" && prevState.view !== "manager";
    const goingBackToArchive =
      viewChanged && currentState.view === "archive" && prevState.view === "trip";
    const goingBackToMoreOverview =
      sectionChanged &&
      currentState.moreSection === "overview" &&
      prevState.moreSection !== "overview";

    if (goingBackToManager || goingBackToArchive || goingBackToMoreOverview) {
      if (historyDepthRef.current > 0) {
        historyDepthRef.current--;
        window.history.back();
        lastHistoryStateRef.current = currentState;
        return;
      }
    }

    let shouldPush = false;
    if (viewChanged || tripChanged) {
      shouldPush = true;
    } else if (currentState.view === "trip") {
      if (tabChanged) {
        if (currentState.activeTab === "more" && currentState.moreSection !== "overview")
          shouldPush = true;
        else shouldPush = false;
      } else if (sectionChanged) {
        if (currentState.moreSection !== "overview") shouldPush = true;
        else shouldPush = false;
      }
    }

    if (shouldPush) {
      window.history.pushState(currentState, "");
      historyDepthRef.current++;
    } else {
      window.history.replaceState(currentState, "");
    }
    lastHistoryStateRef.current = currentState;
  }, [isManagingTrips, isViewingArchive, selectedTripId, activeTab, moreSection]);

  const setMoreSectionAnimated = useCallback(
    (section: MoreSectionType) => {
      startViewTransition(() => setMoreSection(section));
    },
    [startViewTransition]
  );

  const setSelectedTripIdAnimated = useCallback(
    (id: number | null) => {
      startViewTransition(() => setSelectedTripId(id));
    },
    [startViewTransition]
  );

  const setIsManagingTripsAnimated = useCallback(
    (val: boolean) => {
      startViewTransition(() => setIsManagingTrips(val));
    },
    [startViewTransition]
  );

  const setIsViewingArchiveAnimated = useCallback(
    (val: boolean) => {
      startViewTransition(() => setIsViewingArchive(val));
    },
    [startViewTransition]
  );

  function navigateToMore(section: MoreSectionType) {
    startViewTransition(() => {
      setMoreSection(section);
      setActiveTabInternal("more");
    });
  }

  return {
    activeTab,
    setActiveTab,
    moreSection,
    setMoreSection: setMoreSectionAnimated,
    setMoreSectionRaw: setMoreSection,
    selectedTripId,
    setSelectedTripId: setSelectedTripIdAnimated,
    isManagingTrips,
    setIsManagingTrips: setIsManagingTripsAnimated,
    isViewingArchive,
    setIsViewingArchive: setIsViewingArchiveAnimated,
    navigateToMore,
    lastHistoryStateRef,
  };
}
