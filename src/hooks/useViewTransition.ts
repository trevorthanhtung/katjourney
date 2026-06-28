import { flushSync } from "react-dom";

/**
 * A safe wrapper for the View Transition API that doesn't require React 19/Canary.
 * It uses native document.startViewTransition and flushSync to ensure DOM updates
 * are caught in the transition snapshot.
 */
export function useViewTransition() {
  const startViewTransition = (updateCallback: () => void) => {
    // Fallback for unsupported browsers
    // @ts-ignore
    if (!document.startViewTransition) {
      updateCallback();
      return;
    }

    // @ts-ignore
    document.startViewTransition(() => {
      flushSync(() => {
        updateCallback();
      });
    });
  };

  return { startViewTransition };
}
