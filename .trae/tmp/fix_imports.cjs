const fs = require('fs');
const path = require('path');

const files = [
  'src/growth/knowledge-graph/knowledgeGraphService.ts',
  'src/growth/study-planner/studyPlannerService.ts',
  'src/growth/study-companion/studyCompanionService.ts',
  'src/growth/schedule/scheduleService.ts',
  'src/growth/mood-journal/moodJournalService.ts',
  'src/growth/error-book/errorBookService.ts',
  'src/growth/exam-tracker/examTrackerService.ts',
  'src/growth/reading/readingService.ts',
  'src/growth/memory-cards/memoryCardsService.ts',
];

for (const file of files) {
  const fullPath = path.join('e:/星寰海', file);
  let content = fs.readFileSync(fullPath, 'utf8');
  content = content.replace(/from '\.\.\/shared\/data\/storageFactory'/, "from '../../shared/data/storageFactory'");
  fs.writeFileSync(fullPath, content);
  console.log('Fixed:', file);
}
