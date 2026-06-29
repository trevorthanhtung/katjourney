import React, { useState, useEffect, useRef } from "react";
import { useTranslation, Trans } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CompassIcon,
  Loading01Icon,
  Cancel01Icon,
  AlertCircleIcon,
  LockIcon,
  UserIcon,
  LaptopIcon,
  WalletCardsIcon,
  SparklesIcon,
  Download01Icon,
  Globe02Icon,
  LanguageSkillIcon,
  CheckIcon,
} from "@hugeicons/core-free-icons";
import { signInAsGuest, signInWithGoogle } from "../services/authService";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { PWAInstallInstructionsSheet } from "./PWAInstallInstructionsSheet";

interface WelcomeScreenProps {
  onDismiss: () => void;
}

const GoogleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    xmlns="http://www.w3.org/2000/svg"
    className="shrink-0"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

const AndroidIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0004.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.022 3.503C15.5902 8.244 13.8533 7.851 12 7.851c-1.8533 0-3.5902.393-5.1371 1.0997l-2.022-3.503a.4158.4158 0 00-.5676-.1521.4154.4154 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396" />
  </svg>
);

const AppleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 384 512" fill="currentColor" className={className}>
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
);

const onboardingSlides = [
  {
    icon: CompassIcon,
    titleKey: "welcomeScreen.slide1Title",
    descKey: "welcomeScreen.slide1Desc",
    accent: "from-kat-primary/10 to-teal-500/10",
    iconColor: "text-kat-primary",
  },
  {
    icon: WalletCardsIcon,
    titleKey: "welcomeScreen.slide2Title",
    descKey: "welcomeScreen.slide2Desc",
    accent: "from-amber-500/10 to-orange-500/10",
    iconColor: "text-amber-500",
  },
  {
    icon: SparklesIcon,
    titleKey: "welcomeScreen.slide3Title",
    descKey: "welcomeScreen.slide3Desc",
    accent: "from-pink-500/10 to-rose-500/10",
    iconColor: "text-rose-500",
  },
];

export function WelcomeScreen({ onDismiss }: WelcomeScreenProps) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState<"google" | "guest" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<"terms" | "privacy" | "cookie" | "language" | null>(
    null
  );

  // PWA Install Assistant states
  const { isInstallable, isStandalone, platform, triggerInstall } = usePWAInstall();
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const handleInstallPWA = async () => {
    const showGuide = await triggerInstall();
    if (showGuide) {
      setIsGuideOpen(true);
    }
  };

  // Onboarding Carousel States
  const [activeSlide, setActiveSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const autoPlayRef = useRef<any>(null);

  const startAutoPlay = () => {
    stopAutoPlay();
    autoPlayRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % onboardingSlides.length);
    }, 4500);
  };

  const stopAutoPlay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    stopAutoPlay();
    setTouchStartX(e.touches[0].clientX);
    setTouchCurrentX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    setTouchCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchCurrentX === null) return;
    const diffX = touchStartX - touchCurrentX;

    // Swipe sensitivity threshold: 50px
    if (diffX > 50) {
      // Swipe Left -> Next Slide
      setActiveSlide((prev) => (prev + 1) % onboardingSlides.length);
    } else if (diffX < -50) {
      // Swipe Right -> Prev Slide
      setActiveSlide((prev) => (prev + onboardingSlides.length - 1) % onboardingSlides.length);
    }

    setTouchStartX(null);
    setTouchCurrentX(null);
    setIsDragging(false);
    startAutoPlay();
  };

  const dragOffset =
    isDragging && touchStartX !== null && touchCurrentX !== null ? touchCurrentX - touchStartX : 0;

  const sliderStyle = {
    transform: isDragging
      ? `translate3d(calc(-${activeSlide * 100}% + ${dragOffset}px), 0, 0)`
      : `translate3d(-${activeSlide * 100}%, 0, 0)`,
    transition: isDragging ? "none" : "transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)",
  };

  const handleGoogleLogin = async () => {
    setLoading("google");
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || t("welcomeScreen.googleLoginFail"));
      setLoading(null);
    }
  };

  const handleGuestLogin = async () => {
    setLoading("guest");
    setErrorMsg(null);
    try {
      await signInAsGuest();
      // Lưu trạng thái phiên làm việc và chế độ đăng nhập
      localStorage.setItem("kat_journey_welcome_viewed", "true");
      localStorage.setItem("kat_auth_mode", "guest");
      onDismiss();
    } catch (err: any) {
      setErrorMsg(err.message || t("welcomeScreen.guestLoginFail"));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col lg:grid lg:grid-cols-2 w-full bg-kat-bg overflow-hidden font-sans select-none">
      {/* Dynamic Cinematic Backgrounds (Full screen on mobile, left half on desktop) */}
      <div className="absolute inset-0 w-full h-full lg:w-1/2 overflow-hidden z-0">
        <img
          src="https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=2070&auto=format&fit=crop"
          alt="Cinematic Resort"
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${activeSlide === 0 ? "opacity-100 scale-105" : "opacity-0 scale-100"}`}
          loading="eager"
        />
        <img
          src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop"
          alt="Cinematic Airplane Sunset"
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${activeSlide === 1 ? "opacity-100 scale-105" : "opacity-0 scale-100"}`}
          loading="eager"
        />
        <img
          src="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?q=80&w=2070&auto=format&fit=crop"
          alt="Cinematic Starry Night"
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${activeSlide === 2 ? "opacity-100 scale-105" : "opacity-0 scale-100"}`}
          loading="eager"
        />

        {/* Luxury Dark Gradient Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/60 to-[#0B1120]/30" />
      </div>

      {/* 1. LEFT SIDE - Hero Image Content (Desktop only) */}
      <div className="hidden lg:flex relative w-full h-full overflow-hidden select-text z-10 pointer-events-none">
        {/* Top Logo */}
        <div className="absolute top-8 left-12 flex items-center gap-3 z-10 select-none">
          <div className="flex h-9 w-9 items-center justify-center shrink-0">
            <img
              src="/asset/logo.png"
              alt="KAT Journey Logo"
              className="h-full w-full rounded-xl object-contain shadow-sm border border-white/20"
            />
          </div>
          <span className="text-[20px] font-black tracking-tight text-white drop-shadow-sm">
            KAT Journey
          </span>
        </div>

        {/* Cinematic Content Text */}
        <div className="absolute bottom-12 left-12 pr-12 z-10 space-y-3">
          <h2 className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-none mb-2 text-balance">
            <span dangerouslySetInnerHTML={{ __html: t("welcomeScreen.heroTitle1") }} />
            <br />
            <span dangerouslySetInnerHTML={{ __html: t("welcomeScreen.heroTitle2") }} />
          </h2>
          <p className="text-lg text-gray-300 font-semibold leading-relaxed max-w-lg">
            {t("welcomeScreen.heroDesc")}
          </p>
        </div>
      </div>

      {/* 2. RIGHT SIDE - Zero-Friction Auth Form (Mobile-first) */}
      <div className="flex flex-col justify-between items-center relative w-full h-full px-6 py-6 pb-safe lg:px-12 lg:py-10 bg-transparent lg:bg-white dark:lg:bg-[#0A1124] overflow-hidden z-10">
        {/* TOP CONTROLS: Language Selector */}
        <div className="absolute top-6 right-6 lg:top-8 lg:right-10 flex items-center z-[60]">
          <button
            onClick={() => setLegalModal("language")}
            className="flex h-10 items-center justify-center gap-2 px-4 rounded-[14px] bg-white/20 lg:bg-slate-100 dark:bg-[#1E293B] hover:bg-white/30 lg:hover:bg-slate-200 dark:hover:bg-[#334155] border border-white/20 lg:border-transparent transition-all shadow-sm focus:outline-none backdrop-blur-md lg:backdrop-blur-none group"
          >
            <HugeiconsIcon
              icon={Globe02Icon}
              className="w-4.5 h-4.5 text-white lg:text-slate-600 dark:text-slate-300 transition-transform group-hover:rotate-12"
            />
            <span className="text-[13.5px] font-extrabold text-white lg:text-slate-700 dark:text-slate-200">
              {i18n.language === "vi"
                ? "Tiếng Việt"
                : i18n.language === "en"
                  ? "English"
                  : (i18n.language || "vi").toUpperCase()}
            </span>
          </button>
        </div>

        <div className="hidden lg:block h-2 w-full shrink-0 relative z-10" />

        {/* MIDDLE ACTIONS: Auth Card Container */}
        <div className="w-full max-w-[400px] mx-auto flex-1 flex flex-col justify-center items-center">
          {/* Mobile Top Logo (Placed right above the card) */}
          <div className="lg:hidden flex items-center justify-center w-full mb-6 select-none relative z-10 animate-fade-in-up">
            <div className="flex h-12 w-12 items-center justify-center shrink-0">
              <img
                src="/asset/logo.png"
                alt="KAT Journey Logo"
                className="h-full w-full rounded-[14px] object-contain shadow-sm border border-white/20"
              />
            </div>
            <span className="ml-3 text-[28px] font-black tracking-tight text-white drop-shadow-lg">
              KAT Journey
            </span>
          </div>

          <div className="w-full p-6 sm:p-8 backdrop-blur-2xl bg-white/95 dark:bg-[#0F172A]/70 lg:backdrop-blur-none lg:bg-white dark:lg:bg-[#0F172A]/40 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.2)] lg:shadow-[0_2px_24px_rgba(3,13,46,0.07)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.3)] border border-white/20 dark:border-slate-800/80 flex flex-col items-center relative z-10 animate-scaleUp">
            {/* Onboarding Carousel (2027 Premium Swipeable) */}
            <div
              className="w-full overflow-x-hidden overflow-y-visible mb-4 relative cursor-grab active:cursor-grabbing select-none pt-2"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="flex w-full" style={sliderStyle}>
                {onboardingSlides.map((slide, idx) => {
                  const IconComp = slide.icon;
                  return (
                    <div
                      key={idx}
                      className="w-full shrink-0 flex flex-col items-center text-center px-1"
                    >
                      {/* Icon */}
                      <div className="relative mb-3 flex items-center justify-center">
                        <div className="flex items-center justify-center h-14 w-14 rounded-[18px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm animate-float-slow">
                          <HugeiconsIcon icon={IconComp} size={22} className={slide.iconColor} />
                        </div>
                      </div>

                      <h3 className="text-[18px] font-black tracking-tight text-kat-dark leading-tight mb-1.5 text-balance">
                        {t(slide.titleKey)}
                      </h3>
                      <p className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                        {t(slide.descKey)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Liquid Dots Indicators */}
            <div className="flex items-center justify-center gap-1.5 mb-5 select-none">
              {onboardingSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    stopAutoPlay();
                    setActiveSlide(idx);
                    startAutoPlay();
                  }}
                  className={`h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 liquid-dot ${
                    activeSlide === idx
                      ? "w-5 bg-kat-primary"
                      : "w-1.5 hover:bg-slate-400 dark:hover:bg-slate-500"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Error display */}
            {errorMsg && (
              <div className="w-full mb-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-3.5 text-[13px] text-rose-800 dark:text-rose-450 font-semibold leading-relaxed flex items-start gap-2.5 animate-fadeIn">
                <HugeiconsIcon
                  icon={AlertCircleIcon}
                  className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5"
                />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action Button Stack */}
            <div className="flex flex-col gap-3 w-full">
              {/* Google Login (Primary) */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-3.5 h-14 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.97] transition-all font-extrabold text-[16px] text-kat-dark dark:text-slate-200 shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] border border-slate-100 dark:border-slate-700/50 disabled:opacity-60 disabled:scale-100 group"
              >
                {loading === "google" ? (
                  <HugeiconsIcon
                    icon={Loading01Icon}
                    className="h-5.5 w-5.5 text-kat-primary animate-spin"
                  />
                ) : (
                  <div className="group-active:scale-95 transition-transform">
                    <GoogleIcon />
                  </div>
                )}
                {t("welcomeScreen.googleLogin")}
              </button>

              {/* Guest Login (Secondary Ghost) */}
              <button
                onClick={handleGuestLogin}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl border border-transparent bg-transparent hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.97] transition-all font-bold text-[15px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-60 group"
              >
                {loading === "guest" ? (
                  <HugeiconsIcon
                    icon={Loading01Icon}
                    className="h-5.5 w-5.5 text-slate-700 dark:text-slate-350 animate-spin"
                  />
                ) : (
                  <HugeiconsIcon
                    icon={CompassIcon}
                    size={22}
                    className="text-slate-400 group-hover:text-slate-600 transition-colors group-active:scale-95"
                  />
                )}
                {t("welcomeScreen.guestLogin")}
              </button>

              {/* Install PWA button removed per user request */}
            </div>
          </div>
        </div>
        {/* end flex-1 wrapper */}

        {/* BOTTOM SECTION: LEGAL FOOTER */}
        <div className="w-full shrink-0 text-center pt-4 pb-1 relative z-10">
          <div
            className="flex items-center justify-center gap-4 text-slate-300 opacity-80 mb-3"
            title={t("welcomeScreen.multiplatform")}
          >
            <HugeiconsIcon
              icon={LaptopIcon}
              className="h-[16px] w-[16px] hover:text-sky-400 transition-colors"
              strokeWidth={2.5}
            />
            <AndroidIcon className="h-[16px] w-[16px] hover:text-emerald-400 transition-colors" />
            <AppleIcon className="h-[18px] w-[18px] hover:text-slate-400 transition-colors" />
          </div>
          <p className="text-[11.5px] leading-relaxed text-slate-400 font-medium max-w-xs mx-auto">
            <Trans
              i18nKey="welcomeScreen.legalTerms"
              components={[
                <button
                  key="terms"
                  onClick={() => setLegalModal("terms")}
                  className="text-kat-primary hover:underline font-semibold focus:outline-none"
                />,
                <button
                  key="privacy"
                  onClick={() => setLegalModal("privacy")}
                  className="text-kat-primary hover:underline font-semibold focus:outline-none"
                />,
                <button
                  key="cookie"
                  onClick={() => setLegalModal("cookie")}
                  className="text-kat-primary hover:underline font-semibold focus:outline-none"
                />,
              ]}
            />
          </p>
        </div>
      </div>

      {/* 3. LEGAL MODAL SHEETS */}
      {legalModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-[500px] rounded-[28px] border border-slate-200 dark:border-slate-800 p-6 shadow-floating max-h-[85vh] flex flex-col animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                {legalModal === "language" ? (
                  <HugeiconsIcon icon={LanguageSkillIcon} className="h-5 w-5 text-kat-primary" />
                ) : (
                  <HugeiconsIcon icon={LockIcon} className="h-5 w-5 text-kat-primary" />
                )}
                <h4 className="text-[17px] font-black text-kat-text dark:text-slate-200">
                  {legalModal === "terms" && t("welcomeScreen.modal.termsTitle")}
                  {legalModal === "privacy" && t("welcomeScreen.modal.privacyTitle")}
                  {legalModal === "cookie" && t("welcomeScreen.modal.cookieTitle")}
                  {legalModal === "language" && t("settings.menu.language.title", "Ngôn ngữ")}
                </h4>
              </div>
              <button
                onClick={() => setLegalModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 pr-1 text-[13.5px] font-medium leading-relaxed text-slate-500 dark:text-slate-400 custom-scrollbar select-text space-y-3.5">
              {legalModal === "terms" && (
                <>
                  <p className="font-bold text-kat-dark">{t("welcomeScreen.modal.terms1Title")}</p>
                  <p>{t("welcomeScreen.modal.terms1Desc")}</p>
                  <p className="font-bold text-kat-dark">{t("welcomeScreen.modal.terms2Title")}</p>
                  <p>{t("welcomeScreen.modal.terms2Desc")}</p>
                  <p className="font-bold text-kat-dark">{t("welcomeScreen.modal.terms3Title")}</p>
                  <p>{t("welcomeScreen.modal.terms3Desc")}</p>
                </>
              )}

              {legalModal === "privacy" && (
                <>
                  <p className="font-bold text-kat-dark">
                    {t("welcomeScreen.modal.privacy1Title")}
                  </p>
                  <p>{t("welcomeScreen.modal.privacy1Desc")}</p>
                  <p className="font-bold text-kat-dark">
                    {t("welcomeScreen.modal.privacy2Title")}
                  </p>
                  <p>{t("welcomeScreen.modal.privacy2Desc")}</p>
                  <p className="font-bold text-kat-dark">
                    {t("welcomeScreen.modal.privacy3Title")}
                  </p>
                  <p>{t("welcomeScreen.modal.privacy3Desc")}</p>
                </>
              )}

              {legalModal === "cookie" && (
                <>
                  <p className="font-bold text-kat-dark">{t("welcomeScreen.modal.cookie1Title")}</p>
                  <p>{t("welcomeScreen.modal.cookie1Desc")}</p>
                  <p className="font-bold text-kat-dark">{t("welcomeScreen.modal.cookie2Title")}</p>
                  <p>{t("welcomeScreen.modal.cookie2Desc")}</p>
                </>
              )}

              {legalModal === "language" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-fadeIn p-1 pr-2">
                  {[
                    {
                      code: "vi",
                      label: "Tiếng Việt",
                      char: "Vi",
                      bg: "bg-orange-50 dark:bg-orange-500/10",
                      border: "border-orange-200/50 dark:border-orange-500/20",
                      text: "text-orange-600 dark:text-orange-400",
                    },
                    {
                      code: "en",
                      label: "English",
                      char: "En",
                      bg: "bg-blue-50 dark:bg-blue-500/10",
                      border: "border-blue-200/50 dark:border-blue-500/20",
                      text: "text-blue-600 dark:text-blue-400",
                    },
                    {
                      code: "ko",
                      label: "한국어",
                      char: "한",
                      bg: "bg-rose-50 dark:bg-rose-500/10",
                      border: "border-rose-200/50 dark:border-rose-500/20",
                      text: "text-rose-600 dark:text-rose-400",
                    },
                    {
                      code: "zh",
                      label: "中文",
                      char: "文",
                      bg: "bg-red-50 dark:bg-red-500/10",
                      border: "border-red-200/50 dark:border-red-500/20",
                      text: "text-red-600 dark:text-red-400",
                    },
                    {
                      code: "ja",
                      label: "日本語",
                      char: "あ",
                      bg: "bg-fuchsia-50 dark:bg-fuchsia-500/10",
                      border: "border-fuchsia-200/50 dark:border-fuchsia-500/20",
                      text: "text-fuchsia-600 dark:text-fuchsia-400",
                    },
                    {
                      code: "th",
                      label: "ไทย",
                      char: "ก",
                      bg: "bg-emerald-50 dark:bg-emerald-500/10",
                      border: "border-emerald-200/50 dark:border-emerald-500/20",
                      text: "text-emerald-600 dark:text-emerald-400",
                    },
                    {
                      code: "es",
                      label: "Español",
                      char: "Es",
                      bg: "bg-yellow-50 dark:bg-yellow-500/10",
                      border: "border-yellow-200/50 dark:border-yellow-500/20",
                      text: "text-yellow-600 dark:text-yellow-400",
                    },
                    {
                      code: "fr",
                      label: "Français",
                      char: "Fr",
                      bg: "bg-sky-50 dark:bg-sky-500/10",
                      border: "border-sky-200/50 dark:border-sky-500/20",
                      text: "text-sky-600 dark:text-sky-400",
                    },
                    {
                      code: "de",
                      label: "Deutsch",
                      char: "De",
                      bg: "bg-slate-50 dark:bg-slate-500/10",
                      border: "border-slate-200/50 dark:border-slate-500/20",
                      text: "text-slate-600 dark:text-slate-400",
                    },
                    {
                      code: "it",
                      label: "Italiano",
                      char: "It",
                      bg: "bg-teal-50 dark:bg-teal-500/10",
                      border: "border-teal-200/50 dark:border-teal-500/20",
                      text: "text-teal-600 dark:text-teal-400",
                    },
                    {
                      code: "pt",
                      label: "Português",
                      char: "Pt",
                      bg: "bg-indigo-50 dark:bg-indigo-500/10",
                      border: "border-indigo-200/50 dark:border-indigo-500/20",
                      text: "text-indigo-600 dark:text-indigo-400",
                    },
                    {
                      code: "id",
                      label: "Indonesia",
                      char: "Id",
                      bg: "bg-cyan-50 dark:bg-cyan-500/10",
                      border: "border-cyan-200/50 dark:border-cyan-500/20",
                      text: "text-cyan-600 dark:text-cyan-400",
                    },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        i18n.changeLanguage(lang.code);
                      }}
                      className={`relative flex items-center gap-3.5 p-3 rounded-[20px] border-2 transition-all duration-300 group focus:outline-none text-left overflow-hidden w-full ${
                        i18n.language === lang.code
                          ? "border-kat-primary bg-kat-primary/5 ring-2 ring-kat-primary/20 shadow-lg shadow-kat-primary/20 scale-[1.02] dark:border-kat-primary/50 dark:bg-kat-primary/10"
                          : "border-slate-100 dark:border-white/[0.04] bg-white/80 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:scale-[1.01] active:scale-[0.98] hover:shadow-md"
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-[14px] flex items-center justify-center font-black text-[14px] border shadow-inner group-hover:scale-105 transition-transform duration-300 shrink-0 ${lang.bg} ${lang.border} ${lang.text}`}
                      >
                        {lang.char}
                      </div>
                      <div className="flex-1 min-w-0 relative z-10">
                        <span
                          className={`block text-[14.5px] font-black truncate transition-colors duration-200 tracking-tight ${
                            i18n.language === lang.code
                              ? "text-kat-primary drop-shadow-[0_0_4px_rgba(var(--kat-primary),0.3)]"
                              : "text-slate-800 dark:text-slate-200"
                          }`}
                        >
                          {lang.label}
                        </span>
                      </div>
                      <div
                        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 mr-1 relative z-10 ${
                          i18n.language === lang.code
                            ? "border-kat-primary bg-kat-primary shadow-[0_0_8px_rgba(var(--kat-primary),0.5)]"
                            : "border-slate-200 dark:border-slate-700 bg-transparent opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        {i18n.language === lang.code && (
                          <HugeiconsIcon icon={CheckIcon} className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className={`w-full inline-flex min-h-[44px] items-center justify-center rounded-[12px] px-6 font-bold hover:brightness-105 active:scale-[0.98] transition-all shadow-sm ${
                  legalModal === "language"
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                    : "bg-kat-dark dark:bg-kat-primary text-white dark:text-slate-950"
                }`}
              >
                {legalModal === "language"
                  ? t("settings.actions.backToMenu", "Quay lại menu")
                  : t("welcomeScreen.modal.agreeAndClose")}
              </button>
            </div>
          </div>
        </div>
      )}

      <PWAInstallInstructionsSheet
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        platform={platform as "ios" | "android" | "other"}
      />
    </div>
  );
}
