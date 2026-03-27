// TimelineContainer.tsx - 时间统计面板主入口
// game rules: Master-Detail 双栏布局，左栏显示时间轴，右栏显示详情

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CalendarStrip } from './CalendarStrip';
import { TimeGrid } from './TimeGrid';
import type { TimeGridRef } from './TimeGrid';
import { TimeBlock } from './TimeBlock';
import { LogDetailPanel } from './LogDetailPanel';
import { DayProgressBar } from './DayProgressBar';
import { Splitter } from '../shared/Splitter';
import type { TimeBlockData, DailyStats, FocusLog } from './types';
import { convertToTimeBlockData } from './types';
import { getFocusLogsByDate, getFocusLogsByDateRange } from '../../db/schema';
import { useTimelineStore } from '../../store/timelineStore';

interface TimelineContainerProps {
  // 可选：传入特定任务ID，只显示该任务的记录
  goalId?: string;
}

export function TimelineContainer({ goalId }: TimelineContainerProps) {
  // 状态管理
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [focusLogs, setFocusLogs] = useState<FocusLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dailyStats, setDailyStats] = useState<Map<string, DailyStats>>(new Map());

  // 右侧面板宽度状态（默认 35%）
  const [detailPanelWidth, setDetailPanelWidth] = useState(35);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(35);

  // 使用 timeline store
  const { selectedFocusLogId, selectFocusLog } = useTimelineStore();

  // TimeGrid ref 用于保存和恢复滚动位置
  const timeGridRef = useRef<TimeGridRef>(null);

  // 开始拖拽
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = detailPanelWidth;
  }, [detailPanelWidth]);

  // 拖拽中
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const delta = e.clientX - startXRef.current;
    const deltaPercent = (delta / containerWidth) * 100;
    const newWidth = Math.max(25, Math.min(50, startWidthRef.current - deltaPercent)); // 注意这里是减，因为右侧面板从右边算
    setDetailPanelWidth(newWidth);
  }, [isResizing]);

  // 结束拖拽
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // 添加/移除全局鼠标事件监听
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // 加载选中日期的专注记录
  const loadFocusLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const logs = await getFocusLogsByDate(selectedDate);
      // 如果指定了 goalId，只显示该任务的记录
      const filteredLogs = goalId
        ? logs.filter(log => log.goalId === goalId)
        : logs;
      setFocusLogs(filteredLogs);
    } catch (error) {
      console.error('[Timeline] 加载专注记录失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, goalId]);

  // 加载日期范围内的统计数据（用于日历显示）
  const loadDailyStats = useCallback(async () => {
    try {
      const startDate = new Date(selectedDate);
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 30);

      const allLogs = await getFocusLogsByDateRange(startDate, endDate);
      const statsMap = new Map<string, DailyStats>();

      allLogs.forEach(log => {
        // 如果指定了 goalId，只统计该任务的记录
        if (goalId && log.goalId !== goalId) return;

        const dateKey = new Date(log.startTime).toISOString().split('T')[0];
        const existing = statsMap.get(dateKey);

        if (existing) {
          existing.totalDuration += log.duration;
          existing.logCount += 1;
          existing.goalIds.add(log.goalId);
        } else {
          statsMap.set(dateKey, {
            date: new Date(log.startTime),
            totalDuration: log.duration,
            logCount: 1,
            goalIds: new Set([log.goalId]),
          });
        }
      });

      setDailyStats(statsMap);
    } catch (error) {
      console.error('[Timeline] 加载统计数据失败:', error);
    }
  }, [selectedDate, goalId]);

  // 初始加载和数据刷新
  useEffect(() => {
    loadFocusLogs();
    loadDailyStats();
  }, [loadFocusLogs, loadDailyStats]);

  // 转换为时间块数据
  const timeBlocks: TimeBlockData[] = useMemo(() => {
    return focusLogs.map(log => convertToTimeBlockData(log));
  }, [focusLogs]);

  // 处理时间块点击 - 选中记录
  const handleBlockClick = useCallback((block: TimeBlockData) => {
    selectFocusLog(block.id);
  }, [selectFocusLog]);

  // 处理删除 - 保存滚动位置，删除后恢复
  const handleBlockDeleted = useCallback(() => {
    // 保存当前滚动位置
    const scrollTop = timeGridRef.current?.getScrollTop() || 0;

    // 重新加载数据
    loadFocusLogs();

    // 在下一帧恢复滚动位置
    requestAnimationFrame(() => {
      timeGridRef.current?.setScrollTop(scrollTop);
    });
  }, [loadFocusLogs]);

  return (
    <div ref={containerRef} className="flex flex-row h-full bg-white w-full overflow-x-hidden" style={{ height: 'calc(100% - 80px)' }}>
      {/* 左栏 - Master：日历和时间轴 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 24小时进度条 - 帮助时间感知 */}
        <DayProgressBar />

        {/* 日历选择器 */}
        <CalendarStrip
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          dailyStats={dailyStats}
        />

        {/* 时间轴 */}
        <div className="flex-1 overflow-hidden relative">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2 text-stone-400">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm">加载中...</span>
              </div>
            </div>
          ) : (
            <TimeGrid ref={timeGridRef} currentTime={selectedDate.getTime()}>
              {/* 渲染时间块 */}
              {timeBlocks.map((block) => (
                <TimeBlock
                  key={block.id}
                  data={block}
                  isSelected={selectedFocusLogId === block.id}
                  onClick={handleBlockClick}
                  onDeleted={handleBlockDeleted}
                />
              ))}


            </TimeGrid>
          )}
        </div>
      </div>

      {/* 分栏拖拽条 */}
      <Splitter isResizing={isResizing} onResizeStart={handleResizeStart} />

      {/* 右栏 - Detail：详情面板 */}
      <div style={{ width: `${detailPanelWidth}%`, minWidth: '280px', maxWidth: '500px' }}>
        <LogDetailPanel
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </div>
    </div>
  );
}
