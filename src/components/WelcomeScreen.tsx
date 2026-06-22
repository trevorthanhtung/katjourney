import React, { useState, useEffect, useRef } from "react";
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
  Download01Icon
} from "@hugeicons/core-free-icons";
import { signInAsGuest, signInWithGoogle } from "../services/authService";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { PWAInstallInstructionsSheet } from "./PWAInstallInstructionsSheet";

interface WelcomeScreenProps {
  onDismiss: () => void;
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
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
    title: "Lập lịch trình thông minh",
    desc: "Lên kế hoạch chi tiết từng ngày, ghim địa điểm và sắp xếp hành trình trực quan cùng đồng đội.",
    accent: "from-kat-primary/10 to-teal-500/10",
    iconColor: "text-kat-primary",
  },
  {
    icon: WalletCardsIcon,
    title: "Chia sẻ chi phí công bằng",
    desc: "Ghi chép chi tiêu nhóm, tự động chia hóa đơn và giải quyết thanh toán tức thì.",
    accent: "from-amber-500/10 to-orange-500/10",
    iconColor: "text-amber-500",
  },
  {
    icon: SparklesIcon,
    title: "Lưu giữ trọn vẹn kỷ niệm",
    desc: "Chuẩn bị đồ đạc theo checklist và viết nhật ký hành trình lưu giữ những bức ảnh ý nghĩa.",
    accent: "from-pink-500/10 to-rose-500/10",
    iconColor: "text-rose-500",
  }
];

export function WelcomeScreen({ onDismiss }: WelcomeScreenProps) {
  const [loading, setLoading] = useState<"google" | "guest" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<"terms" | "privacy" | "cookie" | null>(null);

  // PWA Install Assistant states
  const { isInstallable, isStandalone, platform, triggerInstall } = usePWAInstall();
  const [isIosGuideOpen, setIsIosGuideOpen] = useState(false);

  const handleInstallPWA = async () => {
    const showGuide = await triggerInstall();
    if (showGuide && platform === "ios") {
      setIsIosGuideOpen(true);
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

  const dragOffset = isDragging && touchStartX !== null && touchCurrentX !== null
    ? touchCurrentX - touchStartX
    : 0;

  const sliderStyle = {
    transform: isDragging
      ? `translate3d(calc(-${activeSlide * 100}% + ${dragOffset}px), 0, 0)`
      : `translate3d(-${activeSlide * 100}%, 0, 0)`,
    transition: isDragging ? "none" : "transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)"
  };

  const handleGoogleLogin = async () => {
    setLoading("google");
    setErrorMsg(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || "Đăng nhập Google thất bại.");
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
      setErrorMsg(err.message || "Đăng nhập Khách thất bại.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] grid grid-cols-1 lg:grid-cols-2 w-full bg-kat-bg overflow-hidden font-sans select-none">
      
      {/* 1. LEFT SIDE - Hero Image (Desktop only) */}
      <div className="hidden lg:flex relative w-full h-full overflow-hidden select-text">
        {/* Background Landscape Image */}
        <img 
          src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop" 
          alt="Travel Landscape" 
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-10000 hover:scale-105"
          loading="eager"
        />
        
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        
        {/* Top Logo */}
        <div className="absolute top-8 left-12 flex items-center gap-3 z-10 select-none">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-white/20 shadow-sm shrink-0">
            <img src="/asset/logo.png" alt="KAT Journey Logo" className="h-6 w-6 object-contain" />
          </div>
          <span className="text-[20px] font-black tracking-tight text-white drop-shadow-sm">KAT Journey</span>
        </div>

        {/* Cinematic Content Text */}
        <div className="absolute bottom-12 left-12 pr-12 z-10 space-y-3">
          <h2 className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-none mb-2 text-balance">
            Khám phá thế giới.<br />Lưu giữ khoảnh khắc.
          </h2>
          <p className="text-lg text-gray-300 font-semibold leading-relaxed max-w-lg">
            Đồng bộ dữ liệu đa nền tảng, quản lý lịch trình và chia sẻ chi phí tức thì.
          </p>
        </div>
      </div>

      {/* 2. RIGHT SIDE - Zero-Friction Auth Form (Mobile-first) */}
      <div className="flex flex-col justify-between items-center relative w-full h-full px-6 py-6 pb-safe lg:px-12 lg:py-10 bg-white overflow-hidden">
        
        <div className="hidden lg:block h-2 w-full shrink-0 relative z-10" />

        {/* MIDDLE ACTIONS: Auth Card */}
        <div className="w-full max-w-[400px] mx-auto flex-1 flex flex-col justify-center">
        <div className="w-full p-6 sm:p-8 bg-white rounded-[32px] shadow-[0_2px_24px_rgba(3,13,46,0.07)] border border-slate-200 flex flex-col items-center relative z-10 animate-scaleUp">
          
          {/* Onboarding Carousel (2027 Premium Swipeable) */}
          <div 
            className="w-full overflow-x-hidden overflow-y-visible mb-4 relative cursor-grab active:cursor-grabbing select-none pt-2"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              className="flex w-full"
              style={sliderStyle}
            >
              {onboardingSlides.map((slide, idx) => {
                const IconComp = slide.icon;
                return (
                  <div key={idx} className="w-full shrink-0 flex flex-col items-center text-center px-1">
                    {/* Icon */}
                    <div className="relative mb-3 flex items-center justify-center">
                      <div className="flex items-center justify-center h-14 w-14 rounded-[18px] bg-slate-50 border border-slate-200 shadow-sm animate-float-slow">
                        <HugeiconsIcon icon={IconComp} size={22} className={slide.iconColor} />
                      </div>
                    </div>

                    <h3 className="text-[18px] font-black tracking-tight text-kat-dark leading-tight mb-1.5 text-balance">
                      {slide.title}
                    </h3>
                    <p className="text-[12.5px] font-semibold text-slate-500 leading-relaxed max-w-[280px] mx-auto">
                      {slide.desc}
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
                className={`h-1.5 rounded-full bg-slate-350 liquid-dot ${
                  activeSlide === idx ? "w-5 bg-kat-primary" : "w-1.5 hover:bg-slate-400"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Error display */}
          {errorMsg && (
            <div className="w-full mb-4 rounded-2xl bg-rose-50 border border-rose-100 p-3.5 text-[13px] text-rose-800 font-semibold leading-relaxed flex items-start gap-2.5 animate-fadeIn">
              <HugeiconsIcon icon={AlertCircleIcon} className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Button Stack */}
          <div className="flex flex-col gap-3 w-full">
            {/* Google Login (Primary) */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-3.5 h-14 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.97] transition-all font-extrabold text-[16px] text-kat-dark shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] border border-slate-100 disabled:opacity-60 disabled:scale-100 group"
            >
              {loading === "google" ? (
                <HugeiconsIcon icon={Loading01Icon} className="h-5.5 w-5.5 text-kat-primary animate-spin" />
              ) : (
                <div className="group-active:scale-95 transition-transform"><GoogleIcon /></div>
              )}
              Tiếp tục với Google
            </button>

            {/* Guest Login (Secondary Ghost) */}
            <button
              onClick={handleGuestLogin}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl border border-transparent bg-transparent hover:bg-black/5 active:scale-[0.97] transition-all font-bold text-[15px] text-slate-500 hover:text-slate-800 disabled:opacity-60 group"
            >
              {loading === "guest" ? (
                <HugeiconsIcon icon={Loading01Icon} className="h-5.5 w-5.5 text-slate-700 animate-spin" />
              ) : (
                <HugeiconsIcon 
                  icon={CompassIcon} 
                  size={22}
                  className="text-slate-400 group-hover:text-slate-600 transition-colors group-active:scale-95" 
                />
              )}
              Khám phá tư cách Khách
            </button>

            {/* Install PWA button removed per user request */}
          </div>

        </div>
        </div>{/* end flex-1 wrapper */}

        {/* BOTTOM SECTION: LEGAL FOOTER */}
        <div className="w-full shrink-0 text-center pt-4 pb-1 relative z-10">
          <div className="flex items-center justify-center gap-4 text-slate-300 opacity-80 mb-3" title="Sẵn sàng trên đa nền tảng">
            <HugeiconsIcon icon={LaptopIcon} className="h-[16px] w-[16px] hover:text-sky-400 transition-colors" strokeWidth={2.5} />
            <AndroidIcon className="h-[16px] w-[16px] hover:text-emerald-400 transition-colors" />
            <AppleIcon className="h-[18px] w-[18px] hover:text-slate-400 transition-colors" />
          </div>
          <p className="text-[11.5px] leading-relaxed text-slate-400 font-medium max-w-xs mx-auto">
            Bằng việc tiếp tục, bạn đồng ý với{" "}
            <button 
              onClick={() => setLegalModal("terms")}
              className="text-kat-primary hover:underline font-semibold focus:outline-none"
            >
              Điều khoản Sử dụng
            </button>
            ,{" "}
            <button 
              onClick={() => setLegalModal("privacy")}
              className="text-kat-primary hover:underline font-semibold focus:outline-none"
            >
              Chính sách Quyền riêng tư
            </button>{" "}
            và{" "}
            <button 
              onClick={() => setLegalModal("cookie")}
              className="text-kat-primary hover:underline font-semibold focus:outline-none"
            >
              Chính sách Cookie
            </button>{" "}
            của chúng tôi.
          </p>
        </div>

      </div>

      {/* 3. LEGAL MODAL SHEETS */}
      {legalModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-[500px] rounded-[28px] border border-slate-200 p-6 shadow-floating max-h-[85vh] flex flex-col animate-scaleUp">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={LockIcon} className="h-5 w-5 text-kat-primary" />
                <h4 className="text-[17px] font-black text-kat-text">
                  {legalModal === "terms" && "Điều khoản Sử dụng"}
                  {legalModal === "privacy" && "Chính sách Quyền riêng tư"}
                  {legalModal === "cookie" && "Chính sách Cookie"}
                </h4>
              </div>
              <button 
                onClick={() => setLegalModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 pr-1 text-[13.5px] font-medium leading-relaxed text-slate-500 custom-scrollbar select-text space-y-3.5">
              {legalModal === "terms" && (
                <>
                  <p className="font-bold text-kat-dark">1. Cùng tạo nên những hành trình tuyệt vời</p>
                  <p>Chào mừng bạn đến với KAT Journey! Bằng việc trải nghiệm ứng dụng, chúng ta đồng ý tôn trọng các nguyên tắc chung để xây dựng một cộng đồng du lịch văn minh. Nếu có điểm nào chưa phù hợp, bạn luôn có quyền ngưng sử dụng dịch vụ bất cứ lúc nào.</p>
                  <p className="font-bold text-kat-dark">2. Không gian kỷ niệm của riêng bạn</p>
                  <p>Tài khoản là nơi cất giữ những chuyến đi mang đậm dấu ấn cá nhân. Hãy giúp chúng tôi bảo vệ nó bằng cách giữ an toàn thông tin đăng nhập (tài khoản Google). Chúng tôi luôn khuyến khích bạn bảo mật thiết bị cá nhân thật tốt để tránh rò rỉ dữ liệu.</p>
                  <p className="font-bold text-kat-dark">3. Lưu trữ an toàn, đi muôn nơi</p>
                  <p>KAT Journey ưu tiên lưu dữ liệu trực tiếp trên máy của bạn để bạn có thể xem lịch trình ngay cả khi lên rừng hay xuống biển (không có mạng). Lưu ý nhỏ: Đừng vội xóa dữ liệu duyệt web (clear cache) khi chưa đồng bộ lên đám mây, để tránh làm rơi rớt những kế hoạch đang dở dang nhé!</p>
                </>
              )}

              {legalModal === "privacy" && (
                <>
                  <p className="font-bold text-kat-dark">1. Chúng tôi cần biết gì về bạn? Rất ít!</p>
                  <p>KAT Journey chỉ thu thập một vài thông tin cơ bản (Họ tên, Email, Ảnh đại diện) từ tài khoản Google của bạn để làm "hộ chiếu" định danh. Việc này giúp bạn lưu trữ và đồng bộ hóa các chuyến đi xuyên suốt trên nhiều thiết bị.</p>
                  <p className="font-bold text-kat-dark">2. Kỷ niệm của bạn, an toàn là trên hết</p>
                  <p>Mọi kế hoạch, chi tiêu và hành lý đều "ngủ yên" trên thiết bị của bạn. Chỉ khi bạn chủ động mời bạn bè qua tính năng "Chia sẻ chuyến đi", dữ liệu mới được mã hóa cẩn thận và đưa lên hệ thống máy chủ đám mây với độ bảo mật cao nhất.</p>
                  <p className="font-bold text-kat-dark">3. Quyền kiểm soát hoàn toàn trong tay bạn</p>
                  <p>Bạn là "cơ trưởng" của tài khoản này. Bạn có toàn quyền tạo mới, chỉnh sửa, xóa bỏ vĩnh viễn các chuyến đi, hoặc thu hồi link chia sẻ bất kỳ lúc nào chỉ với một lần chạm.</p>
                </>
              )}

              {legalModal === "cookie" && (
                <>
                  <p className="font-bold text-kat-dark">1. Cookie giúp hành trình mượt mà hơn</p>
                  <p>KAT Journey sử dụng một ít "bánh quy" (Cookies và Local Storage) để ghi nhớ bạn là ai, chuyến đi nào đang xem dở, và giữ cho bạn luôn trong trạng thái sẵn sàng lên đường mà không cần đăng nhập lại nhiều lần.</p>
                  <p className="font-bold text-kat-dark">2. Nói "Không" với quảng cáo theo dõi</p>
                  <p>Trải nghiệm lên kế hoạch du lịch của bạn không nên bị làm phiền. Chúng tôi cam kết chỉ sử dụng các Cookie kỹ thuật thiết yếu để ứng dụng hoạt động chính xác. KAT Journey tuyệt đối KHÔNG bám đuôi hay bán dữ liệu của bạn cho bất kỳ bên thứ ba nào.</p>
                </>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="w-full inline-flex min-h-[44px] items-center justify-center rounded-[12px] bg-kat-primary text-white px-6 font-bold hover:brightness-105 active:scale-[0.98] transition-all shadow-sm"
              >
                Đồng ý và Đóng
              </button>
            </div>

          </div>
        </div>
      )}

      <PWAInstallInstructionsSheet isOpen={isIosGuideOpen} onClose={() => setIsIosGuideOpen(false)} />
    </div>
  );
}
