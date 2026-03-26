import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initDatabase, db } from './db/schema.ts'

// 启动守卫组件
function BootstrapGuard() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    tryInitDatabase()
  }, [])

  async function tryInitDatabase() {
    setStatus('loading')
    setError('')
    
    try {
      // 如果数据库已经打开，先关闭它
      if (db.isOpen()) {
        db.close()
      }
      
      // 初始化数据库
      await initDatabase()
      setStatus('success')
    } catch (err) {
      console.error('[Bootstrap] 数据库初始化失败:', err)
      setError(err instanceof Error ? err.message : '未知错误')
      setStatus('error')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在连接数据库...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-red-700 mb-2">数据库启动失败</h1>
          <p className="text-red-600 mb-4">
            请检查系统权限或尝试重启应用
          </p>
          <p className="text-sm text-red-400 mb-6">
            错误信息: {error}
          </p>
          <button
            onClick={tryInitDatabase}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            重试连接
          </button>
        </div>
      </div>
    )
  }

  // 成功状态，渲染主应用
  return (
    <StrictMode>
      <App />
    </StrictMode>
  )
}

// 启动应用
const rootElement = document.getElementById('root')!
const root = createRoot(rootElement)
root.render(<BootstrapGuard />)
