export type ThemeId =
  | 'minimal-premium'
  | 'minimal-sage'
  | 'cream-dopamine'
  | 'dopamine-yellow'
  | 'dopamine-green'
  | 'dopamine-pink'
  | 'dopamine-combo'
  | 'ink-wash'
  | 'ink-bamboo'
  | 'ink-rainblue'
  | 'modern-chinese'
  | 'healing-anime'
  | 'anime-sky'
  | 'morandi-gentle'
  | 'morandi-rose'
  | 'business-bluegray'
  | 'business-graphite'
  | 'night-focus'
  | 'night-aurora'

export type ThemeAesthetic =
  | 'minimal'
  | 'dopamine'
  | 'ink'
  | 'chinese'
  | 'anime'
  | 'morandi'
  | 'business'
  | 'night'

export type WallpaperSupport = {
  overlay: string
  blur: string
  brightness: string
  saturation: string
}

export type StudyTheme = {
  id: ThemeId
  name: string
  category: 'built-in' | 'extension'
  aesthetic: ThemeAesthetic
  defaultCandidate: boolean
  visualComfort: string
  recommendedFor: string[]
  accessibilityNotes: string[]
  wallpaperSupport: WallpaperSupport
  design: {
    tone: string
    scene: string
    principle: string
    aiVoice: string
  }
  tokens: {
    colors: {
      background: string
      surface: string
      surfaceStrong: string
      primary: string
      secondary: string
      accent: string
      text: string
      muted: string
      border: string
    }
    gradients: {
      hero: string
      card: string
    }
    charts: {
      plan: string
      focus: string
      review: string
    }
    effects: {
      radius: string
      shadow: string
      glass: string
    }
  }
}

export const themeRegistry: StudyTheme[] = [
  {
    id: 'minimal-premium',
    name: '极简高级感',
    category: 'built-in',
    aesthetic: 'minimal',
    defaultCandidate: true,
    visualComfort: '低噪音、低饱和、适合长时间学习和办公',
    recommendedFor: ['长期使用', '办公学习', '信息密度偏好', '极简偏好'],
    accessibilityNotes: ['正文使用深灰蓝', '强调色小面积使用', '适合作为默认候选'],
    wallpaperSupport: { overlay: 'rgba(248, 247, 242, 0.72)', blur: '14px', brightness: '0.96', saturation: '0.82' },
    design: {
      tone: '极简高级、低噪音、长期耐看',
      scene: '适合长期学习、办公计划、日常任务和高频记录',
      principle: '用米白、灰蓝和雾绿建立低刺激底色，只用木色作为少量强调，让信息层级清晰且不疲劳。',
      aiVoice: '克制效率顾问型，直接给出结构、重点和下一步。'
    },
    tokens: {
      colors: {
        background: 'linear-gradient(135deg, #f8f7f2 0%, #ece8de 55%, #e7ece9 100%)',
        surface: 'rgba(255, 255, 255, 0.82)',
        surfaceStrong: '#ffffff',
        primary: '#2f4858',
        secondary: '#8fa6a3',
        accent: '#d8a75f',
        text: '#20242c',
        muted: '#667085',
        border: 'rgba(47, 72, 88, 0.14)'
      },
      gradients: {
        hero: 'linear-gradient(90deg, #2f4858, #8fa6a3)',
        card: 'linear-gradient(135deg, #ffffff, #f0eee7)'
      },
      charts: { plan: '#2f4858', focus: '#8fa6a3', review: '#d8a75f' },
      effects: { radius: '24px', shadow: '0 18px 42px rgba(47, 72, 88, 0.12)', glass: 'blur(16px)' }
    }
  },
  {
    id: 'minimal-sage',
    name: '极简鼠尾草',
    category: 'built-in',
    aesthetic: 'minimal',
    defaultCandidate: false,
    visualComfort: '灰绿低饱和、留白稳定、适合长期学习与桌面常驻',
    recommendedFor: ['长期使用', '低刺激偏好', '阅读复盘', '办公学习'],
    accessibilityNotes: ['主色低饱和', '正文保持深灰蓝', '强调色只用于进度和关键按钮'],
    wallpaperSupport: { overlay: 'rgba(243, 246, 239, 0.72)', blur: '14px', brightness: '0.96', saturation: '0.78' },
    design: {
      tone: '鼠尾草绿、安静留白、自然秩序',
      scene: '适合喜欢冷静自然感、希望界面少打扰的用户',
      principle: '用灰绿、石白和温木色建立清爽层次，减少色彩刺激但保留行动提示。',
      aiVoice: '安静整理型，强调清单、节奏和可持续推进。'
    },
    tokens: {
      colors: {
        background: 'linear-gradient(135deg, #f3f6ef 0%, #e7eee5 56%, #f7f1e6 100%)',
        surface: 'rgba(255, 255, 250, 0.82)',
        surfaceStrong: 'rgba(255, 255, 250, 0.96)',
        primary: '#627d68',
        secondary: '#9aaa91',
        accent: '#caa86a',
        text: '#202820',
        muted: '#667166',
        border: 'rgba(98, 125, 104, 0.16)'
      },
      gradients: {
        hero: '#627d68',
        card: 'linear-gradient(135deg, rgba(255, 255, 250, 0.96), rgba(231, 238, 229, 0.88))'
      },
      charts: { plan: '#627d68', focus: '#9aaa91', review: '#caa86a' },
      effects: { radius: '24px', shadow: '0 18px 44px rgba(98, 125, 104, 0.12)', glass: 'blur(16px)' }
    }
  },
  {
    id: 'cream-dopamine',
    name: '轻多巴胺年轻感',
    category: 'built-in',
    aesthetic: 'dopamine',
    defaultCandidate: true,
    visualComfort: '奶油底色、小面积高亮、适合打卡和轻松成长',
    recommendedFor: ['年轻用户', '自律打卡', '轻松成长', '情绪激励'],
    accessibilityNotes: ['高饱和色只用于按钮和徽章', '正文保持深色', '卡片使用奶油白保护可读性'],
    wallpaperSupport: { overlay: 'rgba(255, 247, 230, 0.68)', blur: '18px', brightness: '1.02', saturation: '0.9' },
    design: {
      tone: '奶油多巴胺、快乐成长、柔雾激励',
      scene: '适合打卡、习惯养成、成长激励和轻量日程',
      principle: '以奶油底色承托柔雾粉、浅黄和薄荷绿，把高亮控制在行动按钮与奖励反馈区域。',
      aiVoice: '活力陪伴型，给出轻松鼓励、微行动和正反馈。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(circle at 12% 14%, rgba(255, 182, 193, 0.32), transparent 26%), radial-gradient(circle at 88% 10%, rgba(255, 222, 125, 0.30), transparent 24%), linear-gradient(135deg, #fff7e6 0%, #fff1f5 48%, #ecfff7 100%)',
        surface: 'rgba(255, 255, 255, 0.78)',
        surfaceStrong: 'rgba(255, 255, 255, 0.94)',
        primary: '#ff7a90',
        secondary: '#58bfa3',
        accent: '#f5b84b',
        text: '#2b2833',
        muted: '#7a7180',
        border: 'rgba(255, 122, 144, 0.18)'
      },
      gradients: {
        hero: '#e86f83',
        card: '#fff3d8'
      },
      charts: { plan: '#ff7a90', focus: '#58bfa3', review: '#f5b84b' },
      effects: { radius: '28px', shadow: '0 24px 62px rgba(255, 122, 144, 0.16)', glass: 'blur(18px) saturate(1.12)' }
    }
  },
  {
    id: 'dopamine-yellow',
    name: '多巴胺柠檬黄',
    category: 'built-in',
    aesthetic: 'dopamine',
    defaultCandidate: false,
    visualComfort: '奶油黄为主、粉绿小面积点缀，明亮但不刺眼',
    recommendedFor: ['晨间打卡', '自律成长', '轻松计划', '快乐激励'],
    accessibilityNotes: ['黄色不承载正文', '文字使用深棕灰', '按钮保持高对比'],
    wallpaperSupport: { overlay: 'rgba(255, 249, 219, 0.68)', blur: '18px', brightness: '1.02', saturation: '0.88' },
    design: {
      tone: '柠檬奶油、明亮鼓励、轻盈行动',
      scene: '适合早起、晨间计划、每日打卡和轻松任务启动',
      principle: '用奶油黄做主情绪，绿色只负责完成感，粉色只负责奖励反馈，避免整屏高饱和。',
      aiVoice: '阳光鼓励型，给出轻快提示和小步开始。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(circle at 12% 12%, rgba(255, 224, 102, 0.34), transparent 26%), radial-gradient(circle at 88% 14%, rgba(115, 214, 159, 0.20), transparent 24%), linear-gradient(135deg, #fff9db 0%, #fff3c4 48%, #f3ffe8 100%)',
        surface: 'rgba(255, 255, 247, 0.80)',
        surfaceStrong: 'rgba(255, 255, 247, 0.95)',
        primary: '#e9a923',
        secondary: '#46b77a',
        accent: '#ef7a9b',
        text: '#2d2a1f',
        muted: '#776f58',
        border: 'rgba(233, 169, 35, 0.18)'
      },
      gradients: {
        hero: '#e9a923',
        card: 'linear-gradient(135deg, rgba(255, 255, 247, 0.96), rgba(255, 243, 196, 0.88))'
      },
      charts: { plan: '#e9a923', focus: '#46b77a', review: '#ef7a9b' },
      effects: { radius: '28px', shadow: '0 24px 62px rgba(233, 169, 35, 0.14)', glass: 'blur(18px) saturate(1.08)' }
    }
  },
  {
    id: 'dopamine-green',
    name: '多巴胺薄荷绿',
    category: 'built-in',
    aesthetic: 'dopamine',
    defaultCandidate: false,
    visualComfort: '薄荷绿为主、奶油底色、适合希望活力但不甜腻的用户',
    recommendedFor: ['习惯养成', '运动打卡', '清爽计划', '成长恢复'],
    accessibilityNotes: ['绿色用于主要操作', '黄色用于轻提示', '粉色只做奖励点缀'],
    wallpaperSupport: { overlay: 'rgba(236, 255, 247, 0.68)', blur: '18px', brightness: '1.02', saturation: '0.86' },
    design: {
      tone: '薄荷绿、多巴胺清爽、恢复行动',
      scene: '适合习惯养成、运动记录、低压力自律和清爽日程',
      principle: '让薄荷绿成为主色，搭配奶油黄和轻粉，让活力更干净，不再像混杂糖果色。',
      aiVoice: '清爽陪跑型，强调恢复、继续和完成后的正反馈。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(circle at 14% 12%, rgba(111, 225, 170, 0.32), transparent 26%), radial-gradient(circle at 88% 12%, rgba(255, 218, 111, 0.22), transparent 24%), linear-gradient(135deg, #ecfff7 0%, #f3fff0 48%, #fff7df 100%)',
        surface: 'rgba(255, 255, 248, 0.80)',
        surfaceStrong: 'rgba(255, 255, 248, 0.95)',
        primary: '#28a774',
        secondary: '#f0b73c',
        accent: '#ee7aa7',
        text: '#213229',
        muted: '#66786d',
        border: 'rgba(40, 167, 116, 0.18)'
      },
      gradients: {
        hero: '#28a774',
        card: 'linear-gradient(135deg, rgba(255, 255, 248, 0.96), rgba(236, 255, 247, 0.90))'
      },
      charts: { plan: '#28a774', focus: '#f0b73c', review: '#ee7aa7' },
      effects: { radius: '28px', shadow: '0 24px 62px rgba(40, 167, 116, 0.14)', glass: 'blur(18px) saturate(1.08)' }
    }
  },
  {
    id: 'dopamine-pink',
    name: '多巴胺蜜桃粉',
    category: 'built-in',
    aesthetic: 'dopamine',
    defaultCandidate: false,
    visualComfort: '蜜桃粉主色、浅奶油底、适合偏可爱和柔软正反馈',
    recommendedFor: ['女生自律', '生活打卡', '情绪激励', '温柔成长'],
    accessibilityNotes: ['粉色只做行动强调', '正文深色保证可读', '黄色与绿色作为辅助区分状态'],
    wallpaperSupport: { overlay: 'rgba(255, 241, 246, 0.68)', blur: '18px', brightness: '1.02', saturation: '0.86' },
    design: {
      tone: '蜜桃粉、柔软多巴胺、甜而克制',
      scene: '适合生活打卡、温柔复盘、轻松成长和情绪正反馈',
      principle: '以蜜桃粉作为主行动色，背景保持奶油白，绿色只代表完成，黄色只代表提醒。',
      aiVoice: '温柔鼓励型，允许中断，并把下一步拆得更轻。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(circle at 12% 14%, rgba(255, 148, 184, 0.30), transparent 26%), radial-gradient(circle at 86% 12%, rgba(255, 218, 111, 0.22), transparent 24%), linear-gradient(135deg, #fff1f6 0%, #fff7ea 48%, #f3fff4 100%)',
        surface: 'rgba(255, 255, 250, 0.80)',
        surfaceStrong: 'rgba(255, 255, 250, 0.95)',
        primary: '#ef6f9f',
        secondary: '#48b984',
        accent: '#f0b73c',
        text: '#332633',
        muted: '#7c6a78',
        border: 'rgba(239, 111, 159, 0.18)'
      },
      gradients: {
        hero: '#ef6f9f',
        card: 'linear-gradient(135deg, rgba(255, 255, 250, 0.96), rgba(255, 241, 246, 0.90))'
      },
      charts: { plan: '#ef6f9f', focus: '#48b984', review: '#f0b73c' },
      effects: { radius: '28px', shadow: '0 24px 62px rgba(239, 111, 159, 0.14)', glass: 'blur(18px) saturate(1.08)' }
    }
  },
  {
    id: 'dopamine-combo',
    name: '多巴胺组合色',
    category: 'built-in',
    aesthetic: 'dopamine',
    defaultCandidate: false,
    visualComfort: '组合色只用于装饰和图表，按钮保持主色，避免杂乱',
    recommendedFor: ['奖励系统', '成就墙', '轻游戏化', '活力桌面'],
    accessibilityNotes: ['组合渐变不用于长文本底色', '按钮使用主粉色', '状态仍保留文字说明'],
    wallpaperSupport: { overlay: 'rgba(255, 247, 230, 0.66)', blur: '20px', brightness: '1.03', saturation: '0.92' },
    design: {
      tone: '粉黄绿组合、多巴胺奖励、轻游戏化',
      scene: '适合喜欢活泼奖励感、成就墙和成长打卡的用户',
      principle: '组合色用于品牌标识、进度条和图表，按钮仍使用单一主色，既有多巴胺也不混乱。',
      aiVoice: '奖励陪伴型，用正反馈强化连续行动。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(circle at 12% 12%, rgba(239, 111, 159, 0.28), transparent 25%), radial-gradient(circle at 82% 10%, rgba(240, 183, 60, 0.26), transparent 24%), radial-gradient(circle at 78% 86%, rgba(72, 185, 132, 0.22), transparent 26%), linear-gradient(135deg, #fff7ea 0%, #fff1f6 48%, #effff5 100%)',
        surface: 'rgba(255, 255, 250, 0.79)',
        surfaceStrong: 'rgba(255, 255, 250, 0.95)',
        primary: '#ef6f9f',
        secondary: '#48b984',
        accent: '#f0b73c',
        text: '#312b31',
        muted: '#786f75',
        border: 'rgba(239, 111, 159, 0.18)'
      },
      gradients: {
        hero: 'linear-gradient(135deg, #ef6f9f 0%, #f0b73c 50%, #48b984 100%)',
        card: 'linear-gradient(135deg, rgba(255, 255, 250, 0.96), rgba(255, 241, 246, 0.88), rgba(239, 255, 245, 0.82))'
      },
      charts: { plan: '#ef6f9f', focus: '#48b984', review: '#f0b73c' },
      effects: { radius: '30px', shadow: '0 26px 70px rgba(239, 111, 159, 0.15)', glass: 'blur(20px) saturate(1.12)' }
    }
  },
  {
    id: 'ink-wash',
    name: '水墨留白',
    category: 'built-in',
    aesthetic: 'ink',
    defaultCandidate: false,
    visualComfort: '宣纸米白、淡墨层次、留白充足、适合深度学习',
    recommendedFor: ['阅读复盘', '深度学习', '晚间整理', '安静办公'],
    accessibilityNotes: ['正文使用松烟黑', '装饰色低饱和', '留白优先于复杂纹理'],
    wallpaperSupport: { overlay: 'rgba(246, 242, 231, 0.74)', blur: '12px', brightness: '0.94', saturation: '0.72' },
    design: {
      tone: '水墨留白、宣纸肌理、淡墨晕染',
      scene: '适合阅读、复盘、深度学习和晚间整理',
      principle: '以宣纸底、墨韵晕染和留白建立东方安静感，灰绿只作为远山层次，避免把水墨做成普通米色主题。',
      aiVoice: '安静复盘型，语气平和，关注提炼、归纳和下一步。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(ellipse at 16% 14%, rgba(42, 42, 39, 0.16), transparent 22%), radial-gradient(ellipse at 78% 16%, rgba(111, 125, 104, 0.16), transparent 28%), radial-gradient(ellipse at 64% 82%, rgba(154, 123, 79, 0.12), transparent 28%), linear-gradient(135deg, #f7f3e8 0%, #ece5d3 56%, #dfe6dc 100%)',
        surface: 'rgba(255, 252, 244, 0.78)',
        surfaceStrong: 'rgba(255, 252, 244, 0.94)',
        primary: '#2a2a27',
        secondary: '#6c7663',
        accent: '#92744d',
        text: '#1f2420',
        muted: '#687066',
        border: 'rgba(42, 42, 39, 0.13)'
      },
      gradients: {
        hero: '#2a2a27',
        card: 'linear-gradient(135deg, #f7f3e8 0%, #ece5d3 100%)'
      },
      charts: { plan: '#2a2a27', focus: '#6c7663', review: '#92744d' },
      effects: { radius: '22px', shadow: '0 20px 54px rgba(42, 42, 39, 0.10)', glass: 'blur(12px) saturate(0.94)' }
    }
  },
  {
    id: 'ink-bamboo',
    name: '水墨竹影',
    category: 'built-in',
    aesthetic: 'ink',
    defaultCandidate: false,
    visualComfort: '竹青墨色、宣纸背景、比传统水墨更清爽',
    recommendedFor: ['阅读复盘', '深度学习', '笔记整理', '清爽东方感'],
    accessibilityNotes: ['深墨用于按钮与标题', '竹青低饱和', '正文保持高对比'],
    wallpaperSupport: { overlay: 'rgba(245, 248, 237, 0.72)', blur: '13px', brightness: '0.96', saturation: '0.72' },
    design: {
      tone: '竹影水墨、清润留白、东方书房',
      scene: '适合阅读、知识笔记、复盘和长时间写作',
      principle: '用竹青作为水墨的植物层次，墨色只压住关键信息，背景保留宣纸和淡淡竹影。',
      aiVoice: '书房陪伴型，强调慢读、摘录和复盘。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(ellipse at 18% 12%, rgba(83, 113, 75, 0.18), transparent 28%), radial-gradient(ellipse at 86% 18%, rgba(38, 50, 38, 0.13), transparent 24%), linear-gradient(135deg, #f5f8ed 0%, #e8eedf 52%, #f7f1df 100%)',
        surface: 'rgba(255, 253, 244, 0.78)',
        surfaceStrong: 'rgba(255, 253, 244, 0.94)',
        primary: '#2f3b2f',
        secondary: '#667f58',
        accent: '#9b8053',
        text: '#1f271f',
        muted: '#68745f',
        border: 'rgba(47, 59, 47, 0.14)'
      },
      gradients: {
        hero: '#2f3b2f',
        card: 'linear-gradient(135deg, rgba(255, 253, 244, 0.96), rgba(232, 238, 223, 0.88))'
      },
      charts: { plan: '#2f3b2f', focus: '#667f58', review: '#9b8053' },
      effects: { radius: '22px', shadow: '0 20px 54px rgba(47, 59, 47, 0.10)', glass: 'blur(13px) saturate(0.94)' }
    }
  },
  {
    id: 'ink-rainblue',
    name: '水墨雨青',
    category: 'built-in',
    aesthetic: 'ink',
    defaultCandidate: false,
    visualComfort: '雨青灰蓝、淡墨晕染、适合夜前复盘和安静阅读',
    recommendedFor: ['晚间整理', '阅读复盘', '写作沉淀', '低刺激偏好'],
    accessibilityNotes: ['蓝灰低饱和', '深墨保证正文对比', '装饰不遮挡信息'],
    wallpaperSupport: { overlay: 'rgba(238, 244, 242, 0.72)', blur: '14px', brightness: '0.95', saturation: '0.68' },
    design: {
      tone: '雨青水墨、雾气留白、冷静复盘',
      scene: '适合晚间复盘、阅读整理、安静写作和低刺激工作',
      principle: '用雨青灰蓝表现水墨里的雾气和远山，墨色负责骨架，减少暖色装饰。',
      aiVoice: '冷静复盘型，帮助归纳、沉淀和收尾。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(ellipse at 16% 14%, rgba(64, 78, 82, 0.15), transparent 25%), radial-gradient(ellipse at 86% 16%, rgba(93, 124, 126, 0.17), transparent 30%), linear-gradient(135deg, #eef4f2 0%, #dfe9e7 52%, #f3eedf 100%)',
        surface: 'rgba(251, 252, 247, 0.78)',
        surfaceStrong: 'rgba(251, 252, 247, 0.94)',
        primary: '#344044',
        secondary: '#668587',
        accent: '#9a7b55',
        text: '#1e2527',
        muted: '#647071',
        border: 'rgba(52, 64, 68, 0.14)'
      },
      gradients: {
        hero: '#344044',
        card: 'linear-gradient(135deg, rgba(251, 252, 247, 0.96), rgba(223, 233, 231, 0.88))'
      },
      charts: { plan: '#344044', focus: '#668587', review: '#9a7b55' },
      effects: { radius: '22px', shadow: '0 20px 54px rgba(52, 64, 68, 0.10)', glass: 'blur(14px) saturate(0.92)' }
    }
  },
  {
    id: 'modern-chinese',
    name: '新中式国风',
    category: 'built-in',
    aesthetic: 'chinese',
    defaultCandidate: false,
    visualComfort: '传统色小面积点缀、文化感强但不干扰信息层级',
    recommendedFor: ['传统文化偏好', '仪式感记录', '沉稳审美', '国风偏好'],
    accessibilityNotes: ['朱砂只作强调色', '正文使用墨色', '文化符号服从现代 UI 层级'],
    wallpaperSupport: { overlay: 'rgba(248, 241, 226, 0.70)', blur: '16px', brightness: '0.95', saturation: '0.78' },
    design: {
      tone: '新中式国风、传统色、现代秩序感',
      scene: '适合喜欢国风、传统文化和沉稳仪式感的用户',
      principle: '以米白、青绿和墨色建立主体，朱砂作为关键行动强调，避免过度古风化影响效率。',
      aiVoice: '沉稳策士型，强调节奏、取舍、复盘和目标。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(circle at 10% 12%, rgba(156, 43, 43, 0.16), transparent 24%), radial-gradient(circle at 88% 10%, rgba(52, 94, 78, 0.18), transparent 26%), linear-gradient(135deg, #f8f1e2 0%, #efe3cd 50%, #dfe8dc 100%)',
        surface: 'rgba(255, 250, 240, 0.80)',
        surfaceStrong: 'rgba(255, 250, 240, 0.94)',
        primary: '#345e4e',
        secondary: '#1f2522',
        accent: '#b64a3a',
        text: '#1f2522',
        muted: '#71695e',
        border: 'rgba(52, 94, 78, 0.15)'
      },
      gradients: {
        hero: 'linear-gradient(135deg, #345e4e 0%, #1f2522 58%, #b64a3a 100%)',
        card: 'linear-gradient(135deg, rgba(255, 250, 240, 0.96), rgba(239, 227, 205, 0.90))'
      },
      charts: { plan: '#345e4e', focus: '#b64a3a', review: '#9a7b4f' },
      effects: { radius: '20px', shadow: '0 22px 58px rgba(52, 94, 78, 0.14)', glass: 'blur(14px) saturate(1.02)' }
    }
  },
  {
    id: 'healing-anime',
    name: '二次元治愈',
    category: 'built-in',
    aesthetic: 'anime',
    defaultCandidate: false,
    visualComfort: '柔和渐变、陪伴感强、装饰不遮挡任务信息',
    recommendedFor: ['ACG 用户', '创作者', '自律恢复', '灵感管理'],
    accessibilityNotes: ['梦幻色用于背景和状态', '正文保持深蓝灰', '角色装饰后续必须可关闭'],
    wallpaperSupport: { overlay: 'rgba(249, 246, 255, 0.66)', blur: '20px', brightness: '1.02', saturation: '0.86' },
    design: {
      tone: '梦幻陪伴、二次元治愈、柔和灵感',
      scene: '适合创作、灵感收集、轻复盘和自律恢复',
      principle: '用樱粉、天青和电光紫制造陪伴感，但让卡片和正文保持高可读，装饰不抢任务信息。',
      aiVoice: '治愈伙伴型，强调陪伴、鼓励和把压力拆小。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(circle at 14% 12%, rgba(255, 159, 198, 0.30), transparent 25%), radial-gradient(circle at 88% 10%, rgba(125, 211, 252, 0.30), transparent 24%), linear-gradient(135deg, #fff7fb 0%, #eef7ff 52%, #f4edff 100%)',
        surface: 'rgba(255, 255, 255, 0.76)',
        surfaceStrong: 'rgba(255, 255, 255, 0.94)',
        primary: '#7c5cff',
        secondary: '#ff7ab6',
        accent: '#38bdf8',
        text: '#24223a',
        muted: '#6f6a86',
        border: 'rgba(124, 92, 255, 0.16)'
      },
      gradients: {
        hero: 'linear-gradient(135deg, #7c5cff 0%, #ff7ab6 55%, #38bdf8 100%)',
        card: 'linear-gradient(135deg, rgba(255, 247, 251, 0.96), rgba(238, 247, 255, 0.92))'
      },
      charts: { plan: '#7c5cff', focus: '#ff7ab6', review: '#38bdf8' },
      effects: { radius: '30px', shadow: '0 26px 74px rgba(124, 92, 255, 0.15)', glass: 'blur(20px) saturate(1.18)' }
    }
  },
  {
    id: 'anime-sky',
    name: '二次元晴空蓝',
    category: 'built-in',
    aesthetic: 'anime',
    defaultCandidate: false,
    visualComfort: '晴空蓝主色、粉紫点缀、梦幻但更清爽',
    recommendedFor: ['ACG 用户', '创作者', '灵感管理', '轻复盘'],
    accessibilityNotes: ['蓝色用于主操作', '粉紫只做装饰', '正文保持深蓝灰'],
    wallpaperSupport: { overlay: 'rgba(240, 249, 255, 0.66)', blur: '20px', brightness: '1.02', saturation: '0.84' },
    design: {
      tone: '晴空蓝、轻动画感、清爽陪伴',
      scene: '适合创作、灵感收集、轻复盘和自律恢复',
      principle: '用晴空蓝作为主情绪，粉紫只给陪伴感，避免二次元主题过度甜腻。',
      aiVoice: '清爽伙伴型，强调陪伴、鼓励和轻启动。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(circle at 14% 12%, rgba(125, 211, 252, 0.32), transparent 25%), radial-gradient(circle at 88% 12%, rgba(196, 181, 253, 0.24), transparent 24%), linear-gradient(135deg, #f0f9ff 0%, #eef7ff 52%, #f8f1ff 100%)',
        surface: 'rgba(255, 255, 255, 0.76)',
        surfaceStrong: 'rgba(255, 255, 255, 0.94)',
        primary: '#3198d8',
        secondary: '#8b7cf6',
        accent: '#ff86b8',
        text: '#202844',
        muted: '#68738d',
        border: 'rgba(49, 152, 216, 0.16)'
      },
      gradients: {
        hero: '#3198d8',
        card: 'linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(238, 247, 255, 0.92))'
      },
      charts: { plan: '#3198d8', focus: '#8b7cf6', review: '#ff86b8' },
      effects: { radius: '30px', shadow: '0 26px 74px rgba(49, 152, 216, 0.14)', glass: 'blur(20px) saturate(1.14)' }
    }
  },
  {
    id: 'morandi-gentle',
    name: '莫兰迪温柔',
    category: 'built-in',
    aesthetic: 'morandi',
    defaultCandidate: false,
    visualComfort: '低饱和、低刺激、适合生活记录和温柔复盘',
    recommendedFor: ['生活管理', '女性成长', '自律恢复', '低刺激偏好'],
    accessibilityNotes: ['低对比背景配深色正文', '状态文字不只依赖颜色', '避免大面积高饱和'],
    wallpaperSupport: { overlay: 'rgba(242, 235, 228, 0.70)', blur: '18px', brightness: '0.97', saturation: '0.68' },
    design: {
      tone: '莫兰迪低饱和、温柔生活、不焦虑',
      scene: '适合生活管理、成长记录、低压力习惯和温柔复盘',
      principle: '用灰粉、灰蓝、豆绿和暖米色降低刺激，把注意力从催促转向恢复和持续。',
      aiVoice: '温柔陪跑型，允许中断，强调恢复入口和最小行动。'
    },
    tokens: {
      colors: {
        background: 'linear-gradient(135deg, #f2ebe4 0%, #e7d8d2 38%, #d9e2dc 100%)',
        surface: 'rgba(255, 252, 248, 0.78)',
        surfaceStrong: 'rgba(255, 252, 248, 0.94)',
        primary: '#7f8f86',
        secondary: '#8f8aa7',
        accent: '#b98c8f',
        text: '#2d2f35',
        muted: '#74767c',
        border: 'rgba(127, 143, 134, 0.16)'
      },
      gradients: {
        hero: 'linear-gradient(135deg, #7f8f86 0%, #8f8aa7 56%, #b98c8f 100%)',
        card: 'linear-gradient(135deg, rgba(255, 252, 248, 0.96), rgba(231, 216, 210, 0.90))'
      },
      charts: { plan: '#7f8f86', focus: '#8f8aa7', review: '#b98c8f' },
      effects: { radius: '26px', shadow: '0 22px 58px rgba(127, 143, 134, 0.12)', glass: 'blur(18px) saturate(0.98)' }
    }
  },
  {
    id: 'morandi-rose',
    name: '莫兰迪烟粉',
    category: 'built-in',
    aesthetic: 'morandi',
    defaultCandidate: false,
    visualComfort: '烟粉低饱和、灰米背景、适合温柔复盘和生活管理',
    recommendedFor: ['生活管理', '女性成长', '温柔复盘', '低刺激偏好'],
    accessibilityNotes: ['粉色低饱和', '正文深灰保证对比', '状态文字不只依赖颜色'],
    wallpaperSupport: { overlay: 'rgba(244, 236, 233, 0.70)', blur: '18px', brightness: '0.97', saturation: '0.66' },
    design: {
      tone: '烟粉莫兰迪、温柔克制、生活复盘',
      scene: '适合生活记录、成长复盘、温柔计划和低压力习惯',
      principle: '把粉色压低饱和并加入灰调，避免甜腻，让主题更耐看。',
      aiVoice: '温柔陪跑型，允许中断，强调恢复入口和最小行动。'
    },
    tokens: {
      colors: {
        background: 'linear-gradient(135deg, #f4ece9 0%, #e8d7d5 44%, #e4e2d8 100%)',
        surface: 'rgba(255, 252, 248, 0.78)',
        surfaceStrong: 'rgba(255, 252, 248, 0.94)',
        primary: '#a2787d',
        secondary: '#7f8f86',
        accent: '#b49a72',
        text: '#302f33',
        muted: '#767176',
        border: 'rgba(162, 120, 125, 0.16)'
      },
      gradients: {
        hero: '#a2787d',
        card: 'linear-gradient(135deg, rgba(255, 252, 248, 0.96), rgba(232, 215, 213, 0.90))'
      },
      charts: { plan: '#a2787d', focus: '#7f8f86', review: '#b49a72' },
      effects: { radius: '26px', shadow: '0 22px 58px rgba(162, 120, 125, 0.12)', glass: 'blur(18px) saturate(0.96)' }
    }
  },
  {
    id: 'business-bluegray',
    name: '商务蓝灰',
    category: 'built-in',
    aesthetic: 'business',
    defaultCandidate: false,
    visualComfort: '冷静清晰、信息密度友好、适合项目推进和会议行动项',
    recommendedFor: ['职场办公', '项目管理', '会议行动项', '周报整理'],
    accessibilityNotes: ['冷白和蓝灰保持专业感', '金色只用于关键提醒', '适合高信息密度'],
    wallpaperSupport: { overlay: 'rgba(241, 245, 249, 0.74)', blur: '14px', brightness: '0.95', saturation: '0.76' },
    design: {
      tone: '商务蓝灰、专业可信、交付导向',
      scene: '适合项目管理、会议行动项、工作日志和周报整理',
      principle: '用冷白、蓝灰和深蓝建立秩序感，少量金色提示关键交付与风险，降低花哨装饰。',
      aiVoice: '专业效率顾问型，强调负责人、截止时间、交付物和风险。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(circle at 8% 10%, rgba(59, 130, 246, 0.18), transparent 26%), linear-gradient(135deg, #e8edf3 0%, #f8fafc 48%, #dbe3ee 100%)',
        surface: 'rgba(255, 255, 255, 0.82)',
        surfaceStrong: 'rgba(255, 255, 255, 0.94)',
        primary: '#1e4f7a',
        secondary: '#334155',
        accent: '#c7953b',
        text: '#0f172a',
        muted: '#64748b',
        border: 'rgba(30, 79, 122, 0.15)'
      },
      gradients: {
        hero: 'linear-gradient(135deg, #1e4f7a 0%, #334155 72%, #c7953b 100%)',
        card: 'linear-gradient(135deg, rgba(248, 250, 252, 0.96), rgba(219, 227, 238, 0.92))'
      },
      charts: { plan: '#1e4f7a', focus: '#334155', review: '#c7953b' },
      effects: { radius: '20px', shadow: '0 24px 70px rgba(30, 79, 122, 0.13)', glass: 'blur(14px) saturate(1.08)' }
    }
  },
  {
    id: 'business-graphite',
    name: '商务石墨灰',
    category: 'built-in',
    aesthetic: 'business',
    defaultCandidate: false,
    visualComfort: '石墨灰秩序感、低装饰、高信息密度友好',
    recommendedFor: ['职场办公', '项目管理', '会议行动项', '高信息密度'],
    accessibilityNotes: ['深灰作为主色', '蓝色提示路径', '金色只用于关键提醒'],
    wallpaperSupport: { overlay: 'rgba(241, 243, 245, 0.74)', blur: '14px', brightness: '0.94', saturation: '0.70' },
    design: {
      tone: '石墨灰、克制商务、专业推进',
      scene: '适合项目管理、会议行动项、周报整理和高密度工作台',
      principle: '用石墨灰建立专业底盘，蓝色作为信息路径，金色只标注关键交付风险。',
      aiVoice: '专业效率顾问型，强调负责人、截止时间、交付物和风险。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(circle at 8% 10%, rgba(71, 85, 105, 0.16), transparent 26%), linear-gradient(135deg, #eef1f4 0%, #f8fafc 48%, #dce2e8 100%)',
        surface: 'rgba(255, 255, 255, 0.82)',
        surfaceStrong: 'rgba(255, 255, 255, 0.94)',
        primary: '#334155',
        secondary: '#256f93',
        accent: '#bd8b2f',
        text: '#111827',
        muted: '#64707f',
        border: 'rgba(51, 65, 85, 0.15)'
      },
      gradients: {
        hero: '#334155',
        card: 'linear-gradient(135deg, rgba(248, 250, 252, 0.96), rgba(220, 226, 232, 0.92))'
      },
      charts: { plan: '#334155', focus: '#256f93', review: '#bd8b2f' },
      effects: { radius: '20px', shadow: '0 24px 70px rgba(51, 65, 85, 0.13)', glass: 'blur(14px) saturate(1.04)' }
    }
  },
  {
    id: 'night-focus',
    name: '夜间专注',
    category: 'built-in',
    aesthetic: 'night',
    defaultCandidate: false,
    visualComfort: '非纯黑背景、低眩光、适合深夜学习和写作',
    recommendedFor: ['夜间学习', '写作', '低光环境', '深度专注'],
    accessibilityNotes: ['避免纯黑纯白强反差', '浅蓝和薄荷绿小面积提示', '深色卡片保留边界'],
    wallpaperSupport: { overlay: 'rgba(15, 23, 42, 0.72)', blur: '16px', brightness: '0.62', saturation: '0.74' },
    design: {
      tone: '夜间专注、低眩光、沉浸写作',
      scene: '适合夜间学习、深度办公、长时间写作和安静复盘',
      principle: '采用深蓝灰而非纯黑，正文使用柔和浅灰，浅蓝与薄荷绿只作为路径提示，减少视觉疲劳。',
      aiVoice: '安静陪伴型，简短、克制、专注下一步行动。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(circle at 18% 12%, rgba(96, 165, 250, 0.20), transparent 26%), radial-gradient(circle at 88% 18%, rgba(45, 212, 191, 0.16), transparent 24%), linear-gradient(135deg, #111827 0%, #1e293b 54%, #172033 100%)',
        surface: 'rgba(255, 255, 255, 0.09)',
        surfaceStrong: 'rgba(255, 255, 255, 0.13)',
        primary: '#93c5fd',
        secondary: '#5eead4',
        accent: '#c4b5fd',
        text: '#f1f5f9',
        muted: '#cbd5e1',
        border: 'rgba(255, 255, 255, 0.13)'
      },
      gradients: {
        hero: 'linear-gradient(135deg, #93c5fd 0%, #5eead4 52%, #c4b5fd 100%)',
        card: 'linear-gradient(135deg, rgba(30, 41, 59, 0.84), rgba(15, 23, 42, 0.72))'
      },
      charts: { plan: '#93c5fd', focus: '#5eead4', review: '#c4b5fd' },
      effects: { radius: '24px', shadow: '0 28px 80px rgba(0, 0, 0, 0.32)', glass: 'blur(16px) saturate(1.08)' }
    }
  },
  {
    id: 'night-aurora',
    name: '夜间极光',
    category: 'built-in',
    aesthetic: 'night',
    defaultCandidate: false,
    visualComfort: '深蓝夜色、低亮极光、适合夜间但更有氛围',
    recommendedFor: ['夜间学习', '写作', '沉浸专注', '低光环境'],
    accessibilityNotes: ['极光只做背景氛围', '正文保持浅灰', '避免纯黑纯白强反差'],
    wallpaperSupport: { overlay: 'rgba(12, 19, 34, 0.72)', blur: '18px', brightness: '0.60', saturation: '0.78' },
    design: {
      tone: '夜间极光、沉浸专注、低眩光氛围',
      scene: '适合夜间学习、深度办公、写作和沉浸复盘',
      principle: '用低亮青绿和蓝紫表现极光，主体仍保持深蓝灰和高可读信息层级。',
      aiVoice: '沉浸陪伴型，简短、克制、专注下一步行动。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(circle at 18% 14%, rgba(94, 234, 212, 0.18), transparent 28%), radial-gradient(circle at 84% 12%, rgba(167, 139, 250, 0.18), transparent 26%), linear-gradient(135deg, #0c1322 0%, #16213a 54%, #101827 100%)',
        surface: 'rgba(255, 255, 255, 0.09)',
        surfaceStrong: 'rgba(255, 255, 255, 0.13)',
        primary: '#5eead4',
        secondary: '#93c5fd',
        accent: '#c4b5fd',
        text: '#f1f5f9',
        muted: '#cbd5e1',
        border: 'rgba(255, 255, 255, 0.13)'
      },
      gradients: {
        hero: '#5eead4',
        card: 'linear-gradient(135deg, rgba(22, 33, 58, 0.84), rgba(12, 19, 34, 0.72))'
      },
      charts: { plan: '#5eead4', focus: '#93c5fd', review: '#c4b5fd' },
      effects: { radius: '24px', shadow: '0 28px 80px rgba(0, 0, 0, 0.32)', glass: 'blur(18px) saturate(1.08)' }
    }
  }
]

const legacyThemeMap: Record<string, ThemeId> = {
  'campus-premium': 'minimal-premium',
  'minimal-white': 'minimal-premium',
  'growth-rpg': 'cream-dopamine',
  'dream-purple': 'healing-anime',
  'business-focus': 'business-bluegray'
}

export const getThemeById = (themeId: string): StudyTheme =>
  themeRegistry.find((theme) => theme.id === (legacyThemeMap[themeId] ?? themeId)) ?? themeRegistry[0]
