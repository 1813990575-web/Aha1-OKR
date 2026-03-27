// TimeBlockContextMenu.tsx - 时间块右键菜单
// game rules: 参考 Apple Calendar 风格的右键菜单

import { useEffect, useRef } from 'react';
import { deleteFocusLog, updateFocusLogEndTime, db } from '../../db/schema';

interface ContextMenuProps {
  x: number;
  y: number;
  logId: string;
  isOngoing: boolean;
  onClose: () => void;
  onDeleted: () => void;
  onCompleted?: () => void;
}

export function TimeBlockContextMenu({ x, y, logId, isOngoing, onClose, onDeleted, onCompleted }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // 处理完成专注
  const handleComplete = async () => {
    try {
      // 获取当前时间作为结束时间
      const endTime = Date.now();
      // 从数据库获取记录以计算时长
      const log = await db.focusLogs.get(logId);
      if (log) {
        const duration = Math.floor((endTime - log.startTime) / 1000); // 转换为秒
        await updateFocusLogEndTime(logId, endTime, duration);
        onCompleted?.();
      }
      onClose();
    } catch (error) {
      console.error('[ContextMenu] 完成专注失败:', error);
    }
  };

  // 处理删除
  const handleDelete = async () => {
    try {
      await deleteFocusLog(logId);
      onDeleted();
      onClose();
    } catch (error) {
      console.error('[ContextMenu] 删除失败:', error);
    }
  };

  // 调整菜单位置，确保不超出视口
  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 150);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-stone-200/60 py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100"
      style={{ left: adjustedX, top: adjustedY }}
    >
      {/* 完成专注 - 仅进行中显示 */}
      {isOngoing && (
        <button
          onClick={handleComplete}
          className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 transition-colors"
        >
          完成专注
        </button>
      )}

      {/* 编辑备注 */}
      <button
        onClick={onClose}
        className="w-full px-4 py-2 text-left text-sm text-stone-700 hover:bg-stone-100 transition-colors"
      >
        编辑备注
      </button>

      {/* 分割线 */}
      <div className="my-1 border-t border-stone-200/60" />

      {/* 删除 */}
      <button
        onClick={handleDelete}
        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
      >
        删除
      </button>
    </div>
  );
}
