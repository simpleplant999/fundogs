import Link from 'next/link';
import { CAMPAIGN_TYPES, CAMPAIGN_TYPE_LABELS } from '@/lib/campaign-type';
import type { CampaignTypeId } from '@/lib/types';

function chipClass(active: boolean) {
  return `inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition ${
    active
      ? 'bg-teal-700 text-white ring-teal-700 shadow-sm'
      : 'bg-white text-amber-950/85 ring-amber-900/15 hover:bg-amber-50'
  }`;
}

export function CampaignTypeFilterChips({ selected }: { selected?: CampaignTypeId | null }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-full text-xs font-semibold uppercase tracking-wide text-amber-950/55 sm:w-auto sm:mr-1">
        Filter
      </span>
      <Link href="/donate" className={chipClass(!selected)} scroll={false}>
        All types
      </Link>
      {CAMPAIGN_TYPES.map((id) => (
        <Link
          key={id}
          href={`/donate?type=${encodeURIComponent(id)}`}
          className={chipClass(selected === id)}
          scroll={false}
        >
          {CAMPAIGN_TYPE_LABELS[id]}
        </Link>
      ))}
    </div>
  );
}
