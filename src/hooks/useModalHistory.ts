import { useEffect, useRef } from "react";

/**
 * A hook that syncs a modal's open state with the browser history hash.
 * When the modal is open, a hash (e.g. #settings-modal) is pushed to history.
 * If the user presses the browser or hardware back button, the hash is popped,
 * which triggers onClose() to close the modal.
 * If the user closes the modal manually (clicks Close/Cancel), history.back()
 * is called programmatically to keep the history stack in sync.
 * 
 * @param isOpen Whether the modal is currently open.
 * @param onClose Callback function to close the modal.
 * @param modalHash The hash string to push (without the "#").
 */
export function useModalHistory(isOpen: boolean, onClose: () => void, modalHash: string) {
  const isNavigatingRef = useRef(false);
  const onCloseRef = useRef(onClose);

  // Always keep the ref updated with the latest callback
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      const url = new URL(window.location.href);
      const currentModal = url.searchParams.get("modal");
      
      // Push history state if not already on the target modal query param
      if (currentModal !== modalHash) {
        console.log(`[ModalHistory:${modalHash}] pushing param. current:`, currentModal);
        url.searchParams.set("modal", modalHash);
        window.history.pushState({ isModal: true, modalHash }, "", url.toString());
      } else {
        console.log(`[ModalHistory:${modalHash}] param already correct:`, currentModal);
      }

      const handlePopState = () => {
        const currentUrl = new URL(window.location.href);
        // If the param changed and is no longer the target param, close the modal
        if (currentUrl.searchParams.get("modal") !== modalHash) {
          isNavigatingRef.current = true;
          onCloseRef.current();
        }
      };

      window.addEventListener("popstate", handlePopState);
      
      return () => {
        window.removeEventListener("popstate", handlePopState);
        // If closed manually by clicking close button/outside, pop the param
        const currentUrl = new URL(window.location.href);
        console.log(`[ModalHistory:${modalHash}] cleanup. isNavigating:${isNavigatingRef.current} param:${currentUrl.searchParams.get("modal")} target:${modalHash}`);
        if (!isNavigatingRef.current && currentUrl.searchParams.get("modal") === modalHash) {
          console.log(`[ModalHistory:${modalHash}] calling history.back()`);
          window.history.back();
        }
        isNavigatingRef.current = false;
      };
    }
  }, [isOpen, modalHash]);
}
