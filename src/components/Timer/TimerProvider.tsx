import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { createFocusLog, updateFocusLogEndTime, db } from '../../db/schema';
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
  
  // 当前专注记录ID（用于更新进行中的记录）
  const [currentFocusLogId, setCurrentFocusLogId] = useState<string | null>(null);
  
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
  const currentFocusLogIdRef = useRef(currentFocusLogId);
  
  // 同步 ref 和 state
  useEffect(() => {
    currentFocusLogIdRef.current = currentFocusLogId;
  }, [currentFocusLogId]);
  
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

  // 创建进行中的专注记录（点击开始时调用）
  const createOngoingFocusLog = useCallback(async (
    goalId: string,
    start: number,
    plannedDuration: number
  ): Promise<string | null> => {
    try {
      const goal = getGoalById(goalId);
      if (!goal) {
        console.error('[Timer] 无法找到目标信息:', goalId);
        return null;
      }

      const newLog = await createFocusLog({
        goalId,
        goalTitle: goal.title,
        startTime: start,
        endTime: null, // 进行中，结束时间为 null
        duration: 0,   // 进行中，时长为 0
        plannedDuration,
        note: null,
      });
      
      console.log('[Timer] 专注记录已创建（进行中）:', {
        logId: newLog.id,
        goalId,
        goalTitle: goal.title,
      });
      
      return newLog.id;
    } catch (error) {
      console.error('[Timer] 创建专注记录失败:', error);
      return null;
    }
  }, [getGoalById]);

  // 完成专注记录（点击完成时调用）
  const completeFocusLog = useCallback(async (
    logId: string | null,
    end: number
  ) => {
    if (!logId) {
      console.error('[Timer] 没有进行中的专注记录');
      return;
    }
    
    try {
      // 获取记录以计算时长
      const log = await db.focusLogs.get(logId);
      if (!log) {
        console.error('[Timer] 找不到专注记录:', logId);
        return;
      }
      
      const actualDuration = Math.floor((end - log.startTime) / 1000); // 转换为秒
      
      await updateFocusLogEndTime(logId, end, actualDuration);
      
      console.log('[Timer] 专注记录已完成:', {
        logId,
        endTime: end,
        duration: actualDuration,
      });
    } catch (error) {
      console.error('[Timer] 完成专注记录失败:', error);
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
      setStartTime(null);
    }
  }, []);

  // 切换专注状态
  const toggleFocus = useCallback((goalId: string) => {
    if (activeFocusIdRef.current === goalId) {
      // 如果已经是当前专注目标，取消专注并完成记录
      if (currentFocusLogIdRef.current && isRunningRef.current) {
        // 完成专注记录
        completeFocusLog(currentFocusLogIdRef.current, Date.now());
      }
      setActiveFocusId(null);
      clearTimer();
      setIsRunning(false);
      setIsPaused(false);
      setStartTime(null);
      startTimeRef.current = null;
      setCurrentFocusLogId(null);
      currentFocusLogIdRef.current = null;
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
      startTimeRef.current = null;
      setCurrentFocusLogId(null);
      currentFocusLogIdRef.current = null;
    }
  }, [completeFocusLog]);

  // 检查目标是否处于专注状态
  const isGoalFocused = useCallback((goalId: string) => {
    return activeFocusId === goalId;
  }, [activeFocusId]);

  // 开始计时 - 不使用 useCallback，直接使用函数
  const startTimer = async () => {
    if (!isRunningRef.current && timeRemaining > 0) {
      setIsRunning(true);
      setIsPaused(false);
      
      // 记录开始时间（如果还没记录）
      if (!startTimeRef.current) {
        const now = Date.now();
        setStartTime(now);
        startTimeRef.current = now;
        
        // 创建进行中的专注记录
        if (activeFocusIdRef.current) {
          const logId = await createOngoingFocusLog(
            activeFocusIdRef.current,
            now,
            totalTimeRef.current
          );
          if (logId) {
            setCurrentFocusLogId(logId);
            currentFocusLogIdRef.current = logId;
          }
        }
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
            
            // 完成专注记录
            if (currentFocusLogIdRef.current) {
              completeFocusLog(currentFocusLogIdRef.current, Date.now());
            }
            
            // 触发完成回调
            if (onCompleteRef.current) {
              onCompleteRef.current();
            }
            
            // 重置状态
            setStartTime(null);
            startTimeRef.current = null;
            setCurrentFocusLogId(null);
            currentFocusLogIdRef.current = null;
            
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
    // 如果正在运行，先完成当前记录
    if (isRunningRef.current && currentFocusLogIdRef.current) {
      completeFocusLog(currentFocusLogIdRef.current, Date.now());
    }
    
    clearTimer();
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(totalTime);
    setStartTime(null);
    startTimeRef.current = null;
    setCurrentFocusLogId(null);
    currentFocusLogIdRef.current = null;
  };

  // 完成计时 - 手动完成并保存记录，同时取消专注状态
  const completeTimer = () => {
    // 完成专注记录
    if (currentFocusLogIdRef.current) {
      completeFocusLog(currentFocusLogIdRef.current, Date.now());
    }
    
    clearTimer();
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(0);
    setStartTime(null);
    startTimeRef.current = null;
    setCurrentFocusLogId(null);
    currentFocusLogIdRef.current = null;
    
    // 触发完成回调
    if (onCompleteRef.current) {
      onCompleteRef.current();
    }
    
    // 取消专注状态（清除 activeFocusId）
    setActiveFocusId(null);
    setShowBubble(false);
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
      // 如果正在专注，完成记录
      if (isRunningRef.current && currentFocusLogIdRef.current) {
        completeFocusLog(currentFocusLogIdRef.current, Date.now());
      }
      clearTimer();
    };
  }, [completeFocusLog]);

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
