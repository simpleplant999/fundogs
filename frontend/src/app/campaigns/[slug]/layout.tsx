import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Campaign · ${slug}` };
}

export default function CampaignSlugLayout({ children }: { children: ReactNode }) {
  return children;
}
