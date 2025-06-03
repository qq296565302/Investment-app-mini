import { defineConfig, loadEnv } from "vite";
import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * 创建基础Vite配置
 * @param {Object} options - 配置选项
 * @param {string} options.mode - 环境模式
 * @param {string} options.root - 项目根目录
 * @param {Object} options.customConfig - 自定义配置，将与基础配置合并
 * @returns {import('vite').UserConfig}
 */
export function createBaseConfig(options = {}) {
  const { 
    mode = 'development', 
    root = process.cwd(),
    customConfig = {}
  } = options;
  
  // 加载环境变量
  const env = loadEnv(mode, root, "");
  
  // 基础配置
  const baseConfig = {
    base: './', // 设置相对路径，确保资源正确加载
    plugins: [
      vue(),
      AutoImport({
        imports: ["vue", "vue-router", "pinia"],
      }),
    ],
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
        "stores": resolve(__dirname, "./src/stores"),
        "utils": resolve(__dirname, "./src/utils"),
      },
    },
    css: {
      postcss: {
        plugins: [],
      },
      preprocessorOptions: {
        scss: {
          api: "modern-compiler",
        },
      },
    },
    server: {
      port: 8769,
      proxy: env.VITE_BASE_SERVICE ? {
        "/api": {
          target: env.VITE_BASE_SERVICE,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      } : {},
    },
  };

  // 深度合并自定义配置
  return defineConfig(mergeConfig(baseConfig, customConfig));
}

/**
 * 深度合并配置对象
 * @param {Object} baseConfig - 基础配置
 * @param {Object} customConfig - 自定义配置
 * @returns {Object} - 合并后的配置
 */
function mergeConfig(baseConfig, customConfig) {
  const merged = { ...baseConfig };
  
  for (const key in customConfig) {
    // 如果是对象且不是数组，则递归合并
    if (typeof customConfig[key] === 'object' && 
        !Array.isArray(customConfig[key]) && 
        typeof baseConfig[key] === 'object' && 
        !Array.isArray(baseConfig[key])) {
      merged[key] = mergeConfig(baseConfig[key] || {}, customConfig[key]);
    } else {
      // 直接替换或添加
      merged[key] = customConfig[key];
    }
  }
  
  return merged;
}

/**
 * 向后兼容的默认导出
 * @param {Object} options - 配置选项
 * @returns {import('vite').UserConfig}
 */
export default ({ mode }) => {
  return createBaseConfig({ mode });
};
