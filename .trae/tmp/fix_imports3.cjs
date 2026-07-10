const fs = require('fs');
const path = require('path');

const files = [
  'src/growth/study-planner/StudyPlannerUI.tsx',
  'src/growth/study-companion/StudyCompanionUI.tsx',
  'src/growth/memory-cards/MemoryCardsUI.tsx',
  'src/growth/exam-tracker/ExamTrackerUI.tsx',
];

for (const file of files) {
  const fullPath = path.join('e:/星寰海', file);
  let content = fs.readFileSync(fullPath, 'utf8');
  content = content.replace(/from '\.\.\/ai-partner\/agent\/agentRuntime'/, "from '../../ai-partner/agent/agentRuntime'");
  fs.writeFileSync(fullPath, content);
  console.log('Fixed:', file);
}
