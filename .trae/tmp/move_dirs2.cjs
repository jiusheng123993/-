const fs = require('fs');
const path = require('path');

// Move directories to their target locations
const moves = [
  { src: 'src/report', dest: 'src/shared/report' },
  { src: 'src/templates', dest: 'src/shared/templates' },
  { src: 'src/quicknotes', dest: 'src/shared/quicknotes' },
  { src: 'src/review', dest: 'src/growth/review' },
  { src: 'src/timeblock', dest: 'src/growth/timeblock' },
  { src: 'src/focus-mode', dest: 'src/growth/focus-mode' },
  { src: 'src/focushistory', dest: 'src/growth/focushistory' },
  { src: 'src/focusstats', dest: 'src/growth/focusstats' },
];

for (const { src, dest } of moves) {
  const srcPath = path.join('e:/星寰海', src);
  const destPath = path.join('e:/星寰海', dest);

  if (fs.existsSync(srcPath)) {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.cpSync(srcPath, destPath, { recursive: true });
    fs.rmSync(srcPath, { recursive: true, force: true });
    console.log(`Moved: ${src} -> ${dest}`);
  } else {
    console.log(`Skipped (not found): ${src}`);
  }
}
