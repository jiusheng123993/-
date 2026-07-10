const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 自动更新项目看板
 * 
 * 用法：node update-board.cjs <项目根目录> <"改动标题"> <"改动描述"> [涉及文件]
 * 
 * 示例：
 * node update-board.cjs "E:\星寰海" "修复登录bug" "修复用户无法登录的问题" "src/auth/login.ts,src/auth/authService.ts"
 */

function updateBoard(projectPath, title, description, files) {
  const boardDir = path.join(projectPath, '.board');
  const indexPath = path.join(boardDir, 'index.html');
  const diffsDir = path.join(boardDir, 'diffs');

  // 确保目录存在
  if (!fs.existsSync(diffsDir)) {
    fs.mkdirSync(diffsDir, { recursive: true });
  }

  // 生成时间戳
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const timeStr = now.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  }).replace(/\//g, '-');

  // 生成 diff 文件
  const diffFilename = `${timestamp}-${title.replace(/[^\w\u4e00-\u9fa5]/g, '-').slice(0, 30)}.diff`;
  const diffPath = path.join(diffsDir, diffFilename);

  // 生成 git diff
  let diffContent = '';
  try {
    diffContent = execSync('git diff HEAD', { 
      cwd: projectPath, 
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024 // 10MB
    });
  } catch (e) {
    // 如果没有 git 或没有改动，生成一个空的 diff
    diffContent = `# 改动说明\n# 问题：${title}\n# 原因：${description}\n# 改动：\n#   1. ${title}\n# 影响：${description}\n`;
  }

  // 如果没有 git diff，生成一个基于文件的 diff
  if (!diffContent.trim()) {
    diffContent = `# 改动说明\n# 问题：${title}\n# 原因：${description}\n# 改动：\n#   1. ${title}\n# 影响：${description}\n`;
  }

  fs.writeFileSync(diffPath, diffContent, 'utf-8');

  // 读取当前 index.html
  let html = fs.readFileSync(indexPath, 'utf-8');

  // 生成新的时间线记录
  const fileList = files ? files.split(',').map(f => f.trim()).join(', ') : '详见 diff 文件';
  const newRecord = `          <div class="tl-item done" data-diff="${diffFilename}">
            <div class="tl-time">${timeStr}</div>
            <div class="tl-title">${title}</div>
            <div class="tl-desc">${description}</div>
            <div class="tl-file">${fileList}</div>
            <div class="tl-actions"><span class="tl-view-diff" onclick="openDiff('${diffFilename}', '${title}')">&#128269; 查看改动</span></div>
          </div>`;

  // 在时间线开头插入新记录（找到第一个 tl-item 之前）
  const timelineStart = html.indexOf('<div class="timeline">');
  if (timelineStart === -1) {
    console.error('找不到时间线容器');
    process.exit(1);
  }

  // 在第一个 tl-item 之前插入
  const firstItem = html.indexOf('<div class="tl-item', timelineStart);
  if (firstItem !== -1) {
    html = html.slice(0, firstItem) + newRecord + '\n' + html.slice(firstItem);
  } else {
    // 如果没有记录，在 timeline div 结束后插入
    const timelineEnd = html.indexOf('</div>', timelineStart);
    html = html.slice(0, timelineEnd) + newRecord + '\n' + html.slice(timelineEnd);
  }

  // 更新进度（如果有需要）
  // 这里可以添加进度计算逻辑

  // 保存更新后的 index.html
  fs.writeFileSync(indexPath, html, 'utf-8');

  console.log(`✅ 看板已更新`);
  console.log(`   项目：${projectPath}`);
  console.log(`   标题：${title}`);
  console.log(`   时间：${timeStr}`);
  console.log(`   Diff：${diffPath}`);
}

// 解析命令行参数
const args = process.argv.slice(2);
if (args.length < 3) {
  console.log('用法：node update-board.cjs <项目根目录> <"改动标题"> <"改动描述"> [涉及文件]');
  console.log('示例：node update-board.cjs "E:\\星寰海" "修复登录bug" "修复用户无法登录的问题" "src/auth/login.ts"');
  process.exit(1);
}

const [projectPath, title, description, files] = args;
updateBoard(projectPath, title, description, files);
