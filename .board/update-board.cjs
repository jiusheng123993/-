const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function updateBoard(projectPath, title, description, files, type) {
  const boardDir = path.join(projectPath, '.board');
  const indexPath = path.join(boardDir, 'index.html');
  const diffsDir = path.join(boardDir, 'diffs');

  if (!fs.existsSync(diffsDir)) {
    fs.mkdirSync(diffsDir, { recursive: true });
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const pad = function(n) { return n < 10 ? '0' + n : '' + n; };
  const timeStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());

  const diffFilename = timestamp + '-' + title.replace(/[^\w\u4e00-\u9fa5]/g, '-').slice(0, 30) + '.diff';
  const diffPath = path.join(diffsDir, diffFilename);

  let diffContent = '';
  try {
    diffContent = execSync('git diff HEAD', {
      cwd: projectPath,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    });
  } catch (e) {
    diffContent = '# 改动说明\n# ' + title + '\n# ' + description + '\n';
  }

  if (!diffContent.trim()) {
    diffContent = '# 改动说明\n# ' + title + '\n# ' + description + '\n';
  }

  fs.writeFileSync(diffPath, diffContent, 'utf-8');

  var html = fs.readFileSync(indexPath, 'utf-8');

  var fileList = files ? files.split(',').map(function(f) { return f.trim(); }).join(', ') : '详见 diff 文件';
  var recordType = type || 'change';

  var newEntry = '{time:"' + timeStr + '",title:"' + title.replace(/"/g, '\\"') + '",desc:"' + description.replace(/"/g, '\\"') + '",files:"' + fileList.replace(/"/g, '\\"') + '",type:"' + recordType + '",diff:"' + diffFilename + '"}';

  var marker = 'timeline:[';
  var markerPos = html.indexOf(marker);
  if (markerPos === -1) {
    console.error('找不到 BD.timeline 数据标记');
    process.exit(1);
  }

  var insertPos = markerPos + marker.length;
  html = html.slice(0, insertPos) + newEntry + ',' + html.slice(insertPos);

  var updateMarker = 'updatedAt:"';
  var updatePos = html.indexOf(updateMarker);
  if (updatePos !== -1) {
    var updateEnd = html.indexOf('"', updatePos + updateMarker.length);
    if (updateEnd !== -1) {
      html = html.slice(0, updatePos + updateMarker.length) + timeStr + html.slice(updateEnd);
    }
  }

  fs.writeFileSync(indexPath, html, 'utf-8');

  console.log('看板已更新');
  console.log('  项目：' + projectPath);
  console.log('  标题：' + title);
  console.log('  类型：' + recordType);
  console.log('  时间：' + timeStr);
  console.log('  Diff：' + diffPath);
}

var args = process.argv.slice(2);
if (args.length < 3) {
  console.log('用法：node update-board.cjs <项目根目录> <"改动标题"> <"改动描述"> [涉及文件] [类型]');
  console.log('类型：change(默认) / done / fail / review / sync / test');
  console.log('示例：node update-board.cjs "E:\\星寰海" "修复登录bug" "修复用户无法登录的问题" "src/auth/login.ts" done');
  process.exit(1);
}

var projectPath = args[0];
var title = args[1];
var description = args[2];
var files = args[3] || '';
var type = args[4] || 'change';
updateBoard(projectPath, title, description, files, type);
