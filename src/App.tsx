import { useEffect, useState, useRef, useCallback } from 'react';
import { useGoalStore } from './store/goalStore';
import { LeftSidebar } from './components/LeftSidebar';
import { MiddlePanel } from './components/MiddlePanel';
import { RightPanel } from './components/RightPanel';

function App() {
  const { loadGoals, getSplitGoals } = useGoalStore();
  
  // 中间面板宽度状态（默认 280px）
  const [middlePanelWidth, setMiddlePanelWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(280);

  useEffect(() => {
    // 应用启动时从数据库加载目标
    loadGoals();
  }, [loadGoals]);

  // 开始拖拽
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = middlePanelWidth;
  }, [middlePanelWidth]);

  // 拖拽中
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const delta = e.clientX - startXRef.current;
    const newWidth = Math.max(200, Math.min(500, startWidthRef.current + delta));
    setMiddlePanelWidth(newWidth);
  }, [isResizing]);

  // 结束拖拽
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // 添加/移除全局鼠标事件监听
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // 检查是否有被拆分的目标（决定是否显示中间面板）
  const splitGoals = getSplitGoals();
  const hasSplitGoals = splitGoals.length > 0;

  return (
    <div className="relative h-screen w-screen flex bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden" ref={containerRef}>
      {/* Left Sidebar - Fixed */}
      <LeftSidebar />

      {/* Middle Panel - 动态宽度 */}
      {hasSplitGoals && (
        <>
          <MiddlePanel width={middlePanelWidth} />
          
          {/* Resizer - 可拖拽分隔条 */}
          <div
            className="absolute z-20 cursor-col-resize group"
            onMouseDown={handleResizeStart}
            style={{
              left: `${220 + middlePanelWidth}px`,
              width: '6px',
              height: '100%',
              transform: 'translateX(-50%)',
            }}
          >
            {/* 视觉线条 - 悬浮时显示 */}
            <div 
              className={`
                absolute top-0 bottom-0 left-1/2 -translate-x-1/2
                w-[2px] bg-blue-500/30 opacity-0 group-hover:opacity-100
                transition-opacity duration-150
                ${isResizing ? 'opacity-100' : ''}
              `}
            />
          </div>
        </>
      )}

      {/* Right Panel - Main workspace */}
      <RightPanel />
    </div>
  );
}

export default App;
