// 星寰海 v2.0 - 急救流程配置
// 5条急救流程，每条包含多个步骤，每个步骤有详细内容

import type { EmergencyFlow } from '../engines/emergency/types';

/** 难过流程 */
const sadFlow: EmergencyFlow = {
  flowId: 'sad',
  mood: 'sad',
  displayName: '我好难过',
  color: '#4fc3f7', // 浅蓝（平静、舒缓）
  steps: [
    {
      stepId: 'naming',
      title: '你现在感到难过，对吗？',
      description: '承认并命名你的感受是第一步',
      component: 'EmergencyStepNaming',
      durationEstimate: 10,
      config: {
        subtitle: '给这种情绪一个名字，让它变得具体',
        options: [
          { id: 'sorrow', label: '悲伤', description: '一种深沉的失落感' },
          { id: 'disappointment', label: '失望', description: '期望落空的感觉' },
          { id: 'grief', label: '哀伤', description: '失去某人或某物的痛苦' },
          { id: 'melancholy', label: '忧郁', description: '一种淡淡的忧伤' },
          { id: 'heartbreak', label: '心碎', description: '情感上的创伤' }
        ]
      }
    },
    {
      stepId: 'writing',
      title: '把脑子里所有的话倒出来',
      description: '不用组织语言，想到什么写什么',
      component: 'EmergencyStepWriting',
      durationEstimate: 300,
      config: {
        subtitle: '表达性写作可以帮助释放情绪',
        prompts: [
          { id: 'p1', text: '今天发生了什么让我难过的事...' },
          { id: 'p2', text: '我现在心里在想什么...' },
          { id: 'p3', text: '我希望有人能对我说...' },
          { id: 'p4', text: '这种感觉让我想起了...' }
        ],
        crisisKeywords: ['自杀', '不想活', '结束生命', '活着没意思']
      }
    },
    {
      stepId: 'action',
      title: '做一件小事来安抚自己',
      description: '选一个微行动来缓解情绪',
      component: 'EmergencyStepAction',
      durationEstimate: 60,
      config: {
        subtitle: '接地技术可以帮助你回到当下',
        options: [
          { id: 'grounding', title: '5-4-3-2-1 接地练习', description: '用感官回到当下' },
          { id: 'breathing', title: '深呼吸放松', description: '4-7-8 呼吸法' },
          { id: 'self-compassion', title: '自我关怀', description: '像对待朋友一样对待自己' }
        ],
        defaultOptionId: 'grounding'
      }
    },
    {
      stepId: 'connect',
      title: '今晚有人和你一样',
      description: '你不是一个人在感受这些',
      component: 'EmergencyStepConnect',
      durationEstimate: 10,
      config: {
        subtitle: '分享你的感受，找到共鸣',
        resourceType: 'peer',
        resources: [
          { id: 'treehole', title: '树洞倾诉', description: '匿名分享你的故事', icon: '🌳' },
          { id: 'goodnight', title: '晚安交换', description: '给陌生人一句温暖', icon: '🌙' },
          { id: 'support', title: '互助社区', description: '找到理解你的人', icon: '💛' },
          { id: 'message', title: '暖心消息', description: '看看别人怎么说', icon: '💬' }
        ],
        supportMessages: [
          { id: 'm1', text: '我也经历过这样的时刻，后来发现一切都会好起来的', author: '一位朋友' },
          { id: 'm2', text: '允许自己难过，这是勇敢的表现', author: '温暖的人' },
          { id: 'm3', text: '你值得被温柔对待，包括被你自己', author: '关心你的人' }
        ]
      }
    },
    {
      stepId: 'closing',
      title: '今晚你做了4件事',
      description: '命名、写出、行动、连接。够了。',
      component: 'EmergencyStepClosing',
      durationEstimate: 10,
      config: {
        subtitle: '你已经迈出了重要的一步',
        summaries: [
          { stepNumber: 1, title: '命名情绪', content: '你给了这种感受一个名字' },
          { stepNumber: 2, title: '表达感受', content: '你把内心的话写了出来' },
          { stepNumber: 3, title: '采取行动', content: '你尝试了让自己平静的方法' },
          { stepNumber: 4, title: '建立连接', content: '你知道自己不是一个人' }
        ],
        encouragements: [
          { id: 'e1', text: '难过是正常的，这说明你在乎', icon: '💙' },
          { id: 'e2', text: '你已经做得很棒了', icon: '🌟' },
          { id: 'e3', text: '明天又是新的一天', icon: '☀️' },
          { id: 'e4', text: '你的感受很重要，值得被倾听', icon: '💝' }
        ],
        showGratitude: true
      }
    }
  ]
};

/** 焦虑流程 */
const anxiousFlow: EmergencyFlow = {
  flowId: 'anxious',
  mood: 'anxious',
  displayName: '我好焦虑',
  color: '#ff8a65', // 橙红（温暖、释放）
  steps: [
    {
      stepId: 'naming',
      title: '焦虑来了，我们先稳住',
      description: '承认焦虑的存在，不要对抗它',
      component: 'EmergencyStepNaming',
      durationEstimate: 10,
      config: {
        subtitle: '给焦虑一个名字，观察它',
        options: [
          { id: 'worry', label: '担忧', description: '对未来的不确定感' },
          { id: 'panic', label: '恐慌', description: '突然的强烈恐惧' },
          { id: 'tension', label: '紧张', description: '身体紧绷的感觉' },
          { id: 'overwhelm', label: '不知所措', description: '事情太多感觉无法应对' },
          { id: 'restlessness', label: '坐立不安', description: '无法平静下来' }
        ]
      }
    },
    {
      stepId: 'writing',
      title: '把焦虑的事一条一条写出来',
      description: '让大脑从"想"切换到"写"',
      component: 'EmergencyStepWriting',
      durationEstimate: 300,
      config: {
        subtitle: '写下让你焦虑的事情，把它们从脑子里移出来',
        prompts: [
          { id: 'p1', text: '是什么让我感到焦虑...' },
          { id: 'p2', text: '我在担心什么最坏的结果...' },
          { id: 'p3', text: '如果最坏的情况发生，我能做什么...' },
          { id: 'p4', text: '其实我知道，大部分担心都不会发生...' }
        ],
        crisisKeywords: ['自杀', '不想活', '结束生命', '活着没意思']
      }
    },
    {
      stepId: 'action',
      title: '做一个呼吸练习',
      description: '4-7-8 呼吸法可以快速缓解焦虑',
      component: 'EmergencyStepAction',
      durationEstimate: 120,
      config: {
        subtitle: '专注于呼吸，让身体放松',
        options: [
          { id: 'breathing', title: '4-7-8 深呼吸', description: '吸气4秒，屏住7秒，呼气8秒' },
          { id: 'muscle-relaxation', title: '渐进式肌肉放松', description: '依次收紧和放松肌肉' },
          { id: 'grounding', title: '5-4-3-2-1 接地', description: '用感官回到当下' }
        ],
        defaultOptionId: 'breathing'
      }
    },
    {
      stepId: 'connect',
      title: '寻求专业帮助',
      description: '如果焦虑持续困扰你，专业人士可以提供帮助',
      component: 'EmergencyStepConnect',
      durationEstimate: 10,
      config: {
        subtitle: '你不需要独自承受',
        resourceType: 'professional',
        resources: [
          { id: 'hotline', title: '心理援助热线', description: '400-161-9995，24小时免费', icon: '📞' },
          { id: 'counselor', title: '在线咨询', description: '专业心理咨询师一对一服务', icon: '👨‍⚕️' },
          { id: 'therapy', title: '认知行为疗法', description: '学习管理焦虑的技巧', icon: '📚' },
          { id: 'app', title: '冥想应用', description: '引导式冥想和呼吸练习', icon: '📱' }
        ]
      }
    },
    {
      stepId: 'closing',
      title: '把能控制的做一件，不能控制的今晚别想',
      description: '你已经迈出了第一步',
      component: 'EmergencyStepClosing',
      durationEstimate: 10,
      config: {
        subtitle: '焦虑不会一夜消失，但你可以开始应对它',
        summaries: [
          { stepNumber: 1, title: '识别焦虑', content: '你给焦虑起了名字' },
          { stepNumber: 2, title: '写下担忧', content: '你把焦虑的事写了出来' },
          { stepNumber: 3, title: '呼吸练习', content: '你尝试了放松技巧' },
          { stepNumber: 4, title: '寻求支持', content: '你知道可以获得帮助' }
        ],
        encouragements: [
          { id: 'e1', text: '焦虑是你的一部分，但不是全部', icon: '🧡' },
          { id: 'e2', text: '你已经在学习如何与焦虑相处', icon: '🌱' },
          { id: 'e3', text: '每一次练习都会让下次更容易', icon: '✨' },
          { id: 'e4', text: '你比自己想象的更强大', icon: '💪' }
        ],
        showGratitude: false
      }
    }
  ]
};

/** 累流程 */
const tiredFlow: EmergencyFlow = {
  flowId: 'tired',
  mood: 'tired',
  displayName: '我好累',
  color: '#9fa8da', // 淡紫（柔和、休息）
  steps: [
    {
      stepId: 'naming',
      title: '你累了，这很正常',
      description: '允许自己感到疲惫，不要自责',
      component: 'EmergencyStepNaming',
      durationEstimate: 10,
      config: {
        subtitle: '给这种疲惫一个名字',
        options: [
          { id: 'physical', label: '身体疲惫', description: '体力消耗过大' },
          { id: 'mental', label: '精神疲惫', description: '脑力劳动过度' },
          { id: 'emotional', label: '情绪疲惫', description: '照顾他人太多' },
          { id: 'burnout', label: '倦怠', description: '长期压力导致' },
          { id: 'exhaustion', label: '精疲力竭', description: '完全耗尽能量' }
        ]
      }
    },
    {
      stepId: 'writing',
      title: '是什么消耗了你的能量？',
      description: '找出让你累的原因',
      component: 'EmergencyStepWriting',
      durationEstimate: 180,
      config: {
        subtitle: '写下消耗你能量的事情',
        prompts: [
          { id: 'p1', text: '今天做了什么让我特别累的事...' },
          { id: 'p2', text: '我的精力被什么消耗了...' },
          { id: 'p3', text: '我需要什么才能恢复...' },
          { id: 'p4', text: '我可以放下什么...' }
        ],
        crisisKeywords: ['自杀', '不想活', '结束生命', '活着没意思']
      }
    },
    {
      stepId: 'action',
      title: '做一个5分钟微休息',
      description: '即使只有几分钟，也能帮助你恢复',
      component: 'EmergencyStepAction',
      durationEstimate: 60,
      config: {
        subtitle: '选择一种方式给自己充电',
        options: [
          { id: 'micro-rest', title: '微休息协议', description: '5分钟快速恢复能量' },
          { id: 'breathing', title: '深呼吸放松', description: '简单的呼吸练习' },
          { id: 'muscle-relaxation', title: '肌肉放松', description: '释放身体紧张' }
        ],
        defaultOptionId: 'micro-rest'
      }
    },
    {
      stepId: 'connect',
      title: '改善睡眠质量',
      description: '良好的睡眠是恢复能量的关键',
      component: 'EmergencyStepConnect',
      durationEstimate: 10,
      config: {
        subtitle: '试试这些睡眠卫生建议',
        resourceType: 'sleep',
        resources: [
          { id: 'routine', title: '建立规律作息', description: '每天固定时间睡觉和起床' },
          { id: 'environment', title: '优化睡眠环境', description: '黑暗、安静、凉爽的房间' },
          { id: 'screen', title: '睡前远离屏幕', description: '至少提前1小时放下手机' },
          { id: 'winddown', title: '放松仪式', description: '阅读、冥想、热水澡' }
        ]
      }
    },
    {
      stepId: 'closing',
      title: '明天的事明天再说',
      description: '今晚好好休息',
      component: 'EmergencyStepClosing',
      durationEstimate: 10,
      config: {
        subtitle: '休息不是偷懒，是必要的自我关怀',
        summaries: [
          { stepNumber: 1, title: '承认疲惫', content: '你允许自己感到累' },
          { stepNumber: 2, title: '找出原因', content: '你分析了能量消耗的来源' },
          { stepNumber: 3, title: '微休息', content: '你给自己短暂的休息' },
          { stepNumber: 4, title: '关注睡眠', content: '你了解了改善睡眠的方法' }
        ],
        encouragements: [
          { id: 'e1', text: '累了就休息，这是对自己负责', icon: '💜' },
          { id: 'e2', text: '你不需要一直坚强', icon: '🌸' },
          { id: 'e3', text: '休息后你会更有力量', icon: '🌙' },
          { id: 'e4', text: '照顾好自己不是自私', icon: '💖' }
        ],
        showGratitude: true
      }
    }
  ]
};

/** 孤独流程 */
const lonelyFlow: EmergencyFlow = {
  flowId: 'lonely',
  mood: 'lonely',
  displayName: '我好孤独',
  color: '#80deea', // 青色（清新、连接）
  steps: [
    {
      stepId: 'naming',
      title: '孤独感只是信号，不是判决',
      description: '孤独是一种感受，它会过去',
      component: 'EmergencyStepNaming',
      durationEstimate: 10,
      config: {
        subtitle: '描述你感受到的孤独',
        options: [
          { id: 'isolation', label: '孤立', description: '感觉自己被隔离' },
          { id: 'missing', label: '想念某人', description: '渴望特定的人' },
          { id: 'misunderstood', label: '不被理解', description: '感觉没人懂你' },
          { id: 'empty', label: '空虚', description: '内心感到空洞' },
          { id: 'disconnected', label: '断开连接', description: '与周围世界脱节' }
        ]
      }
    },
    {
      stepId: 'writing',
      title: '探索你的孤独',
      description: '写下你对孤独的感受',
      component: 'EmergencyStepWriting',
      durationEstimate: 240,
      config: {
        subtitle: '通过书写理解你的孤独',
        prompts: [
          { id: 'p1', text: '孤独对我来说意味着什么...' },
          { id: 'p2', text: '我什么时候最容易感到孤独...' },
          { id: 'p3', text: '我真正渴望的是什么...' },
          { id: 'p4', text: '如果我不孤独，我会做什么...' }
        ],
        crisisKeywords: ['自杀', '不想活', '结束生命', '活着没意思']
      }
    },
    {
      stepId: 'action',
      title: '练习自我关怀',
      description: '像对待好朋友一样对待自己',
      component: 'EmergencyStepAction',
      durationEstimate: 60,
      config: {
        subtitle: '学会与自己相处',
        options: [
          { id: 'self-compassion', title: '自我关怀练习', description: '温柔地对待自己' },
          { id: 'sensory', title: '感官着陆', description: '用感官回到当下' },
          { id: 'breathing', title: '深呼吸放松', description: '平静身心' }
        ],
        defaultOptionId: 'self-compassion'
      }
    },
    {
      stepId: 'connect',
      title: '找到你的社区',
      description: '与理解你的人建立连接',
      component: 'EmergencyStepConnect',
      durationEstimate: 10,
      config: {
        subtitle: '这里有人在乎你',
        resourceType: 'community',
        resources: [
          { id: 'treehole', title: '树洞社区', description: '匿名分享，找到共鸣', icon: '🌳' },
          { id: 'interest', title: '兴趣小组', description: '加入志同道合的人群', icon: '🎯' },
          { id: 'volunteer', title: '志愿服务', description: '通过帮助他人获得连接', icon: '🤝' },
          { id: 'online', title: '在线社区', description: '随时随地找到陪伴', icon: '💻' }
        ]
      }
    },
    {
      stepId: 'closing',
      title: '今晚你不是一个人',
      description: '这里有人在乎你',
      component: 'EmergencyStepClosing',
      durationEstimate: 10,
      config: {
        subtitle: '孤独的时刻会过去，连接永远存在',
        summaries: [
          { stepNumber: 1, title: '认识孤独', content: '你描述了自己的感受' },
          { stepNumber: 2, title: '探索内心', content: '你写下了对孤独的理解' },
          { stepNumber: 3, title: '自我关怀', content: '你学会了善待自己' },
          { stepNumber: 4, title: '寻找连接', content: '你知道可以找到同伴' }
        ],
        encouragements: [
          { id: 'e1', text: '孤独不等于没有人爱你', icon: '💚' },
          { id: 'e2', text: '你值得被连接和被看见', icon: '🌈' },
          { id: 'e3', text: '有时候，先爱自己是第一步', icon: '💗' },
          { id: 'e4', text: '连接从接纳自己开始', icon: '🌻' }
        ],
        showGratitude: true
      }
    }
  ]
};

/** 说不出来流程 */
const unclearFlow: EmergencyFlow = {
  flowId: 'unclear',
  mood: 'unclear',
  displayName: '说不出来',
  color: '#ce93d8', // 薰衣草紫（模糊、温柔）
  steps: [
    {
      stepId: 'naming',
      title: '说不清楚也没关系',
      description: '有时候语言无法表达',
      component: 'EmergencyStepNaming',
      durationEstimate: 10,
      config: {
        subtitle: '选择一个最接近的描述',
        options: [
          { id: 'numb', label: '麻木', description: '感觉不到任何东西' },
          { id: 'confused', label: '混乱', description: '思绪一团糟' },
          { id: 'overwhelmed', label: '淹没', description: '太多感受无法处理' },
          { id: 'blank', label: '空白', description: '什么都想不起来' },
          { id: 'trapped', label: '被困', description: '说不出的压抑' }
        ]
      }
    },
    {
      stepId: 'writing',
      title: '自由联想写作',
      description: '不用思考，让文字自然流出',
      component: 'EmergencyStepWriting',
      durationEstimate: 240,
      config: {
        subtitle: '随便写点什么，不需要有意义',
        prompts: [
          { id: 'p1', text: '我现在脑子里的任何词...' },
          { id: 'p2', text: '颜色、声音、画面...' },
          { id: 'p3', text: '任何跳进脑海里的东西...' },
          { id: 'p4', text: '或者只是重复一个字...' }
        ],
        crisisKeywords: ['自杀', '不想活', '结束生命', '活着没意思']
      }
    },
    {
      stepId: 'action',
      title: '选择一个感官着陆练习',
      description: '用感官代替语言',
      component: 'EmergencyStepAction',
      durationEstimate: 60,
      config: {
        subtitle: '专注于一个感官，回到当下',
        options: [
          { id: 'sensory', title: '感官着陆', description: '视觉、听觉、触觉、嗅觉' },
          { id: 'breathing', title: '深呼吸', description: '专注于呼吸' },
          { id: 'grounding', title: '5-4-3-2-1', description: '经典的接地技术' }
        ],
        defaultOptionId: 'sensory'
      }
    },
    {
      stepId: 'connect',
      title: '专业咨询选项',
      description: '有时候需要专业人士的帮助',
      component: 'EmergencyStepConnect',
      durationEstimate: 10,
      config: {
        subtitle: '说出来很难，但有人愿意听',
        resourceType: 'counseling',
        resources: [
          { id: 'hotline', title: '心理热线', description: '400-161-9995，随时拨打', icon: '📞' },
          { id: 'chat', title: '在线聊天', description: '文字交流可能更容易', icon: '💬' },
          { id: 'therapist', title: '找咨询师', description: '专业的倾听者', icon: '🎯' },
          { id: 'group', title: '支持小组', description: '和有相似经历的人聊聊', icon: '👥' }
        ]
      }
    },
    {
      stepId: 'closing',
      title: '说不出来就不说',
      description: '你来了，就够了',
      component: 'EmergencyStepClosing',
      durationEstimate: 10,
      config: {
        subtitle: '有时候，沉默也是一种表达',
        summaries: [
          { stepNumber: 1, title: '接纳状态', content: '你允许自己说不清楚' },
          { stepNumber: 2, title: '自由书写', content: '你尝试了非语言表达' },
          { stepNumber: 3, title: '感官练习', content: '你用其他方式安抚自己' },
          { stepNumber: 4, title: '知道资源', content: '你知道可以获得帮助' }
        ],
        encouragements: [
          { id: 'e1', text: '说不出来不是你的错', icon: '💜' },
          { id: 'e2', text: '你的感受真实存在，即使没有名字', icon: '🌫️' },
          { id: 'e3', text: '有时候，静静地待着就好', icon: '☁️' },
          { id: 'e4', text: '你在这里，这就足够了', icon: '⭐' }
        ],
        showGratitude: false
      }
    }
  ]
};

/** 所有急救流程 */
export const EMERGENCY_FLOWS: EmergencyFlow[] = [
  sadFlow,
  anxiousFlow,
  tiredFlow,
  lonelyFlow,
  unclearFlow
];

/** 根据flowId获取流程配置 */
export function getFlowById(flowId: string): EmergencyFlow | undefined {
  return EMERGENCY_FLOWS.find(flow => flow.flowId === flowId);
}

/** 根据情绪类型获取流程配置 */
export function getFlowByMood(mood: string): EmergencyFlow | undefined {
  return EMERGENCY_FLOWS.find(flow => flow.mood === mood);
}