export interface EmotionTrigger {
  type: 'time_after_loss' | 'anniversary' | 'health_event' | 'user_input' | 'checkin_streak'
  params: Record<string, string | number>
}

export interface EmotionResponse {
  id: string
  tone: 'gentle' | 'encouraging' | 'empathetic' | 'celebratory' | 'informative'
  content: string
  suggestions: string[]
}

export interface EmotionScene {
  id: string
  name: string
  category: 'grief' | 'anxiety' | 'celebration' | 'daily_care' | 'health_concern'
  triggerKeywords: string[]
  triggerConditions: EmotionTrigger[]
  responses: EmotionResponse[]
  followUpScenes: string[]
}

export const EMOTION_SCENES: EmotionScene[] = [
  {
    id: 'grief_just_passed',
    name: '刚离世',
    category: 'grief',
    triggerKeywords: ['离世', '走了', '去世', '离开', '不在了', '没了'],
    triggerConditions: [
      {
        type: 'time_after_loss',
        params: { daysAfterLoss: 0, daysAfterLossMax: 3 }
      }
    ],
    responses: [
      {
        id: 'grief_just_passed_r1',
        tone: 'gentle',
        content: '{petName}刚刚离开了，我知道你现在一定非常难过。失去一个陪伴多年的家人，这种痛是无法用语言形容的。请允许自己悲伤，不要压抑情绪，哭泣是正常的。',
        suggestions: ['允许自己悲伤，不要强迫自己坚强', '找一个安静的地方，好好和{petName}告别', '如果需要，可以和身边的人倾诉']
      },
      {
        id: 'grief_just_passed_r2',
        tone: 'empathetic',
        content: '听到{petName}离开的消息，我很难过。它一定很幸福，因为有你这样爱它的家人陪伴到最后。此刻的悲伤，正是你们之间深厚感情的证明。',
        suggestions: ['给自己一些时间，不要急于做决定', '可以整理{petName}的遗物，但不必着急', '记得照顾好自己，{petName}也希望你好好的']
      }
    ],
    followUpScenes: ['grief_one_week', 'grief_one_month']
  },
  {
    id: 'grief_one_week',
    name: '一周纪念',
    category: 'grief',
    triggerKeywords: ['一周', '七天', '一个星期'],
    triggerConditions: [
      {
        type: 'time_after_loss',
        params: { daysAfterLoss: 7 }
      }
    ],
    responses: [
      {
        id: 'grief_one_week_r1',
        tone: 'gentle',
        content: '已经一周了，{petName}离开一周了。这一周你可能经历了各种情绪——悲伤、空虚、甚至自责，这些都是正常的。回忆和{petName}在一起的美好时光，那些快乐的记忆会永远留在你心里。',
        suggestions: ['写一封给{petName}的纪念信，把想说的话都写下来', '翻看和{petName}的照片，回忆美好时光', '不必强迫自己走出悲伤，按自己的节奏来']
      },
      {
        id: 'grief_one_week_r2',
        tone: 'empathetic',
        content: '一周过去了，你可能还是会时不时想起{petName}——它吃饭的样子、等你的眼神、撒娇的动作。这些回忆不是让你更痛苦，而是证明你们之间的爱从未消失。',
        suggestions: ['可以和家人朋友分享关于{petName}的故事', '如果还没整理{petName}的物品，可以慢慢来', '给自己一个拥抱，你已经很坚强了']
      }
    ],
    followUpScenes: ['grief_one_month', 'grief_first_holiday']
  },
  {
    id: 'grief_one_month',
    name: '一月纪念',
    category: 'grief',
    triggerKeywords: ['一个月', '一月', '三十天'],
    triggerConditions: [
      {
        type: 'time_after_loss',
        params: { daysAfterLoss: 30 }
      }
    ],
    responses: [
      {
        id: 'grief_one_month_r1',
        tone: 'empathetic',
        content: '一个月了，时间在走，但思念没有减少。也许有些人会说"该走出来了"，但悲伤没有时间表。{petName}陪伴了你那么久，一个月的时间远远不够忘记。你的悲伤，恰恰说明你有多爱它。',
        suggestions: ['做一本{petName}的纪念相册，收集最珍贵的照片和回忆', '可以在家里设一个小小的纪念角落', '如果悲伤仍然很重，可以考虑加入宠物丧失互助群']
      },
      {
        id: 'grief_one_month_r2',
        tone: 'gentle',
        content: '一个月了，也许有些日子你觉得好一些了，有些日子又突然被思念淹没。这种起伏是完全正常的。{petName}给你的爱不会因为它的离开而消失，它会以另一种方式继续陪伴你。',
        suggestions: ['允许自己有好日子和坏日子', '可以种一棵植物纪念{petName}，看着它成长', '如果感到持续的低落，不要犹豫寻求专业帮助']
      }
    ],
    followUpScenes: ['grief_first_holiday']
  },
  {
    id: 'grief_first_holiday',
    name: '首个节日/生日',
    category: 'grief',
    triggerKeywords: ['节日', '生日', '过年', '中秋', '圣诞', '新年'],
    triggerConditions: [
      {
        type: 'anniversary',
        params: { eventType: 'holiday_or_birthday' }
      }
    ],
    responses: [
      {
        id: 'grief_first_holiday_r1',
        tone: 'empathetic',
        content: '节日到了，没有{petName}的节日，心里一定空落落的。以前它可能在你身边蹭来蹭去，现在那个位置空了。在节日里思念{petName}是再正常不过的事，不必假装开心。',
        suggestions: ['为{petName}点一支蜡烛，安静地纪念', '在节日餐桌上留一个{petName}的位置', '做一件{petName}喜欢的事来纪念它']
      },
      {
        id: 'grief_first_holiday_r2',
        tone: 'gentle',
        content: '这是没有{petName}的第一个节日，我知道很难。但请相信，{petName}在的时候，一定希望你快乐。你可以悲伤，也可以试着找到新的方式来度过这个节日。',
        suggestions: ['写一段话给{petName}，告诉它你有多想它', '和家人一起分享关于{petName}的趣事', '不必勉强参加所有活动，照顾好自己的感受']
      }
    ],
    followUpScenes: []
  },
  {
    id: 'anxiety_pet_sick',
    name: '宠物生病中',
    category: 'anxiety',
    triggerKeywords: ['生病', '不舒服', '不舒服', '呕吐', '拉肚子', '不吃东西', '没精神'],
    triggerConditions: [
      {
        type: 'health_event',
        params: { eventSubtype: 'illness' }
      }
    ],
    responses: [
      {
        id: 'anxiety_pet_sick_r1',
        tone: 'empathetic',
        content: '{petName}生病了，你一定很担心。作为它的家人，你的焦虑和心疼是完全可以理解的。请记住，你的陪伴和关心就是{petName}最好的安慰。',
        suggestions: ['记录{petName}每日的食欲、精神、排泄情况', '按时给药，记录用药时间和反应', '保持环境安静舒适，让{petName}好好休息']
      },
      {
        id: 'anxiety_pet_sick_r2',
        tone: 'encouraging',
        content: '我知道看着{petName}不舒服很难受，但请相信，很多宠物疾病经过治疗都能恢复。你已经做了最对的事——带它看医生、照顾它。{petName}很幸运有你。',
        suggestions: ['遵医嘱治疗，不要自行调整药物', '观察症状变化，及时和兽医沟通', '也要照顾好自己的情绪，适当休息']
      }
    ],
    followUpScenes: ['celebration_recovery', 'anxiety_surgery']
  },
  {
    id: 'anxiety_surgery',
    name: '宠物手术前后',
    category: 'anxiety',
    triggerKeywords: ['手术', '开刀', '麻醉', '术前', '术后'],
    triggerConditions: [
      {
        type: 'user_input',
        params: { matchKeywords: '手术,开刀,麻醉,术前,术后' }
      }
    ],
    responses: [
      {
        id: 'anxiety_surgery_r1',
        tone: 'empathetic',
        content: '{petName}要做手术了，紧张是正常的。手术对宠物和家长都是一次考验。但请相信兽医的专业，现代兽医学已经非常成熟，很多手术的成功率都很高。',
        suggestions: ['术前遵医嘱禁食禁水', '准备好术后护理用品（伊丽莎白圈、软垫、温热毯）', '提前了解术后注意事项，减少慌乱']
      },
      {
        id: 'anxiety_surgery_r2',
        tone: 'encouraging',
        content: '手术是为了让{petName}更健康，虽然过程让人担心，但这是通向康复的必经之路。你为{petName}做了正确的决定，它虽然不懂，但一定会感谢你的。',
        suggestions: ['术后保持安静环境，限制活动', '按时给药，观察伤口愈合情况', '记录食欲和排泄，有异常及时联系兽医']
      }
    ],
    followUpScenes: ['celebration_recovery']
  },
  {
    id: 'anxiety_new_pet',
    name: '新宠物适应期',
    category: 'anxiety',
    triggerKeywords: ['新宠物', '领养', '新来的', '刚带回家', '不适应', '躲着'],
    triggerConditions: [
      {
        type: 'user_input',
        params: { matchKeywords: '新宠物,领养,新来的,刚带回家,不适应,躲着' }
      }
    ],
    responses: [
      {
        id: 'anxiety_new_pet_r1',
        tone: 'gentle',
        content: '新成员到家了！{petName}可能还在适应新环境，躲藏、不吃东西、紧张都是正常的。给它一些时间和空间，不要着急，慢慢来。',
        suggestions: ['给{petName}一个安静的小空间作为安全区', '不要强行抱它或追它，让它自己探索', '保持日常作息稳定，减少突然的声响']
      },
      {
        id: 'anxiety_new_pet_r2',
        tone: 'encouraging',
        content: '每只宠物适应新家的速度不同，有的几天，有的需要几周。{petName}现在可能害怕，但你的耐心和温柔它会慢慢感受到的。循序渐进，一切都会好起来的。',
        suggestions: ['用食物建立信任，先从远处投喂开始', '每天固定时间互动，建立规律感', '如果家里有其他宠物，分开适应后再慢慢介绍']
      }
    ],
    followUpScenes: ['daily_morning', 'daily_evening']
  },
  {
    id: 'celebration_birthday',
    name: '生日快乐',
    category: 'celebration',
    triggerKeywords: ['生日', '过生日', '生日快乐', '几岁'],
    triggerConditions: [
      {
        type: 'anniversary',
        params: { eventType: 'pet_birthday' }
      }
    ],
    responses: [
      {
        id: 'celebration_birthday_r1',
        tone: 'celebratory',
        content: '今天是{petName}的生日！🎂 感谢它又陪伴了你一年，每一个和它在一起的日子都是值得庆祝的。祝{petName}生日快乐，健康长寿！',
        suggestions: ['给{petName}准备一份特别的健康零食', '安排一次健康体检作为生日礼物', '拍一组生日照片，记录这个特别的日子']
      },
      {
        id: 'celebration_birthday_r2',
        tone: 'celebratory',
        content: '{petName}又长大了一岁！从它来到你身边的那天起，你们的生活就充满了温暖和快乐。今天，让我们一起庆祝{petName}的生日，感谢它带来的每一份幸福。',
        suggestions: ['带{petName}去它最喜欢的地方散步', '给它买一个新玩具作为生日礼物', '和{petName}一起度过一段特别的时光']
      }
    ],
    followUpScenes: ['daily_morning']
  },
  {
    id: 'celebration_checkin_7',
    name: '连续打卡7天',
    category: 'celebration',
    triggerKeywords: ['打卡', '坚持', '连续'],
    triggerConditions: [
      {
        type: 'checkin_streak',
        params: { streakDays: 7 }
      }
    ],
    responses: [
      {
        id: 'celebration_checkin_7_r1',
        tone: 'celebratory',
        content: '太棒了！你已经连续7天为{petName}打卡记录了！坚持记录是负责任的表现，这些数据对了解{petName}的健康状况非常有帮助。',
        suggestions: ['查看{petName}这一周的趋势报告', '给自己一个小奖励，坚持不容易', '继续保持，下一个目标是14天']
      },
      {
        id: 'celebration_checkin_7_r2',
        tone: 'encouraging',
        content: '连续7天打卡，你做到了！每一天的记录都是对{petName}的关爱。这些日积月累的数据，会在关键时刻帮助兽医更好地了解{petName}。',
        suggestions: ['回顾这周的记录，看看有没有需要关注的趋势', '设置每日提醒，帮助自己继续坚持', '分享你的打卡成就，鼓励更多宠物家长']
      }
    ],
    followUpScenes: ['daily_morning', 'daily_evening']
  },
  {
    id: 'celebration_recovery',
    name: '康复庆祝',
    category: 'celebration',
    triggerKeywords: ['康复', '好了', '痊愈', '恢复', '出院'],
    triggerConditions: [
      {
        type: 'health_event',
        params: { eventSubtype: 'recovery' }
      }
    ],
    responses: [
      {
        id: 'celebration_recovery_r1',
        tone: 'celebratory',
        content: '太好了！{petName}康复了！🎉 这段时间你辛苦了，日夜照顾、担惊受怕，现在终于可以松一口气了。{petName}能恢复健康，离不开你的悉心照料。',
        suggestions: ['继续观察{petName}的恢复情况，遵医嘱复查', '逐步恢复正常活动，不要一下子太剧烈', '给自己也放个小假，你也需要休息']
      },
      {
        id: 'celebration_recovery_r2',
        tone: 'encouraging',
        content: '{petName}挺过来了！这段日子你一定很不容易，但你没有放弃，{petName}也没有。现在它又恢复了活力，记得继续关注它的健康，预防胜于治疗。',
        suggestions: ['按时复查，确保完全康复', '调整饮食和运动计划，帮助{petName}恢复体力', '记录这次生病的经验，以后可以更好地预防']
      }
    ],
    followUpScenes: ['daily_morning']
  },
  {
    id: 'daily_morning',
    name: '早晨问候',
    category: 'daily_care',
    triggerKeywords: ['早上好', '早安', '起床', '新的一天'],
    triggerConditions: [
      {
        type: 'user_input',
        params: { timeOfDay: 'morning' }
      }
    ],
    responses: [
      {
        id: 'daily_morning_r1',
        tone: 'gentle',
        content: '早上好！新的一天开始了，{petName}是不是已经迫不及待地等你了？每一天的陪伴都是珍贵的，祝你和{petName}今天也过得开心。',
        suggestions: ['检查{petName}的食欲是否正常', '观察{petName}的精神状态', '确保饮水充足']
      },
      {
        id: 'daily_morning_r2',
        tone: 'encouraging',
        content: '早安！又是和{petName}在一起的一天。记得每天花一点时间关注它的状态，小细节往往藏着重要的健康信号。',
        suggestions: ['记录{petName}今天的食欲和排便情况', '检查{petName}的饮水量', '如果一切正常，别忘了打卡记录']
      }
    ],
    followUpScenes: ['daily_evening']
  },
  {
    id: 'daily_evening',
    name: '晚间回顾',
    category: 'daily_care',
    triggerKeywords: ['晚上好', '晚安', '今天', '回顾', '总结'],
    triggerConditions: [
      {
        type: 'user_input',
        params: { timeOfDay: 'evening' }
      }
    ],
    responses: [
      {
        id: 'daily_evening_r1',
        tone: 'gentle',
        content: '晚上好！今天和{petName}过得怎么样？一天结束前，花一点时间回顾一下它的状态，是对它最好的关心。',
        suggestions: ['回顾{petName}今天的食欲和精神状态', '检查今天的排便是否正常', '完成今日打卡记录']
      },
      {
        id: 'daily_evening_r2',
        tone: 'empathetic',
        content: '忙碌了一天，辛苦了。{petName}一定很感谢你的照顾。睡前再看看它，确认一切安好，然后好好休息，明天继续。',
        suggestions: ['确认{petName}的睡眠环境舒适', '如果今天有异常情况，记录下来', '给自己也一个晚安，你做得很好']
      }
    ],
    followUpScenes: ['daily_morning']
  }
]
