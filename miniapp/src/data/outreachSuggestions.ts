/**
 * 外联建议模板库
 * 基于不同场景和情绪状态的预设消息模板
 */

/** 外联触发类型 */
export type OutreachTriggerType =
  | 'morning_checkin'      // 晨间问候
  | 'evening_reflection'   // 晚间反思
  | 'high_intensity'       // 高强度记录后
  | 'silence_warning'      // 沉默预警（3天未记录）
  | 'pattern_discovery'    // 模式发现
  | 'followup_emergency'   // 急救后跟进
  | 'good_news'            // 好消息（用户在变好）
  | 'crisis_intervention'  // 危机干预

/** 情绪标签 */
export type MoodTag =
  | 'anxious' | 'sad' | 'tired' | 'lonely' | 'angry'
  | 'overwhelmed' | 'empty' | 'hopeless'
  | 'calm' | 'happy' | 'grateful' | 'excited'
  | 'neutral'

/** 情境标签 */
export type ContextTag =
  | 'work' | 'relationship' | 'family' | 'social' | 'health'
  | 'finance' | 'personal_growth' | 'no_reason'

/** 建议模板接口 */
export interface OutreachSuggestion {
  id: string
  triggerType: OutreachTriggerType
  mood?: MoodTag
  context?: ContextTag
  title: string
  content: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  actionType?: 'breathing' | 'writing' | 'physical' | 'social' | 'sensory' | 'reflection'
}

/** 晨间问候模板 */
const morningCheckinTemplates: OutreachSuggestion[] = [
  {
    id: 'morning-1',
    triggerType: 'morning_checkin',
    title: '早安',
    content: '新的一天开始了。今天你想怎样度过？选一个基调吧：顺其自然、认真搞一把、慢慢来就好、允许自己不开心。',
    priority: 'low',
    actionType: 'reflection'
  },
  {
    id: 'morning-2',
    triggerType: 'morning_checkin',
    title: '昨晚睡得好吗',
    content: '昨晚你来过这里，做了几件让自己好一点的事。今天感觉怎么样？',
    priority: 'low',
    actionType: 'reflection'
  }
]

/** 晚间反思模板 */
const eveningReflectionTemplates: OutreachSuggestion[] = [
  {
    id: 'evening-1',
    triggerType: 'evening_reflection',
    title: '晚安前',
    content: '今天过得怎么样？还不错的话，是什么让你觉得不错？不太好的话，要不要做点什么让自己好一点？',
    priority: 'low',
    actionType: 'reflection'
  },
  {
    id: 'evening-2',
    triggerType: 'evening_reflection',
    title: '今天辛苦了',
    content: '不管今天发生了什么，你都撑过来了。今晚对自己好一点，早点休息吧。',
    priority: 'low',
    actionType: 'reflection'
  }
]

/** 高强度记录后模板 */
const highIntensityTemplates: OutreachSuggestion[] = [
  {
    id: 'high-intensity-1',
    triggerType: 'high_intensity',
    mood: 'anxious',
    title: '我注意到你刚才记录了强烈的焦虑',
    content: '你现在可能很难受。要不要试试4-7-8呼吸法？吸气4秒，屏住7秒，呼气8秒，重复4次。这能帮你快速平静下来。',
    priority: 'high',
    actionType: 'breathing'
  },
  {
    id: 'high-intensity-2',
    triggerType: 'high_intensity',
    mood: 'sad',
    title: '我注意到你刚才记录了强烈的难过',
    content: '难过的时候，说出来会好一些。把脑子里所有的话倒出来，不用组织语言，写下来就好。',
    priority: 'high',
    actionType: 'writing'
  },
  {
    id: 'high-intensity-3',
    triggerType: 'high_intensity',
    mood: 'angry',
    title: '我注意到你刚才记录了强烈的愤怒',
    content: '愤怒是正常的情绪。先深呼吸几次，然后想想：这件事值得你生气吗？还是只是累了？',
    priority: 'high',
    actionType: 'breathing'
  },
  {
    id: 'high-intensity-4',
    triggerType: 'high_intensity',
    mood: 'lonely',
    title: '我注意到你刚才记录了强烈的孤独',
    content: '今夜有很多人都和你一样，还没睡。要不要看看树洞里别人在说什么？或者给陌生人说一句晚安？',
    priority: 'high',
    actionType: 'social'
  }
]

/** 沉默预警模板 */
const silenceWarningTemplates: OutreachSuggestion[] = [
  {
    id: 'silence-1',
    triggerType: 'silence_warning',
    title: '好久没见你了',
    content: '你已经3天没来了。上次你来的时候说了句"好累，什么都不想做"。这几天还好吗？',
    priority: 'medium'
  },
  {
    id: 'silence-2',
    triggerType: 'silence_warning',
    title: '有点担心你',
    content: '你平时每天都会来打卡，最近几天没看到你。如果有什么想说的，我一直在这里。',
    priority: 'medium'
  }
]

/** 模式发现模板 */
const patternDiscoveryTemplates: OutreachSuggestion[] = [
  {
    id: 'pattern-1',
    triggerType: 'pattern_discovery',
    title: '我发现了一个规律',
    content: '过去2个月，每次和家人通话后，你第二天情绪都会低一些。也许家人通话对你来说是一个情绪消耗。这个发现对你有用吗？',
    priority: 'medium',
    actionType: 'reflection'
  },
  {
    id: 'pattern-2',
    triggerType: 'pattern_discovery',
    title: '你的焦虑有规律',
    content: '我注意到你通常在周日晚开始焦虑，周一有会议或汇报。下次周日晚上，我会提前提醒你做呼吸练习。',
    priority: 'medium',
    actionType: 'reflection'
  }
]

/** 急救后跟进模板 */
const followupEmergencyTemplates: OutreachSuggestion[] = [
  {
    id: 'followup-1',
    triggerType: 'followup_emergency',
    title: '昨晚你来过',
    content: '昨晚你用了急救流程，做了呼吸练习。今天感觉怎么样？好一点了吗？',
    priority: 'medium',
    actionType: 'reflection'
  },
  {
    id: 'followup-2',
    triggerType: 'followup_emergency',
    title: '还记得昨晚吗',
    content: '昨晚你写了一些东西，做了几件让自己好一点的事。记住，你昨晚自己做到了。',
    priority: 'medium',
    actionType: 'reflection'
  }
]

/** 好消息模板 */
const goodNewsTemplates: OutreachSuggestion[] = [
  {
    id: 'goodnews-1',
    triggerType: 'good_news',
    title: '你在变好',
    content: '这周你的情绪指数比上周高了9分。你可能自己没注意到，但我看到了。这周做了什么不一样的事？',
    priority: 'low',
    actionType: 'reflection'
  },
  {
    id: 'goodnews-2',
    triggerType: 'good_news',
    title: '进步很大',
    content: '第一次来的时候你的情绪指数是32分，现在平均58分。你在变好，继续保持！',
    priority: 'low',
    actionType: 'reflection'
  }
]

/** 危机干预模板 */
const crisisInterventionTemplates: OutreachSuggestion[] = [
  {
    id: 'crisis-1',
    triggerType: 'crisis_intervention',
    title: '我很担心你',
    content: '如果你正在经历非常困难的时刻，请记住：你不是一个人。可以拨打希望24小时热线：400-161-9995。有人愿意听你说。',
    priority: 'critical'
  },
  {
    id: 'crisis-2',
    triggerType: 'crisis_intervention',
    title: '紧急帮助',
    content: '如果你感到无法承受的痛苦，请立即联系：\n• 希望24热线：400-161-9995\n• 北京心理危机研究与干预中心：010-82951332\n• 生命热线：400-821-1215\n\n这些电话24小时有人接听。',
    priority: 'critical'
  }
]

/** 所有建议模板集合 */
export const outreachSuggestions: OutreachSuggestion[] = [
  ...morningCheckinTemplates,
  ...eveningReflectionTemplates,
  ...highIntensityTemplates,
  ...silenceWarningTemplates,
  ...patternDiscoveryTemplates,
  ...followupEmergencyTemplates,
  ...goodNewsTemplates,
  ...crisisInterventionTemplates
]

/** 根据触发类型获取建议 */
export function getSuggestionsByTrigger(triggerType: OutreachTriggerType): OutreachSuggestion[] {
  return outreachSuggestions.filter(s => s.triggerType === triggerType)
}

/** 根据情绪和情境获取建议 */
export function getSuggestionsByMoodAndContext(mood: MoodTag, context?: ContextTag): OutreachSuggestion[] {
  let suggestions = outreachSuggestions.filter(s => s.mood === mood)
  if (context) {
    suggestions = suggestions.filter(s => !s.context || s.context === context)
  }
  return suggestions
}

/** 随机选择一个建议 */
export function getRandomSuggestion(suggestions: OutreachSuggestion[]): OutreachSuggestion | null {
  if (suggestions.length === 0) return null
  const index = Math.floor(Math.random() * suggestions.length)
  return suggestions[index]
}
