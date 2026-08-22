/**
 * 工具注册中心 - Agent 工具的定义、注册、校验和执行
 * 采用注册表模式，支持运行时动态注册工具
 */
import { pool } from '../db.js';

// ========== 工具类型定义 ==========

export interface ToolDefinition {
  /** OpenAI Function Calling 格式的工具名 */
  name: string;
  /** 工具描述，给 AI 看，决定何时调用 */
  description: string;
  /** 参数 JSON Schema */
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
    }>;
    required: string[];
  };
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  message?: string;
}

export type ToolExecutor = (
  args: Record<string, unknown>,
  context: { userId: string; petId?: string }
) => Promise<ToolResult>;

// ========== 工具定义清单（给 AI 看） ==========

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'find_pet_by_name',
    description: '按名字查找用户家的宠物，返回宠物 ID。当用户提到"家里的某只宠物"（如"小黑""豆豆"）但不确定是哪只、或需要查询非当前宠物的信息时，先调用本工具拿到 pet_id，再传给其他查询工具（get_pet_profile/get_recent_checkins 等的 pet_id 参数）。',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: '宠物名字，如"小黑""豆豆"' },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_pet_profile',
    description: '获取宠物的完整档案，包括品种、年龄、体重、绝育状态、照片等。当用户询问宠物基本信息或需要了解宠物情况时使用。可通过 pet_id 指定宠物（先用 find_pet_by_name 获取），不传则查当前活跃宠物。',
    parameters: {
      type: 'object',
      properties: {
        pet_id: { type: 'string', description: '宠物 ID（来自 find_pet_by_name）；不传则查当前活跃宠物' },
      },
      required: [],
    },
  },
  {
    name: 'get_pet_facts',
    description: '获取 AI 记住的宠物特征、喜好、习惯、性格信息。包括喜欢/讨厌的食物、行为习惯、性格特点等。当需要个性化回复时使用。可通过 pet_id 指定宠物。',
    parameters: {
      type: 'object',
      properties: {
        pet_id: { type: 'string', description: '宠物 ID（来自 find_pet_by_name）；不传则查当前活跃宠物' },
      },
      required: [],
    },
  },
  {
    name: 'get_recent_checkins',
    description: '查询宠物最近 N 天的健康打卡记录，包括精神状态、食欲、排便、运动等维度。当用户询问宠物最近状态或需要健康趋势分析时使用。可通过 pet_id 指定宠物（如用户问"小黑最近怎么样"）。',
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'number', description: '查询最近多少天，默认 7 天' },
        pet_id: { type: 'string', description: '宠物 ID（来自 find_pet_by_name）；不传则查当前活跃宠物' },
      },
      required: [],
    },
  },
  {
    name: 'record_health_checkin',
    description: '为宠物记录一次健康打卡。当用户说"打卡"、"记录一下"或描述宠物今天状态（精神、食欲、排便等）时使用。',
    parameters: {
      type: 'object',
      properties: {
        spirit: { type: 'string', enum: ['很好', '正常', '一般', '不太好'], description: '精神状态' },
        appetite: { type: 'string', enum: ['很好', '正常', '一般', '不太好'], description: '食欲' },
        poop: { type: 'string', enum: ['正常', '偏软', '偏硬', '拉稀', '未排便'], description: '排便情况' },
        exercise: { type: 'string', enum: ['充足', '正常', '较少', '未运动'], description: '运动量' },
        weight: { type: 'number', description: '体重（kg），可选' },
        note: { type: 'string', description: '备注，如异常详细描述' },
      },
      required: [],
    },
  },
  {
    name: 'query_food_safety',
    description: '查询某种食物对宠物是否安全。仅当用户主动提问食物安全性时使用（如"XX能吃吗""XX有毒吗"）。用户分享宠物吃了什么（如"它今天吃了超多"）时不使用此工具。',
    parameters: {
      type: 'object',
      properties: {
        foodName: { type: 'string', description: '食物名称，如"巧克力""葡萄""鸡肉"' },
      },
      required: ['foodName'],
    },
  },
  {
    name: 'check_symptom',
    description: '宠物症状初筛，评估紧急程度。当用户描述宠物不适症状（呕吐、拉稀、精神差等）时使用。不诊断，只评估是否需要就医。',
    parameters: {
      type: 'object',
      properties: {
        symptom: { type: 'string', description: '症状描述，如"呕吐2次，精神不好"' },
        duration: { type: 'string', description: '持续时间，如"半天""2天"' },
      },
      required: ['symptom'],
    },
  },
  {
    name: 'get_vaccine_calendar',
    description: '查询宠物的疫苗日历，包括已接种和即将到期的疫苗。当用户询问疫苗相关问题时使用。可通过 pet_id 指定宠物。',
    parameters: {
      type: 'object',
      properties: {
        pet_id: { type: 'string', description: '宠物 ID（来自 find_pet_by_name）；不传则查当前活跃宠物' },
      },
      required: [],
    },
  },
  {
    name: 'get_health_trends',
    description: '查询宠物健康趋势数据，包括体重变化、打卡趋势等。当用户询问"最近胖了没"、"趋势怎么样"时使用。可通过 pet_id 指定宠物。',
    parameters: {
      type: 'object',
      properties: {
        days: { type: 'number', description: '查询最近多少天，默认 30 天' },
        pet_id: { type: 'string', description: '宠物 ID（来自 find_pet_by_name）；不传则查当前活跃宠物' },
      },
      required: [],
    },
  },
  {
    name: 'search_breed_info',
    description: '查询宠物品种百科信息，包括品种特征、常见遗传病、饲养注意事项等。当用户询问品种相关问题时使用。',
    parameters: {
      type: 'object',
      properties: {
        breed: { type: 'string', description: '品种名称，如"金毛寻回犬""英短"等。如果不传则查询当前宠物品种。' },
      },
      required: [],
    },
  },
  {
    name: 'get_family_pets',
    description: '获取用户家庭中所有宠物列表。当用户提及"家里的其他宠物"或需要对比多只宠物时使用。',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'record_feeding',
    description: '记录一次喂养。当用户说"喂了XX"、"吃了XX"时使用。',
    parameters: {
      type: 'object',
      properties: {
        food: { type: 'string', description: '喂的食物，如"牛肉200g""狗粮1碗"' },
        note: { type: 'string', description: '备注，可选' },
      },
      required: ['food'],
    },
  },
  {
    name: 'search_hospital',
    description: '搜索附近的宠物医院。当用户宠物出现紧急症状或需要就医时使用。',
    parameters: {
      type: 'object',
      properties: {
        emergency: { type: 'boolean', description: '是否紧急情况，默认 false' },
      },
      required: [],
    },
  },
  {
    name: 'start_naming',
    description: '当用户想要为宠物取名、起名、命名时使用。调用此工具后前端会启动AI取名流程，包含命理分析。',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'start_checkin',
    description: '当用户想要打卡、记录宠物今日状态时使用。调用此工具后前端会启动健康打卡流程。',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'record_memory',
    description: '当用户想要记录宠物回忆、写回忆、写日记时使用。如果用户已在消息中描述了回忆内容（如"记录回忆：豆豆今天玩疯了""写个日记：今天带它去公园"），必须把回忆内容作为 content 参数传入，工具会直接保存到「时光」页面。如果用户只是表达想记录回忆但未提供具体内容（如"添加回忆""想写个日记"），则不传 content，会启动回忆录制流程让用户输入。',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: '回忆内容描述。用户已在消息中提供回忆内容时传入，例如"豆豆今天追逗猫棒玩疯了""今天带它去公园散步，遇到一只小狗"' },
      },
      required: [],
    },
  },
];

// ========== 工具执行器注册 ==========

const toolExecutors = new Map<string, ToolExecutor>();

export function registerTool(name: string, executor: ToolExecutor): void {
  toolExecutors.set(name, executor);
}

export function getToolExecutor(name: string): ToolExecutor | undefined {
  return toolExecutors.get(name);
}

export function getAllToolNames(): string[] {
  return Array.from(toolExecutors.keys());
}

// ========== 工具参数校验 ==========

function validateArgs(tool: ToolDefinition, args: Record<string, unknown>): string | null {
  for (const req of tool.parameters.required) {
    if (args[req] === undefined || args[req] === null || args[req] === '') {
      return `缺少必填参数: ${req}`;
    }
  }
  // 枚举值校验
  for (const [key, schema] of Object.entries(tool.parameters.properties)) {
    if (schema.enum && args[key] !== undefined) {
      if (!schema.enum.includes(args[key] as string)) {
        return `参数 ${key} 的值 "${args[key]}" 不在允许范围内: ${schema.enum.join(', ')}`;
      }
    }
  }
  return null;
}

// ========== 统一执行入口 ==========

export async function executeTool(
  toolCall: ToolCall,
  context: { userId: string; petId?: string }
): Promise<ToolResult> {
  const tool = TOOL_DEFINITIONS.find((t) => t.name === toolCall.name);
  if (!tool) {
    return { success: false, message: `未知工具: ${toolCall.name}` };
  }

  const validationError = validateArgs(tool, toolCall.arguments);
  if (validationError) {
    return { success: false, message: `参数校验失败: ${validationError}` };
  }

  const executor = toolExecutors.get(toolCall.name);
  if (!executor) {
    return { success: false, message: `工具 ${toolCall.name} 尚未实现` };
  }

  try {
    return await executor(toolCall.arguments, context);
  } catch (error) {
    const message = error instanceof Error ? error.message : '工具执行异常';
    console.error(`[Tool:${toolCall.name}] 执行失败:`, message);
    return { success: false, message: `工具执行失败: ${message}` };
  }
}

// ========== 转为 OpenAI Function Calling 格式 ==========

export function getToolDefinitionsForLLM(): Array<{
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: ToolDefinition['parameters'];
  };
}> {
  return TOOL_DEFINITIONS.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}