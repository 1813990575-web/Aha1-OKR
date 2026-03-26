// NoteEditor.tsx - Apple 风格毛玻璃备注输入框
// game rules: 点击 TimeBlock 弹出，支持 Cmd+Enter 保存和失焦保存

import { useState, useRef, useEffect, useCallback } from 'react';
import type { TimeBlockData } from './types';
import { updateFocusLogNote } from '../../db/schema';

interface NoteEditorProps {
  block: TimeBlockData;
  onClose: () => void;
  onSaved: () => void;
}

export function NoteEditor({ block, onClose, onSaved }: NoteEditorProps) {
  const [note, setNote] = useState(block.note || '');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 自动聚焦
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  // 处理点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleSave();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [note]);

  // 保存备注
  const handleSave = useCallback(async () => {
    if (isSaving) return;
    
    const trimmedNote = note.trim();
    const originalNote = block.note || '';
    
    // 如果没有变化，直接关闭
    if (trimmedNote === originalNote) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      await updateFocusLogNote(block.id, trimmedNote || null);
      onSaved();
      onClose();
    } catch (error) {
      console.error('[NoteEditor] 保存备注失败:', error);
    } finally {
      setIsSaving(false);
    }
  }, [note, block.id, block.note, isSaving, onClose, onSaved]);

  // 键盘处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd+Enter 或 Ctrl+Enter 保存
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
    // Escape 关闭（不保存）
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div
        ref={containerRef}
        className="w-80 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-4 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* 标题 */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-stone-800">添加备注</h4>
            <p className="text-[10px] text-stone-500">{block.goalTitle}</p>
          </div>
        </div>

        {/* 输入框 */}
        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          placeholder="记录这次专注的感受、成果或想法..."
          className="w-full h-24 px-3 py-2 text-sm text-stone-700 bg-white/50 rounded-xl border border-stone-200/60 resize-none outline-none focus:ring-2 focus:ring-stone-300/50 placeholder:text-stone-400"
          disabled={isSaving}
        />

        {/* 底部提示 */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] text-stone-400">
            {isSaving ? '保存中...' : 'Cmd + Enter 保存'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
              disabled={isSaving}
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs font-medium text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors disabled:opacity-50"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
