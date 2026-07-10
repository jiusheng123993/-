const fs = require('fs');
const dirs = ['exam-tracker', 'error-book', 'memory-cards', 'study-planner', 'study-companion', 'mood-journal'];
for (const dir of dirs) {
  const src = 'src/' + dir;
  const dst = 'src/growth/' + dir;
  if (fs.existsSync(src)) {
    fs.cpSync(src, dst, {recursive: true});
    fs.rmSync(src, {recursive: true});
    console.log('Moved ' + src + ' -> ' + dst);
  }
}
