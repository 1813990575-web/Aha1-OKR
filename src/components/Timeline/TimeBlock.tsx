// TimeBlock.tsx - 单个专注任务块的渲染逻辑
// game rules: 纯展示组件，接收计算好的位置数据，负责渲染和交互
// 优化短时长色块的文字显示：只显示标题，居中对齐，极小字号

import { useState } from 'react';
import type { TimeBlockData } from './types';
import { getBlockColor } from './types';
import { TimeBlockContextMenu } from './TimeBlockContextMenu';

interface TimeBlockProps {
  data: TimeBlockData;
  isSelected?: boolean;
  onClick?: (data: TimeBlockData) => void;
  onDeleted?: () => void;
}

export function TimeBlock({ data, isSelected = false, onClick, onDeleted }: TimeBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const colors = getBlockColor(data.goalId);

  // 是否有备注
  const hasNote = data.note && data.note.trim().length > 0;

  // 计算最小高度（确保即使很短的区块也能显示文字）
  const minHeightPx = 16;

  // 处理右键点击
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // 关闭右键菜单
  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  return (
    <>
      <div
        className={`
          absolute left-14 right-1 rounded-md border-l-4 cursor-pointer
          transition-all duration-200
          ${colors.bg} ${colors.border}
          ${isSelected ? 'ring-2 ring-stone-400 ring-offset-1 shadow-lg z-30' : ''}
          ${isHovered && !isSelected ? 'shadow-md z-20 brightness-95' : 'z-10'}
        `}
        style={{
          top: `${data.topPercent}%`,
          height: `${Math.max(data.heightPercent, 1.5)}%`,
          minHeight: `${minHeightPx}px`,
          borderLeftColor: 'currentColor',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onClick?.(data)}
        onContextMenu={handleContextMenu}
      >
        {/* 内容区域 - Flex 居中对齐 */}
        <div className="h-full flex items-center justify-center px-1 overflow-hidden">
          {/* 标题 - 12px，单行省略 */}
          <div 
            className={`
              text-xs font-medium ${colors.text} 
              whitespace-nowrap overflow-hidden text-ellipsis
              leading-none
            `}
            title={data.goalTitle}
          >
            {data.goalTitle}
          </div>

          {/* 备注指示器 - 极小图标，放在标题后面 */}
          {hasNote && (
            <svg 
              className={`w-2 h-2 ml-0.5 ${colors.text} opacity-60 flex-shrink-0`} 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          )}
        </div>
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <TimeBlockContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          logId={data.id}
          onClose={handleCloseContextMenu}
          onDeleted={onDeleted || (() => {})}
        />
      )}
    </>
  );
}
