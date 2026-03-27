import React, { useState, useRef } from 'react';

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [content, setContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!content.trim() || disabled) return;
    onSend(content.trim());
    setContent('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 模拟语音录制
  const handleVoiceClick = () => {
    setIsRecording(!isRecording);
    // TODO: 实现真实的语音录制功能
    if (!isRecording) {
      console.log('[Voice] 开始录制...');
    } else {
      console.log('[Voice] 停止录制');
    }
  };

  return (
    <div className="px-4 py-3 border-t border-stone-100 bg-white">
      <div className="flex items-center gap-2">
        {/* 语音按钮 */}
        <button
          onClick={handleVoiceClick}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse'
              : 'hover:bg-stone-100 text-stone-400 hover:text-stone-600'
          }`}
          title={isRecording ? '停止录制' : '语音输入'}
        >
          {isRecording ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </button>

        {/* 输入框 */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? '正在录制语音...' : '写下你的愿景...'}
            disabled={disabled || isRecording}
            className="w-full px-4 py-2 bg-stone-50 rounded-full text-sm text-stone-700 placeholder-stone-400 border-none outline-none focus:ring-2 focus:ring-stone-200 transition-all duration-200 disabled:opacity-50"
          />
        </div>

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={!content.trim() || disabled}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 ${
            content.trim() && !disabled
              ? 'bg-stone-800 hover:bg-stone-700 text-white'
              : 'bg-stone-100 text-stone-300 cursor-not-allowed'
          }`}
          title="发送"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>

      {/* 录制提示 */}
      {isRecording && (
        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-red-500">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          正在录制，点击停止按钮结束
        </div>
      )}
    </div>
  );
}
