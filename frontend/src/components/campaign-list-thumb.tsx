type Props = {
  imageUrl: string;
  title: string;
  className?: string;
};

/** Small fixed thumbnail for campaign list rows. */
export function CampaignListThumb({ imageUrl, title, className = '' }: Props) {
  return (
    <div
      className={`relative h-11 w-16 shrink-0 overflow-hidden rounded-md border border-amber-900/10 bg-amber-100 ring-1 ring-amber-900/5 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- remote campaign URLs */}
      <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
    </div>
  );
}
