import { useState } from 'react';
import { useTimer } from './TimerProvider';

interface MiniTimerProps {
  goalId: string;
}

export function MiniTimer({ goalId: _goalId }: MiniTimerProps) {
  const { 
    timeRemaining, 
    isRunning, 
    isPaused,
    adjustTime, 
    toggleBubble,
    startTimer,
    pauseTimer 
  } = useTimer();
  
  const [showControls, setShowControls] = useState(false);

  // 格式化时间为 mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 处理增加时间
  const handleAddTime = (e: React.MouseEvent) => {
    e.stopPropagation();
    adjustTime(5);
  };

  // 处理减少时间
  const handleSubtractTime = (e: React.MouseEvent) => {
    e.stopPropagation();
    adjustTime(-5);
  };

  // 处理点击计时器（打开气泡）
  const handleTimerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBubble();
  };

  // 处理开始/暂停
  const handleTogglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  return (
    <div 
      className="flex items-center gap-1"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* 减号按钮 - 悬浮时显示 */}
      <button
        onClick={handleSubtractTime}
        className={`
          w-5 h-5 flex items-center justify-center rounded-full
          bg-white/20 hover:bg-white/30 text-white/80 hover:text-white
          transition-all duration-200
          ${showControls ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}
        `}
        title="减少5分钟"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>

      {/* 计时器显示 */}
      <div
        onClick={handleTimerClick}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer bg-white/10 hover:bg-white/20 transition-all duration-200 group"
        title="点击打开计时器"
      >
        {/* 播放/暂停图标 */}
        <div
          onClick={handleTogglePlay}
          className="w-4 h-4 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          {isRunning ? (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </div>

        {/* 时间显示 */}
        <span className={`text-xs font-mono font-medium ${isRunning ? 'text-white' : 'text-white/80'} ${isPaused ? 'text-white/60' : ''}`}>
          {formatTime(timeRemaining)}
        </span>

        {/* 运行状态指示器 */}
        {isRunning && (
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
        )}
        {isPaused && (
          <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
        )}
      </div>

      {/* 加号按钮 - 悬浮时显示 */}
      <button
        onClick={handleAddTime}
        className={`
          w-5 h-5 flex items-center justify-center rounded-full
          bg-white/20 hover:bg-white/30 text-white/80 hover:text-white
          transition-all duration-200
          ${showControls ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}
        `}
        title="增加5分钟"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
