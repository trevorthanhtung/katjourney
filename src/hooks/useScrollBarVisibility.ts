import { useState, useEffect } from "react";

/**
 * Ẩn/hiện top/bottom bar khi scroll trên mobile.
 * @param desktopBreakpoint - chiều rộng (px) để luôn hiển thị bar. Mặc định 768.
 */
export function useScrollBarVisibility(desktopBreakpoint = 768) {
  const [areBarsVisible, setAreBarsVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDirection = () => {
      if (window.innerWidth >= desktopBreakpoint) {
        setAreBarsVisible(true);
        ticking = false;
        return;
      }

      const scrollY = window.scrollY;

      if (Math.abs(scrollY - lastScrollY) < 10) {
        ticking = false;
        return;
      }

      if (scrollY < 20) {
        setAreBarsVisible(true);
      } else if (scrollY > lastScrollY) {
        setAreBarsVisible(false);
      } else {
        setAreBarsVisible(true);
      }

      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [desktopBreakpoint]);

  useEffect(() => {
    document.body.classList.toggle("bars-hidden", !areBarsVisible);
  }, [areBarsVisible]);

  return areBarsVisible;
}
