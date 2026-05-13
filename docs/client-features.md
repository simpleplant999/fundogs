# Client-facing features (FunDogs)

Inventory of what the **website** offers to **visitors** and **logged-in users** (Supporters and campaign organizers), based on the current Next.js app. Admin-only areas are noted separately.

Last updated: 2026-05-13

---

## Global (every page)

- **Header:** Home, Donate now, My campaigns; **Log in / Register** when logged out; **Profile**, **Log out** (and display name) when logged in; **Admin** link only if the user’s role is `ADMIN`.
- **Footer:** Donate, Verification, Terms & fees; Register, Log in, Profile; MVP disclaimer line.

---

## Public (no login required)

| Area | What users can do |
|------|-------------------|
| **Home (`/`)** | Read mission / positioning; see **featured** published campaigns (cards with image, title, progress); links to Donate now and How posts are verified. |
| **Donate now (`/donate`)** | Browse **all published** campaigns as cards; open a campaign detail page. |
| **Campaign detail (`/campaigns/[slug]`)** | View **image carousel**, title, description, **status** (e.g. Published / Draft / …) and **approval** badge; **raised vs goal** and progress bar; **share** (share menu); **recent donors** list; banners for **pending/rejected** approval; **Stripe return** handling when URL has `?donated=stripe` or `cancel` plus session / payment-intent ids (server sync + user message). |
| **Donations on campaign (PayMongo)** | If the campaign is **approved** and **Published** or **Done**, sidebar: name + amount → choose **QR Ph** or **sandbox test card** (when `pk_test_` is configured) → QR or card flow → thank-you / polling; optimistic refresh of raised amount. |
| **Verification (`/validation`)** | Read static explanation of how post/campaign verification is described (human review, timing, statuses). |
| **Terms & fees (`/terms`)** | Read static summary of fees / withdrawal milestone (placeholder legal copy). |

---

## Account (register / log in)

| Area | What users can do |
|------|-------------------|
| **Register (`/auth/register`)** | Create account (full name, email, password); redirect to Profile (or Admin if that account is admin). |
| **Log in (`/auth/login`)** | Sign in with email/password; dev copy may show API base URL. |
| **Profile (`/profile`)** | When logged in: view **name, email, role**; shortcuts to **New campaign**, **My campaigns**, and **Admin panel** if admin. When logged out: prompt to log in. |

---

## Campaign organizers (logged-in supporter)

| Area | What users can do |
|------|-------------------|
| **New campaign (`/campaigns/new`)** | Form: title, description, **multiple images** (upload), goal amount, recipient name + note; submit creates campaign and redirects to its public slug (draft / pending approval per product copy). |
| **My campaigns (`/campaigns/dashboard`)** | List **your** campaigns; **Preview** in a modal (carousel + progress); **Edit** in a modal (same fields as create + images); saving after **rejected** can return campaign to **pending** for review. Link to **New campaign**. |

---

## Admin-only (not typical “donor” client)

- **Admin** in header and **Admin panel** on profile when `role === 'ADMIN'`.
- Routes under **`/admin`**, **`/admin/campaigns`**, **`/admin/comments`** (the comments admin route is currently a stub / moderation off in code).

---

## Not wired in the live campaign UI (awareness)

- **`CampaignStripeDonate`** / in-page Stripe card widget is **not** mounted on the campaign page today; **Stripe** still matters for **return URL** sync if a flow redirects with `donated=stripe` and session / PI query params.
- **`CommentsSection`** exists in the codebase but is **not** mounted on the campaign page, so **public comments are not an active end-user feature** yet.

---

## How to maintain this doc

- Update when routes or major UX change (new donate path, comments on, etc.).
- Optionally link issues/PRs next to bullets when helpful.
