// LogDetailPanel.tsx - 专注记录详情面板
// game rules: Master-Detail 布局中的 Detail 面板，显示选中记录的详细信息

import { useState, useEffect, useCallback } from 'react';
import { useTimelineStore } from '../../store/timelineStore';
import { useGoalStore } from '../../store/goalStore';
import { useTimer } from '../Timer/TimerProvider';
import { MonthlyCalendar } from './MonthlyCalendar';
import { MiniTimer } from '../Timer/MiniTimer';

interface LogDetailPanelProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export function LogDetailPanel({ selectedDate, onDateSelect }: LogDetailPanelProps) {
  const { selectedFocusLog, updateFocusLogNote } = useTimelineStore();
  const { getGoalById } = useGoalStore();
  const { activeFocusId, isRunning, isPaused } = useTimer();

  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [, setParentGoal] = useState<{ id: string; title: string } | null>(null);
  const [childGoal, setChildGoal] = useState<{ id: string; title: string } | null>(null);

  // 加载选中的记录信息
  useEffect(() => {
    if (selectedFocusLog) {
      setNote(selectedFocusLog.note || '');

      // 获取目标信息
      const goal = getGoalById(selectedFocusLog.goalId);
      if (goal) {
        setChildGoal({ id: goal.id, title: goal.title });

        // 获取父目标
        if (goal.parentId) {
          const parent = getGoalById(goal.parentId);
          if (parent) {
            setParentGoal({ id: parent.id, title: parent.title });
          }
        } else {
          setParentGoal(null);
        }
      }
    } else {
      setNote('');
      setParentGoal(null);
      setChildGoal(null);
    }
  }, [selectedFocusLog, getGoalById]);

  // 自动保存备注
  const handleNoteBlur = useCallback(async () => {
    if (!selectedFocusLog) return;

    const trimmedNote = note.trim();
    const originalNote = selectedFocusLog.note || '';

    if (trimmedNote === originalNote) return;

    setIsSaving(true);
    try {
      await updateFocusLogNote(selectedFocusLog.id, trimmedNote || null);
    } catch (error) {
      console.error('[LogDetailPanel] 保存备注失败:', error);
    } finally {
      setIsSaving(false);
    }
  }, [note, selectedFocusLog, updateFocusLogNote]);

  return (
    <div className="flex-1 flex flex-col w-full bg-white/90 backdrop-blur-sm border-l border-stone-200/60 overflow-hidden">
      {/* 顶部区域：月度日历 */}
      <div className="border-b border-stone-100">
        <MonthlyCalendar selectedDate={selectedDate} onDateSelect={onDateSelect} />
      </div>

      {/* 中下部分：专注详情 */}
      <div className="flex-1 overflow-y-auto">
        {selectedFocusLog ? (
          <>
            {/* 备注编辑区 - 整合时长标签和标题 */}
            <div className="flex flex-col px-4 pt-4 pb-4">
              {/* 迷你计时器 - 仅在专注进行中显示 */}
              {selectedFocusLog.endTime === null && activeFocusId === selectedFocusLog.goalId && (isRunning || isPaused) && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-stone-800 rounded-full px-1 py-0.5">
                    <MiniTimer goalId={selectedFocusLog.goalId} />
                  </div>
                </div>
              )}

              {/* 标题（原备注标签位置）- 左对齐，与下方输入框对齐 */}
              <h3 className="text-sm text-stone-800 font-semibold truncate mb-3 text-left">
                {childGoal?.title || selectedFocusLog.goalTitle}
              </h3>
              
              {isSaving && (
                <span className="text-[10px] text-stone-400 flex items-center gap-1 mb-2 self-end">
                  <svg
                    className="w-3 h-3 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  保存中...
                </span>
              )}

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={handleNoteBlur}
                placeholder="记录这次专注的感受、成果或想法..."
                className="w-full p-3 text-sm text-stone-700 bg-stone-50 rounded-xl border border-stone-200/60 resize-none outline-none focus:ring-2 focus:ring-stone-300/50 focus:bg-white transition-all placeholder:text-stone-400 placeholder:text-xs"
                style={{ minHeight: '280px' }}
              />
            </div>
          </>
        ) : (
          /* 未选中记录时的提示 */
          <div className="flex flex-col items-center justify-center p-6 min-h-[300px]">
            <div className="w-16 h-16 mb-4 rounded-2xl bg-stone-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-stone-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              </svg>
            </div>
            <p className="text-sm text-stone-500 font-medium">点击时间轴选择任务</p>
            <p className="text-xs text-stone-400 mt-2">查看详情并编辑备注</p>
          </div>
        )}
      </div>
    </div>
  );
}
