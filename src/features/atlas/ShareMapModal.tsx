import React, { useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { toPng } from "html-to-image";
import { useTranslation } from "react-i18next";
import { geoEquirectangular, geoPath } from "d3-geo";

interface ShareMapModalProps {
  onClose: () => void;
  geographies: any[];
  visitedCountries: string[];
  totalTrips: number;
}

export function ShareMapModal({
  onClose,
  geographies,
  visitedCountries,
  totalTrips,
}: ShareMapModalProps) {
  const { t } = useTranslation();
  const mapRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // SVG dimensions for the flat map
  const width = 800;
  const height = 450;

  const { projection, pathGenerator } = useMemo(() => {
    const proj = geoEquirectangular().fitSize([width, height], {
      type: "FeatureCollection",
      features: geographies,
    } as any);
    const pathGen = geoPath().projection(proj);
    return { projection: proj, pathGenerator: pathGen };
  }, [geographies, width, height]);

  const percentage = ((visitedCountries.length / 195) * 100).toFixed(1);

  const handleDownload = async (existingDataUrl?: string) => {
    if (!mapRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl =
        existingDataUrl ||
        (await toPng(mapRef.current, {
          cacheBust: true,
          pixelRatio: 2,
          style: {
            transform: "scale(1)",
            transformOrigin: "top left",
          },
        }));

      const link = document.createElement("a");
      link.download = `kat-journey-map-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export map:", err);
      alert(t("atlas.share.error", "Có lỗi xảy ra khi tạo ảnh. Vui lòng thử lại sau."));
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativeShare = async () => {
    if (!mapRef.current) return;
    setIsExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 100));
      const dataUrl = await toPng(mapRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      });

      if (navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "my-travel-map.png", { type: blob.type });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "KAT Journey",
            text: t("atlas.share.text", "Xem bản đồ du lịch của tôi trên KAT Journey!"),
            files: [file],
          });
          return;
        }
      }

      // Fallback to download if sharing is not supported
      await handleDownload(dataUrl);
    } catch (err) {
      console.error("Share failed", err);
      alert(t("atlas.share.fallback", "Không thể chia sẻ, tự động chuyển sang tải ảnh..."));
      handleDownload();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      {/* The Map Card (This will be exported) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg mx-auto bg-[#030712] rounded-[2.5rem] overflow-hidden shadow-[0_32px_80px_-12px_rgba(6,182,212,0.3)] border border-cyan-500/30 ring-1 ring-white/10 relative"
      >
        <div
          ref={mapRef}
          className="bg-[#030712] w-full flex flex-col relative overflow-hidden"
          style={{ aspectRatio: "4/5" }} // Instagram portrait friendly
        >
          {/* Ambient background glows */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>

          {/* Header */}
          <div className="flex items-center justify-center gap-3 pt-10 pb-2 relative z-10">
            <img
              src="/asset/logo.png"
              alt="KAT Journey"
              className="w-8 h-8 rounded-[10px] object-cover shadow-[0_0_20px_rgba(6,182,212,0.6)] border border-cyan-400/50"
            />
            <span className="text-white font-black text-2xl tracking-widest drop-shadow-md">
              KAT Journey
            </span>
          </div>

          {/* Map Area */}
          <div className="flex-1 w-full relative flex items-center justify-center px-2">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[120%] bg-gradient-to-tr from-cyan-500/10 via-transparent to-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>

            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-full drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)] relative z-10"
              style={{ overflow: "visible" }}
            >
              <g>
                {geographies.map((geo) => {
                  const isVisited = visitedCountries.includes(geo.id);
                  return (
                    <path
                      key={geo.id || geo.properties.name}
                      d={pathGenerator(geo) || ""}
                      fill={isVisited ? "#22d3ee" : "rgba(255,255,255,0.03)"}
                      stroke={isVisited ? "#06b6d4" : "rgba(255,255,255,0.06)"}
                      strokeWidth={isVisited ? 1.5 : 0.5}
                      className="transition-colors duration-300"
                    />
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Stats Bar */}
          <div className="mt-auto px-6 pb-10 pt-4 relative z-20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-[1.5rem] p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
                <span className="text-4xl font-black text-white tracking-tighter mb-1 drop-shadow-md">
                  {visitedCountries.length}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">
                  {t("dashboard.stats.countries", "Quốc gia")}
                </span>
              </div>

              <div className="flex-1 bg-cyan-500/10 border border-cyan-400/30 rounded-[1.5rem] p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/20">
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/20 to-transparent opacity-50"></div>
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-200 mb-1 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] relative z-10">
                  {percentage}%
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-200/70 relative z-10">
                  {t("dashboard.stats.world", "Thế giới")}
                </span>
              </div>

              <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-[1.5rem] p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50"></div>
                <span className="text-4xl font-black text-white tracking-tighter mb-1 drop-shadow-md">
                  {totalTrips}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">
                  {t("atlas.stats.trips", "Chuyến đi")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4 w-full max-w-lg justify-center">
        <button
          onClick={handleNativeShare}
          disabled={isExporting}
          className="flex-1 flex flex-col items-center justify-center py-4 bg-slate-800/50 hover:bg-slate-700/50 border border-white/10 backdrop-blur-md rounded-2xl transition-colors gap-2 text-white/80 disabled:opacity-50"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          <span className="text-xs font-semibold tracking-wider uppercase">
            {t("atlas.share.btn_share", "Chia sẻ")}
          </span>
        </button>
        <button
          onClick={() => handleDownload()}
          disabled={isExporting}
          className="flex-1 flex flex-col items-center justify-center py-4 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 rounded-2xl transition-all gap-2 shadow-[0_0_30px_rgba(6,182,212,0.3)] backdrop-blur-md disabled:opacity-50"
        >
          {isExporting ? (
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          )}
          <span className="text-xs font-semibold tracking-wider uppercase">
            {t("atlas.share.btn_save", "Tải ảnh")}
          </span>
        </button>
      </div>

      {/* Close button - Safe area adjusted and high z-index */}
      <button
        onClick={onClose}
        className="absolute top-[max(1.5rem,env(safe-area-inset-top))] right-[max(1.5rem,env(safe-area-inset-right))] w-11 h-11 bg-slate-800/60 hover:bg-slate-700/80 rounded-full flex items-center justify-center text-white transition-colors z-[300] backdrop-blur-md shadow-xl border border-white/20"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
