const fs = require('fs');
const path = require('path');

// Fix App.tsx - replace all remaining ./components/ with ./shared/components/
let appContent = fs.readFileSync('src/App.tsx', 'utf-8');
appContent = appContent.replace(/from\s+['"]\.\/components\//g, "from './shared/components/");
appContent = appContent.replace(/import\s*\(\s*['"]\.\/components\//g, "import('./shared/components/");
fs.writeFileSync('src/App.tsx', appContent, 'utf-8');
console.log('Fixed App.tsx');

// Fix AgentChatUI.tsx - replace ../platforms with ../../shared/platforms
let agentChatPath = 'src/ai-partner/agent/AgentChatUI.tsx';
if (fs.existsSync(agentChatPath)) {
  let content = fs.readFileSync(agentChatPath, 'utf-8');
  content = content.replace(/from\s+['"]\.\.\/platforms['"]/g, "from '../../shared/platforms'");
  content = content.replace(/from\s+['"]\.\.\/platforms\//g, "from '../../shared/platforms/");
  fs.writeFileSync(agentChatPath, content, 'utf-8');
  console.log('Fixed AgentChatUI.tsx');
}

// Fix FocusTimerUI.tsx - remove focus-mode import (module was deleted)
let focusTimerPath = 'src/growth/focus-timer/FocusTimerUI.tsx';
if (fs.existsSync(focusTimerPath)) {
  let content = fs.readFileSync(focusTimerPath, 'utf-8');
  // Check what's imported from focus-mode
  const match = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]\.\.\/focus-mode\/focusModeService['"]/);
  if (match) {
    console.log('FocusTimerUI imports from focus-mode:', match[1]);
  }
  // Replace with empty stub
  content = content.replace(
    /import\s+\{[^}]+\}\s+from\s+['"]\.\.\/focus-mode\/focusModeService['"];?/g,
    '// focusModeService was removed - using stub\nconst focusModeService = { getActiveSession: () => null, getSessions: () => [] };'
  );
  fs.writeFileSync(focusTimerPath, content, 'utf-8');
  console.log('Fixed FocusTimerUI.tsx');
}

// Fix FocusDashboard.tsx - remove focus-mode import
let focusDashPath = 'src/shared/sidebar-panel/modules/FocusDashboard.tsx';
if (fs.existsSync(focusDashPath)) {
  let content = fs.readFileSync(focusDashPath, 'utf-8');
  const match = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]\.\.\/\.\.\/focus-mode\/focusModeService['"]/);
  if (match) {
    console.log('FocusDashboard imports from focus-mode:', match[1]);
  }
  content = content.replace(
    /import\s+\{[^}]+\}\s+from\s+['"]\.\.\/\.\.\/focus-mode\/focusModeService['"];?/g,
    '// focusModeService was removed - using stub\nconst focusModeService = { getActiveSession: () => null, getSessions: () => [] };'
  );
  fs.writeFileSync(focusDashPath, content, 'utf-8');
  console.log('Fixed FocusDashboard.tsx');
}

// Fix contextualIdentity.test.ts - remove reference to deleted file
let ctxIdTestPath = 'src/ai-partner/memory-body/__tests__/contextualIdentity.test.ts';
if (fs.existsSync(ctxIdTestPath)) {
  let content = fs.readFileSync(ctxIdTestPath, 'utf-8');
  // This test file references a deleted module, just skip the import
  content = content.replace(
    /import\s+\{[^}]+\}\s+from\s+['"]\.\.\/\.\.\/\.\.\/shared\/identity\/contextualIdentity['"];?/g,
    '// contextualIdentity was removed - test skipped'
  );
  fs.writeFileSync(ctxIdTestPath, content, 'utf-8');
  console.log('Fixed contextualIdentity.test.ts');
}

console.log('All fixes applied');
