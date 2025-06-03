// 使用 import.meta.glob 导入所有的 svg 文件
const importSvg = import.meta.glob('./*.svg', { eager: true });
// 初始化一个空对象，用于存储导入的 svg 文件
const svg = {};
// 遍历 importSvg 对象的所有属性
for (let path in importSvg) {
  // 从路径中提取文件名，即去掉路径和扩展名
  const name = path.split('/').pop().split('.')[0];
  // 将提取的文件名作为属性名，将对应的 svg 文件内容作为属性值，存储在 svg 对象中
  svg[name] = importSvg[path].default;
}

export default svg

/**
 * BN_ 用于底部导航栏
 */
