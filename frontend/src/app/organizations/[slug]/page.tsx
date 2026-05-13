import { OrganizationPublicClient } from './organization-public-client';

export default async function OrganizationPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <OrganizationPublicClient slug={slug} />;
}
