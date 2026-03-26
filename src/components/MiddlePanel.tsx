import { useState, useRef, useEffect } from 'react';
import { useGoalStore } from '../store/goalStore';

interface MiddlePanelProps {
  width: number;
}

// 层级缩进配置
const DEPTH_INDENT = [0, 16, 40, 64]; // depth 0, 1, 2, 3 的缩进值

export function MiddlePanel({ width }: MiddlePanelProps) {
  const { selectedGoalId, selectGoal, getSplitGoals, toggleGoalCompletion, getDeadlineStatus, addGoal, deleteGoal } = useGoalStore();

  // 获取所有被拆分的目标
  const splitGoals = getSplitGoals();

  // 如果没有被拆分的目标，中间面板为空
  if (splitGoals.length === 0) {
    return null;
  }

  // 找到根级别的被拆分目标（parentId 为 null 且 isSplit 为 true）
  const rootSplitGoals = splitGoals.filter(g => g.parentId === null);

  const handleNewGoal = async () => {
    const goalId = await addGoal('新目标');
    selectGoal(goalId);
  };

  return (
    <div
      className="h-full bg-stone-50/50 border-r border-stone-200/60 flex flex-col flex-shrink-0 relative"
      style={{ width }}
    >
      {/* Top Bar - 独立的上方面板，用于拖拽应用 */}
      <div className="h-10 bg-stone-50/80 flex items-center px-4 flex-shrink-0" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto py-2">
        {rootSplitGoals.map(goal => (
          <GoalTreeNode
            key={goal.id}
            goal={goal}
            selectedGoalId={selectedGoalId}
            onSelect={selectGoal}
            onToggleComplete={toggleGoalCompletion}
            getDeadlineStatus={getDeadlineStatus}
            deleteGoal={deleteGoal}
            depth={0}
          />
        ))}
      </div>

      {/* Floating Add Button - 右下角悬浮按钮 */}
      <button
        onClick={handleNewGoal}
        className="absolute bottom-6 right-6 w-12 h-12 bg-stone-800 hover:bg-stone-700 text-white rounded-full shadow-lg shadow-stone-300/50 hover:shadow-xl hover:shadow-stone-300/50 transition-all duration-200 flex items-center justify-center hover:scale-105"
        title="新目标"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}

interface GoalTreeNodeProps {
  goal: { id: string; title: string; parentId: string | null; isSplit: boolean; isCompleted: boolean };
  selectedGoalId: string | null;
  onSelect: (goalId: string) => void;
  onToggleComplete: (goalId: string) => void;
  getDeadlineStatus: (goalId: string) => { text: string; isOverdue: boolean } | null;
  deleteGoal: (goalId: string) => void;
  depth: number;
}

function GoalTreeNode({ goal, selectedGoalId, onSelect, onToggleComplete, getDeadlineStatus, deleteGoal, depth }: GoalTreeNodeProps) {
  const { getChildGoals } = useGoalStore();
  const childGoals = getChildGoals(goal.id);
  const isSelected = selectedGoalId === goal.id;
  const deadlineStatus = getDeadlineStatus(goal.id);

  // 本地状态：控制展开/折叠
  const [isExpanded, setIsExpanded] = useState(true);
  
  // 右键菜单状态
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // 是否有子目标
  const hasChildren = childGoals.length > 0;

  // 切换展开/折叠状态
  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // 切换完成状态
  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleComplete(goal.id);
  };

  // 处理右键点击
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // 处理删除
  const handleDelete = () => {
    deleteGoal(goal.id);
    setShowContextMenu(false);
  };

  // 点击外部关闭右键菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
    };
    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showContextMenu]);

  // 根据层级获取缩进值
  const indent = DEPTH_INDENT[Math.min(depth, DEPTH_INDENT.length - 1)];

  // 父级（有子项）使用稍大的勾选框，子级使用小勾选框
  const isParent = hasChildren;
  const finalCheckboxSize = isParent ? 'w-[18px] h-[18px]' : 'w-3.5 h-3.5';
  const finalCheckIconSize = isParent ? 'w-3 h-3' : 'w-2 h-2';

  return (
    <div>
      {/* 当前节点行 */}
      <div
        className={`flex items-center gap-1.5 px-3 py-2.5 text-left transition-all duration-200 cursor-pointer rounded-lg mx-2 ${
          isSelected
            ? 'bg-stone-800 text-white'
            : 'text-stone-700 hover:bg-stone-100/50'
        }`}
        style={{ marginLeft: `${8 + indent}px` }}
        onClick={() => onSelect(goal.id)}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/Collapse indicator - 父级显示，子级占位 */}
        {hasChildren ? (
          <button
            onClick={toggleExpand}
            className={`w-4 h-4 flex items-center justify-center rounded transition-colors duration-200 ${
              isSelected ? 'text-white/70 hover:text-white' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ) : (
          <span className="w-4" />
        )}

        {/* Checkbox - 根据层级调整大小 */}
        <button
          onClick={handleToggleComplete}
          className={`${finalCheckboxSize} rounded-full border-2 transition-all duration-200 flex-shrink-0 flex items-center justify-center ${
            goal.isCompleted
              ? 'bg-white/80 border-white/80'
              : isSelected
                ? 'border-white/50 hover:border-white'
                : 'border-stone-300 hover:border-stone-400 hover:bg-stone-50'
          }`}
        >
          {goal.isCompleted && (
            <svg className={`${finalCheckIconSize} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Goal title */}
        <span className={`text-sm truncate flex-1 ${isSelected ? 'font-medium' : ''} ${goal.isCompleted ? 'text-stone-400 line-through' : ''}`}>
          {goal.title}
        </span>

        {/* Deadline Badge - 右上角角标 */}
        {deadlineStatus && !goal.isCompleted && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white shadow-sm flex-shrink-0">
            {(() => {
              const match = deadlineStatus.text.match(/-?\d+/);
              if (!match) return null;
              const days = parseInt(match[0]);
              if (days < 0) return `!${Math.abs(days)}d`;
              return `${days}d`;
            })()}
          </span>
        )}
      </div>

      {/* 右键菜单 */}
      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white rounded-lg shadow-lg shadow-stone-200/50 border border-stone-200/80 py-1 min-w-[120px]"
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
        >
          <button
            onClick={handleDelete}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            删除
          </button>
        </div>
      )}

      {/* Render children if expanded */}
      {isExpanded && hasChildren && childGoals.map(child => (
        <GoalTreeNode
          key={child.id}
          goal={child}
          selectedGoalId={selectedGoalId}
          onSelect={onSelect}
          onToggleComplete={onToggleComplete}
          getDeadlineStatus={getDeadlineStatus}
          deleteGoal={deleteGoal}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
