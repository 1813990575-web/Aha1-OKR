// Splitter.tsx - 可拖拽分栏分隔条组件
// game rules: 极简风格，悬浮显示细线，拖拽时变色

import { useState } from 'react';

interface SplitterProps {
  isResizing: boolean;
  onResizeStart: (e: React.MouseEvent) => void;
}

export function Splitter({ isResizing, onResizeStart }: SplitterProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative z-20 cursor-col-resize"
      onMouseDown={onResizeStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '8px',
        marginLeft: '-4px',
        marginRight: '-4px',
      }}
    >
      {/* 热区背景（透明，用于扩大可点击区域） */}
      <div className="absolute inset-0" />
      
      {/* 视觉线条 - 悬浮或拖拽时显示 */}
      <div 
        className={`
          absolute top-0 bottom-0 left-1/2 -translate-x-1/2
          w-[1px] transition-colors duration-150
          ${isResizing 
            ? 'bg-stone-400' 
            : isHovered 
              ? 'bg-stone-300' 
              : 'bg-transparent'
          }
        `}
      />
    </div>
  );
}
