export function LeftSidebar() {
  return (
    <div className="w-[220px] h-full bg-[#fafaf9] border-r border-stone-200/60 flex flex-col">
      {/* Top Bar - 为 macOS 红绿灯按钮留出空间 */}
      <div className="h-10 flex items-center px-4" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5">
        <NavItem icon="timeline" label="时间线" />
        <NavItem icon="draft" label="草稿箱" />
        <NavItem icon="all" label="全部目标" />
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-stone-200/50">
        <button className="w-full flex items-center gap-2 px-3 py-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100/60 rounded-lg transition-all duration-200 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          搜索
          <span className="ml-auto text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">⌘K</span>
        </button>
      </div>
    </div>
  );
}

function NavItem({ icon, label, hasSubmenu }: { icon: string; label: string; hasSubmenu?: boolean }) {
  const icons: Record<string, JSX.Element> = {
    timeline: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    draft: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    all: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  };

  return (
    <button className="w-full flex items-center gap-3 px-3 py-2 text-stone-600 hover:bg-stone-100/60 hover:text-stone-800 rounded-lg transition-all duration-200 text-sm group">
      <span className="text-stone-400 group-hover:text-stone-600 transition-colors duration-200">{icons[icon]}</span>
      <span className="flex-1 text-left">{label}</span>
      {hasSubmenu && (
        <svg className="w-3 h-3 text-stone-300 group-hover:text-stone-400 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
}
