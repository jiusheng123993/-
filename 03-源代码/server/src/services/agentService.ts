import { config } from '../config.js';
import {
  executeTool,
  getToolDefinitionsForLLM,
  type ToolCall,
} from './toolRegistry.js';
import { pool } from '../db.js';
import {
  buildMemoryContext,
  ingestMemories,
  saveConversation,
  loadConversationHistory,
  summarizePetMemory,
  getActiveMemories,
  detectContradiction,
  type MemoryEntry,
} from './memoryService.js';

// ========== 类型定义 ==========

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
  name?: string;
}

export interface AgentContext {
  userId: string;
  petId?: string;
  petName?: string;
  petBreed?: string;
  petAge?: string;
}

export interface AgentEvent {
  type: 'thinking' | 'tool_call' | 'tool_result' | 'token' | 'done' | 'error';
  data?: unknown;
}

// ========== 配置 ==========

const MAX_ITERATIONS = 10;
const AGENT_TIMEOUT_MS = 90_000;

function getApiKey(): string {
  return config.ai.apiKey || '';
}

function getBaseUrl(): string {
  return config.ai.baseUrl || 'https://api.deepseek.com/v1';
}

function getModel(): string {
  return config.ai.model || 'deepseek-chat';
}

// ========== 记忆系统：构建系统提示词 ==========

export async function buildSystemPrompt(context: AgentContext, userMessage: string): Promise<string> {
  let prompt = `你是星河宠记的 AI 宠物管家，名字叫"小记"。你温暖、专业、体贴。

## ⚡ 路由指南（最重要！先读这里）

当用户发送消息时，你必须先判断用户意图，然后选择正确的工具。以下是详细的路由规则和示例：

### 🏷️ 取名 → 调用 start_naming
用户想为新宠物取名、换名字、求推荐名字时，必须调用 start_naming。
示例：
- "帮我想个名字" → start_naming
- "叫什么名字好" → start_naming
- "起个名字" → start_naming
- "给我家猫取个名" → start_naming
- "有什么好名字推荐" → start_naming
- "想不出叫什么" → start_naming
- "改个名字" → start_naming
- "帮豆豆换个名字" → start_naming
- "求推荐可爱名字" → start_naming
- "帮我想想它叫啥" → start_naming

### 📋 打卡 → 调用 start_checkin 或 record_health_checkin
用户想记录宠物今天状态时：
- 如果用户只是表达了打卡意图但未提供具体数据 → 调用 start_checkin（启动前端打卡流程）
- 如果用户已明确描述了状态数据（如"精神很好，食欲正常"）→ 调用 record_health_checkin（直接记录）
示例：
- "打卡" → start_checkin
- "记录一下今天" → start_checkin
- "今天状态怎么样" → start_checkin
- "做个记录" → start_checkin
- "豆豆今天精神不太好" → start_checkin（启动流程让用户详细填写）
- "记录一下豆豆今天的情况" → start_checkin
- "精神很好，食欲正常，排便正常" → record_health_checkin（已有具体数据）

### 📸 回忆 → 调用 record_memory
用户想记录宠物回忆、写日记、保存美好时刻时，调用 record_memory。
示例：
- "记录回忆" → record_memory
- "写个日记" → record_memory
- "保存这段回忆" → record_memory
- "今天发生了一件有趣的事" → record_memory
- "记录一下我们今天的经历" → record_memory
- "留下美好回忆" → record_memory
- "记个日记" → record_memory
- "写段回忆" → record_memory

### 🏥 症状 → 调用 check_symptom
用户描述宠物不适症状时，调用 check_symptom。
示例：
- "豆豆吐了" → check_symptom
- "拉肚子怎么办" → check_symptom
- "精神不好" → check_symptom
- "不吃东西" → check_symptom
- "帮我看看怎么了" → check_symptom
- "是不是生病了" → check_symptom
- "豆豆今天有点蔫" → check_symptom
- "感觉不太对劲" → check_symptom
- "没精神" → check_symptom
- "老挠自己" → check_symptom

### 🍎 食物查询 → 调用 query_food_safety
用户询问食物安全性时，调用 query_food_safety。
示例：
- "巧克力能吃吗" → query_food_safety
- "葡萄可以喂吗" → query_food_safety
- "吃什么好" → query_food_safety
- "这个有毒吗" → query_food_safety
- "查一下鸡肉" → query_food_safety
- "喂什么好" → query_food_safety
- "推荐一些安全的食物" → query_food_safety

### 🐱 品种百科 → 调用 search_breed_info
用户询问品种信息时，调用 search_breed_info。
示例：
- "金毛怎么样" → search_breed_info
- "英短好养吗" → search_breed_info
- "查一下柯基" → search_breed_info
- "这是什么品种" → search_breed_info
- "品种推荐" → search_breed_info
- "适合新手养的狗" → search_breed_info

### 💬 普通聊天 / 其他 → 直接回复
用户只是聊天、问候、表达情感时，直接文字回复，不调用工具。
示例：
- "你好" → 直接回复
- "今天天气真好" → 直接回复
- "豆豆真可爱" → 直接回复
- "谢谢你" → 直接回复

## 你的能力
你可以通过调用工具来帮助用户管理宠物健康：
- 记录健康打卡（精神状态、食欲、排便、运动）
- 查询食物安全性
- 症状初筛（评估是否需要就医，不做诊断）
- 查询疫苗日历
- 查看健康趋势
- 查询品种百科
- 管理家庭宠物
- 记录喂养
- AI取名（调用 start_naming 工具）
- 健康打卡（调用 start_checkin 工具）
- 记录回忆（调用 record_memory 工具）

## 核心原则
1. 主动使用工具获取信息，不要凭空猜测
2. 如果用户意图不明确，先用工具获取上下文再回复
3. 每次回复控制在 3-5 句，温暖简洁
4. 如果检测到宠物严重症状，必须建议就医并推荐医院
5. 绝对不能做医学诊断、推荐具体药物
6. 涉及医疗建议时必须附带免责声明
7. 检测到用户情绪危机时触发安全干预

## 当前宠物信息
`;

  // 注入宠物档案
  if (context.petId && context.userId) {
    try {
      const { rows } = await pool.query(
        `SELECT name, species, breed, gender, birth_date, weight, is_neutered, notes
         FROM pet_profiles WHERE id = $1 AND user_id = $2`,
        [context.petId, context.userId]
      );
      if (rows.length > 0) {
        const p = rows[0];
        const age = p.birth_date
          ? `${Math.floor((Date.now() - new Date(p.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}岁`
          : '未知';
        prompt += `- 名字：${p.name}
- 品种：${p.breed}（${p.species === 'cat' ? '猫' : '狗'}）
- 年龄：${age}
- 体重：${p.weight || '未知'}kg
- 性别：${p.gender === 'male' ? '公' : p.gender === 'female' ? '母' : '未知'}
- 绝育：${p.is_neutered ? '已绝育' : '未绝育'}
- 备注：${p.notes || '无'}
`;
      }
    } catch {
      // 查询失败不阻塞
    }
  }

  // 注入记忆引擎上下文（记忆、矛盾、健康洞察）
  if (context.petId && context.userId) {
    try {
      const memCtx = await buildMemoryContext(context.userId, context.petId, userMessage);
      if (memCtx.memories) {
        prompt += `\n## 关于这只宠物的长期记忆（AI 自动整理）\n${memCtx.memories}\n`;
      }
      if (memCtx.contradictions) {
        prompt += `\n## ⚠️ 记忆冲突提醒\n${memCtx.contradictions}\n`;
      }
      if (memCtx.healthInsights) {
        prompt += `\n${memCtx.healthInsights}\n`;
      }
    } catch {
      // 记忆加载失败不阻塞
    }
  }

  // 注入长期记忆（宠物特征）- 作为辅助补充
  if (context.petId) {
    try {
      const { rows: facts } = await pool.query(
        `SELECT category, fact FROM pet_facts
         WHERE pet_id = $1 AND user_id = $2
         ORDER BY created_at DESC LIMIT 20`,
        [context.petId, context.userId]
      );
      if (facts.length > 0) {
        prompt += `\n## 宠物特征/喜好（用户手动记录）\n`;
        const categories: Record<string, string[]> = {};
        for (const f of facts) {
          if (!categories[f.category]) categories[f.category] = [];
          categories[f.category].push(f.fact);
        }
        for (const [cat, items] of Object.entries(categories)) {
          const label: Record<string, string> = {
            like: '喜欢', dislike: '讨厌', habit: '习惯', personality: '性格', general: '其他',
          };
          prompt += `- ${label[cat] || cat}：${items.join('；')}\n`;
        }
      }
    } catch {
      // 查询失败不阻塞
    }
  }

  // 注入短期记忆（最近打卡）
  if (context.petId) {
    try {
      const { rows: checkins } = await pool.query(
        `SELECT spirit_level, appetite_level, poop_level, exercise_level, note, created_at
         FROM pet_health_entries WHERE pet_id = $1 AND user_id = $2
         ORDER BY created_at DESC LIMIT 7`,
        [context.petId, context.userId]
      );
      if (checkins.length > 0) {
        prompt += `\n## 最近打卡记录\n`;
        for (const c of checkins) {
          const date = new Date(c.created_at).toLocaleDateString('zh-CN');
          prompt += `- ${date}：精神${c.spirit_level || '?'} 食欲${c.appetite_level || '?'} 排便${c.poop_level || '?'}${c.note ? `（${c.note}）` : ''}\n`;
        }
      }
    } catch {
      // 查询失败不阻塞
    }
  }

  // 注入家庭宠物列表
  if (context.userId) {
    try {
      const { rows: familyPets } = await pool.query(
        `SELECT name, species, breed FROM pet_profiles
         WHERE user_id = $1 AND id != $2
         ORDER BY created_at`,
        [context.userId, context.petId || '']
      );
      if (familyPets.length > 0) {
        prompt += `\n## 家庭其他宠物\n`;
        for (const fp of familyPets) {
          prompt += `- ${fp.name}（${fp.breed}，${fp.species === 'cat' ? '猫' : '狗'}）\n`;
        }
      }
    } catch {
      // 查询失败不阻塞
    }
  }

  prompt += `\n## 重要
- 你拥有工具调用能力和长期记忆能力，可以记住关于宠物的重要信息
- 看到「关于这只宠物的长期记忆」中的内容，说明你之前已经了解这些信息，请在回复中自然引用
- 如果记忆冲突提醒中有标记，说明用户的说法与之前记录不一致，请优先信任新信息
- 遇到需要查询或记录的情况，请主动调用工具
- 不要假装你已经知道数据，必须通过工具获取
- 如果用户没有指定宠物，默认使用当前活跃宠物
- 回复时用第二人称"你"，语气温暖自然`;

  return prompt;
}

// ========== 调用 LLM（支持 function calling） ==========

interface LLMResponse {
  content: string | null;
  toolCalls: ToolCall[] | null;
  finishReason: string;
  reasoningContent: string | null;
}

async function callLLM(
  messages: ChatMessage[],
  stream: boolean,
): Promise<LLMResponse> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('AI 服务未配置');
  }

  const body: Record<string, unknown> = {
    model: getModel(),
    messages,
    temperature: 0.7,
    max_tokens: 1024,
    stream: false,
    tools: getToolDefinitionsForLLM(),
    tool_choice: 'auto',
  };

  const response = await fetch(`${getBaseUrl()}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`AI API error: ${response.status} ${errorText}`);
  }

  const data = await response.json() as {
    choices: Array<{
      message: {
        content?: string;
        tool_calls?: Array<{
          id: string;
          type: 'function';
          function: { name: string; arguments: string };
        }>;
      };
      finish_reason: string;
    }>;
  };

  const choice = data.choices[0];
  const msg = choice.message;

  const toolCalls: ToolCall[] = [];
  if (msg.tool_calls) {
    for (const tc of msg.tool_calls) {
      try {
        toolCalls.push({
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments),
        });
      } catch {
        console.error(`[Agent] 工具参数解析失败: ${tc.function.name}`);
      }
    }
  }

  return {
    content: msg.content || null,
    toolCalls: toolCalls.length > 0 ? toolCalls : null,
    finishReason: choice.finish_reason,
    reasoningContent: (msg as Record<string, unknown>).reasoning_content as string || null,
  };
}

// ========== Agent 主循环（ReAct） ==========

export async function* agentLoop(
  userMessage: string,
  history: ChatMessage[],
  context: AgentContext,
): AsyncGenerator<AgentEvent> {
  const startTime = Date.now();

  // 构建系统提示词（传入用户消息以检索相关记忆）
  const systemPrompt = await buildSystemPrompt(context, userMessage);

  // 构建消息列表
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10),
    { role: 'user', content: userMessage },
  ];

  let iterations = 0;
  let finalContent = '';

  while (iterations < MAX_ITERATIONS) {
    // 超时检查
    if (Date.now() - startTime > AGENT_TIMEOUT_MS) {
      yield { type: 'error', data: { message: '思考超时，请稍后重试' } };
      return;
    }

    iterations++;
    yield { type: 'thinking', data: { iteration: iterations } };

    try {
      const response = await callLLM(messages, false);

      // LLM 想调用工具
      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const toolCall of response.toolCalls) {
          // 通知前端：正在调用工具
          yield {
            type: 'tool_call',
            data: { name: toolCall.name, arguments: toolCall.arguments },
          };

          // 执行工具
          const result = await executeTool(toolCall, {
            userId: context.userId,
            petId: context.petId,
          });

          // 通知前端：工具执行结果
          yield {
            type: 'tool_result',
            data: {
              name: toolCall.name,
              success: result.success,
              message: result.message,
              data: result.data,
            },
          };

          // 将工具调用和结果加入消息历史
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: '',
            tool_calls: [
              {
                id: `call_${Date.now()}_${toolCall.name}`,
                type: 'function',
                function: {
                  name: toolCall.name,
                  arguments: JSON.stringify(toolCall.arguments),
                },
              },
            ],
          };
          // DeepSeek V4 Flash 要求回传 reasoning_content
          if (response.reasoningContent) {
            (assistantMsg as unknown as Record<string, unknown>).reasoning_content = response.reasoningContent;
          }
          messages.push(assistantMsg);
          messages.push({
            role: 'tool',
            content: JSON.stringify(result),
            tool_call_id: `call_${Date.now()}_${toolCall.name}`,
          });
        }
        // 继续循环，让 LLM 处理工具结果
        continue;
      }

      // LLM 生成最终回复
      if (response.content) {
        finalContent = response.content;
        // 逐字流式输出
        const chars = Array.from(finalContent);
        for (let i = 0; i < chars.length; i += 3) {
          yield {
            type: 'token',
            data: { text: chars.slice(i, i + 3).join('') },
          };
        }
        yield { type: 'done', data: { content: finalContent, iterations } };
        // 异步保存对话记录 & 触发记忆摄入（不阻塞响应）
        const petIdForSave = context.petId || null;
        saveConversation(context.userId, petIdForSave, 'user', userMessage).catch(() => {});
        saveConversation(context.userId, petIdForSave, 'assistant', finalContent).catch(() => {});
        // 异步记忆摄入（传入已有记忆避免重复）+ 矛盾检测
        (async () => {
          const existing = await getActiveMemories(context.userId, context.petId || '', 20);
          await ingestMemories(context.userId, context.petId || '', userMessage, finalContent, existing);
          await detectContradiction(context.userId, context.petId || '', userMessage);
        })().catch(() => {});
        return;
      }

      // 没有内容也没有工具调用，结束
      yield { type: 'done', data: { content: '收到，让我想想...', iterations } };
      // 保存用户消息（无有效助手回复，跳过记忆摄入）
      saveConversation(context.userId, context.petId || null, 'user', userMessage).catch(() => {});
      return;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI 服务异常';

      // 如果已经执行过工具调用，返回部分结果
      if (iterations > 1) {
        yield {
          type: 'error',
          data: { message: `部分操作完成，但回复生成失败：${message}` },
        };
        return;
      }

      yield { type: 'error', data: { message } };
      return;
    }
  }

  // 超过最大迭代次数
  yield {
    type: 'done',
    data: {
      content: finalContent || '我已收集了相关信息，但分析时间较长。请告诉我你想了解什么？',
      iterations,
    },
  };
  // 异步保存对话记录 & 触发记忆摄入（不阻塞响应）
  saveConversation(context.userId, context.petId || null, 'user', userMessage).catch(() => {});
  if (finalContent) {
    saveConversation(context.userId, context.petId || null, 'assistant', finalContent).catch(() => {});
    // 异步记忆摄入 + 矛盾检测
    (async () => {
      const existing = await getActiveMemories(context.userId, context.petId || '', 20);
      await ingestMemories(context.userId, context.petId || '', userMessage, finalContent, existing);
      await detectContradiction(context.userId, context.petId || '', userMessage);
    })().catch(() => {});
  }
}

// ========== 安全守卫（输入检查） ==========

export async function guardCheckInput(text: string): Promise<{
  blocked: boolean;
  reason?: string;
}> {
  const apiKey = getApiKey();
  if (!apiKey) return { blocked: false };

  try {
    const response = await fetch(`${getBaseUrl()}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: getModel(),
        messages: [
          {
            role: 'system',
            content: '你是一个安全检测助手。分析用户输入，只回复JSON: {"score":0-10,"isCrisis":true/false}',
          },
          { role: 'user', content: text },
        ],
        temperature: 0,
        max_tokens: 50,
      }),
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) return { blocked: false };

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    const parsed = JSON.parse(data.choices[0].message.content);

    if (parsed.isCrisis) {
      return {
        blocked: true,
        reason: '请拨打24小时心理援助热线：400-161-9995。你不需要一个人面对。',
      };
    }
    if (parsed.score >= 8) {
      return { blocked: true, reason: '抱歉，我无法处理这条消息。请尝试与宠物相关的问题。' };
    }
    return { blocked: false };
  } catch {
    return { blocked: false };
  }
}