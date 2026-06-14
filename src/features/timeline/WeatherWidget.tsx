import React, { useEffect, useState } from "react";
import { CloudRainWind } from "lucide-react";
import { getWeatherIcon } from "../../services/weatherService";
import { useWeather } from "../../hooks/useWeather";

interface WeatherWidgetProps {
  destination: string;
  latitude?: number;
  longitude?: number;
  days?: number;
}

export function WeatherWidget({ destination, latitude, longitude, days = 3 }: WeatherWidgetProps) {
  const { loading, error, forecast } = useWeather(destination, latitude, longitude, days);

  if (!destination?.trim() && !latitude && !longitude) {
    return (
      <div className="w-full mb-6 rounded-3xl bg-slate-50 border border-slate-100 p-5 shadow-sm flex flex-col items-center justify-center text-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200/50 text-slate-400">
          <CloudRainWind className="w-5 h-5" />
        </span>
        <span className="text-[13.5px] font-bold text-slate-500">Chưa có điểm đến</span>
        <span className="text-[11px] text-slate-400 max-w-[200px]">Hãy thêm điểm đến cho chuyến đi để xem dự báo thời tiết tại đây.</span>
      </div>
    );
  }

  if (error || (!loading && !forecast)) {
    return (
      <div className="w-full h-auto py-4 mb-6 rounded-3xl bg-rose-50 border border-rose-100 flex flex-col items-center justify-center text-rose-500 gap-1 px-4 text-center">
        <CloudRainWind className="w-6 h-6 mb-1 opacity-50" />
        <span className="text-[12px] font-bold">Không thể tải thông tin thời tiết</span>
        <span className="text-[10px] opacity-70">
          Điểm đến: {destination || "Trống"} | Tọa độ: {latitude || "?"}, {longitude || "?"}
        </span>
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

  return (
    <div className="w-full mb-6 rounded-3xl bg-gradient-to-b from-sky-50 to-white border border-sky-100 p-5 shadow-sm relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -right-8 -top-8 opacity-[0.03] pointer-events-none">
        <CloudRainWind className="w-48 h-48" />
      </div>

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/10 text-sky-500">
              <CloudRainWind className="h-4 w-4" />
            </span>
            <h4 className="text-[15px] font-extrabold text-[#030D2E]">Dự báo thời tiết</h4>
          </div>
          <span className="text-[11px] font-bold text-sky-500 bg-sky-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
            {days} ngày
          </span>
        </div>

        <div className="flex flex-col max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
          {forecast?.time.map((dateStr, idx) => {
            const dateObj = new Date(dateStr);
            const dayStr = dateObj.toLocaleDateString("vi-VN", { weekday: "short" });
            const maxTemp = Math.round(forecast.temperature_2m_max[idx]);
            const minTemp = Math.round(forecast.temperature_2m_min[idx]);

            
            // Calculate bar position and width relative to absolute min/max
            const leftPercent = tempRange === 0 ? 0 : ((minTemp - absMin) / tempRange) * 100;
            const widthPercent = tempRange === 0 ? 100 : ((maxTemp - minTemp) / tempRange) * 100;
            
            return (
              <div key={idx} className="flex items-center justify-between py-2.5 border-b border-slate-100/80 last:border-0 group">
                <span className="w-16 text-[13.5px] font-bold text-slate-600 group-hover:text-sky-600 transition-colors">
                  {idx === 0 ? "Hôm nay" : dayStr}
                </span>
                
                <div className="w-8 flex items-center justify-center">
                  {getWeatherIcon(forecast.weathercode[idx], "w-[22px] h-[22px]")}
                </div>
                
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <span className="font-semibold text-slate-400 text-[12.5px] w-6 text-right">{minTemp}°</span>
                  
                  {/* iOS Style Temperature Bar */}
                  <div className="h-1.5 w-16 sm:w-20 bg-slate-100 rounded-full overflow-hidden relative">
                     <div 
                       className="absolute h-full bg-gradient-to-r from-sky-400 to-amber-400 rounded-full opacity-80" 
                       style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                     />
                  </div>
                  
                  <span className="font-black text-[#030D2E] text-[13px] w-6 text-right">{maxTemp}°</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
