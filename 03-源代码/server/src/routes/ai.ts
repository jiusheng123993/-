import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { chat, guardCheck, guardCheckOutput } from '../services/aiService.js';

const router = Router();

router.post('/chat', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { messages, temperature, max_tokens } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ success: false, message: 'messages 不能为空' });
      return;
    }

    const result = await chat(messages, { temperature, max_tokens });
    res.json({ success: true, data: { content: result } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI 服务异常';
    res.status(500).json({ success: false, message });
  }
});

router.post('/guard', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      res.status(400).json({ success: false, message: 'text 参数不能为空' });
      return;
    }

    const result = await guardCheck(text);
    res.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : '安全检测异常';
    res.status(500).json({ success: false, message });
  }
});

router.post('/naming/interpret', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, species, breed, gender } = req.body;

    if (!name || typeof name !== 'string') {
      res.status(400).json({ success: false, message: 'name 参数不能为空' });
      return;
    }

    const systemPrompt = `你是一位专业的宠物取名大师，擅长为${species === 'cat' ? '猫咪' : '狗狗'}取名并解读名字的含义。
请根据用户提供的宠物名字，从字义、寓意、五行、音律、文化内涵等角度进行专业解读。
回复要求：结构化、有深度、语气温暖，控制在 300 字以内。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'user' as const,
        content: `请解读宠物名字"${name}"，这是一只${breed || ''}${gender === 'male' ? '公' : gender === 'female' ? '母' : ''}${species === 'cat' ? '猫' : '狗'}`,
      },
    ];

    const result = await chat(messages, { temperature: 0.7, max_tokens: 600 });

    let safeResult = result;
    try {
      const guardResult = await guardCheckOutput(result);
      if (guardResult.isUnsafeMedicalAdvice) {
        safeResult = '名字解读生成完成，但部分内容因安全策略已过滤。';
      }
    } catch {
      // guard check failed, return original result
    }

    res.json({ success: true, data: { interpretation: safeResult } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '取名解读异常';
    res.status(500).json({ success: false, message });
  }
});

router.post('/naming/recommend', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { species, breed, gender, style, count } = req.body;

    if (!species) {
      res.status(400).json({ success: false, message: 'species 参数不能为空' });
      return;
    }

    const countNum = Math.min(Math.max(count || 5, 1), 10);
    const styleText = style || '可爱温馨';

    const systemPrompt = `你是一位专业的宠物取名大师，擅长为${species === 'cat' ? '猫咪' : '狗狗'}取名字。
请根据用户提供的宠物信息，生成 ${countNum} 个${styleText}风格的名字建议。
每个名字附带简短寓意说明（20字以内）。
回复格式要求：严格返回 JSON 数组，每个元素包含 name 和 meaning 字段。`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'user' as const,
        content: `请为一只${breed || ''}${gender === 'male' ? '公' : gender === 'female' ? '母' : ''}${species === 'cat' ? '猫' : '狗'}推荐${countNum}个${styleText}风格的名字。`,
      },
    ];

    const result = await chat(messages, { temperature: 0.9, max_tokens: 800 });

    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const names = JSON.parse(jsonMatch[0]);
        res.json({ success: true, data: { names } });
        return;
      }
    } catch {
      // parse failed, return raw text
    }

    res.json({ success: true, data: { names: [], raw: result } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '取名推荐异常';
    res.status(500).json({ success: false, message });
  }
});

export default router;
