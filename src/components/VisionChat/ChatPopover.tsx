import React, { useState, useEffect, useRef } from 'react';
import { useNoteStore } from '../../store/noteStore';
import { ChatBubble } from './ChatBubble';

interface ChatPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  goalId: string | null;
  goalTitle: string;
}

export function ChatPopover({ isOpen, onClose, goalId, goalTitle }: ChatPopoverProps) {
  const [inputValue, setInputValue] = useState('');
  const { notes, addNote, updateNote, deleteNote, loadNotes } = useNoteStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // 按时间升序排列（旧的在前，新的在后）
  const goalNotes = goalId
    ? notes.filter(n => n.goalId === goalId).sort((a, b) => a.createdAt - b.createdAt)
    : [];

  // 加载数据
  useEffect(() => {
    if (isOpen && goalId) {
      loadNotes();
    }
  }, [isOpen, goalId]);

  // 自动滚动到底部
  useEffect(() => {
    if (isOpen && goalNotes.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, goalNotes.length]);

  const handleSend = () => {
    if (!inputValue.trim() || !goalId) return;
    addNote(goalId, inputValue.trim(), 'text');
    setInputValue('');
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUpdate = async (noteId: string, content: string) => {
    await updateNote(noteId, content);
  };

  const handleDelete = async (noteId: string) => {
    await deleteNote(noteId);
  };

  if (!isOpen || !goalId) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* 弹窗容器 - 760px 宽度 */}
      <div
        className="w-[760px] h-[720px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - 移除愿景对话标题，目标名称作为主标题 */}
        <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-100">
          <div className="flex items-center gap-3">
            {/* 头像占位 */}
            <div className="w-9 h-9 rounded-full bg-stone-200 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            {/* 目标名称作为主标题，带字数限制 */}
            <h3 className="text-base font-semibold text-stone-800 truncate max-w-[500px]" title={goalTitle}>
              {goalTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-200 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 消息列表区域 - 减小左侧 padding */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-3 py-4 bg-stone-50/30"
        >
          {goalNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-stone-400">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm">还没有愿景记录</p>
              <p className="text-xs mt-1">开始记录你对这个目标的期待吧</p>
            </div>
          ) : (
            <div className="flex flex-col space-y-3">
              {goalNotes.map((note) => (
                <ChatBubble
                  key={note.id}
                  note={note}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
              {/* 滚动锚点 */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="px-3 py-3 bg-stone-50 border-t border-stone-100">
          <div className="flex items-center gap-2">
            {/* 语音按钮 */}
            <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-200 transition-colors text-stone-500 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            
            {/* 输入框 */}
            <div className="flex-1 bg-white rounded-full border border-stone-200 px-4 py-2 focus-within:border-stone-400 focus-within:ring-1 focus-within:ring-stone-200 transition-all">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="写下你的愿景..."
                className="w-full bg-transparent border-none outline-none text-[14px] text-stone-700 placeholder-stone-400"
              />
            </div>
            
            {/* 发送按钮 */}
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-all flex-shrink-0 ${
                inputValue.trim()
                  ? 'bg-stone-800 text-white hover:bg-stone-700'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
