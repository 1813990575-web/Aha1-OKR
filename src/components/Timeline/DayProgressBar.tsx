// DayProgressBar.tsx - 24小时进度条组件
// game rules: 展示今日已度过时间和剩余时间，帮助时间感知
// 已度过时间用灰色，剩余时间用深色

import { useState, useEffect } from 'react';

export function DayProgressBar() {
  const [progress, setProgress] = useState(0);
  const [passedHours, setPassedHours] = useState(0);
  const [remainingHours, setRemainingHours] = useState(24);

  useEffect(() => {
    const updateProgress = () => {
      const now = new Date();
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);

      const totalDayMs = endOfDay.getTime() - startOfDay.getTime();
      const passedMs = now.getTime() - startOfDay.getTime();

      const progressPercent = (passedMs / totalDayMs) * 100;
      const passed = passedMs / (1000 * 60 * 60);
      const remaining = 24 - passed;

      setProgress(progressPercent);
      setPassedHours(Math.floor(passed * 10) / 10); // 保留一位小数
      setRemainingHours(Math.floor(remaining * 10) / 10);
    };

    // 初始更新
    updateProgress();

    // 每分钟更新一次
    const interval = setInterval(updateProgress, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-4 py-3 bg-white shadow-sm z-10">
      <div className="flex items-center gap-3">
        {/* 左侧 - 已度过时间（灰色） */}
        <span className="text-sm font-medium text-stone-400 min-w-[50px] text-right">
          {passedHours}h
        </span>

        {/* 进度条 */}
        <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-stone-400 to-stone-500 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 右侧 - 剩余时间（深色，更关注） */}
        <span className="text-sm font-bold text-stone-800 min-w-[50px]">
          {remainingHours}h
        </span>
      </div>
    </div>
  );
}
