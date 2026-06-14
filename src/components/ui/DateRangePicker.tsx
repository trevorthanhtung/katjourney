import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BottomSheet, classNames } from "./index";

const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];
const DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

interface DateRangePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (startDate: string, endDate: string) => void;
  initialStartDate?: string;
  initialEndDate?: string;
  mode: "single" | "range";
}

// Convert YYYY-MM-DD to Date
function parseDate(str: string): Date | null {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

// Convert Date to YYYY-MM-DD
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Get dates between two dates
function getDatesInRange(start: Date, end: Date) {
  const dateArray: string[] = [];
  let currentDate = new Date(start);
  while (currentDate <= end) {
    dateArray.push(formatDate(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dateArray;
}

export function DateRangePickerSheet({
  isOpen,
  onClose,
  onSave,
  initialStartDate,
  initialEndDate,
  mode,
}: DateRangePickerSheetProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // Track hover for range styling during selection
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  useEffect(() => {
    if (isOpen) {
      const parsedStart = initialStartDate ? parseDate(initialStartDate) : new Date();
      const parsedEnd = initialEndDate && mode === "range" ? parseDate(initialEndDate) : parsedStart;
      
      setStartDate(parsedStart);
      setEndDate(parsedEnd);
      setViewDate(parsedStart || new Date());
      setHoverDate(null);
    }
  }, [isOpen, initialStartDate, initialEndDate, mode]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = [];
  // Padding for previous month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  function handlePrevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }

  function handleNextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  function handleDayClick(day: Date) {
    if (mode === "single") {
      setStartDate(day);
      setEndDate(day);
    } else {
      if (!startDate || (startDate && endDate)) {
        // Start new range
        setStartDate(day);
        setEndDate(null);
      } else if (startDate && !endDate) {
        if (day < startDate) {
          // If selected day is before start date, it becomes the new start date
          setStartDate(day);
        } else {
          // Complete the range
          setEndDate(day);
        }
      }
    }
  }

  function handleSave() {
    if (startDate) {
      onSave(formatDate(startDate), formatDate(endDate || startDate));
    }
    onClose();
  }

  const startStr = startDate ? formatDate(startDate) : "";
  const endStr = endDate ? formatDate(endDate) : "";
  
  // For highlighting
  let rangeStrings: string[] = [];
  if (startDate && endDate) {
    rangeStrings = getDatesInRange(startDate, endDate);
  } else if (startDate && hoverDate && hoverDate > startDate) {
    rangeStrings = getDatesInRange(startDate, hoverDate);
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "range" ? "Chọn khoảng thời gian" : "Chọn ngày"}
      footer={
        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-slate-100 px-6 font-bold text-slate-700 hover:bg-slate-200 active:scale-[0.98] transition-all duration-200"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!startDate || (mode === "range" && !endDate)}
            onClick={handleSave}
            className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-[#00BFB7] text-[#030D2E] px-6 font-black hover:brightness-105 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Lưu
          </button>
        </div>
      }
    >
      <div className="select-none pb-4">
        {/* Header: Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div className="text-[16px] font-bold text-slate-800">
            {MONTHS[month]} {year}
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-700" />
          </button>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map((day, idx) => (
            <div key={idx} className="text-center text-[13px] font-bold text-slate-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-y-2">
          {days.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} />;
            }
            
            const dateStr = formatDate(day);
            const isStart = startStr === dateStr;
            const isEnd = endStr === dateStr;
            const isSelectedSingle = mode === "single" && isStart;
            
            const isInRange = rangeStrings.includes(dateStr);
            const isMiddle = isInRange && !isStart && !isEnd;

            // Compute styling
            let bgClass = "bg-transparent";
            let textClass = "text-slate-700";
            let roundedClass = "rounded-full";

            if (isSelectedSingle) {
              bgClass = "bg-[#00BFB7]";
              textClass = "text-white";
            } else if (mode === "range") {
              if (isStart && isEnd) {
                bgClass = "bg-[#00BFB7]";
                textClass = "text-white";
              } else if (isStart) {
                bgClass = "bg-[#00BFB7]";
                textClass = "text-white";
                roundedClass = "rounded-l-full";
              } else if (isEnd) {
                bgClass = "bg-[#00BFB7]";
                textClass = "text-white";
                roundedClass = "rounded-r-full";
              } else if (isMiddle) {
                bgClass = "bg-[#00BFB7]/20";
                textClass = "text-[#00BFB7]";
                roundedClass = "rounded-none";
              }
            }

            // Highlight today
            const todayStr = formatDate(new Date());
            const isToday = dateStr === todayStr;
            if (isToday && !isStart && !isEnd && !isMiddle) {
              textClass = "text-[#00BFB7] font-black";
            }

            return (
              <div 
                key={dateStr}
                className={classNames(
                  "relative flex items-center justify-center h-10 w-full cursor-pointer",
                  mode === "range" && (isStart || isEnd || isMiddle) && hoverDate && endDate === null ? "" : "",
                  (isStart && endDate && !isEnd) ? "bg-gradient-to-r from-transparent to-[#00BFB7]/20" : "",
                  (isEnd && startDate && !isStart) ? "bg-gradient-to-l from-transparent to-[#00BFB7]/20" : ""
                )}
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => {
                  if (mode === "range" && startDate && !endDate) {
                    setHoverDate(day);
                  }
                }}
              >
                {/* Background spanning logic for range */}
                {mode === "range" && (isStart || isEnd) && startDate && endDate && startDate !== endDate && (
                  <div className={classNames(
                    "absolute inset-0 bg-[#00BFB7]/20",
                    isStart ? "left-1/2 right-0" : "left-0 right-1/2"
                  )} />
                )}
                
                {mode === "range" && startDate && !endDate && hoverDate && hoverDate > startDate && (
                   <div className={classNames(
                    "absolute inset-0 bg-[#00BFB7]/20",
                    isStart ? "left-1/2 right-0" : isMiddle ? "" : (day === hoverDate ? "left-0 right-1/2" : "hidden")
                  )} />
                )}

                <div
                  className={classNames(
                    "relative z-10 flex h-9 w-9 items-center justify-center text-[15px] font-bold transition-all hover:scale-110",
                    bgClass,
                    textClass,
                    roundedClass
                  )}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </BottomSheet>
  );
}
