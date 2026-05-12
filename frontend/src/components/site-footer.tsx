import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-amber-900/10 bg-amber-950 text-amber-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-md space-y-2">
          <p className="text-lg font-semibold">FunDogs</p>
          <p className="text-sm text-amber-100/90">
            Together, we&apos;re making tails wag and hearts full. Rescue. Rehome. Rebuild.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="space-y-2">
            <p className="font-medium text-amber-100">Explore</p>
            <ul className="space-y-1 text-amber-100/85">
              <li>
                <Link href="/donate" className="hover:underline">
                  Donate
                </Link>
              </li>
              <li>
                <Link href="/validation" className="hover:underline">
                  Verification
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:underline">
                  Terms &amp; fees
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-amber-100">Account</p>
            <ul className="space-y-1 text-amber-100/85">
              <li>
                <Link href="/auth/register" className="hover:underline">
                  Register
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:underline">
                  Log in
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:underline">
                  Profile
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-amber-800/80 py-4 text-center text-xs text-amber-200/80">
        Non-profit platform MVP — data shown is illustrative.
      </div>
    </footer>
  );
}
