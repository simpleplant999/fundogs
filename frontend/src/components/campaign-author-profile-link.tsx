import Link from 'next/link';
import type { Campaign } from '@/lib/types';
import { getCampaignAuthorProfileId } from '@/lib/campaign-author';

type Props = {
  campaign: Pick<Campaign, 'slug' | 'author' | 'authorId'>;
  className: string;
};

export function CampaignAuthorProfileLink({ campaign, className }: Props) {
  const profileId = getCampaignAuthorProfileId(campaign as Campaign);
  const name = campaign.author?.fullName?.trim() || 'Campaign creator';
  if (!profileId) {
    return <span className={className}>{name}</span>;
  }
  return (
    <Link
      href={`/users/${encodeURIComponent(profileId)}?returnTo=${encodeURIComponent(`/campaigns/${campaign.slug}`)}`}
      className={className}
    >
      {name}
    </Link>
  );
}
