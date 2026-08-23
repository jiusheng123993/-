/**
 * 回忆录 ASS 字幕生成器（回忆录 2.0 M4 模块）
 * 职责：把分镜脚本的字幕字段生成 .ass 字幕文件内容（供 ffmpeg 烧录）
 *
 * 设计：
 * - 纯函数：输入字幕数组 → 输出 ASS 文本（无文件 IO，便于单测）
 * - 中文字体默认 Noto Sans CJK SC（服务器需装 fonts-noto-cjk）
 * - 时间格式：ASS 标准 h:mm:ss.cc
 */

/** 单条字幕 */
export interface SubtitleItem {
  /** 起始时间（秒） */
  startSec: number;
  /** 结束时间（秒） */
  endSec: number;
  /** 字幕文本 */
  text: string;
}

/** 字幕样式参数 */
export interface AssStyleOptions {
  /** 字体名（服务器需安装对应字体） */
  fontName?: string;
  /** 字号（像素） */
  fontSize?: number;
  /** 字幕颜色（ASS 格式 &HBBGGRR） */
  primaryColor?: string;
  /** 底部边距 */
  marginV?: number;
}

/** 默认样式（白字 + 黑边 + 底部居中） */
const DEFAULT_STYLE: Required<AssStyleOptions> = {
  fontName: 'Noto Sans CJK SC',
  fontSize: 42,
  primaryColor: '&H00FFFFFF',
  marginV: 40,
};

/**
 * 秒 → ASS 时间格式（h:mm:ss.cc）
 * @param sec - 秒（浮点）
 * @returns ASS 时间字符串
 */
export function toAssTime(sec: number): string {
  const clamped = Math.max(0, sec);
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = Math.floor(clamped % 60);
  const cs = Math.floor((clamped - Math.floor(clamped)) * 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

/**
 * 构建 ASS 字幕文件内容
 * @param subtitles - 字幕列表（按时间排序，无重叠）
 * @param options - 样式参数（可覆盖默认）
 * @returns ASS 文件文本
 */
export function buildAssContent(
  subtitles: SubtitleItem[],
  options: AssStyleOptions = {},
): string {
  const style = { ...DEFAULT_STYLE, ...options };

  // 过滤无效字幕（空文本 / 时间倒挂）
  const valid = subtitles.filter(
    (sub) => sub.text && sub.text.trim().length > 0 && sub.endSec > sub.startSec,
  );

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
ScaledBorderAndShadow: yes
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${style.fontName},${style.fontSize},${style.primaryColor},&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,1,2,40,40,${style.marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // 字幕行（文本换行符转 \N，防 ASS 语法破坏）
  const events = valid
    .map((sub) => {
      const text = sub.text.trim().replace(/\n/g, '\\N').replace(/\{|\}/g, '');
      return `Dialogue: 0,${toAssTime(sub.startSec)},${toAssTime(sub.endSec)},Default,,0,0,0,,${text}`;
    })
    .join('\n');

  return header + events + '\n';
}

// 导出默认样式供测试参考
export { DEFAULT_STYLE };
