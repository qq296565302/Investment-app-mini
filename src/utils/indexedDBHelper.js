/**
 * IndexedDB 辅助工具
 * 提供简单的接口用于存储和检索数据
 */

/**
 * 打开数据库连接
 * @param {string} dbName - 数据库名称
 * @param {number} version - 数据库版本
 * @param {Function} upgradeCallback - 数据库升级回调函数
 * @returns {Promise<IDBDatabase>} - 返回数据库连接
 */
export const openDB = (dbName, version, upgradeCallback) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);
    
    request.onerror = (event) => {
      console.error('打开数据库失败:', event.target.error);
      reject(event.target.error);
    };
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };
    
    // 数据库首次创建或版本升级时调用
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (upgradeCallback) {
        upgradeCallback(db, event);
      }
    };
  });
};

/**
 * 保存数据到指定的对象存储
 * @param {IDBDatabase} db - 数据库连接
 * @param {string} storeName - 对象存储名称
 * @param {Object} data - 要保存的数据
 * @param {string} keyPath - 主键路径，默认为'id'
 * @returns {Promise<any>} - 返回保存结果
 */
export const saveData = (db, storeName, data, keyPath = 'id') => {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // 如果数据是数组，则批量添加
      if (Array.isArray(data)) {
        // 使用事务确保原子性
        transaction.oncomplete = () => {
          resolve({ success: true, message: '数据批量保存成功' });
        };
        
        transaction.onerror = (event) => {
          console.error('保存数据失败:', event.target.error);
          reject(event.target.error);
        };
        
        // 批量添加数据
        data.forEach(item => {
          try {
            store.put(item);
          } catch (e) {
            console.error('添加单条数据失败:', e, item);
          }
        });
      } else {
        // 单条数据添加
        const request = store.put(data);
        
        request.onsuccess = (event) => {
          resolve({ success: true, key: event.target.result });
        };
        
        request.onerror = (event) => {
          console.error('保存数据失败:', event.target.error);
          reject(event.target.error);
        };
      }
    } catch (error) {
      console.error('保存数据时发生错误:', error);
      reject(error);
    }
  });
};

/**
 * 从对象存储中获取所有数据
 * @param {IDBDatabase} db - 数据库连接
 * @param {string} storeName - 对象存储名称
 * @returns {Promise<Array>} - 返回所有数据的数组
 */
export const getAllData = (db, storeName) => {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      
      request.onerror = (event) => {
        console.error('获取数据失败:', event.target.error);
        reject(event.target.error);
      };
    } catch (error) {
      console.error('获取数据时发生错误:', error);
      reject(error);
    }
  });
};

/**
 * 根据键获取单条数据
 * @param {IDBDatabase} db - 数据库连接
 * @param {string} storeName - 对象存储名称
 * @param {any} key - 要获取的数据的键
 * @returns {Promise<Object>} - 返回获取的数据
 */
export const getDataByKey = (db, storeName, key) => {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = (event) => {
        resolve(event.target.result);
      };
      
      request.onerror = (event) => {
        console.error('获取数据失败:', event.target.error);
        reject(event.target.error);
      };
    } catch (error) {
      console.error('获取数据时发生错误:', error);
      reject(error);
    }
  });
};

/**
 * 删除对象存储中的所有数据
 * @param {IDBDatabase} db - 数据库连接
 * @param {string} storeName - 对象存储名称
 * @returns {Promise<boolean>} - 返回是否成功
 */
export const clearStore = (db, storeName) => {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = (event) => {
        console.error('清空数据失败:', event.target.error);
        reject(event.target.error);
      };
    } catch (error) {
      console.error('清空数据时发生错误:', error);
      reject(error);
    }
  });
};

/**
 * 关闭数据库连接
 * @param {IDBDatabase} db - 数据库连接
 */
export const closeDB = (db) => {
  if (db) {
    db.close();
    console.log('数据库连接已关闭');
  }
};
