import React, { useState } from "react";
import { CloudRainWind } from "lucide-react";
import { getWeatherIcon } from "../../services/weatherService";
import { useWeather } from "../../hooks/useWeather";
import { WeatherDetailsModal } from "./WeatherDetailsModal";

interface WeatherWidgetProps {
  destination: string;
  latitude?: number;
  longitude?: number;
  days?: number;
}

export function WeatherWidget({ destination, latitude, longitude, days = 3 }: WeatherWidgetProps) {
  const { loading, error, forecast } = useWeather(destination, latitude, longitude, days);
  const [weatherModalOpen, setWeatherModalOpen] = useState(false);

  if (!destination?.trim() && !latitude && !longitude) {
    return (
      <div className="w-full mb-6 rounded-3xl bg-gradient-to-b from-sky-50/20 via-sky-50/5 to-white border border-slate-200/40 p-5 shadow-[0_4px_20px_rgba(3,13,46,0.02)] flex flex-col items-center justify-center text-center gap-2">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-500 mb-1 shadow-sm animate-pulse">
          <CloudRainWind className="w-5.5 h-5.5" />
        </span>
        <span className="text-[14px] font-black text-[#030D2E]">Chưa có điểm đến</span>
        <span className="text-[11.5px] text-slate-500/80 font-medium max-w-[220px] leading-relaxed">Hãy thêm điểm đến cho chuyến đi để xem dự báo thời tiết tại đây.</span>
      </div>
    );
  }

  if (error || (!loading && !forecast)) {
    return (
      <div className="w-full h-auto py-4 mb-6 rounded-3xl bg-rose-50 border border-rose-100 flex flex-col items-center justify-center text-rose-500 gap-1 px-4 text-center">
        <CloudRainWind className="w-6 h-6 mb-1 opacity-50" />
        <span className="text-[12.5px] font-bold">Địa điểm không có dữ liệu để cập nhật thời tiết</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-24 mb-6 rounded-2xl bg-sky-50/50 border border-sky-100/50 animate-pulse flex items-center justify-center">
        <span className="text-sky-300 text-[13px] font-bold">Đang tải thời tiết...</span>
      </div>
    );
  }

  // Find absolute min and max for the temperature bars
  const absMin = forecast ? Math.min(...forecast.temperature_2m_min) : 0;
  const absMax = forecast ? Math.max(...forecast.temperature_2m_max) : 100;
  const tempRange = absMax - absMin;

  // Current temperature for "today" dot
  const currentTemp = forecast?.current?.temperature;

  return (
    <>
      <div className="w-full mb-6 rounded-3xl bg-gradient-to-b from-sky-50/70 via-sky-50/20 to-white border border-sky-100/70 shadow-[0_8px_30px_rgba(107,178,255,0.08)] relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -right-8 -top-8 text-sky-400/[0.04] pointer-events-none">
          <CloudRainWind className="w-48 h-48" />
        </div>

        <div className="relative z-10 flex flex-col gap-0">
          <button
            onClick={() => setWeatherModalOpen(true)}
            className="flex items-center justify-between px-5 pt-5 pb-3 w-full text-left transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/10 text-sky-500">
                <CloudRainWind className="h-4 w-4" />
              </span>
              <h4 className="text-[15px] font-extrabold text-[#030D2E]">Dự báo thời tiết</h4>
            </div>
            <span className="text-[10.5px] font-bold text-sky-600 bg-sky-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">
              {days} ngày
            </span>
          </button>

          <div className="flex flex-col px-5 pb-5 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar divide-y divide-slate-100">
            {forecast?.time.map((dateStr, idx) => {
              const dateObj = new Date(dateStr);
              const dayStr = dateObj.toLocaleDateString("vi-VN", { weekday: "short" });
              const maxTemp = Math.round(forecast.temperature_2m_max[idx]);
              const minTemp = Math.round(forecast.temperature_2m_min[idx]);
              
              // Calculate bar position and width relative to absolute min/max
              const leftPercent = tempRange === 0 ? 0 : ((minTemp - absMin) / tempRange) * 100;
              const widthPercent = tempRange === 0 ? 100 : ((maxTemp - minTemp) / tempRange) * 100;
              
              // Current temperature dot position for "today" (idx === 0)
              let currentTempDotPercent: number | null = null;
              if (idx === 0 && currentTemp != null) {
                const clampedTemp = Math.max(minTemp, Math.min(maxTemp, currentTemp));
                const rangeForDay = maxTemp - minTemp;
                if (rangeForDay === 0) {
                  currentTempDotPercent = leftPercent;
                } else {
                  currentTempDotPercent = leftPercent + ((clampedTemp - minTemp) / rangeForDay) * widthPercent;
                }
              }
              
              return (
                <button
                  key={idx}
                  onClick={() => setWeatherModalOpen(true)}
                  className="flex items-center justify-between py-3 last:pb-0 first:pt-0 group text-left w-full hover:bg-sky-50/30 transition-colors rounded-xl px-1 -mx-1"
                >
                  <span className="w-16 text-[13.5px] font-bold text-slate-600 group-hover:text-sky-600 transition-colors shrink-0">
                    {idx === 0 ? "Hôm nay" : dayStr}
                  </span>
                  
                  <div className="w-8 flex items-center justify-center shrink-0">
                    {getWeatherIcon(forecast.weathercode[idx], "w-[22px] h-[22px] drop-shadow-sm")}
                  </div>
                  
                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <span className="font-semibold text-slate-400 text-[12.5px] w-6 text-right">{minTemp}°</span>
                    
                    {/* iOS Style Temperature Bar with current temp dot */}
                    <div className="h-1.5 w-16 sm:w-20 bg-slate-100 rounded-full overflow-visible relative">
                      <div 
                        className="absolute h-full bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400 rounded-full opacity-90 shadow-sm" 
                        style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                      />
                      {/* Current temperature indicator dot (only for "Hôm nay") */}
                      {currentTempDotPercent != null && (
                        <div
                          className="absolute w-3 h-3 bg-white border-2 border-sky-500 rounded-full shadow-md -top-[3px] transition-all"
                          style={{ left: `calc(${currentTempDotPercent}% - 6px)` }}
                          title={`Hiện tại: ${Math.round(currentTemp!)}°`}
                        />
                      )}
                    </div>
                    
                    <span className="font-black text-[#030D2E] text-[13px] w-6 text-right">{maxTemp}°</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <WeatherDetailsModal
        isOpen={weatherModalOpen}
        onClose={() => setWeatherModalOpen(false)}
        destination={destination}
        forecast={forecast}
      />
    </>
  );
}
