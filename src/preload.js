// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 切换窗口置顶状态
  toggleAlwaysOnTop: (shouldBeOnTop) => ipcRenderer.invoke('toggle-always-on-top', shouldBeOnTop),
  
  // 获取窗口当前置顶状态
  getAlwaysOnTopStatus: () => ipcRenderer.invoke('get-always-on-top-status'),
  
  // 最小化窗口
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  
  // 关闭窗口
  closeWindow: () => ipcRenderer.invoke('close-window')
});
