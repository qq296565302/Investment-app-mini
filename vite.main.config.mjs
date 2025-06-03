import { defineConfig } from 'vite';
import path from 'path';

// Electron主进程的Vite配置
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // 主进程不需要Vue插件
});
