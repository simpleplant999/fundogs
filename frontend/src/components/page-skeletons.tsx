/** Shared pulse blocks for list and detail page loading states. */

const pulse = 'animate-pulse rounded-lg bg-amber-950/[0.09]';

function SrOnlyLoading() {
  return <span className="sr-only">Loading…</span>;
}

function CampaignCardSkeleton() {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-amber-900/10 bg-white shadow-sm">
      <div className={`aspect-[16/9] w-full ${pulse}`} aria-hidden />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className={`h-4 w-3/4 ${pulse}`} aria-hidden />
        <div className={`h-3 w-1/2 ${pulse}`} aria-hidden />
        <div className={`mt-2 h-2 w-full ${pulse}`} aria-hidden />
        <div className={`h-2 w-4/5 ${pulse}`} aria-hidden />
        <div className="mt-auto flex justify-between gap-2 pt-2">
          <div className={`h-3 w-20 ${pulse}`} aria-hidden />
          <div className={`h-3 w-16 ${pulse}`} aria-hidden />
        </div>
      </div>
    </article>
  );
}

function CampaignGridSkeleton({ count = 6, className = 'mt-10' }: { count?: number; className?: string }) {
  return (
    <ul className={`grid gap-8 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <li key={i}>
          <CampaignCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

/** /donate and similar campaign browse pages */
export function CampaignListPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6" role="status" aria-busy="true">
      <SrOnlyLoading />
      <header className="max-w-2xl">
        <div className={`h-9 w-48 max-w-full ${pulse}`} aria-hidden />
        <div className={`mt-4 h-4 w-full max-w-lg ${pulse}`} aria-hidden />
        <div className={`mt-2 h-4 max-w-md ${pulse} w-[92%]`} aria-hidden />
      </header>
      <CampaignGridSkeleton />
    </div>
  );
}

/** Home hero + featured campaigns strip */
export function HomePageSkeleton() {
  return (
    <div role="status" aria-busy="true">
      <SrOnlyLoading />
      <section className="border-b border-amber-900/10 bg-gradient-to-b from-amber-50 to-[#fffaf3]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className={`h-4 w-40 ${pulse}`} aria-hidden />
          <div className={`mt-4 h-12 w-full max-w-2xl ${pulse}`} aria-hidden />
          <div className={`mt-3 h-12 w-full max-w-xl ${pulse}`} aria-hidden />
          <div className={`mt-6 h-5 w-full max-w-xl ${pulse}`} aria-hidden />
          <div className="mt-8 flex gap-3">
            <div className={`h-11 w-36 rounded-full ${pulse}`} aria-hidden />
            <div className={`h-11 w-44 rounded-full ${pulse}`} aria-hidden />
          </div>
        </div>
      </section>
      <section className="border-y border-amber-900/10 bg-white/80">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className={`h-8 w-64 ${pulse}`} aria-hidden />
            <div className={`h-4 w-40 ${pulse}`} aria-hidden />
          </div>
          <CampaignGridSkeleton count={6} />
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className={`h-8 w-48 ${pulse}`} aria-hidden />
        <div className="mt-6 space-y-3">
          <div className={`h-5 w-full max-w-2xl ${pulse}`} aria-hidden />
          <div className={`h-5 w-full max-w-xl ${pulse}`} aria-hidden />
          <div className={`h-5 max-w-lg ${pulse} w-[92%]`} aria-hidden />
        </div>
      </section>
    </div>
  );
}

function OrganizationIndexCardSkeleton() {
  return (
    <article className="flex max-h-[500px] min-w-0 flex-col overflow-hidden rounded-2xl border border-amber-900/10 bg-white shadow-sm">
      <div className={`aspect-square w-full shrink-0 ${pulse}`} aria-hidden />
      <div className="flex min-h-0 flex-1 flex-col gap-2 p-4">
        <div className={`h-5 w-4/5 ${pulse}`} aria-hidden />
        <div className={`h-3 w-full ${pulse}`} aria-hidden />
        <div className={`h-3 w-full ${pulse}`} aria-hidden />
        <div className={`mt-auto h-3 w-24 pt-2 ${pulse}`} aria-hidden />
      </div>
    </article>
  );
}

/** /organizations index */
export function OrganizationsIndexPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6" role="status" aria-busy="true">
      <SrOnlyLoading />
      <div className={`h-9 w-56 ${pulse}`} aria-hidden />
      <div className={`mt-3 h-4 w-full max-w-2xl ${pulse}`} aria-hidden />
      <div className={`mt-2 h-4 w-full max-w-xl ${pulse}`} aria-hidden />
      <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="min-w-0">
            <OrganizationIndexCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Single campaign public page (matches campaign-page-client layout). */
export function CampaignViewSkeleton() {
  return (
    <article className="mx-auto max-w-6xl px-4 py-10 sm:px-6" role="status" aria-busy="true">
      <SrOnlyLoading />
      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className={`aspect-[16/9] w-full rounded-3xl border border-amber-900/10 ${pulse}`} aria-hidden />
          <div className="mt-6 flex gap-2">
            <div className={`h-7 w-24 rounded-full ${pulse}`} aria-hidden />
          </div>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              <div className={`h-10 w-full max-w-xl ${pulse}`} aria-hidden />
              <div className={`h-10 max-w-lg ${pulse} w-[85%]`} aria-hidden />
            </div>
            <div className={`h-10 w-28 shrink-0 rounded-full ${pulse}`} aria-hidden />
          </div>
          <div className={`mt-3 h-4 w-2/3 max-w-md ${pulse}`} aria-hidden />
          <div className="mt-4 space-y-2">
            <div className={`h-3 w-32 ${pulse}`} aria-hidden />
            <div className={`h-3 w-48 ${pulse}`} aria-hidden />
          </div>
          <div className="mt-5 space-y-2">
            <div className={`h-4 w-full ${pulse}`} aria-hidden />
            <div className={`h-4 w-full ${pulse}`} aria-hidden />
            <div className={`h-4 max-w-2xl ${pulse} w-[95%]`} aria-hidden />
            <div className={`h-4 max-w-xl ${pulse} w-[88%]`} aria-hidden />
          </div>
          <div className="mt-8 rounded-2xl border border-amber-900/10 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap justify-between gap-6">
              <div className="space-y-2">
                <div className={`h-3 w-16 ${pulse}`} aria-hidden />
                <div className={`h-8 w-28 ${pulse}`} aria-hidden />
              </div>
              <div className="space-y-2">
                <div className={`h-3 w-12 ${pulse}`} aria-hidden />
                <div className={`h-7 w-24 ${pulse}`} aria-hidden />
              </div>
            </div>
            <div className={`mt-4 h-3 w-full rounded-full ${pulse}`} aria-hidden />
          </div>
          <div className="mt-10 border-t border-amber-900/10 pt-10">
            <div className={`h-7 w-32 ${pulse}`} aria-hidden />
            <div className={`mt-2 h-3 w-64 max-w-full ${pulse}`} aria-hidden />
            <div className="mt-6 space-y-4">
              <div className={`h-24 rounded-xl border border-amber-900/10 ${pulse}`} aria-hidden />
              <div className={`h-20 rounded-xl border border-amber-900/10 ${pulse}`} aria-hidden />
            </div>
          </div>
        </div>
        <aside className="space-y-8 lg:pt-2">
          <div className={`min-h-[200px] rounded-2xl border border-amber-900/10 ${pulse}`} aria-hidden />
          <div>
            <div className={`h-7 w-40 ${pulse}`} aria-hidden />
            <div className="mt-4 space-y-0 rounded-xl border border-amber-900/10 bg-white">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between gap-2 border-b border-amber-900/10 px-4 py-3 last:border-b-0">
                  <div className="space-y-2">
                    <div className={`h-4 w-28 ${pulse}`} aria-hidden />
                    <div className={`h-3 w-36 ${pulse}`} aria-hidden />
                  </div>
                  <div className={`h-5 w-20 shrink-0 ${pulse}`} aria-hidden />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}

/** Full organization public profile (initial client load). */
export function OrganizationPublicPageSkeleton() {
  return (
    <article className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6" role="status" aria-busy="true">
      <SrOnlyLoading />
      <div className="overflow-hidden rounded-2xl border border-amber-900/10 bg-white shadow-sm">
        <div className={`aspect-[21/6] w-full ${pulse}`} aria-hidden />
        <div className="relative px-6 pb-8 pt-0 sm:px-10">
          <div className="-mt-14 flex flex-col items-center sm:-mt-10 sm:flex-row sm:items-end sm:gap-6">
            <div className={`relative h-28 w-28 shrink-0 rounded-2xl border-4 border-white sm:h-32 sm:w-32 ${pulse}`} aria-hidden />
            <div className="mt-4 w-full space-y-3 sm:mt-0 sm:flex-1">
              <div className={`mx-auto h-8 w-48 sm:mx-0 sm:w-2/3 ${pulse}`} aria-hidden />
              <div className={`mx-auto h-4 w-40 sm:mx-0 ${pulse}`} aria-hidden />
            </div>
          </div>
          <div className="mt-8 space-y-2">
            <div className={`h-4 w-full ${pulse}`} aria-hidden />
            <div className={`h-4 w-full ${pulse}`} aria-hidden />
            <div className={`h-4 w-3/4 ${pulse}`} aria-hidden />
          </div>
          <div className="mt-10 flex flex-wrap gap-2 border-b border-amber-900/10 pb-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-10 w-28 rounded-full ${pulse}`} aria-hidden />
            ))}
          </div>
          <div className="mt-6">
            <CampaignGridSkeleton count={6} className="mt-0" />
          </div>
        </div>
      </div>
    </article>
  );
}

/** Org profile: campaigns/members tab area while extras fetch. */
export function OrganizationTabPanelSkeleton() {
  return (
    <div className="mt-6" role="status" aria-busy="true">
      <SrOnlyLoading />
      <CampaignGridSkeleton count={6} className="mt-0" />
    </div>
  );
}

/** /users/[userId] */
export function UserProfilePageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6" role="status" aria-busy="true">
      <SrOnlyLoading />
      <div className={`h-4 w-16 ${pulse}`} aria-hidden />
      <article className="mt-6 overflow-hidden rounded-2xl border border-amber-900/10 bg-white p-8 text-center shadow-sm">
        <div className={`mx-auto h-28 w-28 rounded-full ${pulse}`} aria-hidden />
        <div className={`mx-auto mt-5 h-8 w-48 max-w-full ${pulse}`} aria-hidden />
        <div className={`mx-auto mt-3 h-4 w-32 ${pulse}`} aria-hidden />
        <div className={`mx-auto mt-6 h-16 w-full max-w-sm ${pulse}`} aria-hidden />
      </article>
      <section className="mt-12 space-y-10">
        <div>
          <div className={`h-6 w-44 ${pulse}`} aria-hidden />
          <div className={`mt-2 h-3 w-32 ${pulse}`} aria-hidden />
          <CampaignGridSkeleton count={3} className="mt-4" />
        </div>
        <div>
          <div className={`h-6 w-52 ${pulse}`} aria-hidden />
          <div className={`mt-2 h-3 w-48 ${pulse}`} aria-hidden />
          <CampaignGridSkeleton count={3} className="mt-4" />
        </div>
      </section>
    </div>
  );
}
