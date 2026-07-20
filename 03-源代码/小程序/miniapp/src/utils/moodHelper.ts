export function getMoodDisplayName(mood: string): string {
  const moodMap: Record<string, string> = {
    sad: '难过',
    anxious: '焦虑',
    tired: '累',
    lonely: '孤独',
    unclear: '说不出来',
    happy: '开心',
    calm: '平静',
    angry: '愤怒',
    fearful: '恐惧',
    stressed: '压力',
    frustrated: '沮丧',
    hopeful: '希望',
  };
  return moodMap[mood] || mood;
}