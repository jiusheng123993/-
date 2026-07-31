/**
 * 3D 模型生成服务 - 调用 Meshy API 从 2D 图片生成 3D 模型
 * 支持多视图（多角度 2D 图）和单图降级模式
 */
import { config } from '../config.js';
import { pool } from '../db.js';
import { updateTaskProgress, updateTaskStatus, updateTaskResult } from './taskQueue.js';
import { delay } from '../utils/delay.js';

const MESHY_IMAGE_TO_3D_API = 'https://api.meshy.ai/openapi/v2/image-to-3d';
const MESHY_MULTI_IMAGE_TO_3D_API = 'https://api.meshy.ai/openapi/v2/multi-image-to-3d';

interface Generate3DParams {
  taskId: string;
  image2DTaskId: string;
}

export async function generate3DModel(params: Generate3DParams): Promise<void> {
  const { taskId, image2DTaskId } = params;
  const apiKey = config.meshy.apiKey;

  if (!apiKey) {
    await updateTaskStatus(taskId, 'failed', '3D 模型生成服务未配置');
    return;
  }

  await updateTaskStatus(taskId, 'processing');
  await updateTaskProgress(taskId, 10);

  try {
    // 获取多角度 2D 图作为多视图输入
    // 优先选取正面、左侧、右侧、背面的 happy 表情图
    const multiAngleResult = await pool.query(
      `SELECT image_url, angle
       FROM avatar_2d_images
       WHERE task_id = $1 AND expression = 'happy'
         AND angle IN ('front', 'left', 'right', 'back')
       ORDER BY CASE angle
         WHEN 'front' THEN 0
         WHEN 'left' THEN 1
         WHEN 'right' THEN 2
         WHEN 'back' THEN 3
       END`,
      [image2DTaskId],
    );

    if (multiAngleResult.rowCount === 0) {
      await updateTaskStatus(taskId, 'failed', '没有可用的 2D 形象图，请先生成 2D 形象');
      return;
    }

    const multiAngleImages = multiAngleResult.rows as Array<{ image_url: string; angle: string }>;
    await updateTaskProgress(taskId, 30);

    let meshyTaskId: string;

    if (multiAngleImages.length >= 3) {
      // 多视图模式：传入 3-4 张不同角度的图
      meshyTaskId = await callMultiImageTo3D(multiAngleImages, apiKey);
    } else {
      // 单图降级模式
      meshyTaskId = await callSingleImageTo3D(multiAngleImages[0].image_url, apiKey);
    }

    if (!meshyTaskId) {
      await updateTaskStatus(taskId, 'failed', '3D 模型生成服务请求失败，请稍后重试');
      return;
    }

    await updateTaskProgress(taskId, 40);

    // 轮询 Meshy 任务状态
    let modelUrl = '';
    for (let i = 0; i < 60; i++) {
      await delay(5000);

      const statusRes = await fetch(`https://api.meshy.ai/openapi/v2/image-to-3d/${meshyTaskId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!statusRes.ok) continue;

      const statusData = (await statusRes.json()) as {
        status: string;
        model_urls?: { glb?: string };
        thumbnail_url?: string;
      };

      const pollProgress = 40 + Math.floor((i / 60) * 45);
      await updateTaskProgress(taskId, Math.min(pollProgress, 85));

      if (statusData.status === 'SUCCEEDED') {
        modelUrl = statusData.model_urls?.glb || '';
        const thumbnailUrl = statusData.thumbnail_url || '';

        await updateTaskProgress(taskId, 95);

        await pool.query(
          `INSERT INTO avatar_3d_models (task_id, model_url, thumbnail_url)
           VALUES ($1, $2, $3)`,
          [taskId, modelUrl, thumbnailUrl],
        );

        await updateTaskResult(taskId, { modelUrl, thumbnailUrl });
        await updateTaskProgress(taskId, 100);
        await updateTaskStatus(taskId, 'completed');
        return;
      }

      if (statusData.status === 'FAILED') {
        await updateTaskStatus(taskId, 'failed', '3D 模型生成失败');
        return;
      }
    }

    await updateTaskStatus(taskId, 'failed', '3D 模型生成超时，请稍后重试');
  } catch (error) {
    const message = error instanceof Error ? error.message : '3D 模型生成异常';
    await updateTaskStatus(taskId, 'failed', message);
  }
}

async function callSingleImageTo3D(imageUrl: string, apiKey: string): Promise<string> {
  const response = await fetch(MESHY_IMAGE_TO_3D_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      image_url: imageUrl,
      enable_pbr: false,
      topology: 'quad',
      target_polycount: 30000,
    }),
  });

  if (!response.ok) {
    console.error(`[Model3D] Single-image API error: ${response.status}`);
    return '';
  }

  const data = (await response.json()) as { result: string };
  return data.result || '';
}

async function callMultiImageTo3D(
  images: Array<{ image_url: string; angle: string }>,
  apiKey: string,
): Promise<string> {
  const angleMapping: Record<string, string> = {
    front: 'front',
    left: 'left',
    right: 'right',
    back: 'back',
  };

  const imageList = images.map(img => ({
    url: img.image_url,
    angle: angleMapping[img.angle] || 'front',
  }));

  const response = await fetch(MESHY_MULTI_IMAGE_TO_3D_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      images: imageList,
      enable_pbr: false,
      topology: 'quad',
      target_polycount: 30000,
    }),
  });

  if (!response.ok) {
    console.error(`[Model3D] Multi-image API error: ${response.status}, falling back to single-image`);
    return callSingleImageTo3D(images[0].image_url, apiKey);
  }

  const data = (await response.json()) as { result: string };
  return data.result || '';
}