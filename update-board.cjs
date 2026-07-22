const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function updateBoard(projectPath, title, description, files) {
  const boardDir = path.join(projectPath, '.board');
  const indexPath = path.join(boardDir, 'index.html');
  const diffsDir = path.join(boardDir, 'diffs');

  if (!fs.existsSync(indexPath)) {
    console.error(`❌ 项目没有看板：${projectPath}`);
    console.error('   请先创建看板：在项目根目录运行 "node create-board.cjs"');
    process.exit(1);
  }

  const projectName = path.basename(projectPath);
  try {
    const { saveProject } = require('./ws-server.cjs');
    saveProject(projectPath, projectName);
  } catch (e) {
  }

  if (!fs.existsSync(diffsDir)) {
    fs.mkdirSync(diffsDir, { recursive: true });
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const timeStr = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/\//g, '-');

  const safeTitle = title.replace(/[^\w\u4e00-\u9fa5]/g, '-').slice(0, 30);
  const diffFilename = `${timestamp}-${safeTitle}.diff`;
  const diffPath = path.join(diffsDir, diffFilename);

  let diffContent = '';
  try {
    diffContent = execSync('git diff HEAD', {
      cwd: projectPath,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    });
  } catch (e) {
  }

  if (!diffContent.trim()) {
    diffContent = `# 改动说明\n# 问题：${title}\n# 原因：${description}\n# 改动：\n#   1. ${title}\n# 影响：${description}\n`;
  }

  fs.writeFileSync(diffPath, diffContent, 'utf-8');

  let html = fs.readFileSync(indexPath, 'utf-8');

  const fileList = files ? files.split(',').map(f => f.trim()).join(', ') : '详见 diff 文件';
  const newRecord = `          <div class="tl-item done" data-diff="${diffFilename}">
            <div class="tl-time">${timeStr}</div>
            <div class="tl-title">${title}</div>
            <div class="tl-desc">${description}</div>
            <div class="tl-file">${fileList}</div>
            <div class="tl-actions"><span class="tl-view-diff" onclick="openDiff('${diffFilename}', '${title}')">&#128269; 查看改动</span></div>
          </div>`;

  const timelineStart = html.indexOf('<div class="timeline">');
  if (timelineStart === -1) {
    console.error('❌ 找不到时间线容器');
    process.exit(1);
  }

  const firstItem = html.indexOf('<div class="tl-item', timelineStart);
  if (firstItem !== -1) {
    html = html.slice(0, firstItem) + newRecord + '\n' + html.slice(firstItem);
  } else {
    const timelineEnd = html.indexOf('</div>', timelineStart);
    html = html.slice(0, timelineEnd) + newRecord + '\n' + html.slice(timelineEnd);
  }

  fs.writeFileSync(indexPath, html, 'utf-8');

  console.log(`✅ 看板时间线已更新`);
  console.log(`   项目：${projectPath}`);
  console.log(`   标题：${title}`);
  console.log(`   时间：${timeStr}`);
  console.log(`   Diff：${diffPath}`);

  try {
    const syncScriptPath = path.join(projectPath, 'sync-board.cjs');
    if (fs.existsSync(syncScriptPath)) {
      const { syncBoard } = require(syncScriptPath);
      console.log('\n🔄 自动同步看板模块状态/进度/统计...');
      syncBoard(projectPath);
    } else {
      console.log('⚠️ sync-board.cjs 不存在，跳过自动同步');
    }
  } catch (e) {
    console.log('⚠️ 自动同步失败:', e.message);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log('用法：node update-board.cjs <项目根目录> <"改动标题"> <"改动描述"> [涉及文件]');
    console.log('示例：node update-board.cjs "E:\\星寰海" "修复登录bug" "修复用户无法登录的问题" "src/auth/login.ts"');
    process.exit(1);
  }

  const [projectPath, title, description, files] = args;
  updateBoard(projectPath, title, description, files);
}

module.exports = { updateBoard };
