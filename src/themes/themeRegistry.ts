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
  | 'clash-pop-orange-violet'
  | 'clash-blue-orange'
  | 'clash-neon-cyber'
  | 'clash-juicy-gradient'
  | 'clash-retro-sunset'

export type ThemeAesthetic =
  | 'minimal'
  | 'dopamine'
  | 'ink'
  | 'chinese'
  | 'anime'
  | 'morandi'
  | 'business'
  | 'night'
  | 'clash'

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
    visualComfort: '更深的非纯黑背景、低眩光、适合深夜学习和写作',
    recommendedFor: ['夜间学习', '写作', '低光环境', '深度专注'],
    accessibilityNotes: ['避免纯黑纯白强反差', '蓝灰与薄荷绿降低亮度后小面积提示', '深色卡片保留边界'],
    wallpaperSupport: { overlay: 'rgba(8, 13, 24, 0.82)', blur: '16px', brightness: '0.48', saturation: '0.66' },
    design: {
      tone: '夜间专注、低眩光、沉浸写作',
      scene: '适合夜间学习、深度办公、长时间写作和安静复盘',
      principle: '采用更深的蓝黑底色而非纯黑，正文使用柔和浅灰，蓝灰与低亮薄荷绿只作为路径提示，减少视觉疲劳。',
      aiVoice: '安静陪伴型，简短、克制、专注下一步行动。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(circle at 18% 12%, rgba(59, 130, 246, 0.11), transparent 28%), radial-gradient(circle at 88% 18%, rgba(20, 184, 166, 0.09), transparent 26%), linear-gradient(135deg, #070b14 0%, #0d1626 54%, #090f1b 100%)',
        surface: 'rgba(10, 18, 32, 0.72)',
        surfaceStrong: 'rgba(12, 22, 38, 0.88)',
        primary: '#6fa4d8',
        secondary: '#3fb9aa',
        accent: '#9d8ee7',
        text: '#d7e0ea',
        muted: '#8fa1b5',
        border: 'rgba(148, 163, 184, 0.16)'
      },
      gradients: {
        hero: 'linear-gradient(135deg, #6fa4d8 0%, #3fb9aa 52%, #9d8ee7 100%)',
        card: 'linear-gradient(135deg, rgba(13, 22, 38, 0.90), rgba(7, 11, 20, 0.82))'
      },
      charts: { plan: '#6fa4d8', focus: '#3fb9aa', review: '#9d8ee7' },
      effects: { radius: '24px', shadow: '0 28px 80px rgba(0, 0, 0, 0.44)', glass: 'blur(16px) saturate(0.92)' }
    }
  },
  {
    id: 'night-aurora',
    name: '夜间极光',
    category: 'built-in',
    aesthetic: 'night',
    defaultCandidate: false,
    visualComfort: '更深的蓝黑夜色、低亮极光、适合夜间但更有氛围',
    recommendedFor: ['夜间学习', '写作', '沉浸专注', '低光环境'],
    accessibilityNotes: ['极光只做低亮背景氛围', '正文保持柔和浅灰', '避免纯黑纯白强反差'],
    wallpaperSupport: { overlay: 'rgba(5, 10, 20, 0.84)', blur: '18px', brightness: '0.46', saturation: '0.68' },
    design: {
      tone: '夜间极光、沉浸专注、低眩光氛围',
      scene: '适合夜间学习、深度办公、写作和沉浸复盘',
      principle: '用更低亮的青绿和蓝紫表现极光，主体保持深蓝黑和高可读信息层级。',
      aiVoice: '沉浸陪伴型，简短、克制、专注下一步行动。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(circle at 18% 14%, rgba(45, 212, 191, 0.10), transparent 30%), radial-gradient(circle at 84% 12%, rgba(139, 92, 246, 0.10), transparent 28%), linear-gradient(135deg, #050a14 0%, #0a1325 54%, #070d19 100%)',
        surface: 'rgba(8, 16, 30, 0.74)',
        surfaceStrong: 'rgba(10, 20, 36, 0.88)',
        primary: '#42b9aa',
        secondary: '#6f9fd4',
        accent: '#9f91df',
        text: '#d9e2ec',
        muted: '#91a2b6',
        border: 'rgba(148, 163, 184, 0.16)'
      },
      gradients: {
        hero: '#42b9aa',
        card: 'linear-gradient(135deg, rgba(10, 19, 37, 0.90), rgba(5, 10, 20, 0.82))'
      },
      charts: { plan: '#42b9aa', focus: '#6f9fd4', review: '#9f91df' },
      effects: { radius: '24px', shadow: '0 28px 80px rgba(0, 0, 0, 0.46)', glass: 'blur(18px) saturate(0.92)' }
    }
  },
  {
    id: 'clash-pop-orange-violet',
    name: '波普橙紫撞色',
    category: 'built-in',
    aesthetic: 'clash',
    defaultCandidate: false,
    visualComfort: '橙紫互补撞色、奶白底承托、活泼但保留正文留白',
    recommendedFor: ['年轻用户', '创意工作', '灵感激励', '社交分享'],
    accessibilityNotes: ['撞色只用于装饰块和按钮', '正文保持深紫黑高对比', '大面积仍以奶白承托'],
    wallpaperSupport: { overlay: 'rgba(252, 244, 232, 0.66)', blur: '18px', brightness: '1.02', saturation: '1.04' },
    design: {
      tone: '波普撞色、橙紫互补、活泼大胆',
      scene: '适合喜欢张扬个性、创意激励、社交分享和灵感记录的用户',
      principle: '以电光紫和活力橙作为互补撞色，奶白底承托正文，撞色块只出现在卡片标题、按钮和装饰图形，避免视觉疲劳。',
      aiVoice: '活力派对型，鼓励大胆尝试，把任务变成一次冒险。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(circle at 10% 12%, rgba(255, 122, 41, 0.32), transparent 26%), radial-gradient(circle at 88% 12%, rgba(124, 58, 237, 0.30), transparent 26%), linear-gradient(135deg, #fff5e8 0%, #fdf0f8 52%, #f1ecff 100%)',
        surface: 'rgba(255, 252, 247, 0.82)',
        surfaceStrong: 'rgba(255, 252, 247, 0.96)',
        primary: '#7c3aed',
        secondary: '#ff7a29',
        accent: '#ffd23f',
        text: '#1f1240',
        muted: '#6b5a86',
        border: 'rgba(124, 58, 237, 0.20)'
      },
      gradients: {
        hero: 'linear-gradient(135deg, #7c3aed 0%, #ff7a29 100%)',
        card: 'linear-gradient(135deg, rgba(255, 252, 247, 0.96), rgba(241, 236, 255, 0.88))'
      },
      charts: { plan: '#7c3aed', focus: '#ff7a29', review: '#ffd23f' },
      effects: { radius: '26px', shadow: '0 26px 70px rgba(124, 58, 237, 0.20)', glass: 'blur(18px) saturate(1.18)' }
    }
  },
  {
    id: 'clash-blue-orange',
    name: '蓝橙冷暖撞色',
    category: 'built-in',
    aesthetic: 'clash',
    defaultCandidate: false,
    visualComfort: '钴蓝主色、活力橙强调、冷暖撞色但层级清晰',
    recommendedFor: ['品牌型用户', '运动打卡', '青年职场', '行动派'],
    accessibilityNotes: ['钴蓝承担主操作', '活力橙只做强调和警示', '正文保持深蓝黑'],
    wallpaperSupport: { overlay: 'rgba(238, 244, 255, 0.70)', blur: '16px', brightness: '1.00', saturation: '1.00' },
    design: {
      tone: '钴蓝活力橙、冷暖撞色、自信现代',
      scene: '适合运动打卡、青年职场、行动派计划和品牌型用户',
      principle: '用钴蓝建立秩序，活力橙只用于关键按钮、未完成标记和奖励反馈，制造经典冷暖撞色而不混乱。',
      aiVoice: '直接行动派，给出明确截止、关键路径和下一步。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(circle at 12% 14%, rgba(37, 99, 235, 0.20), transparent 28%), radial-gradient(circle at 88% 12%, rgba(255, 122, 41, 0.22), transparent 26%), linear-gradient(135deg, #eef4ff 0%, #f7fbff 50%, #fff3e6 100%)',
        surface: 'rgba(255, 255, 255, 0.84)',
        surfaceStrong: 'rgba(255, 255, 255, 0.96)',
        primary: '#1d4ed8',
        secondary: '#ff7a29',
        accent: '#f4b942',
        text: '#0b1d3a',
        muted: '#5b6a85',
        border: 'rgba(29, 78, 216, 0.18)'
      },
      gradients: {
        hero: 'linear-gradient(135deg, #1d4ed8 0%, #ff7a29 100%)',
        card: 'linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(238, 244, 255, 0.90))'
      },
      charts: { plan: '#1d4ed8', focus: '#ff7a29', review: '#f4b942' },
      effects: { radius: '22px', shadow: '0 24px 64px rgba(29, 78, 216, 0.18)', glass: 'blur(16px) saturate(1.10)' }
    }
  },
  {
    id: 'clash-neon-cyber',
    name: '霓虹赛博撞色',
    category: 'built-in',
    aesthetic: 'clash',
    defaultCandidate: false,
    visualComfort: '深夜紫底、霓虹粉绿撞色、赛博朋克氛围但保留可读性',
    recommendedFor: ['极客用户', '夜猫子', '游戏化偏好', '潮流追逐者'],
    accessibilityNotes: ['霓虹色仅做点缀与按钮发光', '正文使用柔和浅灰', '深紫黑底替代纯黑减少眩光'],
    wallpaperSupport: { overlay: 'rgba(10, 6, 28, 0.82)', blur: '20px', brightness: '0.52', saturation: '1.15' },
    design: {
      tone: '霓虹赛博、粉绿撞色、未来夜色',
      scene: '适合夜猫子、极客、游戏化偏好和追求潮流氛围的用户',
      principle: '用深紫黑作底，让霓虹粉与霓虹青绿成为撞色主角，仅出现在按钮、进度条、徽章和图表，正文保持柔和高对比。',
      aiVoice: '潮酷战友型，简短、犀利、带一点幽默地推你完成关键任务。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(circle at 14% 12%, rgba(236, 72, 153, 0.22), transparent 26%), radial-gradient(circle at 86% 14%, rgba(34, 211, 238, 0.20), transparent 28%), linear-gradient(135deg, #0a0620 0%, #140a32 52%, #0c0824 100%)',
        surface: 'rgba(20, 12, 44, 0.72)',
        surfaceStrong: 'rgba(24, 14, 52, 0.90)',
        primary: '#ff2bd6',
        secondary: '#22d3ee',
        accent: '#facc15',
        text: '#ecebff',
        muted: '#9d96c7',
        border: 'rgba(255, 43, 214, 0.28)'
      },
      gradients: {
        hero: 'linear-gradient(135deg, #ff2bd6 0%, #7c3aed 50%, #22d3ee 100%)',
        card: 'linear-gradient(135deg, rgba(24, 14, 52, 0.92), rgba(10, 6, 32, 0.80))'
      },
      charts: { plan: '#ff2bd6', focus: '#22d3ee', review: '#facc15' },
      effects: { radius: '24px', shadow: '0 28px 80px rgba(255, 43, 214, 0.28)', glass: 'blur(20px) saturate(1.25)' }
    }
  },
  {
    id: 'clash-juicy-gradient',
    name: '果汁多色渐变',
    category: 'built-in',
    aesthetic: 'clash',
    defaultCandidate: false,
    visualComfort: '黄绿青蓝渐变、活力果汁感、装饰块大胆但正文保持高对比',
    recommendedFor: ['活力青年', '社群运营', '校园用户', '兴趣社团'],
    accessibilityNotes: ['多色渐变只用于背景、Banner 和图表', '按钮使用纯色高对比', '正文保持深绿黑'],
    wallpaperSupport: { overlay: 'rgba(243, 255, 234, 0.66)', blur: '18px', brightness: '1.02', saturation: '1.08' },
    design: {
      tone: '果汁多色、青柠青蓝、夏日活力',
      scene: '适合校园社团、社群运营、活力青年和兴趣小组日常',
      principle: '用青柠绿、橙黄、青蓝构造果汁渐变，正文区使用奶白卡片承托，让撞色只在 Banner、徽章、进度条里释放能量。',
      aiVoice: '阳光社群型，强调一起来、节奏感和当日小目标。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(circle at 10% 14%, rgba(250, 204, 21, 0.30), transparent 26%), radial-gradient(circle at 86% 14%, rgba(34, 211, 238, 0.28), transparent 26%), radial-gradient(circle at 80% 84%, rgba(132, 204, 22, 0.26), transparent 28%), linear-gradient(135deg, #f3ffea 0%, #effbff 50%, #fff8e1 100%)',
        surface: 'rgba(255, 255, 250, 0.80)',
        surfaceStrong: 'rgba(255, 255, 250, 0.95)',
        primary: '#16a34a',
        secondary: '#0ea5e9',
        accent: '#f97316',
        text: '#0f2a17',
        muted: '#5b7363',
        border: 'rgba(22, 163, 74, 0.20)'
      },
      gradients: {
        hero: 'linear-gradient(135deg, #facc15 0%, #84cc16 35%, #22d3ee 70%, #0ea5e9 100%)',
        card: 'linear-gradient(135deg, rgba(255, 255, 250, 0.96), rgba(243, 255, 234, 0.88), rgba(239, 251, 255, 0.82))'
      },
      charts: { plan: '#16a34a', focus: '#0ea5e9', review: '#f97316' },
      effects: { radius: '30px', shadow: '0 28px 72px rgba(22, 163, 74, 0.18)', glass: 'blur(20px) saturate(1.20)' }
    }
  },
  {
    id: 'clash-retro-sunset',
    name: '复古日落撞色',
    category: 'built-in',
    aesthetic: 'clash',
    defaultCandidate: false,
    visualComfort: '焦橙玫粉撞色、复古蓝点缀、70 年代 Disco 但克制装饰',
    recommendedFor: ['复古爱好者', '生活记录', '情绪激励', '创作灵感'],
    accessibilityNotes: ['焦橙作为主操作', '玫粉负责装饰和奖励', '复古蓝小面积出现，避免抢主角'],
    wallpaperSupport: { overlay: 'rgba(253, 235, 222, 0.70)', blur: '18px', brightness: '0.98', saturation: '0.96' },
    design: {
      tone: '焦橙玫粉、复古蓝点缀、Disco 暖光',
      scene: '适合复古审美、生活记录、情绪激励和创作灵感',
      principle: '用焦橙作主色制造暖意，玫粉只做奖励和装饰，复古蓝小面积出现压住温度，整体像 70 年代 Disco 海报的暖光。',
      aiVoice: '温暖鼓舞型，像老朋友递来一杯热饮，再轻推一下下一步。'
    },
    tokens: {
      colors: {
        background: 'radial-gradient(circle at 12% 12%, rgba(234, 88, 12, 0.26), transparent 26%), radial-gradient(circle at 86% 14%, rgba(236, 72, 153, 0.22), transparent 26%), linear-gradient(135deg, #fdebde 0%, #ffe1ea 50%, #efe6f7 100%)',
        surface: 'rgba(255, 250, 244, 0.80)',
        surfaceStrong: 'rgba(255, 250, 244, 0.95)',
        primary: '#ea580c',
        secondary: '#db2777',
        accent: '#1e3a8a',
        text: '#3a1d12',
        muted: '#7a5a4e',
        border: 'rgba(234, 88, 12, 0.20)'
      },
      gradients: {
        hero: 'linear-gradient(135deg, #ea580c 0%, #db2777 60%, #1e3a8a 100%)',
        card: 'linear-gradient(135deg, rgba(255, 250, 244, 0.96), rgba(255, 225, 234, 0.88))'
      },
      charts: { plan: '#ea580c', focus: '#db2777', review: '#1e3a8a' },
      effects: { radius: '26px', shadow: '0 26px 70px rgba(234, 88, 12, 0.20)', glass: 'blur(18px) saturate(1.10)' }
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
