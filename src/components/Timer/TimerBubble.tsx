import { useEffect, useRef, useState } from 'react';
import { useTimer } from './TimerProvider';

interface TimerBubbleProps {
  goalTitle: string;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function TimerBubble({ goalTitle, anchorRef }: TimerBubbleProps) {
  const {
    timeRemaining,
    totalTime,
    isRunning,
    isPaused,
    showBubble,
    setShowBubble,
    startTimer,
    pauseTimer,
    resetTimer,
    completeTimer,
    adjustTime,
  } = useTimer();

  const bubbleRef = useRef<HTMLDivElement>(null);
  const [showTimeControls, setShowTimeControls] = useState(false);

  // 点击外部关闭气泡
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        bubbleRef.current &&
        !bubbleRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        setShowBubble(false);
      }
    };

    if (showBubble) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showBubble, setShowBubble, anchorRef]);

  // 格式化时间为 mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 计算进度百分比
  const progressPercent = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0;

  // 处理开始/暂停
  const handleTogglePlay = () => {
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  // 处理调整时间
  const handleAdjustTime = (deltaMinutes: number) => {
    adjustTime(deltaMinutes);
  };

  // 处理完成
  const handleComplete = () => {
    completeTimer();
    setShowBubble(false);
  };

  if (!showBubble) return null;

  return (
    <div
      ref={bubbleRef}
      className="fixed z-50 animate-in fade-in zoom-in-95 duration-200"
      style={{
        // 定位将由父组件通过计算设置
      }}
    >
      {/* 小尖角 - 指向上方 */}
      <div
        className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0"
        style={{
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '8px solid rgba(255, 255, 255, 0.85)',
        }}
      />

      {/* 气泡主体 - 玻璃拟态效果 */}
      <div
        className="
          relative mt-2
          bg-white/85 backdrop-blur-xl
          rounded-2xl
          shadow-2xl shadow-stone-400/30
          border border-white/50
          p-6
          min-w-[300px]
        "
      >
        {/* 目标标题 - 弱化显示，限制宽度并添加省略号 */}
        <div className="mb-6 text-center px-4">
          <h3 
            className="text-xs font-medium text-stone-500 truncate max-w-[200px] mx-auto" 
            title={goalTitle}
          >
            {goalTitle}
          </h3>
        </div>

        {/* 时间调整 + 倒计时显示 */}
        <div 
          className="flex items-baseline justify-center gap-6 mb-6 group"
          onMouseEnter={() => setShowTimeControls(true)}
          onMouseLeave={() => setShowTimeControls(false)}
        >
          {/* 减号按钮 - 悬浮时显示，与时间数字基线对齐 */}
          <button
            onClick={() => handleAdjustTime(-5)}
            className={`
              w-5 h-5 flex items-center justify-center
              rounded-full bg-stone-100 hover:bg-stone-200
              text-stone-400 hover:text-stone-600
              transition-all duration-200 flex-shrink-0
              ${showTimeControls ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}
            `}
            title="减少5分钟"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>

          {/* 倒计时显示 */}
          <div className="text-center min-w-[120px]">
            <div
              className={`
                text-5xl font-mono font-bold tracking-tight
                ${isRunning ? 'text-stone-800' : 'text-stone-600'}
                ${timeRemaining < 60 ? 'text-red-500' : ''}
                transition-colors duration-300
              `}
            >
              {formatTime(timeRemaining)}
            </div>
          </div>

          {/* 加号按钮 - 悬浮时显示，与时间数字基线对齐 */}
          <button
            onClick={() => handleAdjustTime(5)}
            className={`
              w-5 h-5 flex items-center justify-center
              rounded-full bg-stone-100 hover:bg-stone-200
              text-stone-400 hover:text-stone-600
              transition-all duration-200 flex-shrink-0
              ${showTimeControls ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'}
            `}
            title="增加5分钟"
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* 进度条 */}
        <div className="mb-6">
          <div className="h-1.5 bg-stone-200/70 rounded-full overflow-hidden">
            <div
              className={`
                h-full rounded-full transition-all duration-1000 ease-linear
                ${isRunning ? 'bg-stone-800' : 'bg-stone-400'}
              `}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 控制按钮 - 顺序：重置、暂停/开始、完成 */}
        <div className="flex items-center gap-2">
          {/* 重置按钮 */}
          <button
            onClick={resetTimer}
            className="
              w-10 h-10 flex items-center justify-center
              rounded-xl bg-stone-100 hover:bg-stone-200
              text-stone-600 hover:text-stone-800
              transition-all duration-200
            "
            title="重置"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {/* 开始/暂停按钮 */}
          <button
            onClick={handleTogglePlay}
            className={`
              flex-1 flex items-center justify-center gap-2
              py-2.5 px-4 rounded-xl
              font-medium text-sm
              transition-all duration-200
              ${
                isRunning
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                  : 'bg-stone-800 hover:bg-stone-700 text-white'
              }
            `}
          >
            {isRunning ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
                暂停
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {isPaused ? '继续' : '开始'}
              </>
            )}
          </button>

          {/* 完成按钮 */}
          <button
            onClick={handleComplete}
            className="
              w-10 h-10 flex items-center justify-center
              rounded-xl bg-green-100 hover:bg-green-200
              text-green-600 hover:text-green-800
              transition-all duration-200
            "
            title="完成"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={() => setShowBubble(false)}
          className="
            absolute top-3 right-3
            w-6 h-6 flex items-center justify-center
            rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100
            transition-all duration-200
          "
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
