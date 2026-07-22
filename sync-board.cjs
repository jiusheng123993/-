const fs = require('fs');
const path = require('path');

function syncBoard(projectRoot) {
  const boardHtmlPath = path.join(projectRoot, '.board', 'index.html');
  const srcDir = path.join(projectRoot, '03-源代码', '小程序', 'miniapp', 'src');

  if (!fs.existsSync(boardHtmlPath)) {
    console.error('看板文件不存在:', boardHtmlPath);
    return false;
  }

  if (!fs.existsSync(srcDir)) {
    console.error('源代码目录不存在:', srcDir);
    return false;
  }

  let html = fs.readFileSync(boardHtmlPath, 'utf-8');

  const moduleRegex = /<div class="module-item"\s+data-module-id="([^"]+)"\s+data-check-files="([^"]*)"[^>]*>([\s\S]*?)<\/div>\s*<span class="badge\s+([^"]+)">([\s\S]*?)<\/span>/g;

  const moduleMap = {};
  let match;
  const updatedModules = [];

  while ((match = moduleRegex.exec(html)) !== null) {
    const moduleId = match[1];
    const checkFiles = match[2];
    const currentBadge = match[4];
    const currentText = match[5];

    moduleMap[moduleId] = {
      checkFiles,
      currentBadge,
      currentText,
      fullMatch: match[0],
    };

    if (checkFiles === '') {
      continue;
    }

    const files = checkFiles.split(',').filter(Boolean);
    let existCount = 0;
    const missingFiles = [];

    for (const file of files) {
      const fullPath = path.join(srcDir, file);
      if (fs.existsSync(fullPath)) {
        existCount++;
      } else {
        missingFiles.push(file);
      }
    }

    let newBadge;
    let newText;

    if (existCount === files.length) {
      newBadge = 'badge-done';
      newText = '✓ 代码已有';
    } else if (existCount > 0) {
      newBadge = 'badge-partial';
      newText = '⚠ 部分实现';
    } else {
      newBadge = 'badge-pending';
      newText = '⏳ 未实现';
    }

    if (newBadge !== currentBadge || newText !== currentText) {
      updatedModules.push({
        moduleId,
        oldBadge: currentBadge,
        newBadge,
        oldText: currentText,
        newText,
        existCount,
        totalFiles: files.length,
        missingFiles,
      });
    }
  }

  for (const update of updatedModules) {
    const oldBadgeSpan = `<span class="badge ${update.oldBadge}">${update.oldText}</span>`;
    const newBadgeSpan = `<span class="badge ${update.newBadge}">${update.newText}</span>`;
    html = html.replace(oldBadgeSpan, newBadgeSpan);
  }

  const layerModuleMapping = {
    'data-hub': ['memory-body'],
    'ai-engine': ['ai-advisor', 'health-pattern', 'anomaly-alert', 'proactive-reach', 'effect-tracking'],
    'func-layer': ['4.2-pet-profile', '4.3-checkin', '4.4-vaccine', '4.5-symptom', '4.6-food', '4.7-trends', '4.7-report', 'breed-encyclopedia'],
    'emotion': ['4.8-grief', '4.8-anxiety', '4.8-beginner', '6.3-emotion-data', '8.6-emotion-diversion', '6.4-effect-standard'],
    'avatar': ['4.9.2-avatar-gen', '4.9.3-expression', '4.9.4-decoration', '4.9.5-achievement', '4.9.6-diary', '4.9.7-member-avatar'],
    'protect': ['pet-safety', 'medical-disclaimer', 'auth-guard', '8.1-compliance', '8.3-emotion-compliance', '8.4-disclaimer', '8.5-frequency', '8.6-extreme', '14.3-overdefense', 'backend-security'],
    'monetize': ['7.3-quota', '7.1-subscribe', '7.1-ads', '7.4-hospital', '7.1-ecommerce', '7.5-calc'],
    'infra': ['9.1-knowledge', '12-privacy', '16-metrics', '16.3-tracking', '6.5-backup', '13-coldstart', '18-flow', '15-schedule'],
  };

  function getModuleStatus(moduleId) {
    const info = moduleMap[moduleId];
    if (!info) return 0;

    if (info.currentBadge === 'badge-done') return 1;
    if (info.currentBadge === 'badge-partial') return 0.5;
    if (info.currentBadge === 'badge-doing') return 0.3;
    if (info.currentBadge === 'badge-review') return 0.8;
    if (info.currentBadge === 'badge-pending') return 0;
    if (info.currentBadge === 'badge-phase15') return 0;
    if (info.currentBadge === 'badge-phase2') return 0;
    if (info.currentBadge === 'badge-phase3') return 0;
    if (info.currentBadge === 'badge-blocked') return 0;
    return 0;
  }

  const layerStats = {};
  let totalDone = 0;
  let totalModules = 0;

  for (const [layer, moduleIds] of Object.entries(layerModuleMapping)) {
    let done = 0;
    for (const mid of moduleIds) {
      done += getModuleStatus(mid);
    }
    const total = moduleIds.length;
    const pct = Math.round((done / total) * 100);
    layerStats[layer] = { done, total, pct };
    totalDone += done;
    totalModules += total;
  }

  const overallPct = Math.round((totalDone / totalModules) * 100);

  for (const [layer, stats] of Object.entries(layerStats)) {
    const rowRegex = new RegExp(
      `(<div class="prd-stat-row" data-layer="${layer}">[\\s\\S]*?<span class="prd-stat-value"[^>]*>)[^<]*(</span></div>)`
    );
    const rowMatch = html.match(rowRegex);
    if (rowMatch) {
      const newText = `${stats.done}/${stats.total} = ${stats.pct}%`;
      html = html.replace(rowMatch[0], `${rowMatch[1]}${newText}${rowMatch[2]}`);

      const rowStartIdx = html.indexOf(`<div class="prd-stat-row" data-layer="${layer}">`);
      if (rowStartIdx !== -1) {
        const afterRow = html.indexOf('</div>', rowStartIdx) + 6;
        const progressRegex = /<div class="prd-progress-bar"><div class="prd-progress-fill" style="width:\d+%;background:[^"]+"><\/div><\/div>/;
        const subHtml = html.substring(afterRow, afterRow + 200);
        const progressMatch = subHtml.match(progressRegex);
        if (progressMatch) {
          const bgColor = stats.pct >= 75 ? '#4ade80' : stats.pct >= 50 ? '#f59e0b' : '#ef4444';
          const newProgress = `<div class="prd-progress-bar"><div class="prd-progress-fill" style="width:${stats.pct}%;background:${bgColor}"></div></div>`;
          html = html.substring(0, afterRow) + subHtml.replace(progressMatch[0], newProgress) + html.substring(afterRow + subHtml.indexOf(progressMatch[0]) + progressMatch[0].length);
        }
      }
    }
  }

  const progressRegex = /<!-- BOARD_PROGRESS --><div class="progress-bar"><div class="progress-fill" style="width:\d+%"><\/div><\/div>\s*<div[^>]*>整体进度[^<]*<\/div><!-- \/BOARD_PROGRESS -->/;
  const newProgressHtml = `<!-- BOARD_PROGRESS --><div class="progress-bar"><div class="progress-fill" style="width:${overallPct}%"></div></div>\n<div style="margin-top:8px;font-size:13px;opacity:.7">整体进度：${overallPct}%（按PRD v3.1全量${totalModules}项计算：已完成${Math.floor(totalDone)}项 + 部分实现${Math.round((totalDone - Math.floor(totalDone)) * 2)}项 + 待实现${totalModules - Math.ceil(totalDone)}项 ≈ ${overallPct}%）</div><!-- /BOARD_PROGRESS -->`;
  html = html.replace(progressRegex, newProgressHtml);

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const dateRegex = /<!-- BOARD_UPDATE_DATE -->更新于：\d{4}-\d{2}-\d{2}<!-- \/BOARD_UPDATE_DATE -->/;
  html = html.replace(dateRegex, `<!-- BOARD_UPDATE_DATE -->更新于：${dateStr}<!-- /BOARD_UPDATE_DATE -->`);

  function countFiles(dir, pattern, excludePatterns) {
    if (!fs.existsSync(dir)) return 0;
    let count = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        count += countFiles(fullPath, pattern, excludePatterns);
      } else if (entry.isFile()) {
        const name = entry.name;
        let matches = false;
        if (typeof pattern === 'string') {
          matches = name === pattern || name.endsWith(pattern);
        } else {
          matches = pattern.test(name);
        }
        if (matches) {
          let excluded = false;
          for (const exc of excludePatterns) {
            if (typeof exc === 'string' && name === exc) { excluded = true; break; }
            if (exc instanceof RegExp && exc.test(name)) { excluded = true; break; }
          }
          if (!excluded) count++;
        }
      }
    }
    return count;
  }

  let pageCount = 0;
  const pagesBaseDirs = ['pages', 'pagesPet', 'pagesUser'];
  for (const baseName of pagesBaseDirs) {
    const baseDir = path.join(srcDir, baseName);
    if (!fs.existsSync(baseDir)) continue;
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (fs.existsSync(path.join(baseDir, entry.name, 'index.tsx'))) {
          pageCount++;
        }
      }
    }
  }

  const storesDir = path.join(srcDir, 'stores');
  const storeCount = fs.existsSync(storesDir)
    ? fs.readdirSync(storesDir).filter(f => f.endsWith('.ts') && f !== 'index.ts' && !f.includes('.test.')).length
    : 0;

  const servicesDir = path.join(srcDir, 'services');
  const serviceCount = fs.existsSync(servicesDir)
    ? fs.readdirSync(servicesDir).filter(f => f.endsWith('.ts') && f !== 'index.ts' && !f.includes('.test.')).length
    : 0;

  const hooksDir = path.join(srcDir, 'hooks');
  const composablesDir = path.join(srcDir, 'composables');
  const hookBaseDir = fs.existsSync(hooksDir) ? hooksDir : (fs.existsSync(composablesDir) ? composablesDir : null);
  const hookCount = hookBaseDir
    ? fs.readdirSync(hookBaseDir).filter(f => f.endsWith('.ts') && !f.includes('.test.')).length
    : 0;

  const enginesDir = path.join(srcDir, 'engines');
  let engineCount = 0;
  if (fs.existsSync(enginesDir)) {
    const engineEntries = fs.readdirSync(enginesDir, { withFileTypes: true });
    for (const entry of engineEntries) {
      if (entry.isDirectory()) {
        const subPath = path.join(enginesDir, entry.name);
        engineCount += fs.readdirSync(subPath).filter(f => f.endsWith('.ts') && f !== 'index.ts' && !f.includes('.test.')).length;
      } else if (entry.isFile() && entry.name.endsWith('.ts') && entry.name !== 'index.ts' && !entry.name.includes('.test.')) {
        engineCount++;
      }
    }
  }

  const dataDir = path.join(srcDir, 'data');
  const dataCount = fs.existsSync(dataDir)
    ? countFiles(dataDir, /\.ts$/, [/\.test\./])
    : 0;

  const componentsDir = path.join(srcDir, 'components');
  const componentCount = fs.existsSync(componentsDir)
    ? fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx') && f !== 'index.ts' && !f.includes('.test.')).length
    : 0;

  const testCount = countFiles(srcDir, /\.test\.(ts|tsx)$/, []);

  const codeStats = {
    pages: pageCount,
    stores: storeCount,
    services: serviceCount,
    hooks: hookCount,
    engines: engineCount,
    data: dataCount,
    components: componentCount,
    tests: testCount,
  };

  const codeStatsRegex = /<!-- BOARD_CODE_STATS -->([\s\S]*?)<!-- \/BOARD_CODE_STATS -->/;
  const codeStatsMatch = html.match(codeStatsRegex);
  if (codeStatsMatch) {
    let statsHtml = codeStatsMatch[1];

    const replacements = [
      [/页面/, codeStats.pages],
      [/Store/, codeStats.stores],
      [/Service/, codeStats.services],
      [/Hook/, codeStats.hooks],
      [/引擎/, codeStats.engines],
      [/数据/, codeStats.data],
      [/组件/, codeStats.components],
      [/测试文件/, codeStats.tests],
    ];

    for (const [label, value] of replacements) {
      const regex = new RegExp(`(<div class="stat-card"><div class="stat-value stat-green">)\\d+(</div><div class="stat-label">${label.source}</div></div>)`);
      statsHtml = statsHtml.replace(regex, `$1${value}$2`);
    }

    html = html.replace(codeStatsRegex, `<!-- BOARD_CODE_STATS -->${statsHtml}<!-- /BOARD_CODE_STATS -->`);
  }

  fs.writeFileSync(boardHtmlPath, html, 'utf-8');

  console.log('\n=== 看板自动同步 ===\n');
  console.log(`更新日期: ${dateStr}`);
  console.log(`整体进度: ${overallPct}% (${totalDone}/${totalModules})\n`);

  console.log('--- 层级进度 ---');
  for (const [layer, stats] of Object.entries(layerStats)) {
    console.log(`  ${layer}: ${stats.done}/${stats.total} = ${stats.pct}%`);
  }

  if (updatedModules.length > 0) {
    console.log('\n--- 模块状态变更 ---');
    for (const u of updatedModules) {
      console.log(`  [${u.moduleId}] ${u.oldBadge} → ${u.newBadge} (${u.existCount}/${u.totalFiles} 文件存在)`);
      if (u.missingFiles.length > 0) {
        console.log(`    缺失: ${u.missingFiles.join(', ')}`);
      }
    }
  } else {
    console.log('\n--- 无模块状态变更 ---');
  }

  console.log('\n--- 代码文件统计 ---');
  console.log(`  页面: ${codeStats.pages} | Store: ${codeStats.stores} | Service: ${codeStats.services} | Hook: ${codeStats.hooks}`);
  console.log(`  引擎: ${codeStats.engines} | 数据: ${codeStats.data} | 组件: ${codeStats.components} | 测试: ${codeStats.tests}`);
  console.log(`  总计: ${Object.values(codeStats).reduce((a, b) => a + b, 0)}+ 文件\n`);

  return true;
}

if (require.main === module) {
  const projectRoot = process.argv[2];
  if (!projectRoot) {
    console.error('用法: node sync-board.cjs "项目根目录"');
    process.exit(1);
  }
  syncBoard(projectRoot);
}

module.exports = { syncBoard };
