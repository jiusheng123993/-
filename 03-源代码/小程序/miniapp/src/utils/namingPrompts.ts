export function buildInterpretPrompt(name: string, breed: string, birthDate: string): string {
  return `你是一位精通中国传统文化的取名大师。请从以下角度分析宠物名字：

名字：${name}
品种：${breed}
出生日期：${birthDate}

请从以下维度解读（控制在5-8句话内）：
1. 五行属性（根据名字字的五行）
2. 守护星宿（二十八星宿之一）
3. 诗词典故出处
4. 寓意与综合评价

使用温暖、雅致的语气，引用经典诗句（标注出处），让用户感受到文化深度。`
}

export function buildRecommendPrompt(breed: string, birthDate: string, gender: string, season: string): string {
  return `为一只${breed}推荐3个中文宠物名字。出生日期${birthDate}，${season}天，${gender}。

每个名字从以下角度解读：
1. 来源（诗词/典故/山川地名/星宿）
2. 五行属性及与出生季节的关联
3. 寓意简述

推荐要求：
- 名字2-3个汉字
- 古典雅致
- 有文化底蕴
- 避免过于常见的名字

输出格式：
① 「名字」
来源：xxx
五行：xxx（与季节xxx的关联）
寓意：xxx`
}
