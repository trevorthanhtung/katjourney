import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

interface PWAInstallInstructionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  platform?: "ios" | "android" | "other";
}

export function PWAInstallInstructionsSheet({
  isOpen,
  onClose,
  platform = "ios",
}: PWAInstallInstructionsSheetProps) {
  if (!isOpen) return null;

  const isAndroid = platform === "android";

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      {/* Click outside to close */}
      <div className="absolute inset-0 z-0" onClick={onClose} />

      <div className="bg-white dark:bg-kat-surface w-full max-w-[420px] rounded-[30px] border border-slate-100 dark:border-kat-border/40 p-6 sm:p-7 shadow-floating relative z-10 animate-slideUp flex flex-col pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between pb-4.5 border-b border-slate-100/80 dark:border-kat-border/40 shrink-0">
          <div className="flex flex-col text-left">
            <h4 className="text-[17px] font-black text-kat-dark leading-snug">
              {isAndroid ? "Cài đặt KAT Journey trên Android" : "Cài đặt KAT Journey trên iPhone"}
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
              {isAndroid
                ? "Thực hiện theo các bước đơn giản dưới đây"
                : "Thực hiện theo 3 bước cực kỳ đơn giản dưới đây"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng hướng dẫn"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
          </button>
        </div>

        {/* Steps Content */}
        <div className="py-5 space-y-5 flex-1 select-text">
          {/* Step 1 */}
          <div className="flex gap-3.5 items-start text-left">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 font-black shrink-0 text-[13.5px] shadow-sm">
              1
            </div>
            <div className="space-y-1 pt-1">
              <p className="text-[14px] font-black text-kat-dark">
                {isAndroid ? "Nhấn vào menu trình duyệt" : "Nhấn vào nút Chia sẻ (Share)"}
              </p>
              <p className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                {isAndroid ? (
                  <>
                    Tìm biểu tượng{" "}
                    <strong className="font-extrabold text-kat-dark">3 dấu chấm (⋮)</strong> thường
                    nằm ở góc trên bên phải của trình duyệt Chrome hoặc menu dưới cùng.
                  </>
                ) : (
                  <>
                    Tìm biểu tượng hình vuông có mũi tên chỉ lên{" "}
                    <span className="inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md p-1 px-1.5 align-middle mx-0.5 border border-slate-200/50 dark:border-kat-border/40">
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        className="text-blue-600 dark:text-blue-400"
                        aria-hidden="true"
                      >
                        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M12 2v14M12 2L8 6m4-4l4 4" />
                      </svg>
                    </span>{" "}
                    trên thanh công cụ Safari ở dưới cùng màn hình.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3.5 items-start text-left">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/40 text-teal-600 dark:text-teal-400 font-black shrink-0 text-[13.5px] shadow-sm">
              2
            </div>
            <div className="space-y-1 pt-1">
              <p className="text-[14px] font-black text-kat-dark">
                {isAndroid
                  ? 'Chọn "Thêm vào MH chính"'
                  : 'Chọn "Thêm vào MH chính" (Add to Home Screen)'}
              </p>
              <p className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                {isAndroid ? (
                  <>
                    Tìm và nhấn vào tùy chọn{" "}
                    <strong className="font-extrabold text-kat-dark">
                      Thêm vào màn hình chính
                    </strong>{" "}
                    (hoặc Cài đặt ứng dụng).
                  </>
                ) : (
                  <>
                    Cuộn menu chia sẻ xuống dưới và nhấn vào tùy chọn có biểu tượng dấu cộng{" "}
                    <span className="inline-flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md p-1 px-1.5 align-middle mx-0.5 border border-slate-200/50 dark:border-kat-border/40">
                      <svg
                        viewBox="0 0 24 24"
                        width="13"
                        height="13"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-slate-800 dark:text-slate-200"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                    .
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3.5 items-start text-left">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-black shrink-0 text-[13.5px] shadow-sm">
              3
            </div>
            <div className="space-y-1 pt-1">
              <p className="text-[14px] font-black text-kat-dark">Xác nhận thêm</p>
              <p className="text-[12.5px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                {isAndroid ? (
                  <>
                    Nhấn nút <strong className="font-extrabold text-kat-dark">"Thêm"</strong> hoặc
                    "Cài đặt" ở hộp thoại hiện ra để hoàn tất.
                  </>
                ) : (
                  <>
                    Nhấn nút <strong className="font-extrabold text-kat-dark">"Thêm" (Add)</strong>{" "}
                    ở góc trên bên phải màn hình để hoàn tất.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 mt-2">
          <button
            onClick={onClose}
            className="w-full min-h-[44px] flex items-center justify-center rounded-xl font-bold bg-kat-dark dark:bg-kat-primary text-white dark:text-kat-dark hover:brightness-110 active:scale-[0.98] transition-all shadow-sm"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
