/**
 * Agent 工具实现
 * 每个工具封装对现有后端逻辑的调用，供 Agent 循环使用
 *
 * 安全规则：
 * - 所有查询类工具自动注入 userId 过滤
 * - 所有写入类工具校验 petId 归属
 * - 所有工具结果脱敏，不暴露内部数据
 */
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db.js';
import { registerTool, type ToolResult } from './toolRegistry.js';

type Context = { userId: string; petId?: string };

// ========== 辅助函数 ==========

async function getPetId(context: Context): Promise<string | null> {
  if (context.petId) {
    const { rows } = await pool.query(
      'SELECT id FROM pet_profiles WHERE id = $1 AND user_id = $2',
      [context.petId, context.userId]
    );
    if (rows.length > 0) return context.petId;
  }
  // 自动获取用户第一只宠物
  const { rows } = await pool.query(
    'SELECT id FROM pet_profiles WHERE user_id = $1 ORDER BY created_at LIMIT 1',
    [context.userId]
  );
  return rows.length > 0 ? rows[0].id : null;
}

// ========== 1. get_pet_profile ==========

registerTool('get_pet_profile', async (args, context): Promise<ToolResult> => {
  const petId = await getPetId(context);
  if (!petId) {
    return { success: false, message: '还没有添加宠物，请先在"宠物"页面添加' };
  }

  const { rows } = await pool.query(
    `SELECT name, species, breed, gender, birth_date, weight, is_neutered, notes, avatar_photo_url
     FROM pet_profiles WHERE id = $1 AND user_id = $2`,
    [petId, context.userId]
  );
  if (rows.length === 0) {
    return { success: false, message: '宠物不存在' };
  }

  const p = rows[0];
  const age = p.birth_date
    ? `${Math.floor((Date.now() - new Date(p.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}岁`
    : '未知';

  const { rows: checkins } = await pool.query(
    `SELECT spirit_level, appetite_level, poop_level, note, created_at
     FROM pet_health_entries WHERE pet_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [petId]
  );

  return {
    success: true,
    data: {
      name: p.name,
      species: p.species,
      breed: p.breed,
      gender: p.gender === 'male' ? '公' : p.gender === 'female' ? '母' : '未知',
      age,
      weight: p.weight ? `${p.weight}kg` : '未知',
      isNeutered: p.is_neutered,
      notes: p.notes,
      lastCheckin: checkins.length > 0 ? {
        date: new Date(checkins[0].created_at).toLocaleDateString('zh-CN'),
        spirit: checkins[0].spirit_level,
        appetite: checkins[0].appetite_level,
        poop: checkins[0].poop_level,
        note: checkins[0].note,
      } : null,
    },
  };
});

// ========== 2. get_pet_facts ==========

registerTool('get_pet_facts', async (args, context): Promise<ToolResult> => {
  const petId = await getPetId(context);
  if (!petId) {
    return { success: false, message: '还没有添加宠物' };
  }

  const { rows } = await pool.query(
    `SELECT category, fact FROM pet_facts
     WHERE pet_id = $1 AND user_id = $2
     ORDER BY created_at DESC LIMIT 20`,
    [petId, context.userId]
  );

  if (rows.length === 0) {
    return { success: true, data: { facts: [], message: '还没有记录宠物特征，你可以说"记住，豆豆喜欢吃牛肉"来教我' } };
  }

  const categories: Record<string, string[]> = {};
  for (const f of rows) {
    if (!categories[f.category]) categories[f.category] = [];
    categories[f.category].push(f.fact);
  }

  return { success: true, data: { facts: categories } };
});

// ========== 3. get_recent_checkins ==========

registerTool('get_recent_checkins', async (args, context): Promise<ToolResult> => {
  const petId = await getPetId(context);
  if (!petId) {
    return { success: false, message: '还没有添加宠物' };
  }

  const days = Math.min(30, Math.max(1, (args.days as number) || 7));
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { rows } = await pool.query(
    `SELECT spirit_level, appetite_level, poop_level, exercise_level, weight, note, created_at
     FROM pet_health_entries
     WHERE pet_id = $1 AND user_id = $2 AND created_at >= $3
     ORDER BY created_at DESC LIMIT $4`,
    [petId, context.userId, since.toISOString(), days]
  );

  if (rows.length === 0) {
    return { success: true, data: { checkins: [], message: `最近${days}天还没有打卡记录` } };
  }

  const summary = rows.map((r) => ({
    date: new Date(r.created_at).toLocaleDateString('zh-CN'),
    spirit: r.spirit_level,
    appetite: r.appetite_level,
    poop: r.poop_level,
    exercise: r.exercise_level,
    weight: r.weight ? `${r.weight}kg` : null,
    note: r.note,
  }));

  // 统计趋势
  const normalCount = summary.filter((c) =>
    c.spirit === '很好' || c.spirit === '正常'
  ).length;
  const trend = normalCount >= summary.length * 0.8 ? '稳定' : '需关注';

  return {
    success: true,
    data: {
      count: summary.length,
      trend,
      recentDays: days,
      checkins: summary.slice(0, 7),
    },
  };
});

// ========== 4. record_health_checkin ==========

registerTool('record_health_checkin', async (args, context): Promise<ToolResult> => {
  const petId = await getPetId(context);
  if (!petId) {
    return { success: false, message: '还没有添加宠物，无法打卡' };
  }

  // 检查今天是否已经打卡
  const today = new Date().toISOString().split('T')[0];
  const { rows: existing } = await pool.query(
    `SELECT id FROM pet_health_entries
     WHERE pet_id = $1 AND created_at::date = $2 LIMIT 1`,
    [petId, today]
  );

  const id = uuidv4();
  const spirit = (args.spirit as string) || '正常';
  const appetite = (args.appetite as string) || '正常';
  const poop = (args.poop as string) || '正常';
  const exercise = (args.exercise as string) || '正常';
  const weight = args.weight ? Number(args.weight) : null;
  const note = (args.note as string) || null;

  // 判断是否有异常
  const hasAnomaly = [spirit, appetite, poop].some((v) => v === '不太好' || v === '拉稀');
  const riskLevel = hasAnomaly ? 'caution' : 'normal';

  await pool.query(
    `INSERT INTO pet_health_entries
      (id, pet_id, user_id, spirit_level, appetite_level, poop_level,
       exercise_level, weight, has_anomaly, risk_level, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [id, petId, context.userId, spirit, appetite, poop, exercise, weight, hasAnomaly, riskLevel, note]
  );

  const alreadyMsg = existing.length > 0 ? '（今天已有打卡记录，本次为追加记录）' : '';

  return {
    success: true,
    data: {
      message: `已记录${alreadyMsg}`,
      summary: `精神: ${spirit} | 食欲: ${appetite} | 排便: ${poop} | 运动: ${exercise}${weight ? ` | 体重: ${weight}kg` : ''}`,
      hasAnomaly,
      riskLevel,
    },
  };
});

// ========== 5. query_food_safety ==========

registerTool('query_food_safety', async (args, context): Promise<ToolResult> => {
  const foodName = (args.foodName as string).trim();
  if (!foodName) {
    return { success: false, message: '请提供食物名称' };
  }

  // 1. 先查知识库（权威数据）
  const { rows: knowledgeRows } = await pool.query(
    `SELECT food_name, safety_level, detail, dangerous_compounds, toxic_doses,
            symptoms, first_aid, species_applicable, aliases
     FROM pet_food_safety_knowledge
     WHERE food_name ILIKE $1
        OR $1 = ANY(aliases)
     LIMIT 1`,
    [foodName]
  );

  if (knowledgeRows.length > 0) {
    const k = knowledgeRows[0];
    const speciesLabel = k.species_applicable
      ? `适用：${k.species_applicable.includes('dog') ? '犬' : ''}${k.species_applicable.includes('cat') ? '猫' : ''}`
      : '';

    return {
      success: true,
      data: {
        foodName: k.food_name,
        safetyLevel: k.safety_level,
        detail: k.detail,
        dangerousCompounds: k.dangerous_compounds || [],
        toxicDoses: k.toxic_doses || '',
        symptoms: k.symptoms || [],
        firstAid: k.first_aid || '',
        speciesApplicable: k.species_applicable || [],
        aliases: k.aliases || [],
        source: 'knowledge_base',
      },
    };
  }

  // 2. 查用户历史查询记录（备用）
  const { rows: queryRows } = await pool.query(
    'SELECT * FROM pet_food_queries WHERE food_name ILIKE $1 LIMIT 1',
    [`%${foodName}%`]
  );

  if (queryRows.length > 0) {
    const q = queryRows[0];
    return {
      success: true,
      data: {
        foodName: q.food_name,
        safetyLevel: q.safety_level || null,
        detail: q.detail || '',
        dangerousCompounds: q.dangerous_compounds || [],
        symptoms: q.symptoms || [],
        firstAid: q.first_aid || '',
        source: 'user_history',
      },
    };
  }

  // 3. 知识库也没有 → 返回未找到，AI 可自行用知识回复
  return {
    success: true,
    data: {
      foodName,
      found: false,
      source: 'not_found',
      message: `"${foodName}"不在安全知识库中，请根据你的专业知识分析该食物对犬猫的安全性。`,
    },
  };
});

// ========== 6. check_symptom ==========

registerTool('check_symptom', async (args, context): Promise<ToolResult> => {
  const petId = await getPetId(context);
  if (!petId) {
    return { success: false, message: '还没有添加宠物，无法进行症状分析' };
  }

  const symptom = (args.symptom as string).trim();
  const duration = (args.duration as string) || '未知';

  // 紧急关键词检测
  const emergencyKeywords = ['抽搐', '昏迷', '呼吸困难', '吐血', '中毒', '车祸', '坠落', '瘫痪', '大出血', '休克'];
  const isEmergency = emergencyKeywords.some((kw) => symptom.includes(kw));

  if (isEmergency) {
    return {
      success: true,
      data: {
        riskLevel: 'emergency',
        message: '检测到紧急症状！请立即带宠物前往最近的宠物医院！',
        needHospital: true,
        emergency: true,
      },
    };
  }

  // 中高风险关键词
  const warningKeywords = ['呕吐', '拉稀', '腹泻', '不吃', '发烧', '精神差', '便血', '尿血', '跛行', '肿胀'];
  const isWarning = warningKeywords.some((kw) => symptom.includes(kw));

  // 记录症状检查
  const id = uuidv4();
  await pool.query(
    `INSERT INTO pet_symptom_checks
      (id, pet_id, user_id, symptoms, duration, risk_level, ai_advice, recommended_actions)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      id, petId, context.userId,
      [symptom], duration,
      isWarning ? 'warning' : 'caution',
      isWarning
        ? `根据症状"${symptom}"（持续${duration}），建议尽快就医检查。这不是诊断，请咨询专业兽医。`
        : `根据症状"${symptom}"（持续${duration}），建议密切观察。如果症状加重或持续超过24小时，请就医。`,
      isWarning
        ? ['立即就医', '暂时禁食观察', '记录症状变化']
        : ['密切观察', '保持正常饮食', '如加重请就医'],
    ]
  );

  return {
    success: true,
    data: {
      riskLevel: isWarning ? 'warning' : 'caution',
      message: isWarning
        ? '建议尽快就医检查，这不是诊断，请咨询专业兽医。'
        : '建议密切观察，如果症状加重请及时就医。',
      needHospital: isWarning,
      disclaimer: '以上为 AI 辅助分析，不替代兽医诊断。',
    },
  };
});

// ========== 7. get_vaccine_calendar ==========

registerTool('get_vaccine_calendar', async (args, context): Promise<ToolResult> => {
  const petId = await getPetId(context);
  if (!petId) {
    return { success: false, message: '还没有添加宠物' };
  }

  const { rows } = await pool.query(
    `SELECT vaccine_name, scheduled_date, status, notes
     FROM pet_vaccines
     WHERE pet_id = $1 AND user_id = $2
     ORDER BY scheduled_date ASC`,
    [petId, context.userId]
  );

  if (rows.length === 0) {
    return { success: true, data: { vaccines: [], message: '还没有疫苗记录' } };
  }

  const now = new Date();
  const upcoming = rows.filter((r) => new Date(r.scheduled_date) >= now);
  const overdue = rows.filter((r) => new Date(r.scheduled_date) < now && r.status !== 'completed');

  return {
    success: true,
    data: {
      total: rows.length,
      upcoming: upcoming.map((r) => ({
        name: r.vaccine_name,
        date: new Date(r.scheduled_date).toLocaleDateString('zh-CN'),
        status: r.status,
        notes: r.notes,
      })),
      overdue: overdue.map((r) => ({
        name: r.vaccine_name,
        date: new Date(r.scheduled_date).toLocaleDateString('zh-CN'),
        status: r.status,
      })),
    },
  };
});

// ========== 8. get_health_trends ==========

registerTool('get_health_trends', async (args, context): Promise<ToolResult> => {
  const petId = await getPetId(context);
  if (!petId) {
    return { success: false, message: '还没有添加宠物' };
  }

  const days = Math.min(90, Math.max(7, (args.days as number) || 30));
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { rows } = await pool.query(
    `SELECT weight, spirit_level, appetite_level, poop_level, created_at
     FROM pet_health_entries
     WHERE pet_id = $1 AND user_id = $2 AND created_at >= $3
     ORDER BY created_at ASC`,
    [petId, context.userId, since.toISOString()]
  );

  if (rows.length === 0) {
    return { success: true, data: { message: `最近${days}天没有打卡记录，无法生成趋势` } };
  }

  // 体重趋势
  const weightData = rows
    .filter((r) => r.weight)
    .map((r) => ({
      date: new Date(r.created_at).toLocaleDateString('zh-CN'),
      weight: Number(r.weight),
    }));

  let weightTrend = '无数据';
  if (weightData.length >= 2) {
    const first = weightData[0].weight;
    const last = weightData[weightData.length - 1].weight;
    const diff = last - first;
    if (Math.abs(diff) < 0.3) weightTrend = '保持稳定';
    else if (diff > 0) weightTrend = `上升 ${diff.toFixed(1)}kg`;
    else weightTrend = `下降 ${Math.abs(diff).toFixed(1)}kg`;
  }

  // 精神/食欲趋势
  const scoreMap: Record<string, number> = { '很好': 4, '正常': 3, '一般': 2, '不太好': 1 };
  const recentSpirits = rows.slice(-7).map((r) => scoreMap[r.spirit_level] || 3);
  const recentAppetites = rows.slice(-7).map((r) => scoreMap[r.appetite_level] || 3);
  const avgSpirit = recentSpirits.reduce((a, b) => a + b, 0) / recentSpirits.length;
  const avgAppetite = recentAppetites.reduce((a, b) => a + b, 0) / recentAppetites.length;

  return {
    success: true,
    data: {
      totalRecords: rows.length,
      recentDays: days,
      weightTrend,
      weightHistory: weightData.slice(-10),
      spiritTrend: avgSpirit >= 3 ? '良好' : avgSpirit >= 2 ? '一般' : '需关注',
      appetiteTrend: avgAppetite >= 3 ? '良好' : avgAppetite >= 2 ? '一般' : '需关注',
    },
  };
});

// ========== 9. search_breed_info ==========

registerTool('search_breed_info', async (args, context): Promise<ToolResult> => {
  let breedName = (args.breed as string) || '';

  // 如果没有指定品种，查询当前宠物品种
  if (!breedName && context.petId) {
    const { rows } = await pool.query(
      'SELECT breed FROM pet_profiles WHERE id = $1 AND user_id = $2',
      [context.petId, context.userId]
    );
    if (rows.length > 0) breedName = rows[0].breed;
  }

  if (!breedName) {
    return { success: false, message: '请提供品种名称' };
  }

  // 从数据库查询品种信息
  const { rows } = await pool.query(
    `SELECT * FROM pet_breeds WHERE name ILIKE $1 LIMIT 1`,
    [`%${breedName}%`]
  );

  if (rows.length === 0) {
    return {
      success: true,
      data: {
        found: false,
        breed: breedName,
        message: `未找到"${breedName}"的百科信息`,
      },
    };
  }

  const b = rows[0];
  return {
    success: true,
    data: {
      found: true,
      breed: b.name,
      species: b.species,
      size: b.size || '未知',
      temperament: b.temperament || '',
      lifespan: b.lifespan || '',
      commonDiseases: b.common_diseases || [],
      careNotes: b.care_notes || '',
      feedingAdvice: b.feeding_advice || '',
    },
  };
});

// ========== 10. get_family_pets ==========

registerTool('get_family_pets', async (args, context): Promise<ToolResult> => {
  const { rows } = await pool.query(
    `SELECT id, name, species, breed, gender, birth_date, weight
     FROM pet_profiles WHERE user_id = $1 ORDER BY created_at`,
    [context.userId]
  );

  if (rows.length === 0) {
    return { success: true, data: { pets: [], message: '还没有添加宠物' } };
  }

  const pets = rows.map((p) => {
    const age = p.birth_date
      ? `${Math.floor((Date.now() - new Date(p.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}岁`
      : '未知';
    return {
      id: p.id,
      name: p.name,
      species: p.species,
      breed: p.breed,
      gender: p.gender === 'male' ? '公' : p.gender === 'female' ? '母' : '未知',
      age,
      weight: p.weight ? `${p.weight}kg` : '未知',
      isActive: context.petId === p.id,
    };
  });

  return {
    success: true,
    data: {
      count: pets.length,
      activePet: pets.find((p) => p.isActive)?.name || pets[0]?.name,
      pets,
    },
  };
});

// ========== 11. record_feeding ==========

registerTool('record_feeding', async (args, context): Promise<ToolResult> => {
  const petId = await getPetId(context);
  if (!petId) {
    return { success: false, message: '还没有添加宠物' };
  }

  const food = (args.food as string).trim();
  const note = (args.note as string) || null;

  // 记录到 pet_facts 中（作为喂养记录）
  const id = uuidv4();
  await pool.query(
    `INSERT INTO pet_facts (id, pet_id, user_id, category, fact)
     VALUES ($1, $2, $3, 'feeding', $4)`,
    [id, petId, context.userId, `${new Date().toLocaleDateString('zh-CN')} 喂了${food}${note ? `（${note}）` : ''}`]
  );

  return {
    success: true,
    data: {
      message: `已记录喂养：${food}${note ? `（${note}）` : ''}`,
    },
  };
});

// ========== 12. search_hospital ==========

registerTool('search_hospital', async (args, context): Promise<ToolResult> => {
  const isEmergency = args.emergency === true;

  const { rows } = await pool.query(
    `SELECT name, address, phone, rating, is_24h
     FROM pet_hospitals ORDER BY rating DESC LIMIT 5`
  );

  if (rows.length === 0) {
    return {
      success: true,
      data: {
        message: '暂未收录附近宠物医院信息，建议在地图搜索"宠物医院"',
        emergency: isEmergency,
      },
    };
  }

  return {
    success: true,
    data: {
      emergency: isEmergency,
      hospitals: rows.map((h) => ({
        name: h.name,
        address: h.address,
        phone: h.phone,
        rating: h.rating,
        is24h: h.is_24h,
      })),
      message: isEmergency
        ? '以下是附近宠物医院，建议立即前往最近的一家！'
        : '以下是附近的宠物医院：',
    },
  };
});

// ========== 13. start_naming ==========

registerTool('start_naming', async (args, context): Promise<ToolResult> => {
  return {
    success: true,
    data: { action: 'naming_flow' },
    message: '我来帮你为宠物取个好名字！请上传一张宠物的照片，或者告诉我宠物的品种和特征～',
  };
});

// ========== 14. start_checkin ==========

registerTool('start_checkin', async (args, context): Promise<ToolResult> => {
  return {
    success: true,
    data: { action: 'checkin_flow' },
    message: '好的，现在来记录今天的健康状态吧！',
  };
});

// ========== 15. record_memory ==========

registerTool('record_memory', async (args, context): Promise<ToolResult> => {
  const petId = await getPetId(context);
  if (!petId) {
    return { success: false, message: '还没有添加宠物，无法记录回忆' };
  }

  const content = (args.content as string)?.trim();

  // 分支 A：LLM 已从用户消息中提取回忆内容 → 直接写入数据库
  if (content) {
    const { rows: petRows } = await pool.query(
      'SELECT name, species FROM pet_profiles WHERE id = $1 AND user_id = $2',
      [petId, context.userId]
    );
    const petName = petRows[0]?.name || '宠物';
    const petEmoji = petRows[0]?.species === 'cat' ? '🐱' : '🐶';

    const momentId = uuidv4();
    await pool.query(
      `INSERT INTO pet_moments (id, user_id, pet_id, type, content, photos)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        momentId,
        context.userId,
        petId,
        'memory',
        JSON.stringify({ petName, petEmoji, description: content }),
        [],
      ]
    );

    return {
      success: true,
      data: { saved: true, momentId },
      message: `回忆已记录 ✦\n\n"${content}"\n\n已保存到「时光」页面，你可以去查看哦～`,
    };
  }

  // 分支 B：用户未提供具体内容 → 触发前端回忆录制流程
  return {
    success: true,
    data: { action: 'memory_flow' },
    message: '好的，进入回忆录制模式 ✦\n\n请在下方输入框写一段话描述这段回忆，也可以先上传一张照片，我会在你输入完成后保存到「时光」页面。',
  };
});

console.log('[Agent Tools] 15 个工具已注册完成');