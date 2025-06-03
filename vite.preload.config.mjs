import { defineConfig } from 'vite';
import path from 'path';

// Electron预加载脚本的Vite配置
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // 预加载脚本不需要Vue插件
});
