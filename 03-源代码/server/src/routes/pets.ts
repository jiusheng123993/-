/**
 * 宠物管理路由 - 宠物资料的 CRUD 操作
 * 创建、查询、更新、删除宠物档案，标记宠物离世，获取 AI 提取的特征
 */
import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createPetSchema, updatePetSchema, petDeceasedSchema } from '../schemas/index.js';
import { PetRepository } from '../repositories/petRepository.js';
import { PetFactRepository } from '../repositories/petFactRepository.js';

const router = Router();
router.use(authMiddleware);

const petRepository = new PetRepository();
const petFactRepository = new PetFactRepository();

function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

function toCamelCaseArray(arr: Record<string, unknown>[]): Record<string, unknown>[] {
  return arr.map(toCamelCase);
}

router.post('/', validate({ body: createPetSchema }), async (req: Request, res: Response) => {
  try {
    const {
      name, species, breed, breed_id, gender, birth_date, weight,
      avatar_photo_url, avatar_cartoon_url, avatar_style, photos,
      is_neutered, microchip_id, notes,
    } = req.body;

    const id = uuidv4();
    const row = await petRepository.createPet({
      id,
      user_id: req.userId!,
      name,
      species,
      breed,
      breed_id,
      gender,
      birth_date,
      weight: weight ?? 0,
      avatar_photo_url: avatar_photo_url ?? null,
      avatar_cartoon_url: avatar_cartoon_url ?? null,
      avatar_style: avatar_style ?? null,
      photos: photos ?? [],
      is_neutered: is_neutered ?? false,
      microchip_id: microchip_id ?? '',
      notes: notes ?? '',
    });

    res.status(201).json({ success: true, data: toCamelCase(row as unknown as Record<string, unknown>) });
  } catch (err) {
    console.error('[Pets Create Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const rows = await petRepository.findAllByUser(req.userId!);

    res.json({ success: true, data: toCamelCaseArray(rows as unknown as Record<string, unknown>[]) });
  } catch (err) {
    console.error('[Pets List Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const petId = req.params.id as string;
    const row = await petRepository.findByIdAndUser(petId, req.userId!);

    if (!row) {
      res.status(404).json({ success: false, message: '宠物不存在' });
      return;
    }

    res.json({ success: true, data: toCamelCase(row as unknown as Record<string, unknown>) });
  } catch (err) {
    console.error('[Pets Get Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.put('/:id', validate({ body: updatePetSchema }), async (req: Request, res: Response) => {
  try {
    const petId = req.params.id as string;
    const existing = await petRepository.findByIdAndUser(petId, req.userId!);

    if (!existing) {
      res.status(404).json({ success: false, message: '宠物不存在' });
      return;
    }

    const {
      name, species, breed, breed_id, gender, birth_date, weight,
      avatar_photo_url, avatar_cartoon_url, avatar_style, photos,
      is_neutered, microchip_id, notes,
    } = req.body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (species !== undefined) updateData.species = species;
    if (breed !== undefined) updateData.breed = breed;
    if (breed_id !== undefined) updateData.breed_id = breed_id;
    if (gender !== undefined) updateData.gender = gender;
    if (birth_date !== undefined) updateData.birth_date = birth_date;
    if (weight !== undefined) updateData.weight = weight;
    if (avatar_photo_url !== undefined) updateData.avatar_photo_url = avatar_photo_url;
    if (avatar_cartoon_url !== undefined) updateData.avatar_cartoon_url = avatar_cartoon_url;
    if (avatar_style !== undefined) updateData.avatar_style = avatar_style;
    if (photos !== undefined) updateData.photos = photos;
    if (is_neutered !== undefined) updateData.is_neutered = is_neutered;
    if (microchip_id !== undefined) updateData.microchip_id = microchip_id;
    if (notes !== undefined) updateData.notes = notes;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ success: false, message: '没有需要更新的字段' });
      return;
    }

    const row = await petRepository.updateByIdAndUser(petId, req.userId!, updateData);

    res.json({ success: true, data: toCamelCase(row as unknown as Record<string, unknown>) });
  } catch (err) {
    console.error('[Pets Update Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const petId = req.params.id as string;
    const deleted = await petRepository.deleteByIdAndUser(petId, req.userId!);

    if (!deleted) {
      res.status(404).json({ success: false, message: '宠物不存在' });
      return;
    }

    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('[Pets Delete Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.post('/:id/deceased', validate({ body: petDeceasedSchema }), async (req: Request, res: Response) => {
  try {
    const petId = req.params.id as string;
    const deceasedDate = req.body.deceased_date || new Date().toISOString().split('T')[0];
    const row = await petRepository.markDeceased(petId, req.userId!, deceasedDate);

    if (!row) {
      res.status(404).json({ success: false, message: '宠物不存在' });
      return;
    }

    res.json({ success: true, data: toCamelCase(row as unknown as Record<string, unknown>) });
  } catch (err) {
    console.error('[Pets Deceased Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// GET /api/pets/:id/facts - 获取宠物 AI 提取的特征/喜好
router.get('/:id/facts', async (req: Request, res: Response) => {
  try {
    const petId = req.params.id as string;
    const rows = await petFactRepository.findByPetAndUser(petId, req.userId!);

    res.json({ success: true, data: toCamelCaseArray(rows as unknown as Record<string, unknown>[]) });
  } catch (err) {
    console.error('[Pets Facts Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

export default router;
