import type { Metadata } from 'next';
import { SupportPageClient } from './support-page-client';

export const metadata: Metadata = {
  title: 'Support us',
  description:
    'Support FunDogs with a gift that helps keep the platform running and reach more animals in need.',
};

export default function SupportPage() {
  return <SupportPageClient />;
}
