// TimeGrid.tsx - 负责渲染 24 小时轴和刻度线
// game rules: 只负责时间轴网格渲染，时间块通过 children 传入

import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { TIMELINE_CONFIG } from './types';

export interface TimeGridRef {
  getScrollTop: () => number;
  setScrollTop: (top: number) => void;
}

interface TimeGridProps {
  children?: React.ReactNode;
  currentTime?: number; // 当前时间戳，用于显示当前时间线
}

export const TimeGrid = forwardRef<TimeGridRef, TimeGridProps>(function TimeGrid(
  { children, currentTime },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentTimePercent, setCurrentTimePercent] = useState<number | null>(null);
  const hasScrolledRef = useRef(false);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    getScrollTop: () => containerRef.current?.scrollTop || 0,
    setScrollTop: (top: number) => {
      if (containerRef.current) {
        containerRef.current.scrollTop = top;
      }
    },
  }));

  // 生成小时刻度
  const hours = Array.from(
    { length: TIMELINE_CONFIG.END_HOUR - TIMELINE_CONFIG.START_HOUR },
    (_, i) => TIMELINE_CONFIG.START_HOUR + i
  );

  // 计算当前时间在时间轴上的位置
  useEffect(() => {
    if (!currentTime) {
      // 如果没有传入当前时间，使用实际当前时间
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      setCurrentTimePercent((minutes / (24 * 60)) * 100);
    } else {
      const date = new Date(currentTime);
      const minutes = date.getHours() * 60 + date.getMinutes();
      setCurrentTimePercent((minutes / (24 * 60)) * 100);
    }
  }, [currentTime]);

  // 初始滚动到当前时间附近（只执行一次）
  useEffect(() => {
    if (hasScrolledRef.current || !containerRef.current) return;
    
    const now = new Date();
    const currentHour = now.getHours();
    // 滚动到当前时间前2小时的位置
    const scrollHour = Math.max(0, currentHour - 2);
    const scrollPercent = (scrollHour / 24) * 100;
    const scrollTop = (scrollPercent / 100) * TIMELINE_CONFIG.TOTAL_HEIGHT;
    
    containerRef.current.scrollTop = scrollTop;
    hasScrolledRef.current = true;
  }, []);

  // 格式化小时显示
  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 时间轴容器 */}
      <div
        ref={containerRef}
        className="relative w-full h-full overflow-y-auto"
        style={{ minHeight: '400px' }}
      >
        {/* 时间轴背景 */}
        <div className="relative" style={{ height: `${TIMELINE_CONFIG.TOTAL_HEIGHT}px` }}>
          {/* 小时刻度线和标签 */}
          {hours.map((hour) => {
            const topPercent = (hour / 24) * 100;
            return (
              <div
                key={hour}
                className="absolute left-0 right-0 flex items-center"
                style={{ top: `${topPercent}%` }}
              >
                {/* 时间标签 */}
                <div className="w-12 flex-shrink-0 text-right pr-2">
                  <span className="text-xs text-stone-400 font-medium">
                    {formatHour(hour)}
                  </span>
                </div>
                {/* 刻度线 */}
                <div className="flex-1 h-px bg-stone-200" />
              </div>
            );
          })}

          {/* 当前时间线 */}
          {currentTimePercent !== null && (
            <div
              className="absolute left-12 right-0 z-30 pointer-events-none"
              style={{ top: `${currentTimePercent}%` }}
            >
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                <div className="flex-1 h-0.5 bg-red-500/50" />
              </div>
            </div>
          )}

          {/* 时间块渲染区域 */}
          <div className="absolute left-0 right-0 top-0 bottom-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
});
