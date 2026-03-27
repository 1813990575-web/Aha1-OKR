// Timeline 组件类型定义
// game rules: 所有类型定义集中管理，确保类型安全

import type { FocusLog } from '../../db/schema';

// 重新导出 FocusLog 类型
export type { FocusLog };

// 时间块视图数据 - 用于渲染
export interface TimeBlockData {
  id: string;
  goalId: string;
  goalTitle: string;
  startTime: number;        // 开始时间戳
  endTime: number | null;   // 结束时间戳，null 表示进行中
  duration: number;         // 时长（秒）
  note: string | null;
  isOngoing: boolean;       // 是否进行中
  // 计算属性 - 由 TimeGrid 计算
  topPercent: number;       // 在时间轴上的起始位置（0-100%）
  heightPercent: number;    // 在时间轴上的高度（0-100%）
}

// 日历条日期项
export interface CalendarDateItem {
  date: Date;
  dayOfMonth: number;
  dayOfWeek: string;        // 一、二、三...
  isToday: boolean;
  isSelected: boolean;
  hasLogs: boolean;         // 该日期是否有专注记录
  totalDuration: number;    // 当日总专注时长（秒）
}

// 时间统计汇总数据
export interface DailyStats {
  date: Date;
  totalDuration: number;    // 总专注时长（秒）
  logCount: number;         // 专注次数
  goalIds: Set<string>;     // 涉及的目标ID集合
}

// 时间轴配置常量
export const TIMELINE_CONFIG = {
  START_HOUR: 0,            // 时间轴起始小时
  END_HOUR: 24,             // 时间轴结束小时
  HOUR_HEIGHT: 60,          // 每小时高度（像素）
  MINUTE_HEIGHT: 1,         // 每分钟高度（像素）
  TOTAL_HEIGHT: 24 * 60,    // 总高度（像素）
} as const;

// 颜色配置 - 不同任务使用不同色调
export const BLOCK_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', hover: 'hover:bg-blue-200' },
  { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', hover: 'hover:bg-green-200' },
  { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', hover: 'hover:bg-purple-200' },
  { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', hover: 'hover:bg-orange-200' },
  { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800', hover: 'hover:bg-pink-200' },
  { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-800', hover: 'hover:bg-teal-200' },
  { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-800', hover: 'hover:bg-indigo-200' },
  { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800', hover: 'hover:bg-amber-200' },
] as const;

// 根据 goalId 获取一致的颜色
export function getBlockColor(goalId: string): typeof BLOCK_COLORS[number] {
  let hash = 0;
  for (let i = 0; i < goalId.length; i++) {
    hash = goalId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % BLOCK_COLORS.length;
  return BLOCK_COLORS[index];
}

// 格式化时长为可读字符串（中文格式）
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}小时${minutes > 0 ? `${minutes}分` : ''}`;
  }
  return `${minutes}分钟`;
}

// 格式化时长为紧凑格式（用于时间块显示）
// < 60分钟: 43min
// >= 60分钟: 1h 17min
export function formatDurationCompact(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}

// 格式化时间为 HH:mm
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// 将 FocusLog 转换为 TimeBlockData
export function convertToTimeBlockData(log: FocusLog): TimeBlockData {
  const startDate = new Date(log.startTime);
  const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
  
  // 判断是否进行中
  const isOngoing = log.endTime === null;
  
  // 计算时长：进行中则显示默认15分钟，否则使用实际时长
  const durationMinutes = isOngoing 
    ? 15  // 进行中默认显示15分钟
    : log.duration / 60;
  
  const topPercent = (startMinutes / (24 * 60)) * 100;
  const heightPercent = Math.max((durationMinutes / (24 * 60)) * 100, 1.5); // 最小高度 1.5%
  
  return {
    id: log.id,
    goalId: log.goalId,
    goalTitle: log.goalTitle,
    startTime: log.startTime,
    endTime: log.endTime,
    duration: isOngoing ? 15 * 60 : log.duration, // 进行中显示15分钟的秒数
    note: log.note,
    isOngoing,
    topPercent,
    heightPercent,
  };
}
