import { create } from 'zustand';
import { db, type FocusLog } from '../db/schema';

interface TimelineState {
  // 选中的专注记录
  selectedFocusLogId: string | null;
  selectedFocusLog: FocusLog | null;

  // Actions
  selectFocusLog: (logId: string | null) => Promise<void>;
  updateFocusLogNote: (logId: string, note: string | null) => Promise<void>;
  getFocusLogById: (logId: string) => Promise<FocusLog | undefined>;
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  selectedFocusLogId: null,
  selectedFocusLog: null,

  // 选中专注记录
  selectFocusLog: async (logId: string | null) => {
    if (!logId) {
      set({ selectedFocusLogId: null, selectedFocusLog: null });
      return;
    }

    try {
      const log = await db.focusLogs.get(logId);
      set({
        selectedFocusLogId: logId,
        selectedFocusLog: log || null,
      });
    } catch (error) {
      console.error('[TimelineStore] Failed to select focus log:', error);
      set({ selectedFocusLogId: null, selectedFocusLog: null });
    }
  },

  // 更新专注记录备注
  updateFocusLogNote: async (logId: string, note: string | null) => {
    try {
      await db.focusLogs.update(logId, { note });
      
      // 如果当前选中的就是这个记录，更新本地状态
      const { selectedFocusLogId } = get();
      if (selectedFocusLogId === logId) {
        const updatedLog = await db.focusLogs.get(logId);
        set({ selectedFocusLog: updatedLog || null });
      }
      
      console.log('[TimelineStore] Updated note for log:', logId);
    } catch (error) {
      console.error('[TimelineStore] Failed to update note:', error);
      throw error;
    }
  },

  // 获取专注记录
  getFocusLogById: async (logId: string) => {
    try {
      return await db.focusLogs.get(logId);
    } catch (error) {
      console.error('[TimelineStore] Failed to get focus log:', error);
      return undefined;
    }
  },
}));
