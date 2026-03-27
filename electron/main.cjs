const { app, BrowserWindow, session, ipcMain, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

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

// 配置 electron-log
log.transports.file.level = 'info';
log.transports.console.level = 'debug';
autoUpdater.logger = log;

// 保持窗口对象的全局引用，防止被垃圾回收
let mainWindow = null;

// 自动更新相关变量
let updateDownloaded = false;
let updateAvailable = false;

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
    log.info('[AutoUpdater] 开发模式，跳过自动更新检查');
    return;
  }

  // 设置自动更新配置
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;

  log.info('[AutoUpdater] 自动更新已配置');
  log.info('[AutoUpdater] 当前版本:', app.getVersion());

  // 检查更新时发生错误
  autoUpdater.on('error', (error) => {
    log.error('[AutoUpdater] 更新错误:', error);
  });

  // 正在检查更新
  autoUpdater.on('checking-for-update', () => {
    log.info('[AutoUpdater] 正在检查更新...');
  });

  // 发现新版本 - 立即弹窗提示用户
  autoUpdater.on('update-available', (info) => {
    log.info('[AutoUpdater] 发现新版本:', info.version);
    updateAvailable = true;
    
    // 立即弹窗提示用户有新版本正在下载
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '发现新版本',
      message: `检测到新版本 v${info.version}，正在后台下载...`,
      detail: '下载完成后将提示您安装更新。请保持应用运行。',
      buttons: ['知道了'],
      defaultId: 0,
    });

    // 向渲染进程发送更新可用事件
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
    }
  });

  // 当前已是最新版本
  autoUpdater.on('update-not-available', (info) => {
    log.info('[AutoUpdater] 当前已是最新版本:', app.getVersion());
  });

  // 下载进度
  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent);
    const transferred = (progressObj.transferred / 1024 / 1024).toFixed(2);
    const total = (progressObj.total / 1024 / 1024).toFixed(2);
    log.info(`[AutoUpdater] 下载进度: ${percent}% (${transferred}MB / ${total}MB)`);
    
    if (mainWindow) {
      mainWindow.webContents.send('download-progress', progressObj);
    }
  });

  // 更新下载完成 - 立即弹窗询问是否重启
  autoUpdater.on('update-downloaded', (info) => {
    log.info('[AutoUpdater] 更新下载完成:', info.version);
    updateDownloaded = true;
    
    // 向渲染进程发送更新下载完成事件
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
    }

    // 弹出对话框询问用户是否立即重启安装
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: '更新已准备就绪',
      message: `Aha1-OKR v${info.version} 已下载完成`,
      detail: '更新已准备就绪，是否立即重启应用以安装新版本？',
      buttons: ['立即重启', '稍后'],
      defaultId: 0,
      cancelId: 1,
    }).then((result) => {
      if (result.response === 0) {
        // 用户选择立即重启
        log.info('[AutoUpdater] 用户选择立即重启安装更新');
        autoUpdater.quitAndInstall(false, true);
      } else {
        log.info('[AutoUpdater] 用户选择稍后安装更新');
      }
    });
  });

  // IPC 监听：用户从 UI 触发检查更新
  ipcMain.handle('check-for-updates', async () => {
    try {
      log.info('[AutoUpdater] 手动触发检查更新');
      await autoUpdater.checkForUpdates();
      return { success: true };
    } catch (error) {
      log.error('[AutoUpdater] 手动检查更新失败:', error);
      return { success: false, error: error.message };
    }
  });

  // IPC 监听：用户从 UI 触发立即安装
  ipcMain.handle('quit-and-install', () => {
    if (updateDownloaded) {
      log.info('[AutoUpdater] 用户通过 UI 触发立即安装');
      autoUpdater.quitAndInstall(false, true);
    }
  });
}

// 启动时检查更新
async function checkForUpdatesOnStartup() {
  try {
    // 延迟 5 秒后检查更新，避免影响应用启动速度
    setTimeout(async () => {
      log.info('[AutoUpdater] 启动检查更新...');
      log.info('[AutoUpdater] 检查地址: https://github.com/1813990575-web/Aha1-OKR/releases');
      
      try {
        const result = await autoUpdater.checkForUpdatesAndNotify();
        if (result) {
          log.info('[AutoUpdater] 检查更新结果:', result.updateInfo ? '有新版本' : '无更新');
        }
      } catch (checkError) {
        log.error('[AutoUpdater] 检查更新时出错:', checkError);
      }
    }, 5000);
  } catch (error) {
    log.error('[AutoUpdater] 启动检查更新失败:', error);
  }
}

// Electron 初始化完成
app.whenReady().then(() => {
  // 直接创建窗口，保留 IndexedDB 数据
  createWindow();
  
  // 设置自动更新
  setupAutoUpdater();
  
  // 启动时检查更新
  checkForUpdatesOnStartup();

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
