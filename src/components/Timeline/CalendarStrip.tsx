// CalendarStrip.tsx - 周视图日历选择器
// game rules: 以星期为一组，每次展示7天（周一到周日）

import { useMemo, useCallback } from 'react';
import type { CalendarDateItem, DailyStats } from './types';

interface CalendarStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  dailyStats: Map<string, DailyStats>;
}

// 格式化日期键
const formatDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// 获取日期所在周的起始日（周一）
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = 周日, 1 = 周一, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 调整到周一
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// 获取日期所在周的结束日（周日）
const getWeekEnd = (date: Date): Date => {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

export function CalendarStrip({ selectedDate, onDateSelect, dailyStats }: CalendarStripProps) {
  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // 获取当前显示的周（基于 selectedDate）
  const weekStart = useMemo(() => getWeekStart(selectedDate), [selectedDate]);
  const weekEnd = useMemo(() => getWeekEnd(selectedDate), [selectedDate]);

  // 生成当前周的7天
  const weekDays: CalendarDateItem[] = useMemo(() => {
    const days: CalendarDateItem[] = [];
    const dayNames = ['一', '二', '三', '四', '五', '六', '日'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      date.setHours(0, 0, 0, 0);

      const dateKey = formatDateKey(date);
      const stats = dailyStats.get(dateKey);

      days.push({
        date,
        dayOfMonth: date.getDate(),
        dayOfWeek: dayNames[i],
        isToday: date.getTime() === today.getTime(),
        isSelected: date.getTime() === selectedDate.getTime(),
        hasLogs: stats ? stats.logCount > 0 : false,
        totalDuration: stats ? stats.totalDuration : 0,
      });
    }

    return days;
  }, [weekStart, selectedDate, today, dailyStats]);

  // 切换到上一周
  const goToPreviousWeek = useCallback(() => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() - 7);
    onDateSelect(newDate);
  }, [selectedDate, onDateSelect]);

  // 切换到下一周
  const goToNextWeek = useCallback(() => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + 7);
    onDateSelect(newDate);
  }, [selectedDate, onDateSelect]);

  // 回到今天
  const goToToday = useCallback(() => {
    onDateSelect(new Date());
  }, [onDateSelect]);

  // 处理日期选择
  const handleDateClick = (date: Date) => {
    onDateSelect(date);
  };

  // 格式化月份显示
  const monthDisplay = useMemo(() => {
    const startMonth = weekStart.getMonth() + 1;
    const endMonth = weekEnd.getMonth() + 1;
    const year = weekStart.getFullYear();

    if (startMonth === endMonth) {
      return `${year}年${startMonth}月`;
    }
    return `${year}年${startMonth}月 - ${endMonth}月`;
  }, [weekStart, weekEnd]);

  return (
    <div className="flex flex-col border-b border-stone-200/60 bg-white w-full min-w-0">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-stone-800">
            {monthDisplay}
          </span>
        </div>
        <button
          onClick={goToToday}
          className="text-xs text-stone-500 hover:text-stone-800 px-2 py-1 rounded-md hover:bg-stone-100 transition-colors"
        >
          回到今天
        </button>
      </div>

      {/* 周切换和日期网格 */}
      <div className="flex items-center px-2 pb-3">
        {/* 上一周按钮 */}
        <button
          onClick={goToPreviousWeek}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors flex-shrink-0"
          title="上一周"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* 7天日期网格 */}
        <div className="flex-1 grid grid-cols-7 gap-1">
          {weekDays.map((item, index) => (
            <button
              key={index}
              onClick={() => handleDateClick(item.date)}
              className={`
                flex flex-col items-center justify-center py-2 rounded-xl
                transition-all duration-200 relative
                ${item.isSelected
                  ? 'bg-stone-800 text-white shadow-md'
                  : 'hover:bg-stone-100 text-stone-600'
                }
              `}
            >
              {/* 星期 */}
              <span className={`
                text-[10px] font-medium mb-0.5
                ${item.isSelected ? 'text-stone-300' : 'text-stone-400'}
              `}>
                {item.dayOfWeek}
              </span>

              {/* 日期数字 - 状态优先：选中态 > 今天态 > 默认态 */}
              <span className={`
                text-base font-semibold leading-tight
                ${item.isSelected
                  ? 'text-white' // 只要被选中，统一显示白字
                  : item.isToday
                    ? 'text-red-500 font-bold' // 只有在'没被选中'且'是今天'时，才显示红字加粗
                    : 'text-stone-600' // 普通日期显示默认灰色
                }
              `}>
                {item.dayOfMonth}
              </span>

              {/* 专注记录指示点 */}
              {item.hasLogs && (
                <div className={`
                  absolute bottom-1 w-1 h-1 rounded-full
                  ${item.isSelected ? 'bg-white/80' : 'bg-stone-400'}
                `} />
              )}
            </button>
          ))}
        </div>

        {/* 下一周按钮 */}
        <button
          onClick={goToNextWeek}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 transition-colors flex-shrink-0"
          title="下一周"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
