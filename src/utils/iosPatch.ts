/**
 * iOS Standalone PWA Safe Area Patch
 * Detects if the app is running in Standalone mode on iOS (Add to Home Screen)
 * and verifies if the environment safe area variables are incorrectly evaluated as 0px (common WebKit bug on iOS 16/iPhone X).
 * If they are 0, it dynamically injects fallback safe-area CSS variables.
 */
export function patchIOSSafeArea() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isStandalone =
    (window.navigator as any).standalone || window.matchMedia("(display-mode: standalone)").matches;

  if (isIOS && isStandalone) {
    // Add class for styling overrides (like scrollbar containers)
    document.documentElement.classList.add("ios-standalone");

    // Create a temporary element to measure actual safe area values in pixel
    const div = document.createElement("div");
    div.style.position = "fixed";
    div.style.top = "env(safe-area-inset-top)";
    div.style.bottom = "env(safe-area-inset-bottom)";
    div.style.height = "0";
    div.style.visibility = "hidden";
    document.body.appendChild(div);

    const style = window.getComputedStyle(div);
    const topInset = parseInt(style.top) || 0;
    const bottomInset = parseInt(style.bottom) || 0;
    document.body.removeChild(div);

    // If both safe area insets are evaluated as 0, but it is an iPhone with notch/island, apply overrides
    if (topInset === 0 && bottomInset === 0) {
      const height = window.screen.height;
      const width = window.screen.width;
      const longDimension = Math.max(height, width);
      const shortDimension = Math.min(width, height);
      const aspectRatio = shortDimension / longDimension;

      // Notched / Dynamic Island iPhones have an aspect ratio less than 0.5 (typically 0.46)
      if (aspectRatio < 0.5) {
        let fallbackTop = "47px";
        const fallbackBottom = "34px"; // Standard bottom safe area for home indicator iPhones

        // Match common iPhone heights to determine specific notch/island size
        if (longDimension === 812) {
          fallbackTop = "44px"; // iPhone X, XS, 11 Pro
        } else if (longDimension === 896) {
          fallbackTop = "48px"; // iPhone XR, 11, 11 Pro Max
        } else if (longDimension === 844 || longDimension === 926) {
          fallbackTop = "47px"; // iPhone 12, 12 Pro, 13, 13 Pro, 14 series
        } else if (longDimension === 852 || longDimension === 932) {
          fallbackTop = "59px"; // iPhone 14 Pro, 15, 16 series (Dynamic Island)
        }

        document.documentElement.style.setProperty("--safe-top", fallbackTop);
        document.documentElement.style.setProperty("--safe-bottom", fallbackBottom);
      }
    }
  }
}
