import { useState, useEffect } from "react";

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    // Check if app is running in standalone mode
    const isStandaloneMode = 
      window.matchMedia("(display-mode: standalone)").matches || 
      (window.navigator as any).standalone === true;
    
    setIsStandalone(isStandaloneMode);

    // Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIos) {
      setPlatform("ios");
    } else if (isAndroid) {
      setPlatform("android");
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as any);

    // iOS doesn't support beforeinstallprompt but is installable on Safari
    if (isIos && !isStandaloneMode) {
      setIsInstallable(true);
    }

    // Allow installation trigger for Android/Chrome testing even if prompt hasn't fired yet
    if (isAndroid && !isStandaloneMode) {
      setIsInstallable(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as any);
    };
  }, []);

  const triggerInstall = async (): Promise<boolean> => {
    if (platform === "ios") {
      // Return true to indicate we should show the iOS guide BottomSheet
      return true;
    }
    
    if (!deferredPrompt) {
      // If we don't have the prompt (e.g. Chrome on iOS, or already installed, or not fired yet)
      return false;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      }
    } catch (err) {
      console.error("PWA installation prompt failed:", err);
    }
    
    return false;
  };

  return { isInstallable, isStandalone, platform, triggerInstall };
}
