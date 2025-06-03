import { createApp } from 'vue';
import App from './App.vue';
import './index.css';
const app = createApp(App)

/**
 * 样式表 统一
 */
import './assets/scss/main.scss'

/**
 * ElementPlus 组件库
 */
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.min.js'
import 'element-plus/dist/index.css'
app.use(ElementPlus, {
    locale: zhCn,
})

/**
 * ElementPlusIcons 图标
 */
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}

/**
 * svg 图标
 */
import importAllSVG from './assets/svg/importAllSVG' // svg 图标导出，全局引入
import cmpsvg from './components/svg.cmp.vue'// SVG 组件
app.component('cmpsvg', cmpsvg) // 注册 SVG 组件
app.config.globalProperties.svgIcon = importAllSVG // svg 图标导出挂载全局

/**
 * axios 请求
 */
const { VITE_BASE_URL } = import.meta.env;
import kakaAxios from './request/kaka-axios'
const request = kakaAxios(VITE_BASE_URL)
app.config.globalProperties.Request = request;

/**
 * CRUD 操作
 */
import CRUD from "./request/crud";
app.config.globalProperties.CRUD = CRUD;

/**
 * API 服务
 */
import API_Service from "kaka-api-service";
app.config.globalProperties.Service = API_Service;

/**
 * localStorage
 */
import kakaLocalStorage from "kaka-localstorage";
app.config.globalProperties.Storage = kakaLocalStorage;

/**
 * echarts 图表
 */
import * as echarts from 'echarts';
app.config.globalProperties.echarts = echarts;

/**
 * pinia 状态管理
 */
import { createPinia } from 'pinia'
const pinia = createPinia()
app.use(pinia)

/**
 * vue-router@4 路由
 */
import router from './router/router'
app.use(router)

app.config.errorHandler = (err, instance, info) => {
    console.error('应用错误:', err);
    // 可以添加错误报告或用户提示
};

app.mount('#app');

