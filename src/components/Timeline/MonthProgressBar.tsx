import { useMemo } from 'react';

interface MonthProgressBarProps {
  currentDate: Date;
}

export function MonthProgressBar({ currentDate }: MonthProgressBarProps) {
  const { daysRemaining, progressPercent } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 获取本月总天数
    const total = new Date(year, month + 1, 0).getDate();

    // 获取当前是本月第几天
    const currentDay = currentDate.getDate();

    // 剩余天数
    const remaining = total - currentDay;

    // 进度百分比
    const percent = (currentDay / total) * 100;

    return {
      daysRemaining: remaining,
      progressPercent: percent,
    };
  }, [currentDate]);

  return (
    <div className="px-4 pb-3">
      {/* 进度条和剩余天数 */}
      <div className="flex items-center gap-3">
        {/* 进度条 */}
        <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-stone-800 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* 剩余天数 */}
        <span className="text-xs font-semibold text-stone-800 flex-shrink-0">
          {daysRemaining}天
        </span>
      </div>
    </div>
  );
}
