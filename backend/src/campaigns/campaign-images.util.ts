import { BadRequestException } from '@nestjs/common';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1548199973-03cce0f87e55?w=800&q=80';

export function normalizeCampaignImages(input: {
  imageUrls?: string[];
  imageUrl?: string;
}): string[] {
  if (input.imageUrls?.length) {
    const cleaned = input.imageUrls.map((u) => u.trim()).filter(Boolean).slice(0, 12);
    if (!cleaned.length) throw new BadRequestException('imageUrls must include at least one URL');
    return cleaned;
  }
  const single = input.imageUrl?.trim();
  return [single && single.length ? single : DEFAULT_IMAGE];
}

export { DEFAULT_IMAGE };
