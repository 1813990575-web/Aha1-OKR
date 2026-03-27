import { useState, useEffect, useRef } from 'react';
import { useGoalStore } from '../store/goalStore';
import { useNoteStore } from '../store/noteStore';
import { useTimer } from './Timer/TimerProvider';
import { MiniTimer } from './Timer/MiniTimer';
import { TimerBubble } from './Timer/TimerBubble';
import { DatePicker } from './DatePicker';
import { TimelineContainer } from './Timeline';
import { ReorderableList, DragHandle } from './shared/ReorderableList';
import type { DragHandleProps } from './shared/ReorderableList';
import { ChatPopover } from './VisionChat/ChatPopover';
import dayjs from 'dayjs';

export function RightPanel() {
  const {
    selectedGoalId,
    getGoalById,
    getChildGoals,
    addGoal,
    splitGoal,
    selectGoal,
    deleteGoal,
    updateGoalTitle,
    toggleGoalCompletion,
    updateGoalDates,
    toggleShowDeadline,
    getDeadlineStatus,
    reorderGoals,
  } = useGoalStore();

  const selectedGoal = selectedGoalId ? getGoalById(selectedGoalId) : null;
  const childGoals = selectedGoalId ? getChildGoals(selectedGoalId) : [];
  const deadlineStatus = selectedGoalId ? getDeadlineStatus(selectedGoalId) : null;

  // Note store
  const { getLatestNoteByGoalId, loadNotes } = useNoteStore();
  const latestNote = selectedGoalId ? getLatestNoteByGoalId(selectedGoalId) : null;

  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [titleInput, setTitleInput] = useState(selectedGoal?.title || '');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'goals' | 'time'>('goals'); // 视图模式：goals=子目标管理, time=时间统计

  // 加载备注数据
  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    if (selectedGoal) {
      setTitleInput(selectedGoal.title);
    }
  }, [selectedGoal?.id]);

  if (!selectedGoal) {
    return (
      <div className="flex-1 h-full bg-white flex flex-col">
        {/* Top Bar - 独立的上方面板，用于拖拽应用 */}
        <div className="h-10 bg-stone-50/80 flex items-center px-4 flex-shrink-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            {/* 装饰性几何图形 */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-stone-200 to-stone-100 rotate-3" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-stone-100 to-stone-50 -rotate-3" />
              <div className="absolute inset-2 rounded-xl bg-white shadow-sm flex items-center justify-center">
                <svg className="w-8 h-8 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium text-stone-800 mb-2 tracking-tight">选择一个目标</h3>
            <p className="text-sm text-stone-500">点击左侧"新目标"开始创建你的第一个目标</p>
          </div>
        </div>
      </div>
    );
  }

  const handleAddChildGoal = async () => {
    if (!newGoalTitle.trim()) {
      setIsAdding(false);
      return;
    }
    await addGoal(newGoalTitle, selectedGoalId);
    setNewGoalTitle('');
  };

  const handleSplit = async (goalId: string, isAlreadySplit: boolean) => {
    if (isAlreadySplit) {
      selectGoal(goalId);
    } else {
      await splitGoal(goalId);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleInput(e.target.value);
  };

  const handleTitleBlur = () => {
    if (selectedGoalId && titleInput !== selectedGoal.title) {
      updateGoalTitle(selectedGoalId, titleInput);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleTitleBlur();
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleToggleCurrentGoal = () => {
    if (selectedGoalId) {
      toggleGoalCompletion(selectedGoalId);
    }
  };

  const getDateDisplayText = () => {
    if (!selectedGoal.startDate || !selectedGoal.endDate) {
      return '设置时间';
    }
    const start = dayjs(selectedGoal.startDate).format('MM/DD');
    const end = dayjs(selectedGoal.endDate).format('MM/DD');
    const days = dayjs(selectedGoal.endDate).diff(dayjs(selectedGoal.startDate), 'day') + 1;
    return `${start} - ${end} · ${days}天`;
  };

  return (
    <div className="flex-1 h-full bg-white flex flex-col relative min-w-0">
      {/* Top Bar - 独立的上方面板，用于拖拽应用 */}
      <div 
        className="h-10 bg-stone-50/80 flex items-center px-4 flex-shrink-0" 
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} 
      />

      {/* Header - 只在子目标管理视图显示 */}
      {viewMode === 'goals' && (
        <div className="px-8 pt-6 pb-4 border-b border-stone-200/50">
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <button
              onClick={handleToggleCurrentGoal}
              className={`mt-1 w-5 h-5 rounded-full border-2 transition-all duration-200 flex-shrink-0 flex items-center justify-center ${
                selectedGoal.isCompleted
                  ? 'bg-stone-400 border-stone-400'
                  : 'border-stone-300 hover:border-stone-400 hover:bg-stone-50'
              }`}
            >
              {selectedGoal.isCompleted && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>

            <div className="flex-1 min-w-0">
              {/* Deadline Tag + Title */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Deadline Tag */}
                {deadlineStatus && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0 bg-red-500 text-white">
                    {deadlineStatus.text}
                  </span>
                )}
                <input
                  type="text"
                  value={titleInput}
                  onChange={handleTitleChange}
                  onBlur={handleTitleBlur}
                  onKeyDown={handleTitleKeyDown}
                  className={`flex-1 text-xl font-semibold bg-transparent border-none outline-none placeholder-stone-300 min-w-0 tracking-tight ${
                    selectedGoal.isCompleted ? 'text-stone-400 line-through' : 'text-stone-800'
                  }`}
                  placeholder="目标标题"
                />
              </div>

              {/* Meta info */}
              <div className="flex items-center gap-3 mt-2">
                {/* 执行时间按钮 */}
                <button 
                  onClick={() => setIsDatePickerOpen(true)}
                  className="flex items-center gap-1 px-2 py-0.5 text-[11px] text-stone-500 hover:text-stone-700 hover:bg-stone-100/80 rounded-md transition-all duration-200"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {getDateDisplayText()}
                </button>

                {/* 备注图标和预览 - 简洁文本风格 */}
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="flex items-center gap-1.5 text-[12px] text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded px-1.5 py-0.5 transition-all duration-200 max-w-[600px]"
                  title="查看愿景备注"
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {latestNote ? (
                    <span className="truncate whitespace-nowrap overflow-hidden text-ellipsis">{latestNote.content}</span>
                  ) : (
                    <span className="text-gray-400">添加愿景...</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Area - 根据视图模式显示不同内容 */}
      {viewMode === 'goals' ? (
        /* 子目标管理视图 */
        <div className="flex-1 overflow-y-auto py-6">
          <>
            {childGoals.length > 0 && (
              <ReorderableList
                items={childGoals}
                onReorder={(newOrder) => {
                  // 本地状态立即更新，确保 UI 无闪烁
                  console.log('[Drag] New order:', newOrder.map(g => g.id));
                }}
                onReorderComplete={async (newOrder) => {
                  const orderedIds = newOrder.map(g => g.id);
                  console.log('[Drag] Dragging complete. Final Array Order:', orderedIds);
                  await reorderGoals(orderedIds);
                }}
                className="flex flex-col"
                itemClassName="w-full px-8"
                renderItem={(child, _index, dragHandleProps) => (
                  <ChildGoalItem
                    goal={child}
                    onSplit={() => handleSplit(child.id, child.isSplit)}
                    onToggleComplete={() => toggleGoalCompletion(child.id)}
                    onUpdateTitle={(newTitle) => {
                      if (newTitle !== child.title) {
                        updateGoalTitle(child.id, newTitle);
                      }
                    }}
                    onDelete={() => deleteGoal(child.id)}
                    dragHandleProps={dragHandleProps}
                  />
                )}
              />
            )}

            {/* Add Child Goal */}
            {isAdding ? (
              <div className="mt-6 flex items-center w-full px-8">
                <div className="w-10 flex-shrink-0 flex items-center justify-end pr-1" />
                <div className="w-4 h-4 rounded-full border-[1.5px] border-stone-300 flex-shrink-0" />
                <input
                  type="text"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddChildGoal();
                    if (e.key === 'Escape') {
                      setIsAdding(false);
                      setNewGoalTitle('');
                    }
                  }}
                  onBlur={() => {
                    if (!newGoalTitle.trim()) {
                      setIsAdding(false);
                    } else {
                      handleAddChildGoal();
                    }
                  }}
                  placeholder="输入子目标名称..."
                  className="ml-3 flex-1 bg-transparent border-none outline-none text-sm text-stone-700 placeholder-stone-400 min-w-0"
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={() => setIsAdding(true)}
                className="mt-6 flex items-center w-full px-8 text-stone-400 hover:text-stone-600 transition-all duration-200 text-sm group"
              >
                <div className="w-10 flex-shrink-0 flex items-center justify-end pr-1">
                  <div className="w-4 h-4 rounded-full border border-stone-300 flex items-center justify-center group-hover:border-stone-400 group-hover:bg-stone-100 transition-all duration-200">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
                <span className="ml-3">添加子目标</span>
              </button>
            )}
          </>
        </div>
      ) : (
        /* 时间统计视图 - 无 padding，占满空间 */
        <div className="flex-1 overflow-hidden relative">
          <TimelineContainer />
        </div>
      )}

      {/* Date Picker Modal */}
      <DatePicker
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        startDate={selectedGoal.startDate}
        endDate={selectedGoal.endDate}
        showDeadline={selectedGoal.showDeadline}
        onSave={(start, end, show) => {
          if (selectedGoalId) {
            updateGoalDates(selectedGoalId, start, end);
            if (show !== selectedGoal.showDeadline) {
              toggleShowDeadline(selectedGoalId);
            }
          }
        }}
      />

      {/* Chat Popover */}
      <ChatPopover
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        goalId={selectedGoalId}
        goalTitle={selectedGoal.title}
      />

      {/* 视图切换悬浮按钮 - fixed 定位，带红色调试边框 */}
      <button
        onClick={() => setViewMode(viewMode === 'goals' ? 'time' : 'goals')}
        className="fixed w-12 h-12 bg-stone-800 hover:bg-stone-700 text-white rounded-full shadow-lg shadow-stone-300/50 hover:shadow-xl hover:shadow-stone-300/50 transition-all duration-200 flex items-center justify-center hover:scale-105"
        style={{ 
          bottom: '40px', 
          right: '40px', 
          zIndex: 99999,
          border: '2px solid red' // 调试边框
        }}
        title={viewMode === 'goals' ? '查看时间统计' : '返回子目标管理'}
      >
        {viewMode === 'goals' ? (
          // 日历图标 - 切换到时间统计视图
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ) : (
          // 列表图标 - 切换回子目标管理视图
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )}
      </button>
    </div>
  );
}

interface ChildGoalItemProps {
  goal: { id: string; title: string; isSplit: boolean; isCompleted: boolean };
  onSplit: () => void;
  onToggleComplete: () => void;
  onUpdateTitle: (newTitle: string) => void;
  onDelete?: () => void;
  dragHandleProps: DragHandleProps;
  depth?: number;
}

function ChildGoalItem({
  goal,
  onSplit,
  onToggleComplete,
  onUpdateTitle,
  onDelete,
  dragHandleProps,
  depth = 0,
}: ChildGoalItemProps) {
  const { getDeadlineStatus, getChildGoals, addGoal, selectGoal, splitGoal, deleteGoal, updateGoalTitle, toggleGoalCompletion } = useGoalStore();
  const { toggleFocus, isGoalFocused, showBubble, setOnTimerComplete } = useTimer();
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const inputRef = useRef<HTMLInputElement>(null);
  const goalRowRef = useRef<HTMLDivElement>(null);
  const [bubblePosition, setBubblePosition] = useState({ top: 0, left: 0 });

  // 专注状态
  const isFocused = isGoalFocused(goal.id);

  // 获取截止日期状态
  const deadlineStatus = getDeadlineStatus(goal.id);

  // 格式化截止日期为角标文本
  const getBadgeText = () => {
    if (goal.isCompleted) return null;
    if (!deadlineStatus) return null;
    const match = deadlineStatus.text.match(/-?\d+/);
    if (!match) return null;
    const days = parseInt(match[0]);
    if (days < 0) return `!${Math.abs(days)}d`;
    return `${days}d`;
  };

  const badgeText = getBadgeText();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // 新创建的目标自动进入编辑模式
  useEffect(() => {
    if (goal.title === '新建目标') {
      setIsEditing(true);
      setEditTitle(goal.title);
    }
  }, [goal.id]); // 只在 goal.id 变化时触发（即新目标创建时）

  // 计算气泡位置 - 显示在子目标下方
  useEffect(() => {
    if (showBubble && isFocused && goalRowRef.current) {
      const rect = goalRowRef.current.getBoundingClientRect();
      // 气泡显示在子目标下方，水平居中对齐
      const bubbleWidth = 240; // 气泡宽度
      const left = rect.left + rect.width / 2 - bubbleWidth / 2;
      const top = rect.bottom + 8; // 子目标底部 + 间距
      setBubblePosition({
        top,
        left: Math.max(8, left), // 确保不超出左边界
      });
    }
  }, [showBubble, isFocused]);

  // 设置计时完成回调
  useEffect(() => {
    if (isFocused) {
      setOnTimerComplete(() => {
        console.log(`[Timer] Focus session completed for goal: ${goal.id}`);
      });
    }
    return () => {
      if (isFocused) {
        setOnTimerComplete(null);
      }
    };
  }, [isFocused, goal.id, setOnTimerComplete]);

  const handleRowClick = () => {
    if (!isFocused) {
      setIsEditing(true);
    }
  };

  const saveEdit = () => {
    if (editTitle.trim() && editTitle !== goal.title) {
      onUpdateTitle(editTitle);
    } else {
      setEditTitle(goal.title);
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditTitle(goal.title);
    setIsEditing(false);
  };

  // 处理专注按钮点击
  const handleFocusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFocus(goal.id);
  };

  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // 关闭右键菜单
  const handleCloseContextMenu = () => {
    setShowContextMenu(false);
  };

  // 处理添加子目标（原地展开）
  const handleAddChild = async () => {
    await addGoal('新建子目标', goal.id);
    setIsExpanded(true);
  };

  // 获取子目标
  const childGoals = getChildGoals(goal.id);
  const hasChildren = childGoals.length > 0;

  return (
    <>
      <div
        ref={goalRowRef}
        className={`
          group relative flex items-center w-full py-2.5 rounded-xl transition-all duration-200
          ${isFocused
            ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/20'
            : 'hover:bg-stone-100/60'
          }
        `}
        style={{ paddingLeft: `${depth * 20}px`, paddingRight: '12px' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onContextMenu={handleContextMenu}
        onDoubleClick={onSplit}
      >
        {/* 图标操作区 - 固定宽度 48px，紧贴左侧 */}
        <div className="w-12 flex-shrink-0 flex items-center justify-start gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {/* Drag Handle - 六点图标 */}
          {!isFocused && (
            <DragHandle
              onPointerDown={dragHandleProps.onPointerDown}
              isDragging={dragHandleProps.isDragging}
              className="text-stone-400 hover:text-stone-600"
            />
          )}
          {/* Add Child Icon - + 图标 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddChild();
            }}
            className="w-5 h-5 flex items-center justify-center rounded text-stone-400 hover:text-stone-600 hover:bg-stone-200/50 transition-colors duration-200"
            title="添加子目标"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Checkbox - 子目标勾选框缩小，与操作区紧邻 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          className={`w-4 h-4 rounded-full border-[1.5px] transition-all duration-200 flex-shrink-0 flex items-center justify-center ${
            goal.isCompleted
              ? isFocused ? 'bg-white/80 border-white/80' : 'bg-stone-400 border-stone-400'
              : isFocused
                ? 'border-white/50 hover:border-white'
                : 'border-stone-300 hover:border-stone-400 hover:bg-stone-50'
          }`}
        >
          {goal.isCompleted && (
            <svg className={`w-2.5 h-2.5 ${isFocused ? 'text-stone-900' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Title */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
            className="ml-3 flex-1 text-sm text-stone-700 bg-transparent border-none outline-none min-w-0"
          />
        ) : (
          <span
            className={`ml-3 flex-1 text-sm cursor-text text-left transition-colors duration-200 ${
              goal.isCompleted ? 'text-stone-400 line-through' : isFocused ? 'text-white' : 'text-stone-700'
            }`}
            onClick={handleRowClick}
          >
            {goal.title}
            {/* Deadline Badge - 紧跟在文字后方的红色角标 */}
            {badgeText && !isFocused && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-red-600 bg-red-100/80 flex-shrink-0 inline-block">
                {deadlineStatus?.text}
              </span>
            )}
          </span>
        )}

        {/* 专注计时器或专注按钮 */}
        {isFocused ? (
          <MiniTimer goalId={goal.id} />
        ) : (
          <button
            onClick={handleFocusClick}
            className={`
              w-7 h-7 flex items-center justify-center rounded-full
              transition-all duration-200 mr-1
              ${isHovered 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-75 pointer-events-none'
              }
              bg-stone-200 hover:bg-stone-300 text-stone-600 hover:text-stone-800
            `}
            title="开始专注"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
          </button>
        )}

      </div>

      {/* 气泡计时器 - 使用 Portal 方式定位 */}
      {showBubble && isFocused && (
        <div style={{ position: 'fixed', top: bubblePosition.top, left: bubblePosition.left, zIndex: 100 }}>
          <TimerBubble goalTitle={goal.title} anchorRef={goalRowRef} />
        </div>
      )}

      {/* 子目标列表 - 递归渲染 ChildGoalItem */}
      {(isExpanded || hasChildren) && (
        <div className="mt-1 space-y-1" style={{ paddingLeft: `${(depth + 1) * 20}px` }}>
          {childGoals.map((child) => (
            <ChildGoalItem
              key={child.id}
              goal={child}
              onSplit={() => {
                if (child.isSplit) {
                  selectGoal(child.id);
                } else {
                  splitGoal(child.id);
                }
              }}
              onToggleComplete={() => toggleGoalCompletion(child.id)}
              onUpdateTitle={(newTitle) => updateGoalTitle(child.id, newTitle)}
              onDelete={() => deleteGoal(child.id)}
              dragHandleProps={dragHandleProps}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {/* 右键菜单 */}
      {showContextMenu && (
        <>
          {/* 遮罩层 - 点击关闭菜单 */}
          <div
            className="fixed inset-0 z-40"
            onClick={handleCloseContextMenu}
          />
          {/* 菜单 */}
          <div
            className="fixed z-50 w-36 bg-white rounded-xl shadow-lg shadow-stone-200/50 border border-stone-200/80 py-1.5 overflow-hidden"
            style={{ top: contextMenuPos.y, left: contextMenuPos.x }}
          >
            <button
              onClick={() => {
                onSplit();
                handleCloseContextMenu();
              }}
              className="w-full px-3 py-2 text-left text-sm text-stone-600 hover:bg-stone-50 flex items-center gap-2.5 transition-colors duration-150"
            >
              <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              拆分
            </button>
            <div className="border-t border-stone-100 my-1" />
            <button
              onClick={() => {
                onDelete?.();
                handleCloseContextMenu();
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors duration-150"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              删除
            </button>
          </div>
        </>
      )}
    </>
  );
}
