import Dexie from 'dexie';
import type { Table } from 'dexie';

// 目标数据接口
export interface Goal {
  id: string;
  title: string;
  parentId: string | null;
  isSplit: boolean;
  isCompleted: boolean;
  // 时间字段
  startDate: number | null;  // 开始日期 (timestamp)
  endDate: number | null;    // 截止日期 (timestamp)
  showDeadline: boolean;     // 是否显示 deadline
  // 排序字段
  sortOrder: number;         // 同级排序顺序
  createdAt: number;
  updatedAt: number;
}

// 专注记录接口
export interface FocusLog {
  id: string;
  goalId: string;           // 关联的任务ID
  goalTitle: string;        // 任务标题（冗余存储，避免关联查询）
  startTime: number;        // 开始时间 (timestamp)
  endTime: number | null;   // 结束时间 (timestamp)，null 表示进行中
  duration: number;         // 实际专注时长（秒）
  plannedDuration: number;  // 计划专注时长（秒）
  note: string | null;      // 备注
  createdAt: number;
}

// 愿景备注接口
export interface Note {
  id: string;
  goalId: string;           // 关联的目标ID
  content: string;          // 内容（文字或语音转文字）
  type: 'text' | 'voice';   // 类型：文字/语音
  voiceUrl?: string;        // 语音文件URL（语音类型时）
  duration?: number;        // 语音时长（秒）
  createdAt: number;        // 创建时间
  updatedAt: number;        // 更新时间
}

// 数据库类
export class AhaOKRDatabase extends Dexie {
  goals!: Table<Goal>;
  focusLogs!: Table<FocusLog>;
  notes!: Table<Note>;

  constructor() {
    super('AhaOKRDatabase');
    
    // 版本 6：添加 notes 表
    this.version(6).stores({
      goals: 'id, parentId, isSplit, isCompleted, startDate, endDate, showDeadline, sortOrder, createdAt, updatedAt',
      focusLogs: 'id, goalId, startTime, endTime, [goalId+startTime], [startTime+endTime]',
      notes: 'id, goalId, createdAt, updatedAt, [goalId+createdAt]'
    });
  }
}

// 数据库实例
export const db = new AhaOKRDatabase();

// 数据库初始化函数
export async function initDatabase(): Promise<void> {
  try {
    // 检查数据库是否可访问
    await db.open();
    
    // 验证表是否存在
    if (!db.goals) {
      throw new Error('Goals table not found');
    }
    
    if (!db.focusLogs) {
      throw new Error('FocusLogs table not found');
    }
    
    console.log('[Database] 数据库连接成功');
  } catch (error) {
    console.error('[Database] 数据库连接失败:', error);
    throw error;
  }
}

// 检查数据库状态
export function isDatabaseReady(): boolean {
  return db.isOpen();
}

// FocusLog 相关操作
export async function createFocusLog(log: Omit<FocusLog, 'id' | 'createdAt'>): Promise<FocusLog> {
  const newLog: FocusLog = {
    ...log,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  await db.focusLogs.add(newLog);
  return newLog;
}

// 更新专注记录的结束时间和时长
export async function updateFocusLogEndTime(id: string, endTime: number, duration: number): Promise<void> {
  await db.focusLogs.update(id, { endTime, duration });
}

export async function getFocusLogsByDate(date: Date): Promise<FocusLog[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return db.focusLogs
    .where('startTime')
    .between(startOfDay.getTime(), endOfDay.getTime())
    .sortBy('startTime');
}

export async function getFocusLogsByDateRange(startDate: Date, endDate: Date): Promise<FocusLog[]> {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return db.focusLogs
    .where('startTime')
    .between(start.getTime(), end.getTime())
    .sortBy('startTime');
}

export async function getFocusLogsByGoalId(goalId: string): Promise<FocusLog[]> {
  return db.focusLogs
    .where('goalId')
    .equals(goalId)
    .sortBy('startTime');
}

export async function deleteFocusLog(id: string): Promise<void> {
  await db.focusLogs.delete(id);
}

export async function updateFocusLogNote(id: string, note: string | null): Promise<void> {
  await db.focusLogs.update(id, { note });
}
