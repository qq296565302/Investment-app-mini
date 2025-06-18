import { app, BrowserWindow, screen, ipcMain } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';

// 判断当前环境是开发环境还是生产环境
const isDevelopment = process.env.NODE_ENV !== 'production';

// 在开发环境中输出日志
if (isDevelopment) {
  console.log('[INFO] App running in development mode');
} else {
  console.log('[INFO] App running in production mode');
}

if (started) {
  app.quit();
}

// 禁用安全警告
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

// 存储主窗口的引用，以便在IPC通信中使用
let mainWindow = null;

const createWindow = () => {
  // 获取主显示器
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  // 根据环境设置不同的窗口配置
  const windowConfig = {
    width: 640,
    height: Math.round(height * 0.8), // 设置高度为显示器分辨率的80%
    frame: false,
    opacity: 1,
    resizable: isDevelopment, // 开发环境下允许调整窗口大小
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // 开发环境下可以启用更多调试功能
      devTools: isDevelopment,
      // 在开发环境下可以启用节点集成以方便调试
      nodeIntegration: isDevelopment,
      contextIsolation: true, // 确保上下文隔离始终启用，以便preload脚本正常工作
    },
  };
  
  // 创建窗口并保存引用
  mainWindow = new BrowserWindow(windowConfig);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // 在开发环境下自动打开开发者工具
  if (isDevelopment) {
    mainWindow.webContents.openDevTools();
  }
  
  return mainWindow;
};

// 添加错误处理
process.on('uncaughtException', (error) => {
  console.error('[ERROR] Uncaught exception:', error);
  if (!isDevelopment) {
    // 在生产环境中可以添加错误报告机制
    // 例如发送错误报告到服务器
  }
});

app.whenReady().then(() => {
  // 记录应用启动时间
  const startTime = new Date();
  console.log(`[INFO] App start time: ${startTime.toLocaleString()}`);
  
  // 创建窗口
  createWindow();
  
  // 设置IPC通信处理程序，用于控制窗口置顶状态
  ipcMain.handle('toggle-always-on-top', (event, shouldBeOnTop) => {
    if (mainWindow) {
      mainWindow.setAlwaysOnTop(shouldBeOnTop);
      return mainWindow.isAlwaysOnTop();
    }
    return false;
  });
  
  // 获取窗口当前置顶状态
  ipcMain.handle('get-always-on-top-status', () => {
    if (mainWindow) {
      return mainWindow.isAlwaysOnTop();
    }
    return false;
  });
  
  // 最小化窗口
  ipcMain.handle('minimize-window', () => {
    if (mainWindow) {
      mainWindow.minimize();
      return true;
    }
    return false;
  });
  
  // 关闭窗口
  ipcMain.handle('close-window', () => {
    if (mainWindow) {
      mainWindow.close();
      return true;
    }
    return false;
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  
  // 在开发环境下监听文件变化
  if (isDevelopment) {
    console.log('[INFO] Development mode: watching file changes');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
