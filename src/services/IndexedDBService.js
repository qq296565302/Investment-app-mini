/**
 * IndexedDB 服务
 * 提供统一的数据库操作接口，简化组件中的数据库操作
 */
import { openDB, saveData, getAllData, clearStore, closeDB } from '@/utils/indexedDBHelper';

// 数据库配置
const DB_NAME = 'KakaDB';
const DB_VERSION = 2;

// 对象存储名称常量
const STORE = {
  SINA_NEWS: 'sina7x24News',
  CLS_NEWS: 'clsNews'
};

// 单例模式实现
let instance = null;

class IndexedDBService {
  /**
   * 构造函数
   */
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  /**
   * 获取单例实例
   * @returns {IndexedDBService} 单例实例
   */
  static getInstance() {
    if (!instance) {
      instance = new IndexedDBService();
    }
    return instance;
  }

  /**
   * 初始化数据库
   * @returns {Promise<boolean>} 是否初始化成功
   */
  async init() {
    if (this.initialized && this.db) {
      return true;
    }

    try {
      // 关闭可能存在的连接
      if (this.db) {
        this.closeConnection();
      }

      // 打开数据库连接
      this.db = await openDB(DB_NAME, DB_VERSION, this._upgradeDatabase);
      this.initialized = true;
      console.log('IndexedDB 服务初始化成功');
      return true;
    } catch (error) {
      console.error('IndexedDB 服务初始化失败:', error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * 数据库升级处理函数
   * @param {IDBDatabase} db - 数据库对象
   * @param {IDBVersionChangeEvent} event - 版本变更事件
   * @private
   */
  _upgradeDatabase = (db, event) => {
    console.log(`数据库升级事件触发，旧版本: ${event.oldVersion}, 新版本: ${event.newVersion}`);
    
    // 处理数据库升级逻辑
    // 注意：switch语句没有break是有意的，允许版本跨越升级
    switch (event.oldVersion) {
      case 0: // 新建数据库
        // 创建新浪7x24新闻存储
        if (!db.objectStoreNames.contains(STORE.SINA_NEWS)) {
          const sinaStore = db.createObjectStore(STORE.SINA_NEWS, { keyPath: '时间' });
          sinaStore.createIndex('time_idx', '时间', { unique: false });
          console.log(`创建对象存储 ${STORE.SINA_NEWS} 成功`);
        }
        // 没有break是有意的，继续执行下一个版本的升级
      case 1: // 从版本1升级到版本2
        // 创建财联社新闻存储
        if (!db.objectStoreNames.contains(STORE.CLS_NEWS)) {
          const clsStore = db.createObjectStore(STORE.CLS_NEWS, { keyPath: '发布时间' });
          clsStore.createIndex('time_idx', '发布时间', { unique: false });
          console.log(`创建对象存储 ${STORE.CLS_NEWS} 成功`);
        }
        break;
      // 如果需要更高版本，可以在这里添加更多的case
    }
  }

  /**
   * 关闭数据库连接
   */
  closeConnection() {
    if (this.db) {
      closeDB(this.db);
      this.db = null;
      this.initialized = false;
      console.log('IndexedDB 连接已关闭');
    }
  }

  /**
   * 数据净化，移除无法序列化的内容
   * @param {Array} data - 要净化的数据
   * @param {Object} options - 配置选项
   * @param {string} options.timeKey - 时间字段名称
   * @param {string} options.contentKey - 内容字段名称
   * @returns {Array} 净化后的数据
   */
  sanitizeData(data, { timeKey = '时间', contentKey = '内容' } = {}) {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map(item => {
      // 创建一个新对象，只包含需要的字段
      const sanitizedItem = {};
      
      // 确保关键字段存在
      if (item[timeKey]) sanitizedItem[timeKey] = item[timeKey];
      if (item[contentKey]) sanitizedItem[contentKey] = item[contentKey];
      
      // 复制其他可能有用的字段，但过滤掉函数和复杂对象
      for (const key in item) {
        if (key !== timeKey && key !== contentKey) {
          const value = item[key];
          // 只保留原始类型和简单对象
          if (value === null || 
              typeof value === 'string' || 
              typeof value === 'number' || 
              typeof value === 'boolean' ||
              (typeof value === 'object' && !Array.isArray(value) && value !== null && Object.keys(value).length < 5)) {
            sanitizedItem[key] = value;
          }
        }
      }
      return sanitizedItem;
    });
  }

  /**
   * 保存数据到指定的存储
   * @param {string} storeName - 存储名称
   * @param {Array} data - 要保存的数据
   * @param {Object} options - 配置选项
   * @returns {Promise<boolean>} 是否保存成功
   */
  async saveData(storeName, data, options = {}) {
    // 确保数据库已初始化
    if (!this.initialized) {
      await this.init();
    }

    if (!this.db) {
      console.warn('IndexedDB 未初始化，无法保存数据');
      return false;
    }

    try {
      // 检查对象存储是否存在
      if (!this.db.objectStoreNames.contains(storeName)) {
        console.warn(`对象存储 ${storeName} 不存在，需要重新初始化数据库`);
        this.closeConnection();
        await this.init();
        
        if (!this.db || !this.db.objectStoreNames.contains(storeName)) {
          return false;
        }
      }

      // 数据净化
      const sanitizedData = this.sanitizeData(data, options);
      
      // 保存处理过的数据
      await saveData(this.db, storeName, sanitizedData);
      console.log(`成功将 ${sanitizedData.length} 条数据保存到 ${storeName}`);
      return true;
    } catch (error) {
      console.error(`保存数据到 ${storeName} 失败:`, error);
      return false;
    }
  }

  /**
   * 从指定的存储加载数据
   * @param {string} storeName - 存储名称
   * @returns {Promise<Array>} 加载的数据
   */
  async loadData(storeName) {
    // 确保数据库已初始化
    if (!this.initialized) {
      await this.init();
    }

    if (!this.db) {
      console.warn('IndexedDB 未初始化，无法加载数据');
      return [];
    }

    try {
      // 检查对象存储是否存在
      if (!this.db.objectStoreNames.contains(storeName)) {
        console.warn(`对象存储 ${storeName} 不存在，需要重新初始化数据库`);
        this.closeConnection();
        await this.init();
        
        if (!this.db || !this.db.objectStoreNames.contains(storeName)) {
          return [];
        }
      }

      const data = await getAllData(this.db, storeName);
      console.log(`从 ${storeName} 加载了 ${data.length} 条数据`);
      return data;
    } catch (error) {
      console.error(`从 ${storeName} 加载数据失败:`, error);
      // 尝试重新初始化数据库
      this.closeConnection();
      await this.init();
      return [];
    }
  }

  /**
   * 清理指定时间前的数据
   * @param {Array} data - 要清理的数据
   * @param {number} days - 保留的天数
   * @param {string} timeKey - 时间字段名称
   * @returns {Array} 清理后的数据
   */
  filterOldData(data, days = 3, timeKey = '时间') {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return data.filter(item => {
      const itemDate = new Date(item[timeKey]);
      return itemDate >= cutoffDate;
    });
  }

  /**
   * 获取存储名称常量
   * @returns {Object} 存储名称常量
   */
  getStoreNames() {
    return STORE;
  }
}

export default IndexedDBService;
