import type { Campaign } from '@/lib/types';

export function getCampaignAuthorProfileId(campaign: Campaign): string | null {
  const fromAuthor = campaign.author?.id?.trim();
  if (fromAuthor) return fromAuthor;
  const fromCampaign = campaign.authorId?.trim();
  return fromCampaign || null;
}
