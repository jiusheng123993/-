/**
 * 取名引擎 - AI 提示词构建
 *
 * 支持两种模式：
 * 1. 推荐模式：根据品种/生日/性别/风格/照片/描述推荐名字
 * 2. 解读模式：根据用户提供的名字进行文化解读
 */

export interface RecommendParams {
  breed: string
  birthDate: string
  gender: string
  season: string
  style?: string
  photoUrl?: string
  description?: string
  /** 已推荐过的名字，需避免重复 */
  excludeNames?: string[]
}

/**
 * 构建名字推荐 prompt
 *
 * 要求 AI 返回结构化 JSON，便于前端解析展示。
 */
export function buildRecommendPrompt(params: RecommendParams): string {
  const { breed, birthDate, gender, season, style, photoUrl, description, excludeNames } = params

  const parts: string[] = [
    `为一只${breed}推荐5个中文宠物名字。`,
    `出生日期：${birthDate}（${season}天），性别：${gender}。`,
  ]

  if (style && style !== '不限风格') {
    parts.push(`风格偏好：${style}。`)
  }

  if (photoUrl) {
    parts.push(`宠物照片URL：${photoUrl}，请根据照片中外貌特征（毛色、体型、眼神、神态等）来推荐名字。`)
  }

  if (description) {
    parts.push(`主人对宠物的描述：${description}。请结合这些特点推荐名字。`)
  }

  if (excludeNames && excludeNames.length > 0) {
    parts.push(`\n以下名字已经推荐过，请务必避免重复推荐：${excludeNames.join('、')}。`)
  }

  parts.push(
    `\n每个名字从以下维度完整解读：`,
    `1. 来源：诗词/典故/山川地名/星宿，必须引用原文并标注出处`,
    `2. 五行：名字汉字的五行属性及与出生季节的关联`,
    `3. 星宿：对应的二十八星宿之一`,
    `4. 寓意：温暖雅致的解读（2-3句话）`,
    `5. 评分：0-100分`,
    `\n推荐要求：`,
    `- 名字2-3个汉字`,
    `- 古典雅致有文化底蕴`,
    `- 避免过于常见的名字（如：小白、小黑、旺财）`,
    `- 5个名字风格多样，各有特色`,
    `\n请严格按以下JSON格式输出（只输出JSON，不要其他文字）：`,
    `[`,
    `  {"name":"名字","source":"诗词典故出处（引用原文+出处）","wuxing":"五行属性及与季节关联","starMansion":"守护星宿","meaning":"寓意解读","score":95}`,
    `]`
  )

  return parts.join('\n')
}

/**
 * 构建名字解读 prompt
 *
 * 用户已有候选名字，AI 从文化角度深度解读。
 */
export function buildInterpretPrompt(name: string, breed: string, birthDate: string): string {
  return `你是一位精通中国传统文化的取名大师。请深度解读以下宠物名字：

名字：${name}
品种：${breed}
出生日期：${birthDate}

请从以下维度完整解读（每个维度2-3句话）：
1. 字义拆解：逐字分析名字中每个汉字的含义和意象
2. 五行属性：名字整体的五行属性，以及与出生季节的生克关系
3. 守护星宿：对应的二十八星宿，及其象征意义
4. 诗词典故：引用至少2处经典诗词或典故，标注出处
5. 综合评价：整体寓意、适用场景、给主人的建议

使用温暖、雅致的语气，引用经典诗句时标注出处，让用户感受到文化深度。`
}

export interface DetailPromptParams {
  name: string
  breed: string
  birthDate: string
  gender: string
  season: string
  wuxing: string
  starMansion: string
  description?: string
}

/**
 * 构建命理深度分析 prompt
 *
 * 模拟传统命理师的风格，从八字、五行、星宿、笔画等维度全面分析名字的运势。
 */
export function buildDetailPrompt(params: DetailPromptParams): string {
  const { name, breed, birthDate, gender, season, wuxing, starMansion, description } = params

  const parts: string[] = [
    `你是一位精通中国传统命理学的取名大师，请为以下宠物名字进行深度命理分析：`,
    ``,
    `【基本信息】`,
    `名字：${name}`,
    `品种：${breed}`,
    `出生日期：${birthDate}（${season}天出生）`,
    `性别：${gender === 'male' ? '男' : gender === 'female' ? '女' : '未知'}`,
    `名字五行：${wuxing}`,
    `守护星宿：${starMansion}`,
  ]

  if (description) {
    parts.push(`主人描述：${description}`)
  }

  parts.push(
    ``,
    `请从以下维度进行命理级别的深度分析，使用温暖而富有文化底蕴的语言：`,
    ``,
    `1. 八字命理简析：根据出生季节推算八字特点，分析名字与八字的生克关系（3-4句话）`,
    `2. 整体运势：综合五行、星宿、字义，分析这个名字带来的整体运势走向（3-4句话）`,
    `3. 事业/生活运势：这个名字对宠物日常生活、活力、表现力的影响（2-3句话）`,
    `4. 感情/人际运势：名字对宠物与主人、其他宠物、家人之间缘分的影响（2-3句话）`,
    `5. 健康运势：从五行平衡角度分析名字对宠物健康的影响（2-3句话）`,
    `6. 性格特质：这个名字会赋予宠物什么样的性格特质（2-3句话）`,
    `7. 笔画数理：按传统姓名学分析名字的笔画数和数理含义（2-3句话）`,
    `8. 吉祥方位：这个名字对应的吉祥方位`,
    `9. 吉祥颜色：这个名字对应的吉祥颜色`,
    `10. 吉祥数字：这个名字对应的幸运数字`,
    `11. 与主人缘分：从名字的气场分析宠物与主人的缘分契合度（2-3句话）`,
    `12. 总结寄语：一段温暖、有文化底蕴的寄语，给主人和宠物（3-4句话）`,
    ``,
    `请严格按以下JSON格式输出（只输出JSON，不要其他文字）：`,
    `{`,
    `  "bazi": "八字命理简析",`,
    `  "fortune": "整体运势分析",`,
    `  "careerFortune": "事业/生活运势",`,
    `  "loveFortune": "感情/人际运势",`,
    `  "healthFortune": "健康运势",`,
    `  "personality": "性格特质分析",`,
    `  "strokes": "笔画数理分析",`,
    `  "luckyDirection": "吉祥方位",`,
    `  "luckyColor": "吉祥颜色",`,
    `  "luckyNumber": "吉祥数字",`,
    `  "karmaWithOwner": "与主人缘分解析",`,
    `  "summary": "总结寄语"`,
    `}`,
    ``,
    `语言风格：温暖、雅致、有文化底蕴，像一位博学的命理师在娓娓道来。可适当引用《易经》《黄帝内经》等经典。`,
  )

  return parts.join('\n')
}