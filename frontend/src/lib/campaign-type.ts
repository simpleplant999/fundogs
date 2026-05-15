import type { Campaign, CampaignTypeId } from './types';

export const CAMPAIGN_TYPES = [
  'medical_emergency',
  'rescue_transport',
  'shelter_daily_care',
  'spay_neuter_tnr',
  'adoption_foster',
  'behavior_training',
  'memorial_tribute',
  'community_education',
  'other',
] as const satisfies readonly CampaignTypeId[];

export const CAMPAIGN_TYPE_LABELS: Record<CampaignTypeId, string> = {
  medical_emergency: 'Medical & emergency care',
  rescue_transport: 'Rescue & transport',
  shelter_daily_care: 'Shelter & daily care',
  spay_neuter_tnr: 'Spay/neuter & population control',
  adoption_foster: 'Adoption & foster support',
  behavior_training: 'Behavior & training',
  memorial_tribute: 'Memorial or tribute',
  community_education: 'Community & education',
  other: 'Other / general',
};

export function getCampaignTypeLabel(c: Pick<Campaign, 'campaignType'>): string {
  const id = c.campaignType ?? 'other';
  return CAMPAIGN_TYPE_LABELS[id] ?? CAMPAIGN_TYPE_LABELS.other;
}

export function isCampaignTypeId(value: string): value is CampaignTypeId {
  return (CAMPAIGN_TYPES as readonly string[]).includes(value);
}
