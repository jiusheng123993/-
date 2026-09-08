/**
 * 照片上传服务 - 将宠物照片保存到本地文件系统
 * 包含文件类型校验、大小限制、目录隔离
 */
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

/**
 * mimeType → 扩展名白名单映射（2026-09 审查 P0 修复）
 * 原实现扩展名取自用户上传的原始文件名（split('.').pop()），可写 .php/.html/.htaccess 等
 * 任意后缀到 /uploads（存储型 XSS/脚本落盘面）。现在扩展名一律由服务端按 mimeType 映射。
 */
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

/**
 * UUID v4 格式校验（2026-09 审查 P0 修复配套）
 * userId/petId 会被拼进磁盘路径，必须先锁格式：petId 传 `../../x` 即路径穿越写任意目录。
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface UploadPhotoParams {
  userId: string;
  petId: string;
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
}

export interface UploadPhotoResult {
  success: boolean;
  url: string;
  error?: string;
}

export async function uploadPetPhoto(params: UploadPhotoParams): Promise<UploadPhotoResult> {
  if (!ALLOWED_TYPES.includes(params.mimeType)) {
    return { success: false, url: '', error: '不支持的图片格式，请上传 JPG/PNG/WebP 格式' };
  }

  if (params.fileBuffer.length > MAX_FILE_SIZE) {
    return { success: false, url: '', error: '图片大小不能超过 10MB' };
  }

  // 路径穿越防线 1：userId/petId 必须是合法 UUID（2026-09 审查 P0 修复）
  if (!UUID_RE.test(params.userId) || !UUID_RE.test(params.petId)) {
    return { success: false, url: '', error: '非法参数' };
  }

  // 路径穿越防线 2：解析后的绝对路径必须仍落在上传根目录内（纵深防御）
  const ext = EXT_BY_MIME[params.mimeType] || 'jpg';
  const filename = `${uuidv4()}.${ext}`;
  const dirPath = path.join(config.uploadDir, 'pet-photos', params.userId, params.petId);
  const resolvedRoot = path.resolve(config.uploadDir);
  if (!path.resolve(dirPath).startsWith(resolvedRoot)) {
    console.error(`[PhotoUpload] 路径穿越拦截: petId=${params.petId.slice(0, 8)}...`);
    return { success: false, url: '', error: '非法参数' };
  }
  const filePath = path.join(dirPath, filename);

  try {
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(filePath, params.fileBuffer);
  } catch (err) {
    console.error('[PhotoUpload] Write error:', err);
    return { success: false, url: '', error: '照片保存失败，请重试' };
  }

  const publicUrl = `/uploads/pet-photos/${params.userId}/${params.petId}/${filename}`;
  return { success: true, url: publicUrl };
}