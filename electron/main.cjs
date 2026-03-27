const { app, BrowserWindow, session, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// 在应用启动前禁用沙盒
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-setuid-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');

// 设置唯一的数据存储路径，避免冲突
const userDataPath = path.join(app.getPath('appData'), 'aha-okr-1.3');
app.setPath('userData', userDataPath);
console.log('[Electron] User data path:', userDataPath);

// 保持窗口对象的全局引用，防止被垃圾回收
let mainWindow = null;

// 自动更新相关变量
let updateDownloaded = false;

// 判断是否为开发环境
const isDev = !app.isPackaged;

function createWindow() {
  // 创建浏览器窗口 - 使用 macOS 原生标题栏
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      sandbox: false,
    },
    // 使用 macOS 原生标题栏，但隐藏标题文字
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    transparent: true,
    backgroundColor: '#00000000',
    show: false, // 先不显示，等加载完成后再显示
  });

  // 加载应用
  console.log('[Electron] isDev:', isDev);
  console.log('[Electron] __dirname:', __dirname);
  
  if (isDev) {
    // 开发环境：加载 Vite 开发服务器
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    console.log('[Electron] Loading dev URL:', devServerUrl);
    
    setTimeout(() => {
      mainWindow.loadURL(devServerUrl);
      mainWindow.webContents.openDevTools();
    }, 1000);
  } else {
    // 生产环境：加载打包后的 index.html
    // 使用 app.getAppPath() 获取应用根目录
    const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
    console.log('[Electron] Loading production build from:', indexPath);
    
    // 检查文件是否存在（调试用）
    const fs = require('fs');
    if (fs.existsSync(indexPath)) {
      console.log('[Electron] index.html exists');
    } else {
      console.error('[Electron] index.html NOT found at:', indexPath);
      // 尝试备用路径
      const altPath = path.join(__dirname, '..', 'dist', 'index.html');
      console.log('[Electron] Trying alternative path:', altPath);
      if (fs.existsSync(altPath)) {
        console.log('[Electron] index.html found at alternative path');
        mainWindow.loadFile(altPath);
      } else {
        console.error('[Electron] index.html not found at alternative path either');
      }
    }
    
    mainWindow.loadFile(indexPath);
  }

  // 窗口加载完成后显示
  mainWindow.once('ready-to-show', () => {
    console.log('[Electron] Window ready to show');
    mainWindow.show();
  });

  // 监听加载失败
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[Electron] Failed to load:', errorCode, errorDescription);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 配置自动更新
function setupAutoUpdater() {
  // 开发环境下不检查更新（除非强制设置）
  if (isDev && !process.env.FORCE_AUTO_UPDATE) {
    console.log('[AutoUpdater] 开发模式，跳过自动更新检查');
    return;
  }

  // 设置更新日志
  autoUpdater.logger = console;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;

  // 检查更新时发生错误
  autoUpdater.on('error', (error) => {
    console.error('[AutoUpdater] 更新错误:', error);
  });

  // 正在检查更新
  autoUpdater.on('checking-for-update', () => {
    console.log('[AutoUpdater] 正在检查更新...');
  });

  // 发现新版本
  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] 发现新版本:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
    }
  });

  // 当前已是最新版本
  autoUpdater.on('update-not-available', (info) => {
    console.log('[AutoUpdater] 当前已是最新版本');
  });

  // 下载进度
  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent);
    console.log(`[AutoUpdater] 下载进度: ${percent}%`);
    if (mainWindow) {
      mainWindow.webContents.send('download-progress', progressObj);
    }
  });

  // 更新下载完成
  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] 更新下载完成:', info.version);
    updateDownloaded = true;
    
    // 向渲染进程发送更新下载完成事件
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
    }

    // 弹出对话框询问用户是否立即重启安装
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '新版本已就绪',
      message: `Aha1-OKR ${info.version} 已下载完成`,
      detail: '新版本已经准备好安装。您希望立即重启应用以完成更新吗？',
      buttons: ['立即重启', '稍后手动重启'],
      defaultId: 0,
      cancelId: 1,
    }).then((result) => {
      if (result.response === 0) {
        // 用户选择立即重启
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  // IPC 监听：用户从 UI 触发检查更新
  ipcMain.handle('check-for-updates', async () => {
    try {
      await autoUpdater.checkForUpdates();
      return { success: true };
    } catch (error) {
      console.error('[AutoUpdater] 手动检查更新失败:', error);
      return { success: false, error: error.message };
    }
  });

  // IPC 监听：用户从 UI 触发立即安装
  ipcMain.handle('quit-and-install', () => {
    if (updateDownloaded) {
      autoUpdater.quitAndInstall(false, true);
    }
  });
}

// 启动时检查更新
async function checkForUpdatesOnStartup() {
  try {
    // 延迟 3 秒后检查更新，避免影响应用启动速度
    setTimeout(async () => {
      console.log('[AutoUpdater] 启动检查更新...');
      await autoUpdater.checkForUpdatesAndNotify();
    }, 3000);
  } catch (error) {
    console.error('[AutoUpdater] 启动检查更新失败:', error);
  }
}

// Electron 初始化完成
app.whenReady().then(() => {
  // 清除存储配额限制
  session.defaultSession.clearStorageData({
    storages: ['cookies', 'filesystem', 'indexdb', 'localstorage', 'shadercache', 'websql', 'serviceworkers', 'cachestorage']
  }).then(() => {
    console.log('[Electron] Storage data cleared');
    createWindow();
    
    // 设置自动更新
    setupAutoUpdater();
    
    // 启动时检查更新
    checkForUpdatesOnStartup();
  }).catch((err) => {
    console.error('[Electron] Failed to clear storage:', err);
    createWindow();
    setupAutoUpdater();
    checkForUpdatesOnStartup();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
