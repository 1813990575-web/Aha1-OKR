// MonthlyCalendar.tsx - 月度日历组件 (极致压缩版)
// game rules: 从核心日历格退居为专注指示小组件

import { useMemo } from 'react';

interface MonthlyCalendarProps {
  selectedDate: Date;
  onDateSelect?: (date: Date) => void;
}

export function MonthlyCalendar({ selectedDate, onDateSelect }: MonthlyCalendarProps) {
  // 获取当前月份的天数和剩余天数
  const { monthDays, firstDayOfWeek, daysRemaining } = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { day: number; isSelected: boolean; isToday: boolean }[] = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      days.push({
        day: i,
        isSelected: i === selectedDate.getDate(),
        isToday: date.getTime() === today.getTime(),
      });
    }

    // 获取月份第一天是星期几
    const firstDay = new Date(year, month, 1).getDay();

    // 计算剩余天数
    const currentDay = selectedDate.getDate();
    const remaining = daysInMonth - currentDay;

    return {
      monthDays: days,
      firstDayOfWeek: firstDay,
      daysRemaining: remaining,
    };
  }, [selectedDate]);

  // 星期标题
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  // 处理日期点击
  const handleDateClick = (day: number) => {
    if (onDateSelect) {
      const newDate = new Date(selectedDate);
      newDate.setDate(day);
      onDateSelect(newDate);
    }
  };

  // 切换到上一个月
  const handlePrevMonth = () => {
    if (onDateSelect) {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() - 1);
      onDateSelect(newDate);
    }
  };

  // 切换到下一个月
  const handleNextMonth = () => {
    if (onDateSelect) {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() + 1);
      onDateSelect(newDate);
    }
  };

  return (
    <div className="px-3 py-2">
      {/* 月份标题 - 剩余天数紧跟标题 */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-stone-500">
            {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月
          </span>
          <span className="text-[11px] text-stone-400">
            剩 {daysRemaining} 天
          </span>
        </div>
        
        {/* 月份切换按钮 */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-stone-100 transition-colors"
          >
            <svg className="w-3 h-3 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNextMonth}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-stone-100 transition-colors"
          >
            <svg className="w-3 h-3 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 星期标题 - 极小字号 */}
      <div className="grid grid-cols-7 mb-0.5">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-[8px] text-stone-300 font-normal py-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日期网格 - 极致压缩 */}
      <div className="grid grid-cols-7 gap-px">
        {/* 空白占位（月初前的空位） */}
        {Array.from({ length: firstDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="w-6 h-6" />
        ))}

        {/* 日期 - 固定 24px 尺寸，极浅灰度 */}
        {monthDays.map((item) => (
          <button
            key={item.day}
            onClick={() => handleDateClick(item.day)}
            className={`
              w-6 h-6 flex items-center justify-center
              text-[11px] leading-none
              transition-all duration-150
              ${item.isSelected
                ? 'bg-red-500/20 text-red-700 font-medium rounded-full'
                : item.isToday
                  ? 'text-stone-700 font-medium bg-stone-100 rounded-full'
                  : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50/50 rounded-full'
              }
            `}
          >
            {item.day}
          </button>
        ))}
      </div>
    </div>
  );
}
