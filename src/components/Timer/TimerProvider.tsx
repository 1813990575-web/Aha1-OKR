import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { createFocusLog } from '../../db/schema';
import { useGoalStore } from '../../store/goalStore';

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
  completeTimer: () => void; // 完成计时
  adjustTime: (deltaMinutes: number) => void;
  setTotalTime: (minutes: number) => void;
  
  // 气泡显示控制
  showBubble: boolean;
  setShowBubble: (show: boolean) => void;
  toggleBubble: () => void;
  
  // 完成回调
  onTimerComplete: (() => void) | null;
  setOnTimerComplete: (callback: (() => void) | null) => void;
  
  // 专注记录相关
  startTime: number | null; // 当前专注开始时间
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
  
  // 专注开始时间（用于记录）
  const [startTime, setStartTime] = useState<number | null>(null);
  
  // 气泡显示状态
  const [showBubble, setShowBubble] = useState(false);
  
  // 完成回调
  const [onTimerComplete, setOnTimerComplete] = useState<(() => void) | null>(null);
  
  // 使用 ref 来存储最新的状态，避免闭包问题
  const activeFocusIdRef = useRef(activeFocusId);
  const startTimeRef = useRef(startTime);
  const totalTimeRef = useRef(totalTime);
  const onCompleteRef = useRef(onTimerComplete);
  const isRunningRef = useRef(isRunning);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // 获取目标信息用于记录
  const { getGoalById } = useGoalStore();
  
  // 同步 ref 和 state
  useEffect(() => {
    activeFocusIdRef.current = activeFocusId;
  }, [activeFocusId]);
  
  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);
  
  useEffect(() => {
    totalTimeRef.current = totalTime;
  }, [totalTime]);
  
  useEffect(() => {
    onCompleteRef.current = onTimerComplete;
  }, [onTimerComplete]);
  
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // 清理计时器 - 使用 ref 而不是 useCallback
  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 保存专注记录到数据库
  const saveFocusLog = useCallback(async (
    goalId: string,
    start: number,
    end: number,
    plannedDuration: number
  ) => {
    try {
      const goal = getGoalById(goalId);
      if (!goal) {
        console.error('[Timer] 无法找到目标信息:', goalId);
        return;
      }

      const actualDuration = Math.floor((end - start) / 1000); // 转换为秒
      
      await createFocusLog({
        goalId,
        goalTitle: goal.title,
        startTime: start,
        endTime: end,
        duration: actualDuration,
        plannedDuration,
        note: null,
      });
      
      console.log('[Timer] 专注记录已保存:', {
        goalId,
        goalTitle: goal.title,
        duration: actualDuration,
      });
    } catch (error) {
      console.error('[Timer] 保存专注记录失败:', error);
    }
  }, [getGoalById]);

  // 设置专注目标
  const setActiveFocus = useCallback((goalId: string | null) => {
    setActiveFocusId(goalId);
    if (goalId) {
      // 重置计时器到默认时间
      setTimeRemaining(DEFAULT_FOCUS_TIME);
      setTotalTimeState(DEFAULT_FOCUS_TIME);
      setIsRunning(false);
      setIsPaused(false);
      setStartTime(null);
    }
  }, []);

  // 切换专注状态
  const toggleFocus = useCallback((goalId: string) => {
    if (activeFocusIdRef.current === goalId) {
      // 如果已经是当前专注目标，取消专注并保存记录
      if (startTimeRef.current && isRunningRef.current) {
        // 保存专注记录
        saveFocusLog(goalId, startTimeRef.current, Date.now(), totalTimeRef.current);
      }
      setActiveFocusId(null);
      clearTimer();
      setIsRunning(false);
      setIsPaused(false);
      setStartTime(null);
      setShowBubble(false);
    } else {
      // 切换到新目标
      clearTimer();
      setActiveFocusId(goalId);
      setTimeRemaining(DEFAULT_FOCUS_TIME);
      setTotalTimeState(DEFAULT_FOCUS_TIME);
      setIsRunning(false);
      setIsPaused(false);
      setStartTime(null);
    }
  }, [saveFocusLog]);

  // 检查目标是否处于专注状态
  const isGoalFocused = useCallback((goalId: string) => {
    return activeFocusId === goalId;
  }, [activeFocusId]);

  // 开始计时 - 不使用 useCallback，直接使用函数
  const startTimer = () => {
    if (!isRunningRef.current && timeRemaining > 0) {
      setIsRunning(true);
      setIsPaused(false);
      
      // 记录开始时间（如果还没记录）
      if (!startTimeRef.current) {
        const now = Date.now();
        setStartTime(now);
        startTimeRef.current = now;
      }
      
      // 清除之前的计时器
      clearTimer();
      
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // 计时结束
            clearTimer();
            setIsRunning(false);
            setIsPaused(false);
            
            // 保存专注记录
            if (activeFocusIdRef.current && startTimeRef.current) {
              saveFocusLog(activeFocusIdRef.current, startTimeRef.current, Date.now(), totalTimeRef.current);
            }
            
            // 触发完成回调
            if (onCompleteRef.current) {
              onCompleteRef.current();
            }
            
            // 重置开始时间
            setStartTime(null);
            startTimeRef.current = null;
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // 暂停计时
  const pauseTimer = () => {
    clearTimer();
    setIsRunning(false);
    setIsPaused(true);
  };

  // 重置计时器
  const resetTimer = () => {
    // 如果正在运行，先保存当前记录
    if (isRunningRef.current && activeFocusIdRef.current && startTimeRef.current) {
      saveFocusLog(activeFocusIdRef.current, startTimeRef.current, Date.now(), totalTimeRef.current);
    }
    
    clearTimer();
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(totalTime);
    setStartTime(null);
    startTimeRef.current = null;
  };

  // 完成计时 - 手动完成并保存记录
  const completeTimer = () => {
    // 保存专注记录
    if (activeFocusIdRef.current && startTimeRef.current) {
      saveFocusLog(activeFocusIdRef.current, startTimeRef.current, Date.now(), totalTimeRef.current);
    }
    
    clearTimer();
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(0);
    setStartTime(null);
    startTimeRef.current = null;
    
    // 触发完成回调
    if (onCompleteRef.current) {
      onCompleteRef.current();
    }
  };

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
    if (!isRunningRef.current && !isPaused) {
      setTimeRemaining(seconds);
    }
  }, [isPaused]);

  // 切换气泡显示
  const toggleBubble = useCallback(() => {
    setShowBubble((prev) => !prev);
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      // 如果正在专注，保存记录
      if (isRunningRef.current && activeFocusIdRef.current && startTimeRef.current) {
        saveFocusLog(activeFocusIdRef.current, startTimeRef.current, Date.now(), totalTimeRef.current);
      }
      clearTimer();
    };
  }, [saveFocusLog]);

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
    completeTimer,
    adjustTime,
    setTotalTime,
    showBubble,
    setShowBubble,
    toggleBubble,
    onTimerComplete,
    setOnTimerComplete,
    startTime,
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
