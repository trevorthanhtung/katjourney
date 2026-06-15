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
      const targetHash = `#${modalHash}`;
      
      // Push history state if not already on the target hash
      if (window.location.hash !== targetHash) {
        window.history.pushState({ isModal: true, modalHash }, "", targetHash);
      }

      const handlePopState = () => {
        // If the hash changed and is no longer the target hash, close the modal
        if (window.location.hash !== targetHash) {
          isNavigatingRef.current = true;
          onCloseRef.current();
        }
      };

      window.addEventListener("popstate", handlePopState);
      
      return () => {
        window.removeEventListener("popstate", handlePopState);
        // If closed manually by clicking close button/outside, pop the hash
        if (!isNavigatingRef.current && window.location.hash === targetHash) {
          window.history.back();
        }
        isNavigatingRef.current = false;
      };
    }
  }, [isOpen, modalHash]);
}
