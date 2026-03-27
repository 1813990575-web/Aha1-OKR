import { useState, useEffect } from 'react';

// 声明 electron API 类型
declare global {
  interface Window {
    electron?: {
      send: (channel: string, ...args: unknown[]) => void;
      receive: (channel: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [version, setVersion] = useState('v1.0.4');
  const [hasUpdate, setHasUpdate] = useState(false);
  const [updateVersion, setUpdateVersion] = useState('');

  useEffect(() => {
    // 获取当前版本号
    if (window.electron) {
      // 请求版本号
      window.electron.send('get-version');
      
      // 监听版本号返回
      window.electron.receive('app-version', (...args: any[]) => {
        const v = args[0] as string;
        setVersion(`v${v}`);
      });

      // 监听更新可用事件
      window.electron.receive('update-available', (...args: any[]) => {
        const info = args[0] as { version: string };
        setHasUpdate(true);
        setUpdateVersion(info.version);
      });

      // 监听更新下载完成
      window.electron.receive('update-downloaded', () => {
        // 更新下载完成后，标签文字可以改变
      });
    }
  }, []);

  const handleMinimize = () => {
    if (window.electron) {
      window.electron.send('window-minimize');
    }
  };

  const handleMaximize = () => {
    if (window.electron) {
      window.electron.send('window-maximize');
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if (window.electron) {
      window.electron.send('window-close');
    }
  };

  const handleVersionClick = () => {
    if (window.electron) {
      if (hasUpdate) {
        // 有更新时，触发安装
        window.electron.send('quit-and-install');
      } else {
        // 无更新时，手动检查更新
        window.electron.send('check-for-updates');
      }
    }
  };

  return (
    <div 
      className="h-10 bg-stone-100/80 backdrop-blur-xl border-b border-stone-200/50 flex items-center justify-between px-4 select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left: Traffic Lights */}
      <div 
        className="flex items-center gap-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleClose}
          className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center group"
          title="关闭"
        >
          <svg 
            className="w-2 h-2 text-red-800 opacity-0 group-hover:opacity-100 transition-opacity" 
            fill="currentColor" 
            viewBox="0 0 8 8"
          >
            <path d="M1.5 1.5l5 5M6.5 1.5l-5 5" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        <button
          onClick={handleMinimize}
          className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors flex items-center justify-center group"
          title="最小化"
        >
          <svg 
            className="w-2 h-2 text-yellow-800 opacity-0 group-hover:opacity-100 transition-opacity" 
            fill="currentColor" 
            viewBox="0 0 8 8"
          >
            <path d="M1 4h6" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center group"
          title="最大化"
        >
          <svg 
            className="w-2 h-2 text-green-800 opacity-0 group-hover:opacity-100 transition-opacity" 
            fill="currentColor" 
            viewBox="0 0 8 8"
          >
            <path d={isMaximized ? "M1 3h4v4H1z M3 1h4v4H3z" : "M1 1h6v6H1z"} stroke="currentColor" strokeWidth="1" fill="none" />
          </svg>
        </button>

        {/* Version Label with Update Indicator */}
        <div 
          className="ml-3 flex items-center gap-2"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={handleVersionClick}
            className={`
              px-2 py-0.5 rounded-md text-xs font-medium transition-all duration-200
              ${hasUpdate 
                ? 'bg-stone-800/90 text-white hover:bg-stone-700 shadow-sm' 
                : 'bg-stone-200/60 text-stone-600 hover:bg-stone-300/80'
              }
            `}
            title={hasUpdate ? `点击安装 v${updateVersion}` : '点击检查更新'}
          >
            <span className="flex items-center gap-1.5">
              {version}
              {hasUpdate && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-stone-200">有新版本</span>
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Center: Title (draggable area) */}
      <div className="flex-1 text-center">
        <span className="text-sm text-stone-500 font-medium">Aha OKR</span>
      </div>

      {/* Right: Empty space for balance */}
      <div className="w-16" />
    </div>
  );
}
