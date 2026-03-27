import React, { useState, useRef, useEffect } from 'react';
import type { Note } from '../../store/noteStore';

interface ChatBubbleProps {
  note: Note;
  onUpdate: (noteId: string, content: string) => void;
  onDelete: (noteId: string) => void;
}

export function ChatBubble({ note, onUpdate, onDelete }: ChatBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [isHovered, setIsHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整 textarea 高度
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // 处理 textarea 高度自适应
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditContent(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleSave = () => {
    if (editContent.trim() && editContent !== note.content) {
      onUpdate(note.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(note.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('确定要删除这条愿景记录吗？')) {
      onDelete(note.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter 保存
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
    // Esc 取消
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div 
      className="flex flex-col items-end mb-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 消息气泡容器 - 使用 flex 布局让按钮在左侧，底部对齐 */}
      <div className="flex items-end gap-2">
        {/* 悬浮操作按钮 - 显示在气泡左侧，底部对齐 */}
        {isHovered && !isEditing && (
          <div className="flex gap-1 animate-in fade-in duration-200 mb-[2px]">
            <button
              onClick={() => setIsEditing(true)}
              className="w-7 h-7 flex items-center justify-center rounded bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-700 transition-colors"
              title="编辑"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              className="w-7 h-7 flex items-center justify-center rounded bg-stone-100 hover:bg-red-100 text-stone-500 hover:text-red-600 transition-colors"
              title="删除"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}

        {/* 消息内容或编辑状态 */}
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              className="bg-white border border-stone-300 text-[#1A1A1A] px-4 py-2.5 rounded-2xl rounded-tr-sm text-[14px] leading-7 shadow-sm text-left min-w-[200px] max-w-[600px] resize-none outline-none focus:border-stone-400"
              rows={1}
            />
            {/* 保存/取消按钮 */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-xs text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
              >
                取消 (Esc)
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1 text-xs bg-stone-800 text-white hover:bg-stone-700 rounded-md transition-colors"
              >
                保存 (⌘+Enter)
              </button>
            </div>
          </div>
        ) : (
          /* 消息内容 - 更浅的灰底，深灰文字 */
          <div className="bg-[#F5F5F5] text-[#1A1A1A] px-4 py-2.5 rounded-2xl rounded-tr-sm text-[14px] leading-7 shadow-sm text-left max-w-[600px]">
            {note.content}
          </div>
        )}
      </div>
      
      {/* 时间戳 */}
      <span className="text-[10px] text-stone-400 mt-1 mr-1">
        {formatTime(note.createdAt)}
        {note.updatedAt !== note.createdAt && ' (已编辑)'}
      </span>
    </div>
  );
}
