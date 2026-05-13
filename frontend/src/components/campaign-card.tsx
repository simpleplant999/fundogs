import Link from "next/link";
import type { Campaign } from "@/lib/types";
import { getCampaignImages } from "@/lib/campaign-images";
import { OrganizationVerifiedBadge } from "@/components/organization-verified-badge";
import { formatPhp } from "@/lib/format-currency";
import { ProgressBar } from "./progress-bar";

function StatusChip({ status }: { status: Campaign["status"] }) {
  const styles: Record<Campaign["status"], string> = {
    Published: "bg-teal-100 text-teal-900 ring-teal-600/20",
    Draft: "bg-zinc-100 text-zinc-700 ring-zinc-500/20",
    Archived: "bg-amber-100 text-amber-900 ring-amber-600/20",
    Done: "bg-emerald-100 text-emerald-900 ring-emerald-600/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-amber-900/10 bg-white shadow-sm shadow-amber-900/5 transition hover:shadow-md">
      <Link href={`/campaigns/${campaign.slug}`} className="relative block aspect-[16/10] w-full overflow-hidden rounded-t-2xl bg-amber-100">
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary campaign image hosts */}
        <img
          src={getCampaignImages(campaign)[0]}
          alt=""
          className="h-full w-full object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={campaign.status} />
        </div>
        <Link href={`/campaigns/${campaign.slug}`}>
          <h2 className="text-lg font-semibold leading-snug text-amber-950 hover:underline">
            {campaign.title}
          </h2>
        </Link>
        <p className="line-clamp-2 text-sm text-amber-950/75">{campaign.description}</p>
        {campaign.author ? (
          <div className="text-xs leading-relaxed text-amber-950/70">
            <p>
              <span className="text-amber-950/85">{campaign.author.fullName}</span>
            </p>
            {campaign.author.organization ? (
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="inline-flex flex-wrap items-center gap-2">
                  <Link
                    href={`/organizations/${campaign.author.organization.slug}`}
                    className="font-medium text-teal-800 underline underline-offset-2 hover:text-teal-900"
                  >
                    {campaign.author.organization.name}
                  </Link>
                  <OrganizationVerifiedBadge compact />
                </span>
              </p>
            ) : null}
          </div>
        ) : null}
        <ProgressBar raised={campaign.raisedAmount} goal={campaign.goalAmount} />
        <div className="mt-auto flex items-end justify-between gap-2 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-amber-950/55">Raised</p>
            <p className="font-semibold text-teal-800">{formatPhp(campaign.raisedAmount)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-amber-950/55">Goal</p>
            <p className="font-medium text-amber-950">{formatPhp(campaign.goalAmount)}</p>
          </div>
        </div>
        <Link
          href={`/campaigns/${campaign.slug}`}
          className="inline-flex justify-center rounded-full bg-amber-950 px-4 py-2 text-center text-sm font-medium text-amber-50 transition hover:bg-amber-900"
        >
          View campaign
        </Link>
      </div>
    </article>
  );
}
