import fs from 'fs';
import path from 'path';
import { config } from '../config.js';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

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

  const ext = params.fileName.split('.').pop() || 'jpg';
  const filename = `${uuidv4()}.${ext}`;
  const dirPath = path.join(config.uploadDir, 'pet-photos', params.userId, params.petId);
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