import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ChevronLeftIcon, ChevronRightIcon, Add01Icon, Calendar01Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { EventItem, Trip } from "../../db";
import { classNames } from "../../utils/helpers";

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function TimelineCalendarView({
  events,
  trip,
  onOpenNewForm,
  renderActivityCard
}: {
  events: EventItem[];
  trip: Trip;
  onOpenNewForm: (date?: string) => void;
  renderActivityCard: (item: EventItem, idx: number) => React.ReactNode;
}) {
  const [currentDate, setCurrentDate] = useState(() => {
    return trip.startDate ? new Date(trip.startDate) : new Date();
  });
  
  const [selectedDate, setSelectedDate] = useState<string | null>(trip.startDate || null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday
  // We want Monday = 0, Sunday = 6
  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const eventsByDate = events.reduce<Record<string, EventItem[]>>((acc, event) => {
    if (!event.date) return acc;
    const dateKey = event.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {});

  const days = [];
  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // Formatting helper for standard YYYY-MM-DD
  const formatIsoDate = (d: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  const selectedEvents = selectedDate && eventsByDate[selectedDate] 
    ? eventsByDate[selectedDate].sort((a, b) => (a.time || "").localeCompare(b.time || ""))
    : [];

  return (
    <div className="space-y-6 motion-page-enter">
      {/* Calendar Card */}
      <div className="bg-white rounded-[28px] p-5 md:p-6 shadow-soft border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-black text-[#030D2E] capitalize">
            Tháng {month + 1}, {year}
          </h3>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-500 hover:bg-slate-100 transition-colors">
              <HugeiconsIcon icon={ChevronLeftIcon} className="w-5 h-5" />
            </button>
            <button onClick={nextMonth} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-500 hover:bg-slate-100 transition-colors">
              <HugeiconsIcon icon={ChevronRightIcon} className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-2 border-b border-slate-100 pb-2">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
            <div key={d} className="text-[12px] font-bold text-slate-400">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-10 md:h-12" />;
            }
            
            const dateStr = formatIsoDate(day);
            const isSelected = selectedDate === dateStr;
            const hasEvents = !!eventsByDate[dateStr];
            const isTripDay = dateStr >= (trip.startDate || "") && dateStr <= (trip.endDate || trip.startDate || "");

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={classNames(
                  "relative h-10 md:h-12 w-full flex flex-col items-center justify-center rounded-[14px] transition-all duration-200 cursor-pointer motion-press",
                  isSelected 
                    ? "bg-[#030D2E] text-white shadow-md border border-[#030D2E]/20" 
                    : "hover:bg-slate-50 border border-transparent",
                  !isSelected && isTripDay ? "bg-[#00BFB7]/10 text-kat-text font-extrabold" : (!isSelected && "text-slate-600 font-semibold")
                )}
              >
                <span className={classNames("text-[14px] md:text-[15px]")}>{day}</span>
                {hasEvents && (
                  <div className={classNames(
                    "absolute bottom-[5px] w-[5px] h-[5px] rounded-full",
                    isSelected ? "bg-[#00BFB7]" : "bg-[#00BFB7]"
                  )} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="animate-fadeIn">
          <div className="flex items-center justify-between mb-4 px-1 border-b border-slate-100 pb-3">
            <h4 className="text-[16px] font-extrabold text-[#030D2E] flex items-center gap-2">
              <HugeiconsIcon icon={Calendar01Icon} className="w-5 h-5 text-[#00BFB7]" />
              Lịch trình ngày {selectedDate.split('-').reverse().join('/')}
            </h4>
            <button 
              onClick={() => onOpenNewForm(selectedDate)}
              className="flex items-center gap-1 text-[13px] font-bold text-[#00BFB7] hover:brightness-95 transition-colors motion-press px-2 py-1 bg-[#00BFB7]/10 rounded-lg"
            >
              <HugeiconsIcon icon={Add01Icon} className="w-4 h-4" />
              Thêm
            </button>
          </div>

          <div className="space-y-4">
            {selectedEvents.length > 0 ? (
              <div className="px-1">
                {selectedEvents.map((item, idx) => renderActivityCard(item, idx))}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-[24px] p-6 text-center shadow-sm">
                <div className="flex justify-center mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm text-slate-400">
                    <HugeiconsIcon icon={Clock01Icon} className="w-5 h-5" />
                  </div>
                </div>
                <h5 className="text-[15px] font-bold text-[#030D2E]">Ngày này trống</h5>
                <p className="mt-1 text-[13.5px] font-medium text-slate-500 max-w-sm mx-auto">
                  Không có sự kiện nào trong ngày này. Hãy thêm điểm dừng để lấp đầy hành trình.
                </p>
                <button 
                  onClick={() => onOpenNewForm(selectedDate)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-white border border-slate-200 px-4 py-2.5 text-[13.5px] font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-sm motion-press"
                >
                  <HugeiconsIcon icon={Add01Icon} className="w-4 h-4 text-kat-primary" />
                  Thêm mục lịch trình
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
