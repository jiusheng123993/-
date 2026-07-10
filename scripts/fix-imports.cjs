/**
 * 批量修复 src/ 下所有 .ts/.tsx 文件中的相对导入路径
 * 根据新的目录结构更新导入路径
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '..', 'src');

// 定义每个模块属于哪个组
// key: 模块名, value: 组名 (ai-partner, growth, duo, shared)
const MODULE_TO_GROUP = {
  'agent': 'ai-partner',
  'ai': 'ai-partner',
  'avatar': 'ai-partner',
  'memory': 'ai-partner',
  'memory-body': 'ai-partner',
  'memory-star-map': 'ai-partner',
  'metrics-dashboard': 'ai-partner',
  'personas': 'ai-partner',
  'cycle': 'growth',
  'focus-timer': 'growth',
  'habits': 'growth',
  'journal': 'growth',
  'relationship': 'duo',
  'animations': 'shared',
  'api': 'shared',
  'auth': 'shared',
  'canvas': 'shared',
  'components': 'shared',
  'data': 'shared',
  'entitlement': 'shared',
  'hooks': 'shared',
  'identity': 'shared',
  'infrastructure': 'shared',
  'module-store': 'shared',
  'notifications': 'shared',
  'onboarding': 'shared',
  'platforms': 'shared',
  'server': 'shared',
  'services': 'shared',
  'settings': 'shared',
  'sidebar': 'shared',
  'sidebar-panel': 'shared',
  'styles': 'shared',
  'themes': 'shared',
  'utils': 'shared',
  'wallpaper': 'shared',
};

// 组名到目录名的映射
const GROUP_TO_DIR = {
  'ai-partner': 'ai-partner',
  'growth': 'growth',
  'duo': 'duo',
  'shared': 'shared',
};

/**
 * 判断文件属于哪个组
 * 返回组名，如果是根级文件（如 App.tsx, main.tsx）则返回 null
 */
function getFileGroup(filePath) {
  const relative = path.relative(SRC_DIR, filePath).replace(/\\/g, '/');
  
  // 根级文件
  if (!relative.includes('/')) {
    return null;
  }
  
  const topDir = relative.split('/')[0];
  
  if (topDir === 'ai-partner') return 'ai-partner';
  if (topDir === 'growth') return 'growth';
  if (topDir === 'duo') return 'duo';
  if (topDir === 'shared') return 'shared';
  
  // 其他顶层目录（如 backlink, badges, e2e 等）视为根级
  return null;
}

/**
 * 解析相对导入路径，返回目标模块名
 * 例如: '../memory/memoryTypes' -> 'memory'
 *       './agentRuntime' -> null (同目录文件)
 *       '../personas/personaRegistry' -> 'personas'
 *       '../../shared/utils/foo' -> 'utils'
 */
function resolveTargetModule(importPath) {
  // 去掉所有开头的 ../ 和 ./
  const cleaned = importPath.replace(/^(?:\.\.?\/)+/, '');
  
  // 如果路径中不包含 /，说明是同目录文件，不需要处理
  if (!cleaned.includes('/')) {
    return null;
  }
  
  // 获取第一段路径
  const firstSegment = cleaned.split('/')[0];
  
  // 如果第一段在映射表中，返回它
  if (MODULE_TO_GROUP[firstSegment]) {
    return firstSegment;
  }
  
  return null;
}

/**
 * 计算从源文件到目标模块的新相对路径
 * 
 * @param {string} sourceFile - 源文件的绝对路径
 * @param {string} importPath - 原始导入路径（如 '../memory/memoryTypes'）
 * @param {string} targetModule - 目标模块名（如 'memory'）
 * @returns {string|null} 新的导入路径，如果不需要修改则返回 null
 */
function computeNewImportPath(sourceFile, importPath, targetModule) {
  const sourceGroup = getFileGroup(sourceFile);
  const targetGroup = MODULE_TO_GROUP[targetModule];
  
  // 如果源文件和目标模块在同一个组，不需要修改
  if (sourceGroup === targetGroup) {
    return null;
  }
  
  // 计算源文件相对于 src/ 的目录
  const sourceRelative = path.relative(SRC_DIR, sourceFile).replace(/\\/g, '/');
  const sourceDir = path.dirname(sourceRelative);
  
  // 目标模块在 src/ 下的新路径
  const targetNewPath = GROUP_TO_DIR[targetGroup] + '/' + targetModule;
  
  // 计算从 sourceDir 到 targetNewPath 的相对路径
  let newRelativePath = path.relative(sourceDir, targetNewPath).replace(/\\/g, '/');
  
  // 确保以 ./ 或 ../ 开头
  if (!newRelativePath.startsWith('.')) {
    newRelativePath = './' + newRelativePath;
  }
  
  // 提取原始导入路径中模块名之后的部分
  const cleaned = importPath.replace(/^(?:\.\.?\/)+/, '');
  const afterModule = cleaned.substring(targetModule.length); // 如 '/memoryTypes'
  
  return newRelativePath + afterModule;
}

/**
 * 处理单个文件中的导入路径
 */
function fixFileImports(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch (e) {
    console.error(`  ERROR reading file: ${filePath}`, e.message);
    return { modified: false, changes: 0 };
  }
  
  let modified = false;
  let changes = 0;
  
  // 匹配 import/export 语句中的相对路径
  // 模式: from './xxx' 或 from '../xxx' 或 import './xxx.css'
  // 也匹配 import('...') 动态导入
  const importRegex = /((?:import|export)\s+(?:(?:type\s+)?(?:\{[^}]*\}|[^'"`;]+)\s+from\s+)?['"`])(\.\.?\/[^'"`]+)(['"`])/g;
  
  // 也匹配纯副作用导入: import './xxx.css'
  const sideEffectRegex = /(import\s+['"`])(\.\.?\/[^'"`]+)(['"`])/g;
  
  let newContent = content;
  
  // 处理 from 导入
  newContent = newContent.replace(importRegex, (match, prefix, importPath, suffix) => {
    const targetModule = resolveTargetModule(importPath);
    if (!targetModule) return match;
    
    const newPath = computeNewImportPath(filePath, importPath, targetModule);
    if (!newPath) return match;
    
    changes++;
    console.log(`  ${importPath} -> ${newPath}`);
    return prefix + newPath + suffix;
  });
  
  // 处理副作用导入 (import './xxx.css')
  newContent = newContent.replace(sideEffectRegex, (match, prefix, importPath, suffix) => {
    const targetModule = resolveTargetModule(importPath);
    if (!targetModule) return match;
    
    const newPath = computeNewImportPath(filePath, importPath, targetModule);
    if (!newPath) return match;
    
    changes++;
    console.log(`  ${importPath} -> ${newPath}`);
    return prefix + newPath + suffix;
  });
  
  if (changes > 0) {
    try {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      modified = true;
    } catch (e) {
      console.error(`  ERROR writing file: ${filePath}`, e.message);
    }
  }
  
  return { modified, changes };
}

/**
 * 递归遍历目录，找到所有 .ts 和 .tsx 文件
 */
function findTsFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // 跳过 node_modules
      if (entry.name === 'node_modules') continue;
      results.push(...findTsFiles(fullPath));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  
  return results;
}

// 主流程
console.log('=== 开始修复导入路径 ===\n');

const allFiles = findTsFiles(SRC_DIR);
console.log(`找到 ${allFiles.length} 个 .ts/.tsx 文件\n`);

let totalModified = 0;
let totalChanges = 0;

for (const file of allFiles) {
  const relative = path.relative(SRC_DIR, file);
  const { modified, changes } = fixFileImports(file);
  
  if (modified) {
    console.log(`[MODIFIED] ${relative} (${changes} changes)`);
    totalModified++;
    totalChanges += changes;
  }
}

console.log(`\n=== 完成 ===`);
console.log(`修改文件数: ${totalModified}`);
console.log(`总修改数: ${totalChanges}`);
