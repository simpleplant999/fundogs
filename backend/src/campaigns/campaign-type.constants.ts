import { CampaignType } from '@prisma/client';

/** API / JSON values (snake_case), stable for clients and query strings. */
export const API_CAMPAIGN_TYPE_VALUES = [
  'medical_emergency',
  'rescue_transport',
  'shelter_daily_care',
  'spay_neuter_tnr',
  'adoption_foster',
  'behavior_training',
  'memorial_tribute',
  'community_education',
  'other',
] as const;

export type ApiCampaignTypeValue = (typeof API_CAMPAIGN_TYPE_VALUES)[number];

export function prismaCampaignTypeToApi(t: CampaignType): ApiCampaignTypeValue {
  return t.toLowerCase() as ApiCampaignTypeValue;
}

export function apiCampaignTypeToPrisma(value: string): CampaignType {
  const normalized = value.trim().toLowerCase();
  const key = normalized
    .split('_')
    .map((p) => p.toUpperCase())
    .join('_') as keyof typeof CampaignType;
  const resolved = CampaignType[key];
  if (resolved === undefined) {
    throw new Error(`Invalid campaign type: ${value}`);
  }
  return resolved;
}

/** For optional query filters: invalid values are ignored. */
export function tryApiCampaignTypeToPrisma(value: string | undefined): CampaignType | undefined {
  if (!value?.trim()) return undefined;
  try {
    return apiCampaignTypeToPrisma(value);
  } catch {
    return undefined;
  }
}
