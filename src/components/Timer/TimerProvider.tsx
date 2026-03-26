import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';

interface TimerState {
  activeFocusId: string | null;
  timeRemaining: number; // 剩余秒数
  totalTime: number; // 总秒数
  isRunning: boolean;
  isPaused: boolean;
}

interface TimerContextType extends TimerState {
  // 专注状态管理
  setActiveFocus: (goalId: string | null) => void;
  toggleFocus: (goalId: string) => void;
  isGoalFocused: (goalId: string) => boolean;
  
  // 计时控制
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  adjustTime: (deltaMinutes: number) => void;
  setTotalTime: (minutes: number) => void;
  
  // 气泡显示控制
  showBubble: boolean;
  setShowBubble: (show: boolean) => void;
  toggleBubble: () => void;
  
  // 完成回调
  onTimerComplete: (() => void) | null;
  setOnTimerComplete: (callback: (() => void) | null) => void;
}

const TimerContext = createContext<TimerContextType | null>(null);

const DEFAULT_FOCUS_TIME = 40 * 60; // 默认40分钟（秒）

export function TimerProvider({ children }: { children: ReactNode }) {
  // 专注状态
  const [activeFocusId, setActiveFocusId] = useState<string | null>(null);
  
  // 计时状态
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_FOCUS_TIME);
  const [totalTime, setTotalTimeState] = useState(DEFAULT_FOCUS_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // 气泡显示状态
  const [showBubble, setShowBubble] = useState(false);
  
  // 完成回调
  const [onTimerComplete, setOnTimerComplete] = useState<(() => void) | null>(null);
  
  // 计时器引用
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onTimerComplete);
  
  // 同步回调引用
  useEffect(() => {
    onCompleteRef.current = onTimerComplete;
  }, [onTimerComplete]);

  // 清理计时器
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 设置专注目标
  const setActiveFocus = useCallback((goalId: string | null) => {
    setActiveFocusId(goalId);
    if (goalId) {
      // 重置计时器到默认时间
      setTimeRemaining(DEFAULT_FOCUS_TIME);
      setTotalTimeState(DEFAULT_FOCUS_TIME);
      setIsRunning(false);
      setIsPaused(false);
    }
  }, []);

  // 切换专注状态
  const toggleFocus = useCallback((goalId: string) => {
    if (activeFocusId === goalId) {
      // 如果已经是当前专注目标，取消专注
      setActiveFocusId(null);
      clearTimer();
      setIsRunning(false);
      setIsPaused(false);
      setShowBubble(false);
    } else {
      // 切换到新目标
      clearTimer();
      setActiveFocusId(goalId);
      setTimeRemaining(DEFAULT_FOCUS_TIME);
      setTotalTimeState(DEFAULT_FOCUS_TIME);
      setIsRunning(false);
      setIsPaused(false);
    }
  }, [activeFocusId, clearTimer]);

  // 检查目标是否处于专注状态
  const isGoalFocused = useCallback((goalId: string) => {
    return activeFocusId === goalId;
  }, [activeFocusId]);

  // 开始计时
  const startTimer = useCallback(() => {
    if (!isRunning && timeRemaining > 0) {
      setIsRunning(true);
      setIsPaused(false);
      
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // 计时结束
            clearTimer();
            setIsRunning(false);
            setIsPaused(false);
            // 触发完成回调
            if (onCompleteRef.current) {
              onCompleteRef.current();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [isRunning, timeRemaining, clearTimer]);

  // 暂停计时
  const pauseTimer = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setIsPaused(true);
  }, [clearTimer]);

  // 重置计时器
  const resetTimer = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(totalTime);
  }, [clearTimer, totalTime]);

  // 调整时间（以5分钟为单位）
  const adjustTime = useCallback((deltaMinutes: number) => {
    const deltaSeconds = deltaMinutes * 60;
    setTimeRemaining((prev) => {
      const newTime = Math.max(60, prev + deltaSeconds); // 最少1分钟
      return newTime;
    });
    setTotalTimeState((prev) => {
      const newTime = Math.max(60, prev + deltaSeconds);
      return newTime;
    });
  }, []);

  // 设置总时间
  const setTotalTime = useCallback((minutes: number) => {
    const seconds = minutes * 60;
    setTotalTimeState(seconds);
    if (!isRunning && !isPaused) {
      setTimeRemaining(seconds);
    }
  }, [isRunning, isPaused]);

  // 切换气泡显示
  const toggleBubble = useCallback(() => {
    setShowBubble((prev) => !prev);
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  const value: TimerContextType = {
    activeFocusId,
    timeRemaining,
    totalTime,
    isRunning,
    isPaused,
    setActiveFocus,
    toggleFocus,
    isGoalFocused,
    startTimer,
    pauseTimer,
    resetTimer,
    adjustTime,
    setTotalTime,
    showBubble,
    setShowBubble,
    toggleBubble,
    onTimerComplete,
    setOnTimerComplete,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
