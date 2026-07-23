import { config } from '../config.js';

export interface GeneratePetImageParams {
  petId: string;
  species: string;
  breed: string;
  gender: string;
  photoUrl?: string;
  style?: string;
}

export interface GeneratePetImageResult {
  url: string;
  isPlaceholder: boolean;
}

const DEFAULT_STYLE = 'cartoon';

function generateSvgPlaceholder(params: GeneratePetImageParams): string {
  const colorMap: Record<string, string> = {
    dog: '#F5A623',
    cat: '#7ED321',
  };
  const speciesEmoji: Record<string, string> = {
    dog: '🐕',
    cat: '🐱',
  };
  const color = colorMap[params.species] || '#8B5CF6';
  const emoji = speciesEmoji[params.species] || '🐾';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="${color}" rx="20"/>
  <text x="200" y="180" text-anchor="middle" font-size="100">${emoji}</text>
  <text x="200" y="260" text-anchor="middle" font-size="24" fill="white" font-family="sans-serif">${params.breed}</text>
  <text x="200" y="300" text-anchor="middle" font-size="16" fill="rgba(255,255,255,0.7)" font-family="sans-serif">AI 形象生成暂不可用</text>
  <text x="200" y="330" text-anchor="middle" font-size="14" fill="rgba(255,255,255,0.5)" font-family="sans-serif">请配置 SEEDREAM_API_KEY</text>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export async function generatePetImage(
  params: GeneratePetImageParams,
): Promise<GeneratePetImageResult> {
  const apiKey = config.seedream.apiKey;

  if (!apiKey) {
    return {
      url: generateSvgPlaceholder(params),
      isPlaceholder: true,
    };
  }

  const style = params.style || DEFAULT_STYLE;
  const genderLabel = params.gender === 'male' ? '公' : params.gender === 'female' ? '母' : '';

  const prompt = `一只可爱的${style}风格${genderLabel}${params.breed}${params.species === 'dog' ? '狗狗' : '猫咪'}头像，高质量，细节丰富，可爱温馨`;

  try {
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'doubao-seedream-4-0-250828',
        prompt,
        size: '1024x1024',
        n: 1,
      }),
    });

    if (!response.ok) {
      console.error('[Seedream] API error:', response.status);
      return {
        url: generateSvgPlaceholder(params),
        isPlaceholder: true,
      };
    }

    const data = (await response.json()) as {
      data: Array<{ url: string }>;
    };

    if (data.data && data.data.length > 0 && data.data[0].url) {
      return {
        url: data.data[0].url,
        isPlaceholder: false,
      };
    }

    return {
      url: generateSvgPlaceholder(params),
      isPlaceholder: true,
    };
  } catch (error) {
    console.error('[Seedream] Error:', error);
    return {
      url: generateSvgPlaceholder(params),
      isPlaceholder: true,
    };
  }
}
