import React, { useState } from "react";
import { 
  Compass, 
  Loader2, 
  X,
  AlertCircle,
  LockKeyhole,
  User
} from "lucide-react";
import { signInAsGuest, signInWithGoogle } from "../services/authService";

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

export function WelcomeScreen({ onDismiss }: WelcomeScreenProps) {
  const [loading, setLoading] = useState<"google" | "guest" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [legalModal, setLegalModal] = useState<"terms" | "privacy" | "cookie" | null>(null);

  const handleGoogleLogin = async () => {
    setLoading("google");
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      // Lưu trạng thái phiên làm việc và chế độ đăng nhập
      localStorage.setItem("kat_journey_welcome_viewed", "true");
      localStorage.setItem("kat_auth_mode", "google");
      onDismiss();
    } catch (err: any) {
      setErrorMsg(err.message || "Đăng nhập Google thất bại.");
    } finally {
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
    <div className="fixed inset-0 z-[100] grid grid-cols-1 md:grid-cols-2 min-h-[100dvh] w-full bg-kat-bg overflow-hidden font-sans select-none">
      
      {/* 1. LEFT SIDE - Hero Image (Desktop only) */}
      <div className="hidden md:flex relative w-full h-full overflow-hidden select-text">
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
          <h2 className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-none mb-2">
            Khám phá thế giới.<br />Lưu giữ khoảnh khắc.
          </h2>
          <p className="text-lg text-gray-300 font-semibold leading-relaxed max-w-lg">
            Đồng bộ dữ liệu đa nền tảng, quản lý lịch trình và chia sẻ chi phí tức thì.
          </p>
        </div>
      </div>

      {/* 2. RIGHT SIDE - Zero-Friction Auth Form (Mobile-first) */}
      <div className="flex flex-col justify-between items-center relative w-full h-full min-h-[100dvh] overflow-y-auto px-6 py-8 md:px-12 md:py-14 custom-scrollbar bg-gradient-to-br from-[#E6F9F8] via-[#FFFDF8] to-[#FFF0F5]">
        
        {/* Noise overlay for spatial texture */}
        <div 
          className="absolute inset-0 z-0 opacity-[0.25] mix-blend-overlay pointer-events-none" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />

        <div className="hidden md:block h-2 w-full shrink-0 relative z-10" />

        {/* MIDDLE ACTIONS: Glassmorphism Card */}
        <div className="w-full max-w-[400px] mx-auto my-auto p-8 sm:p-10 bg-white/60 backdrop-blur-xl rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white flex flex-col items-center relative z-10 animate-scaleUp">
          
          {/* Header text with Logo */}
          <div className="mb-10 text-center flex flex-col items-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-white shadow-sm border border-slate-100 mb-6 ring-4 ring-white/50">
              <img src="/asset/logo.png" alt="KAT Journey Logo" className="h-10 w-10 object-contain drop-shadow-sm" />
            </div>
            <h3 className="text-[32px] font-black tracking-tight text-[#030D2E] leading-tight">
              Bắt đầu hành trình
            </h3>
            <p className="text-[15px] font-semibold text-slate-500 mt-3 max-w-[280px] mx-auto leading-relaxed">
              Lên kế hoạch, chia sẻ và lưu giữ trọn vẹn từng khoảnh khắc.
            </p>
          </div>

          {/* Error display */}
          {errorMsg && (
            <div className="w-full mb-6 rounded-2xl bg-rose-50 border border-rose-100 p-4 text-[13px] text-rose-800 font-semibold leading-relaxed flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Button Stack, height h-14, gap-4 */}
          <div className="flex flex-col gap-3.5 w-full">
            {/* Google Login (Primary) */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-3.5 h-14 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.97] transition-all font-extrabold text-[16px] text-[#030D2E] shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] border border-slate-100 disabled:opacity-60 disabled:scale-100 group"
            >
              {loading === "google" ? (
                <Loader2 className="h-5.5 w-5.5 text-[#00BFB7] animate-spin" />
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
                <Loader2 className="h-5.5 w-5.5 text-slate-700 animate-spin" />
              ) : (
                <Compass className="h-5.5 w-5.5 text-slate-400 group-hover:text-slate-600 transition-colors group-active:scale-95" />
              )}
              Khám phá tư cách Khách
            </button>
          </div>

        </div>

        {/* BOTTOM SECTION: LEGAL FOOTER */}
        <div className="w-full shrink-0 text-center pt-8 pb-2 relative z-10">
          <p className="text-[12.5px] leading-relaxed text-slate-500 font-medium max-w-xs mx-auto">
            Bằng việc tiếp tục, bạn đồng ý với{" "}
            <button 
              onClick={() => setLegalModal("terms")}
              className="text-[#00BFB7] hover:underline font-semibold focus:outline-none"
            >
              Điều khoản Sử dụng
            </button>
            ,{" "}
            <button 
              onClick={() => setLegalModal("privacy")}
              className="text-[#00BFB7] hover:underline font-semibold focus:outline-none"
            >
              Chính sách Quyền riêng tư
            </button>{" "}
            và{" "}
            <button 
              onClick={() => setLegalModal("cookie")}
              className="text-[#00BFB7] hover:underline font-semibold focus:outline-none"
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
          <div className="bg-white w-full max-w-[500px] rounded-[28px] border border-[#E8E1D8] p-6 shadow-floating max-h-[85vh] flex flex-col animate-scaleUp">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <LockKeyhole className="h-5 w-5 text-[#00BFB7]" />
                <h4 className="text-[17px] font-black text-[#030D2E]">
                  {legalModal === "terms" && "Điều khoản Sử dụng"}
                  {legalModal === "privacy" && "Chính sách Quyền riêng tư"}
                  {legalModal === "cookie" && "Chính sách Cookie"}
                </h4>
              </div>
              <button 
                onClick={() => setLegalModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 pr-1 text-[13.5px] font-medium leading-relaxed text-slate-500 custom-scrollbar select-text space-y-3.5">
              {legalModal === "terms" && (
                <>
                  <p className="font-bold text-[#030D2E]">1. Cùng tạo nên những hành trình tuyệt vời</p>
                  <p>Chào mừng bạn đến với KAT Journey! Bằng việc trải nghiệm ứng dụng, chúng ta đồng ý tôn trọng các nguyên tắc chung để xây dựng một cộng đồng du lịch văn minh. Nếu có điểm nào chưa phù hợp, bạn luôn có quyền ngưng sử dụng dịch vụ bất cứ lúc nào.</p>
                  <p className="font-bold text-[#030D2E]">2. Không gian kỷ niệm của riêng bạn</p>
                  <p>Tài khoản là nơi cất giữ những chuyến đi mang đậm dấu ấn cá nhân. Hãy giúp chúng tôi bảo vệ nó bằng cách giữ an toàn thông tin đăng nhập (tài khoản Google). Chúng tôi luôn khuyến khích bạn bảo mật thiết bị cá nhân thật tốt để tránh rò rỉ dữ liệu.</p>
                  <p className="font-bold text-[#030D2E]">3. Lưu trữ an toàn, đi muôn nơi</p>
                  <p>KAT Journey ưu tiên lưu dữ liệu trực tiếp trên máy của bạn để bạn có thể xem lịch trình ngay cả khi lên rừng hay xuống biển (không có mạng). Lưu ý nhỏ: Đừng vội xóa dữ liệu duyệt web (clear cache) khi chưa đồng bộ lên đám mây, để tránh làm rơi rớt những kế hoạch đang dở dang nhé!</p>
                </>
              )}

              {legalModal === "privacy" && (
                <>
                  <p className="font-bold text-[#030D2E]">1. Chúng tôi cần biết gì về bạn? Rất ít!</p>
                  <p>KAT Journey chỉ thu thập một vài thông tin cơ bản (Họ tên, Email, Ảnh đại diện) từ tài khoản Google của bạn để làm "hộ chiếu" định danh. Việc này giúp bạn lưu trữ và đồng bộ hóa các chuyến đi xuyên suốt trên nhiều thiết bị.</p>
                  <p className="font-bold text-[#030D2E]">2. Kỷ niệm của bạn, an toàn là trên hết</p>
                  <p>Mọi kế hoạch, chi tiêu và hành lý đều "ngủ yên" trên thiết bị của bạn. Chỉ khi bạn chủ động mời bạn bè qua tính năng "Chia sẻ chuyến đi", dữ liệu mới được mã hóa cẩn thận và đưa lên hệ thống máy chủ đám mây với độ bảo mật cao nhất.</p>
                  <p className="font-bold text-[#030D2E]">3. Quyền kiểm soát hoàn toàn trong tay bạn</p>
                  <p>Bạn là "cơ trưởng" của tài khoản này. Bạn có toàn quyền tạo mới, chỉnh sửa, xóa bỏ vĩnh viễn các chuyến đi, hoặc thu hồi link chia sẻ bất kỳ lúc nào chỉ với một lần chạm.</p>
                </>
              )}

              {legalModal === "cookie" && (
                <>
                  <p className="font-bold text-[#030D2E]">1. Cookie giúp hành trình mượt mà hơn</p>
                  <p>KAT Journey sử dụng một ít "bánh quy" (Cookies và Local Storage) để ghi nhớ bạn là ai, chuyến đi nào đang xem dở, và giữ cho bạn luôn trong trạng thái sẵn sàng lên đường mà không cần đăng nhập lại nhiều lần.</p>
                  <p className="font-bold text-[#030D2E]">2. Nói "Không" với quảng cáo theo dõi</p>
                  <p>Trải nghiệm lên kế hoạch du lịch của bạn không nên bị làm phiền. Chúng tôi cam kết chỉ sử dụng các Cookie kỹ thuật thiết yếu để ứng dụng hoạt động chính xác. KAT Journey tuyệt đối KHÔNG bám đuôi hay bán dữ liệu của bạn cho bất kỳ bên thứ ba nào.</p>
                </>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="w-full inline-flex min-h-[44px] items-center justify-center rounded-[12px] bg-[#00BFB7] text-[#030D2E] px-6 font-bold hover:brightness-105 active:scale-[0.98] transition-all"
              >
                Đồng ý và Đóng
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
