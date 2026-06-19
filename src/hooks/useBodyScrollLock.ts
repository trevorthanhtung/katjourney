import { useEffect } from "react";

let activeLockCount = 0;
let originalScrollY = 0;

export function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    activeLockCount++;
    
    if (activeLockCount === 1) {
      originalScrollY = window.scrollY;
      
      // Save current inline styles
      const originalPosition = document.body.style.position;
      const originalTop = document.body.style.top;
      const originalWidth = document.body.style.width;
      const originalOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;

      document.body.setAttribute("data-lock-position", originalPosition);
      document.body.setAttribute("data-lock-top", originalTop);
      document.body.setAttribute("data-lock-width", originalWidth);
      document.body.setAttribute("data-lock-overflow", originalOverflow);
      document.body.setAttribute("data-lock-html-overflow", originalHtmlOverflow);
      document.body.setAttribute("data-lock-scroll-y", originalScrollY.toString());

      // Lock scroll using gold standard iOS PWA technique
      document.body.style.position = "fixed";
      document.body.style.top = `-${originalScrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.documentElement.style.setProperty("overflow", "hidden", "important");
    }

    return () => {
      activeLockCount = Math.max(0, activeLockCount - 1);
      
      if (activeLockCount === 0) {
        // Restore styles from saved values or default to empty
        const originalPosition = document.body.getAttribute("data-lock-position") || "";
        const originalTop = document.body.getAttribute("data-lock-top") || "";
        const originalWidth = document.body.getAttribute("data-lock-width") || "";
        const originalOverflow = document.body.getAttribute("data-lock-overflow") || "";
        const originalHtmlOverflow = document.body.getAttribute("data-lock-html-overflow") || "";
        const savedScrollY = parseInt(document.body.getAttribute("data-lock-scroll-y") || "0", 10);

        document.body.style.position = originalPosition;
        document.body.style.top = originalTop;
        document.body.style.width = originalWidth;
        document.body.style.overflow = originalOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;

        // Clean attributes
        document.body.removeAttribute("data-lock-position");
        document.body.removeAttribute("data-lock-top");
        document.body.removeAttribute("data-lock-width");
        document.body.removeAttribute("data-lock-overflow");
        document.body.removeAttribute("data-lock-html-overflow");
        document.body.removeAttribute("data-lock-scroll-y");

        // Scroll back
        window.scrollTo(0, savedScrollY);
      }
    };
  }, [isOpen]);
}
