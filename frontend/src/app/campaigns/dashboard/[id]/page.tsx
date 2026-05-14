import { MyCampaignDetailClient } from '@/components/campaigns/my-campaign-detail-client';

export default async function MyCampaignDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string | string[] }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const editParam = sp.edit;
  const initialEdit = editParam === '1' || editParam === 'true' || (Array.isArray(editParam) && editParam.includes('1'));

  return <MyCampaignDetailClient campaignId={id} initialEdit={initialEdit} />;
}
