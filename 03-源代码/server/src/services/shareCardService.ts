/**
 * 分享卡片业务服务层 - 编排分享卡片的核心业务逻辑
 * 职责：生成卡片（真实 SVG 渲染）、分页列表、详情查询、删除卡片、记录分享行为
 * 所有操作基于 user_id 做归属校验，防止跨用户越权访问
 *
 * SVG 渲染策略：
 *   - 根据卡card_type 和 style.theme 生成纯 SVG 字符串
 *   - 保存到 {uploadDir}/share-cards/{userId}/{cardId}.svg
 *   - card_url 指向静态服务路径 /uploads/share-cards/{userId}/{cardId}.svg
 *   - 配置 publicBaseUrl 时拼接为绝对 URL，否则返回相对路径
 *   - 文件写入失败降级为仅记录 card_data，不阻断卡片创建（card_url=null）
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import {
  ShareCardRepository,
  type ShareCardRow,
} from '../repositories/shareCardRepository.js';

/** 生成卡片的 source_data 输入 */
export interface ShareCardSourceData {
  report_id?: string;
  memoir_id?: string;
  pet_id?: string;
  milestone_id?: string;
  snapshot_id?: string;
  name_history_id?: string;
  feed_id?: string;
  custom_text?: string;
  custom_photos?: string[];
}

/** 生成卡片的 style 输入 */
export interface ShareCardStyle {
  theme?: 'warm' | 'elegant' | 'cute' | 'minimal';
  background_color?: string;
  font_family?: string;
}

/** 生成卡片请求参数 */
export interface GenerateShareCardInput {
  card_type: string;
  source_data: ShareCardSourceData;
  style?: ShareCardStyle;
}

/** 分页查询参数 */
export interface ShareCardQueryInput {
  page: number;
  page_size: number;
  card_type?: string;
}

/** 分页列表响应 */
export interface ShareCardListResponse {
  items: ShareCardRow[];
  total: number;
  page: number;
  page_size: number;
}

/** 分享渠道类型 */
export type ShareChannel = 'wechat' | 'moments' | 'save' | 'copy';

/** 业务错误（带状态码，供路由层捕获） */
export class ShareCardError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ShareCardError';
  }
}

const shareCardRepository = new ShareCardRepository();

/**
 * 卡片类型元数据（标题/图标/默认文案）
 * 用于 SVG 渲染时显示卡片类型标题和默认内容
 */
const CARD_TYPE_META: Record<string, { title: string; icon: string; defaultContent: string }> = {
  health_report: { title: '健康报告', icon: '📊', defaultContent: '本周健康打卡记录' },
  weekly_summary: { title: '周报总结', icon: '📝', defaultContent: '本周家庭周报' },
  milestone: { title: '里程碑', icon: '🎯', defaultContent: '记录成长的重要时刻' },
  family_tree: { title: '家族图谱', icon: '🌳', defaultContent: '毛孩子的家族关系' },
  memoir: { title: '回忆录', icon: '📖', defaultContent: '珍贵的回忆时光' },
  naming: { title: '取名', icon: '📛', defaultContent: '为毛孩子起的名字' },
  birthday: { title: '生日', icon: '🎂', defaultContent: '毛孩子的生日庆典' },
  achievement: { title: '成就', icon: '🏆', defaultContent: '达成的成就里程碑' },
  daily_moment: { title: '日常动态', icon: '📸', defaultContent: '今日份的小确幸' },
  yearly_review: { title: '年度回顾', icon: '📅', defaultContent: '这一年的温暖回忆' },
};

/**
 * 主题配色方案
 * 每个主题定义背景色、文字色、强调色、装饰色
 */
const THEME_PALETTES: Record<string, { bg: string; text: string; accent: string; deco: string }> = {
  warm: { bg: '#FFF8F0', text: '#5D4037', accent: '#FF7043', deco: '#FFCC80' },
  elegant: { bg: '#1A2332', text: '#E8D5B7', accent: '#D4AF37', deco: '#8B7355' },
  cute: { bg: '#FFF0F5', text: '#6A1B4D', accent: '#FF69B4', deco: '#FFB6C1' },
  minimal: { bg: '#FFFFFF', text: '#212121', accent: '#607D8B', deco: '#E0E0E0' },
};

/** SVG 画布尺寸（750x1000，适配小程序分享） */
const SVG_WIDTH = 750;
const SVG_HEIGHT = 1000;

/**
 * XML 转义（防止用户输入破坏 SVG 结构，避免 XSS/注入）
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 将长文本按指定宽度拆分为多行
 * 中文按字符数计算，英文按单词边界计算
 */
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const lines: string[] = [];
  let current = '';
  for (const ch of text) {
    if (ch === '\n') {
      lines.push(current);
      current = '';
    } else if (current.length >= maxCharsPerLine) {
      lines.push(current);
      current = ch;
    } else {
      current += ch;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

/**
 * 生成分享卡片 SVG 字符串
 * 布局设计：
 *   ┌─────────────────────────────────────┐
 *   │  ╭ 顶部装饰条（渐变）              ╮ │
 *   │  │ 星河宠记 · 分享卡片               │ │
 *   │  ╰────────────────────────────────╯ │
 *   │                                     │
 *   │     ┌──────────────┐                │
 *   │     │ 🐾 圆形图标  │                │
 *   │     │  卡片类型标题 │                │
 *   │     └──────────────┘                │
 *   │                                     │
 *   │     "第一行内容..."                 │
 *   │     "第二行内容..."                 │
 *   │                                     │
 *   │  ───── 宠物名 · 日期 ─────          │
 *   │  #card1234                          │
 *   └─────────────────────────────────────┘
 *
 * @param cardType - 卡片类型（10 种枚举）
 * @param sourceData - 数据源（含 custom_text/pet_id 等）
 * @param style - 样式配置（theme/background_color/font_family）
 * @param cardId - 卡片 ID（用于水印显示）
 * @returns SVG 字符串
 */
export function renderCardSvg(
  cardType: string,
  sourceData: ShareCardSourceData,
  style: ShareCardStyle | undefined,
  cardId: string,
): string {
  const meta = CARD_TYPE_META[cardType] ?? { title: cardType, icon: '🐾', defaultContent: '分享我的宠物生活' };
  const theme = style?.theme ?? 'warm';
  const palette = THEME_PALETTES[theme] ?? THEME_PALETTES.warm;
  const bgColor = style?.background_color || palette.bg;
  const fontFamily = style?.font_family || 'PingFang SC, Microsoft YaHei, sans-serif';
  const content = sourceData.custom_text || meta.defaultContent;
  const date = new Date().toISOString().slice(0, 10);

  const appName = '星河宠记';
  const shortId = cardId.slice(0, 8);

  // 多行文本拆分（中文每行最多 18 字符）
  const contentLines = wrapText(content, 18);
  const lineHeight = 52;
  const contentStartY = 560;
  const totalContentHeight = contentLines.length * lineHeight;
  // 内容区垂直居中调整
  const contentBaseY = contentStartY + Math.max(0, (200 - totalContentHeight) / 2);

  // 构建多行文本的 tspan 元素
  const contentTspans = contentLines
    .map((line, i) => `<tspan x="${SVG_WIDTH / 2}" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}">
  <defs>
    <linearGradient id="bg-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${escapeXml(bgColor)}"/>
      <stop offset="100%" stop-color="${escapeXml(palette.deco)}" stop-opacity="0.35"/>
    </linearGradient>
    <linearGradient id="top-bar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${escapeXml(palette.accent)}" stop-opacity="0.15"/>
      <stop offset="50%" stop-color="${escapeXml(palette.accent)}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${escapeXml(palette.accent)}" stop-opacity="0.15"/>
    </linearGradient>
    <linearGradient id="icon-ring" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${escapeXml(palette.accent)}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${escapeXml(palette.deco)}" stop-opacity="0.5"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="${escapeXml(palette.text)}" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- 背景 -->
  <rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="url(#bg-grad)"/>

  <!-- 顶部装饰条 -->
  <rect x="0" y="0" width="${SVG_WIDTH}" height="8" fill="url(#top-bar)"/>

  <!-- 外边框 -->
  <rect x="36" y="36" width="${SVG_WIDTH - 72}" height="${SVG_HEIGHT - 72}" fill="none" stroke="${escapeXml(palette.accent)}" stroke-width="1.5" rx="24" ry="24" opacity="0.35"/>

  <!-- 内边框 -->
  <rect x="52" y="52" width="${SVG_WIDTH - 104}" height="${SVG_HEIGHT - 104}" fill="none" stroke="${escapeXml(palette.accent)}" stroke-width="1" rx="16" ry="16" opacity="0.2"/>

  <!-- 四角装饰小圆 -->
  <circle cx="72" cy="72" r="4" fill="${escapeXml(palette.accent)}" opacity="0.4"/>
  <circle cx="${SVG_WIDTH - 72}" cy="72" r="4" fill="${escapeXml(palette.accent)}" opacity="0.4"/>
  <circle cx="72" cy="${SVG_HEIGHT - 72}" r="4" fill="${escapeXml(palette.accent)}" opacity="0.4"/>
  <circle cx="${SVG_WIDTH - 72}" cy="${SVG_HEIGHT - 72}" r="4" fill="${escapeXml(palette.accent)}" opacity="0.4"/>

  <!-- 顶部标题区 -->
  <text x="${SVG_WIDTH / 2}" y="130" font-family="${escapeXml(fontFamily)}" font-size="28" fill="${escapeXml(palette.text)}" text-anchor="middle" opacity="0.5" letter-spacing="4">${escapeXml(appName)} · 分享卡片</text>

  <!-- 顶部装饰线 -->
  <line x1="${SVG_WIDTH / 2 - 120}" y1="152" x2="${SVG_WIDTH / 2 + 120}" y2="152" stroke="${escapeXml(palette.accent)}" stroke-width="1" opacity="0.25"/>

  <!-- 图标圆形背景 -->
  <circle cx="${SVG_WIDTH / 2}" cy="280" r="72" fill="url(#icon-ring)" filter="url(#shadow)"/>
  <circle cx="${SVG_WIDTH / 2}" cy="280" r="64" fill="${escapeXml(bgColor)}" opacity="0.95"/>

  <!-- 图标 -->
  <text x="${SVG_WIDTH / 2}" y="296" font-family="${escapeXml(fontFamily)}" font-size="64" text-anchor="middle">${escapeXml(meta.icon)}</text>

  <!-- 卡片类型标题 -->
  <text x="${SVG_WIDTH / 2}" y="390" font-family="${escapeXml(fontFamily)}" font-size="44" font-weight="bold" fill="${escapeXml(palette.text)}" text-anchor="middle">${escapeXml(meta.title)}</text>

  <!-- 标题下方装饰线 -->
  <line x1="${SVG_WIDTH / 2 - 80}" y1="420" x2="${SVG_WIDTH / 2 - 20}" y2="420" stroke="${escapeXml(palette.accent)}" stroke-width="2" opacity="0.5" stroke-linecap="round"/>
  <circle cx="${SVG_WIDTH / 2}" cy="420" r="3" fill="${escapeXml(palette.accent)}" opacity="0.5"/>
  <line x1="${SVG_WIDTH / 2 + 20}" y1="420" x2="${SVG_WIDTH / 2 + 80}" y2="420" stroke="${escapeXml(palette.accent)}" stroke-width="2" opacity="0.5" stroke-linecap="round"/>

  <!-- 内容文字区（多行） -->
  <text x="${SVG_WIDTH / 2}" y="${contentBaseY}" font-family="${escapeXml(fontFamily)}" font-size="34" fill="${escapeXml(palette.text)}" text-anchor="middle" opacity="0.85">
    ${contentTspans}
  </text>

  <!-- 底部分隔线 -->
  <line x1="${SVG_WIDTH / 2 - 140}" y1="820" x2="${SVG_WIDTH / 2 + 140}" y2="820" stroke="${escapeXml(palette.accent)}" stroke-width="1" opacity="0.25"/>

  <!-- 底部信息：日期 -->
  <text x="${SVG_WIDTH / 2}" y="870" font-family="${escapeXml(fontFamily)}" font-size="26" fill="${escapeXml(palette.text)}" text-anchor="middle" opacity="0.55">${escapeXml(date)}</text>

  <!-- 底部信息：卡片 ID -->
  <text x="${SVG_WIDTH - 72}" y="${SVG_HEIGHT - 50}" font-family="${escapeXml(fontFamily)}" font-size="18" fill="${escapeXml(palette.text)}" text-anchor="end" opacity="0.3">#${escapeXml(shortId)}</text>

  <!-- 左上角装饰水印 -->
  <text x="72" y="${SVG_HEIGHT - 50}" font-family="${escapeXml(fontFamily)}" font-size="18" fill="${escapeXml(palette.text)}" text-anchor="start" opacity="0.3">${escapeXml(appName)}</text>
</svg>`;
}

/**
 * 保存 SVG 文件到 uploads 目录
 * 路径：{uploadDir}/share-cards/{userId}/{cardId}.svg
 * 文件写入失败返回 null（降级处理，不阻断卡片创建）
 *
 * @param userId - 用户 ID（按用户隔离目录）
 * @param cardId - 卡片 ID（文件名）
 * @param svgContent - SVG 字符串
 * @returns 相对 URL 路径（/uploads/share-cards/{userId}/{cardId}.svg），失败返回 null
 */
function saveCardSvg(userId: string, cardId: string, svgContent: string): string | null {
  try {
    const dirPath = path.join(config.uploadDir, 'share-cards', userId);
    fs.mkdirSync(dirPath, { recursive: true });
    const filePath = path.join(dirPath, `${cardId}.svg`);
    fs.writeFileSync(filePath, svgContent, 'utf8');
    return `/uploads/share-cards/${userId}/${cardId}.svg`;
  } catch (error) {
    // 文件写入失败不阻断卡片创建，降级为 card_url=null
    console.error('[ShareCard SVG Save Error]', error);
    return null;
  }
}

/**
 * 构建 card_data（存储到 JSONB 的结构化数据）
 * 包含 title/content/pet_name/date/style/source_data/generated_at
 */
function buildCardData(
  cardType: string,
  sourceData: ShareCardSourceData,
  style?: ShareCardStyle,
): Record<string, unknown> {
  const meta = CARD_TYPE_META[cardType] ?? { title: cardType, icon: '🐾', defaultContent: '分享我的宠物生活' };
  return {
    title: meta.title,
    icon: meta.icon,
    content: sourceData.custom_text || meta.defaultContent,
    pet_name: null,
    date: new Date().toISOString().slice(0, 10),
    style: style || { theme: 'warm' },
    source_data: sourceData,
    generated_at: new Date().toISOString(),
  };
}

/**
 * 生成分享卡片
 * - 渲染 SVG 字符串
 * - 保存 SVG 文件到 uploads 目录
 * - 构建 card_data 和 card_url
 * - 插入数据库记录，share_count=0, share_channel=null
 *
 * @param userId - 用户 ID
 * @param data - 生成卡片请求参数
 * @returns 卡片记录（含 card_url，文件写入失败时 card_url=null）
 */
export async function generateCard(
  userId: string,
  data: GenerateShareCardInput,
): Promise<ShareCardRow> {
  const cardId = crypto.randomUUID();
  const cardData = buildCardData(data.card_type, data.source_data, data.style);

  // 渲染 SVG 并保存文件
  const svgContent = renderCardSvg(data.card_type, data.source_data, data.style, cardId);
  const relativeUrl = saveCardSvg(userId, cardId, svgContent);

  // 拼接 card_url：配置 publicBaseUrl 时为绝对 URL，否则为相对路径，文件写入失败为 null
  let cardUrl: string | null = null;
  if (relativeUrl) {
    cardUrl = config.publicBaseUrl ? `${config.publicBaseUrl}${relativeUrl}` : relativeUrl;
  }

  return shareCardRepository.insertCard({
    user_id: userId,
    card_type: data.card_type,
    card_data: cardData,
    card_url: cardUrl,
    share_channel: null,
    share_count: 0,
  });
}

/**
 * 分页查询用户卡片列表
 * - 查询列表 + 总数（并行）
 */
export async function listCards(
  userId: string,
  query: ShareCardQueryInput,
): Promise<ShareCardListResponse> {
  const [items, total] = await Promise.all([
    shareCardRepository.findByUserId(
      userId,
      query.page,
      query.page_size,
      query.card_type,
    ),
    shareCardRepository.countByUserId(userId, query.card_type),
  ]);

  return {
    items,
    total,
    page: query.page,
    page_size: query.page_size,
  };
}

/**
 * 获取卡片详情
 * - findByIdAndUser，不存在或不属于当前用户均返回 404
 */
export async function getCard(
  userId: string,
  cardId: string,
): Promise<ShareCardRow> {
  const card = await shareCardRepository.findByIdAndUser(cardId, userId);
  if (!card) {
    throw new ShareCardError(404, '卡片不存在');
  }
  return card;
}

/**
 * 删除卡片
 * - findByIdAndUser，不存在或不属于当前用户均返回 404
 * - 删除记录
 */
export async function deleteCard(
  userId: string,
  cardId: string,
): Promise<void> {
  const card = await shareCardRepository.findByIdAndUser(cardId, userId);
  if (!card) {
    throw new ShareCardError(404, '卡片不存在');
  }
  await shareCardRepository.deleteById(cardId);
}

/**
 * 记录分享行为
 * - findByIdAndUser，不存在或不属于当前用户均返回 404
 * - share_count + 1 并更新 share_channel
 * - 返回更新后的卡片
 */
export async function recordShare(
  userId: string,
  cardId: string,
  channel: ShareChannel,
): Promise<ShareCardRow> {
  const card = await shareCardRepository.findByIdAndUser(cardId, userId);
  if (!card) {
    throw new ShareCardError(404, '卡片不存在');
  }

  const updated = await shareCardRepository.incrementShareCount(cardId, userId, channel);
  if (!updated) {
    // 理论上不会发生（前面已校验归属），作为并发兜底
    throw new ShareCardError(404, '卡片不存在');
  }
  return updated;
}
