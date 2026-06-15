import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { WeatherForecast, getWeatherIcon, getWeatherText, getWeatherGradient } from "../../services/weatherService";
import {
  SunIcon,
  PartlyCloudyIcon,
  CloudyIcon,
  FogIcon,
  RainIcon,
  ThunderstormIcon,
  ThermometerIcon,
  HumidityIcon,
  WindIcon
} from "../../components/WeatherIcons";

interface WeatherDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  destination: string;
  forecast: WeatherForecast | null;
  currentLocationForecast?: WeatherForecast | null;
  currentLocationName?: string | null;
}

export function WeatherDetailsModal({ isOpen, onClose, destination, forecast, currentLocationForecast, currentLocationName }: WeatherDetailsModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Let standard frame run before applying transition class
      requestAnimationFrame(() => {
        setAnimate(true);
      });
    } else {
      setAnimate(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender || !forecast) return null;

  try {
    const currentCode = forecast.current?.weathercode ?? forecast.weathercode?.[0] ?? 0;
    const currentTemp = forecast.current?.temperature ?? Math.round(((forecast.temperature_2m_max?.[0] ?? 0) + (forecast.temperature_2m_min?.[0] ?? 0)) / 2);
    const apparentTemp = forecast.current?.apparent_temperature ?? currentTemp;
    const maxTemp = Math.round(forecast.temperature_2m_max?.[0] ?? 0);
    const minTemp = Math.round(forecast.temperature_2m_min?.[0] ?? 0);
    const humidity = forecast.current?.humidity ?? 70;
    const windspeed = forecast.current?.windspeed ?? 12;
    const uvIndex = forecast.uv_index_max?.[0] ?? 5;

    const bgGradient = getWeatherGradient(currentCode);
    const weatherText = getWeatherText(currentCode);

    // Generate falling rain drops array
    const isRainy = (currentCode >= 51 && currentCode <= 67) || (currentCode >= 80 && currentCode <= 82);
    const isStormy = currentCode >= 95 && currentCode <= 99;
    const isCloudy = currentCode === 2 || currentCode === 3;
    const isFoggy = currentCode === 45 || currentCode === 48;
    const isSunny = currentCode === 0 || currentCode === 1;

    // Render weather recommendations based on code
    function getTravelRecommendation(code: number) {
    if (code === 0 || code === 1) {
      return {
        title: "Thời tiết lý tưởng cho hoạt động ngoài trời",
        desc: "Trời nắng đẹp và quang đãng. Rất thích hợp để đi tắm biển, leo núi, cắm trại hoặc chụp ảnh ngoài trời. Đừng quên bôi kem chống nắng và mang kính râm nhé!",
        icon: <SunIcon className="w-7 h-7" />,
        bg: "bg-amber-500/10 border-amber-500/20 text-amber-900",
        badgeBg: "bg-amber-500/20 text-amber-800"
      };
    }
    if (code === 2 || code === 3) {
      return {
        title: "Thời tiết dịu mát, thuận tiện di chuyển",
        desc: "Trời nhiều mây mát mẽ, không quá nắng gắt. Rất thích hợp để đi bộ dạo phố cổ, đi chợ đêm hoặc tham quan danh lam thắng cảnh mà không lo bị kiệt sức.",
        icon: <PartlyCloudyIcon className="w-7 h-7" />,
        bg: "bg-sky-500/10 border-sky-500/20 text-sky-900",
        badgeBg: "bg-sky-500/20 text-sky-800"
      };
    }
    if (code === 45 || code === 48) {
      return {
        title: "Sương mù mờ ảo, chú ý đường đèo dốc",
        desc: "Không khí lạnh có sương mù đẹp mộng mơ. Thích hợp đi quán cà phê lãng mạn, ăn lẩu nóng. Nếu tự lái xe hoặc đi phượt bằng xe máy, hãy bật đèn cảnh báo và đi chậm.",
        icon: <FogIcon className="w-7 h-7" />,
        bg: "bg-slate-500/10 border-slate-500/20 text-slate-900",
        badgeBg: "bg-slate-500/20 text-slate-800"
      };
    }
    if (isRainy) {
      return {
        title: "Có mưa rào, hãy chuyển hướng vui chơi trong nhà",
        desc: "Trời ẩm ướt và có mưa. Bạn nên ưu tiên đi bảo tàng, khu vui chơi trong nhà, thủy cung, ghé các quán cà phê hoặc tự tay làm quà lưu niệm.",
        icon: <RainIcon className="w-7 h-7" />,
        bg: "bg-blue-500/10 border-blue-500/20 text-blue-900",
        badgeBg: "bg-blue-500/20 text-blue-800"
      };
    }
    if (isStormy) {
      return {
        title: "Dông bão nguy hiểm, nên nghỉ ngơi tại phòng",
        desc: "Thời tiết xấu kèm theo sấm sét nguy hiểm. Tránh tuyệt đối đi thuyền, bơi biển hoặc đi rừng. Hãy mua đồ ăn về phòng cùng chơi board game hoặc xem phim thư giãn nhé.",
        icon: <ThunderstormIcon className="w-7 h-7" />,
        bg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-900",
        badgeBg: "bg-indigo-500/20 text-indigo-800"
      };
    }
    return {
      title: "Thời tiết thích hợp cho kỳ nghỉ",
      desc: "Điều kiện thời tiết bình thường. Hãy theo dõi các khung giờ trong ngày để lên lịch trình đi chơi hợp lý nhất.",
      icon: <ThermometerIcon className="w-7 h-7" />,
      bg: "bg-teal-500/10 border-teal-500/20 text-teal-900",
      badgeBg: "bg-teal-500/20 text-teal-800"
    };
  }

  const recommendation = getTravelRecommendation(currentCode);

  // Get UV Index Rating Text
  function getUvRating(uv: number) {
    if (uv <= 2) return { text: "Thấp", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
    if (uv <= 5) return { text: "Trung bình", color: "text-amber-600 bg-amber-50 border-amber-100" };
    if (uv <= 7) return { text: "Cao", color: "text-orange-600 bg-orange-50 border-orange-100" };
    if (uv <= 10) return { text: "Rất cao", color: "text-rose-600 bg-rose-50 border-rose-100" };
    return { text: "Cực độ", color: "text-purple-600 bg-purple-50 border-purple-100 animate-pulse" };
  }

  const uvRating = getUvRating(uvIndex);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center p-0 md:p-4">
      {/* Dynamic Keyframes Injector */}
      <style>{`
        @keyframes sun-glow {
          0% { transform: scale(1) rotate(0deg); opacity: 0.1; }
          50% { transform: scale(1.15) rotate(180deg); opacity: 0.22; }
          100% { transform: scale(1) rotate(360deg); opacity: 0.1; }
        }
        @keyframes rain-fall {
          0% { transform: translateY(-120%) translateX(0) rotate(15deg); }
          100% { transform: translateY(120%) translateX(-30px) rotate(15deg); }
        }
        @keyframes drift-cloud-sm {
          0% { transform: translateX(-120%) scale(0.8); opacity: 0.05; }
          50% { opacity: 0.15; }
          100% { transform: translateX(120%) scale(0.8); opacity: 0.05; }
        }
        @keyframes storm-flash {
          0%, 94%, 96%, 98%, 100% { opacity: 0; }
          95%, 97% { opacity: 0.18; }
        }
        @keyframes float-dust {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .custom-scrollbar {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
      `}</style>

      {/* Backdrop blur overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300 ${
          animate ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal Box */}
      <div 
        className={`w-full md:max-w-lg bg-[#FAF7F1] md:rounded-[32px] rounded-t-[36px] shadow-[0_-10px_40px_rgba(3,13,46,0.12)] md:shadow-[0_20px_60px_rgba(3,13,46,0.18)] relative overflow-hidden transition-all duration-300 max-h-[92vh] md:max-h-[85vh] flex flex-col z-10 border border-slate-100/50 ${
          animate ? "translate-y-0 opacity-100" : "translate-y-full md:translate-y-10 opacity-0"
        }`}
      >
        {/* Dynamic Animated Weather Background Panel */}
        <div 
          className="relative h-44 shrink-0 flex flex-col justify-end p-6 text-white overflow-hidden"
          style={{ background: bgGradient }}
        >
          {/* Sunny animations */}
          {isSunny && (
            <div 
              className="absolute -right-10 -top-10 w-44 h-44 bg-white/20 rounded-full blur-2xl pointer-events-none"
              style={{ animation: "sun-glow 10s infinite linear" }}
            />
          )}

          {/* Cloudy/Foggy animations */}
          {(isCloudy || isFoggy) && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div 
                className="absolute w-64 h-24 bg-white/10 rounded-full blur-xl -top-6"
                style={{ animation: "drift-cloud-sm 20s infinite linear" }}
              />
              <div 
                className="absolute w-48 h-20 bg-white/5 rounded-full blur-lg top-10"
                style={{ animation: "drift-cloud-sm 14s infinite linear", animationDelay: "3s" }}
              />
            </div>
          )}

          {/* Rainy animations */}
          {(isRainy || isStormy) && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 15 }).map((_, idx) => (
                <div 
                  key={idx}
                  className="absolute w-[1.5px] bg-white/30 rounded-full"
                  style={{
                    height: `${20 + Math.random() * 20}px`,
                    left: `${Math.random() * 100}%`,
                    top: `-40px`,
                    opacity: 0.15 + Math.random() * 0.2,
                    animation: `rain-fall ${0.6 + Math.random() * 0.5}s infinite linear`,
                    animationDelay: `${Math.random() * 1.5}s`
                  }}
                />
              ))}
            </div>
          )}

          {/* Storm flash background */}
          {isStormy && (
            <div 
              className="absolute inset-0 bg-white pointer-events-none"
              style={{ animation: "storm-flash 6s infinite ease-out" }}
            />
          )}

          {/* Floating light dust (aesthetic particle) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div 
                key={idx}
                className="absolute w-1 h-1 bg-white/20 rounded-full"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                  animation: `float-dust ${3 + Math.random() * 3}s infinite ease-in-out`,
                  animationDelay: `${idx * 0.5}s`
                }}
              />
            ))}
          </div>

          {/* Header Actions */}
          <button 
            onClick={onClose}
            className="absolute right-4 top-4 h-9 w-9 bg-black/20 hover:bg-black/35 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-95 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Location details */}
          <div className="relative z-10 text-left drop-shadow-md">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-white/70">Thời tiết hiện tại</span>
            <h3 className="text-xl md:text-2xl font-black text-white line-clamp-1">{destination}</h3>
            
            <div className="flex items-end justify-between mt-2">
              <div className="flex items-center gap-3">
                <span className="text-5xl font-black tracking-tighter drop-shadow-sm">{currentTemp}°</span>
                <div className="flex flex-col mb-1">
                  <span className="text-white/80">{getWeatherIcon(currentCode, "w-6 h-6 text-white")}</span>
                  <span className="text-[12.5px] font-bold text-white uppercase tracking-wider mt-0.5">{weatherText}</span>
                </div>
              </div>
              
              <div className="text-right text-[12.5px] font-bold text-white/90">
                <span>Cao: {maxTemp}°</span>
                <span className="mx-1.5 opacity-60">|</span>
                <span>Thấp: {minTemp}°</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar" style={{ paddingBottom: 'max(40px, calc(env(safe-area-inset-bottom) + 24px))' }}>
          
          {/* Smart Suggestion Banner */}
          <div className={`p-4 rounded-2xl border flex gap-3 ${recommendation.bg} transition-all duration-300`}>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${recommendation.badgeBg} border border-black/5`}>
              {recommendation.icon}
            </div>
            <div className="flex flex-col text-left">
              <h4 className="text-[13.5px] font-black text-slate-800 leading-tight mb-1">{recommendation.title}</h4>
              <p className="text-[12px] font-semibold text-slate-600 leading-relaxed">{recommendation.desc}</p>
            </div>
          </div>

          {/* Dual Weather Comparison Card */}
          {currentLocationForecast && (() => {
            const myTemp = Math.round(currentLocationForecast.current?.temperature ?? ((currentLocationForecast.temperature_2m_max?.[0] ?? 0) + (currentLocationForecast.temperature_2m_min?.[0] ?? 0)) / 2);
            const myCode = currentLocationForecast.current?.weathercode ?? currentLocationForecast.weathercode?.[0] ?? 0;
            const myHumidity = currentLocationForecast.current?.humidity ?? null;
            const myWind = currentLocationForecast.current?.windspeed ?? null;
            const diff = currentTemp - myTemp;
            const diffLabel = diff === 0 ? "Giống nơi bạn" : diff > 0 ? `+${Math.round(diff)}°C so với nơi bạn` : `${Math.round(diff)}°C so với nơi bạn`;
            const diffColor = diff >= 4 ? "text-amber-600" : diff <= -4 ? "text-sky-600" : "text-slate-500";
            return (
              <div className="space-y-2.5">
                <h4 className="text-[13.5px] font-extrabold text-[#030D2E] text-left px-0.5">So sánh với nơi bạn đang ở</h4>
                <div className="bg-white/60 border border-slate-200/50 rounded-2xl p-4 shadow-inner">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    {/* Current location column */}
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 line-clamp-1 max-w-full">{currentLocationName ?? "Nơi bạn ở"}</span>
                      <div className="flex items-center justify-center h-8">
                        {getWeatherIcon(myCode, "w-7 h-7 drop-shadow-sm")}
                      </div>
                      <span className="text-3xl font-black text-[#030D2E] tracking-tighter leading-none">{myTemp}°</span>
                      <div className="flex flex-col items-center gap-1.5 mt-0.5">
                        {myHumidity !== null && (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                            <HumidityIcon className="w-3.5 h-3.5" />
                            <span>{myHumidity}%</span>
                          </div>
                        )}
                        {myWind !== null && (
                          <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                            <WindIcon className="w-3.5 h-3.5" />
                            <span>{myWind} km/h</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle arrow + diff */}
                    <div className="flex flex-col items-center gap-1 px-1">
                      <div className="w-px h-6 bg-slate-200" />
                      <span className={`text-[10px] font-extrabold text-center whitespace-nowrap ${diffColor}`}>{diffLabel}</span>
                      <div className="w-px h-6 bg-slate-200" />
                    </div>

                    {/* Destination column */}
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 line-clamp-1 max-w-full">{destination}</span>
                      <div className="flex items-center justify-center h-8">
                        {getWeatherIcon(currentCode, "w-7 h-7 drop-shadow-sm")}
                      </div>
                      <span className="text-3xl font-black text-[#030D2E] tracking-tighter leading-none">{currentTemp}°</span>
                      <div className="flex flex-col items-center gap-1.5 mt-0.5">
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                          <HumidityIcon className="w-3.5 h-3.5" />
                          <span>{humidity}%</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                          <WindIcon className="w-3.5 h-3.5" />
                          <span>{windspeed} km/h</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Hourly 24-Hour Forecast */}
          {forecast.hourly && (
            <div className="space-y-2.5">
              <h4 className="text-[13.5px] font-extrabold text-[#030D2E] text-left px-0.5">Dự báo 24 giờ tới</h4>
              
              <div className="flex overflow-x-auto gap-3.5 pb-2 pt-1 px-0.5 custom-scrollbar">
                {forecast.hourly.time?.map((timeStr, idx) => {
                  const hour = new Date(timeStr).getHours();
                  const temp = Math.round(forecast.hourly?.temperature?.[idx] ?? 0);
                  const code = forecast.hourly?.weathercode?.[idx] ?? 0;
                  const precip = forecast.hourly?.precipitation_probability?.[idx] ?? 0;
                  
                  return (
                    <div 
                      key={idx}
                      className="shrink-0 w-[64px] rounded-2xl bg-white/70 hover:bg-white border border-slate-200/50 py-3.5 flex flex-col items-center gap-2 shadow-[0_4px_12px_rgba(3,13,46,0.02)] transition-all duration-300"
                    >
                      <span className="text-[11.5px] font-bold text-slate-500">
                        {idx === 0 ? "Bây giờ" : `${hour}:00`}
                      </span>
                      
                      <div className="relative h-7 flex items-center justify-center">
                        {getWeatherIcon(code, "w-6 h-6")}
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <span className="text-[14px] font-extrabold text-[#030D2E]">{temp}°</span>
                        {precip > 15 && (
                          <span className="text-[9px] font-extrabold text-blue-500 mt-0.5 leading-none">
                            {precip}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weather Parameters Grid */}
          <div className="space-y-2.5">
            <h4 className="text-[13.5px] font-extrabold text-[#030D2E] text-left px-0.5">Chỉ số thời tiết chi tiết</h4>
            
            <div className="grid grid-cols-2 gap-3.5">
              {/* Feel Temp Card */}
              <div className="bg-white/60 border border-slate-200/50 rounded-2xl p-4 flex flex-col text-left justify-between h-24 shadow-inner">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-extrabold uppercase tracking-wide">Cảm giác thực tế</span>
                  <ThermometerIcon className="w-5 h-5 text-rose-500" />
                </div>
                <div className="flex items-baseline gap-1 mt-auto">
                  <span className="text-2xl font-black text-[#030D2E]">{apparentTemp}°</span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {apparentTemp === currentTemp ? "Bằng nhiệt độ thực" : apparentTemp > currentTemp ? "Nóng hơn thực tế" : "Mát hơn thực tế"}
                  </span>
                </div>
              </div>

              {/* Humidity Card */}
              <div className="bg-white/60 border border-slate-200/50 rounded-2xl p-4 flex flex-col text-left justify-between h-24 shadow-inner">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-extrabold uppercase tracking-wide">Độ ẩm</span>
                  <HumidityIcon className="w-5 h-5 text-sky-500" />
                </div>
                <div className="flex flex-col mt-auto">
                  <span className="text-2xl font-black text-[#030D2E]">{humidity}%</span>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1 relative">
                    <div 
                      className="absolute left-0 h-full bg-sky-500 rounded-full"
                      style={{ width: `${humidity}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Wind speed Card */}
              <div className="bg-white/60 border border-slate-200/50 rounded-2xl p-4 flex flex-col text-left justify-between h-24 shadow-inner">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-extrabold uppercase tracking-wide">Tốc độ gió</span>
                  <WindIcon className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex items-baseline gap-1 mt-auto">
                  <span className="text-2xl font-black text-[#030D2E]">{windspeed}</span>
                  <span className="text-[11px] font-bold text-slate-500">km/h</span>
                </div>
              </div>

              {/* UV index Card */}
              <div className="bg-white/60 border border-slate-200/50 rounded-2xl p-4 flex flex-col text-left justify-between h-24 shadow-inner">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-extrabold uppercase tracking-wide">Chỉ số UV</span>
                  <SunIcon className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex flex-col mt-auto">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-[#030D2E]">{uvIndex}</span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border ${uvRating.color}`}>
                      {uvRating.text}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
  } catch (err: any) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center">
          <div className="text-red-500 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Lỗi hiển thị thời tiết</h3>
          <p className="text-sm text-slate-500 mb-4">{err.message}</p>
          <button 
            onClick={onClose}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }
}
