# Good to haves — roadmap notes

Living list of enhancements worth considering for FunDogs. Not committed scope; prioritize by risk, compliance, and donor trust.

---

## User types (product note)

We need distinct account classes (auth model, DB relations, and UI to be specified later):

1. **Normal user (individual)** — Can register, log in, and **create campaigns** (subject to approval and current lifecycle rules). Acts as a personal organizer / supporter.

2. **Organization account** — Represents a **verified organization** (e.g. shelter, rescue group). Can **register and manage normal users under that org** (invites, roles, deactivate; optional sub-roles such as org admin vs staff). **Policy TBD:** who owns campaigns (org vs member), how payouts and legal display name work on public pages.

3. **Admin** — **Platform** staff: moderation, campaign approval, disputes, configuration, etc. Separate from org hierarchy; not a substitute for org-internal user management.

**Follow-ups to spec:** org vs individual onboarding/verification; donor-visible labels (“Individual” vs “Organization”); whether one person can have both personal and org-linked access; campaign ownership transfer between org members.

---

## Captured from product discussion

### 1. Identity verification

- **Why:** Reduce fake campaigns, impersonation, and fraud; stronger trust for donors and moderators.
- **Angles:** Lightweight (document upload + manual admin review) vs provider-assisted (e.g. eKYC APIs where available). Align with how you verify **organizers** vs **donors** (donors may need less friction).
- **Pairs well with:** Campaign approval workflow you already have; audit log of who verified what and when.

### 2. User payment method

- **Why:** Faster repeat donations; optional “save card” / wallet linking where PCI and provider rules allow.
- **Note:** PayMongo/Stripe already support customer + payment method objects; saving implies **consent**, secure storage, and **delete/export** paths for privacy.
- **Pairs well with:** Logged-in donor experience and clear “use saved method vs one-off” UI.

### 3. Working mobile number — validated by OTP

- **Why:** Reach users for receipts, payout notices, or urgent campaign updates; reduces throwaway accounts.
- **Angles:** SMS OTP (Twilio, local PH providers), or **WhatsApp / Viber** OTP if that matches your audience. Fallback for users without SMS.
- **Pairs well with:** Rate limits, cooldowns, and bot protection on the OTP endpoint; optional step-up for high-risk actions (large donation, new device).

### 4. Milestone-based payout requests (50% and 100% of goal)

- **Idea:** Once a campaign’s **raised** reaches **50%** of its **goal**, the organizer can **request a payout** for that campaign; again when it reaches **100%** (second milestone). Each unlock is for the **current** campaign only—clear scope per campaign, not a global wallet blur.
- **Why:** Ties withdrawals to demonstrated traction; reduces “cash out before meaningful progress” perception; gives donors a narrative (“halfway—funds can start moving”).
- **Design choices to pin later:** Is 50% a **partial** payout (e.g. up to 50% of raised so far) or a **request gate** (still full balance subject to policy)? What happens if **goal is lowered** after the fact—recompute milestones? Cap concurrent open payout requests per campaign?
- **Ops / risk:** Manual or semi-automated **admin approval**; bank details verified; ledger row per payout (amount, milestone, status); handle **refunds/chargebacks** after a payout was approved.
- **Pairs well with:** Organizer identity / bank verification (above); audit log; notifications to organizer at each unlock.

### 5. Ads, sponsors, and partnerships (platform revenue)

Ways to help **maintain the app** while staying aligned with a non-profit / mission-driven brand (copy, legal, and tax to be reviewed locally).

- **Ads** — Programmatic display (e.g. AdSense-style) or similar; **lazy placement** so donate/checkout flows stay clean; **privacy policy** and, where required, **cookie / ad consent**; label units (“Advertisement”). Disclose that ad income can support **operations**, separate from donor gifts to campaigns, if that is your model.

- **Sponsors** — **Curated, manual** placements: home/footer **logo strip**, “Supported by” blocks, optional **campaign-level** sponsor callouts with clear disclosure. Admin or sales workflow (contracts, duration, assets); easier to control brand fit than open programmatic alone.

- **Partnerships** — **Strategic relationships** beyond logo buys: e.g. vet chains, pet supply brands, corporate CSR, media, NGOs; **co-branded campaigns**, grants, in-kind support, or integrations. Own pipeline (contact, MOU, reporting) distinct from self-serve sponsors.

**Follow-ups to spec:** DTI/SEC/BIR treatment of ad vs sponsorship revenue; PayMongo/Stripe acceptable-use alignment; which routes are **ad-free** (e.g. campaign donate sidebar, post-payment thank-you).

### 6. Admin rejection comment + organizer resubmit

- **Idea:** When an admin **rejects** a campaign, they can leave a **moderator comment** (reason, what to fix, policy cite). The organizer sees it on the campaign or dashboard, edits the campaign, and **resubmits for approval** (e.g. `approvalStatus` returns to **pending** for queue review).
- **Why:** Reduces opaque rejections; faster iteration; fewer back-and-forth emails outside the product.
- **Design choices to pin later:** **Required** vs optional comment on reject; whether **history** of all rejection notes is visible or only the latest; email/push when rejected or on resubmit; whether public campaign page shows anything while rejected (today: organizer-facing messaging exists in places—align UX).
- **Pairs well with:** Audit log (who rejected, when, text); optional link to §1 identity docs if rejection is trust-related.

**Note:** The app already signals that **editing a rejected campaign** can send it back to **pending** for admin review; §6 adds the explicit **admin-supplied reason** and a clear **resubmit** path in the UI.

---

## Further suggestions (still “good to have”)

| Area | Idea |
|------|------|
| **Accounts / RBAC** | Implement § User types: individual, organization (with sub-users), and platform admin; invites, org dashboard, and permission matrix. |
| **Trust & safety** | Organizer bank / payout verification before large withdrawals; public “verified organizer” badge tied to your rules. |
| **Donor experience** | Email (or SMS) receipt with campaign name and amount; optional anonymous display name rules. |
| **Compliance** | Clear fee disclosure if you add platform fees; refund/chargeback playbooks; data export & account deletion (privacy requests). |
| **Abuse prevention** | CAPTCHA or equivalent on signup / donation flows; rate limits on OTP and payment intent creation. |
| **Reliability** | Dead-letter or replay for webhooks; alerting when payment succeeds but DB write fails. |
| **Campaign owners** | Post-campaign “updates” to donors; simple analytics (views, conversion, traffic sources). |
| **Payouts** | Milestone-gated payout requests (see §4); status dashboard (“requested / approved / sent”); export for accounting. |
| **Accessibility & reach** | WCAG-oriented UI pass; Tagalog (or other) copy where it helps your primary users. |
| **Admin** | 2FA for admin accounts; immutable audit log for moderation and payout actions; **rejection with moderator comment** (see §6). |
| **Moderation** | See §6; resubmit flow, notification to organizer, optional rejection-reason templates for admins. |
| **Payments** | Recurring / monthly support if campaigns fit sustained care; explicit “tip to platform” vs “all to campaign” UX if you add fees later. |
| **Revenue — ads** | See §5; slot map + env-driven publisher id; exclude sensitive routes from ad scripts. |
| **Revenue — sponsors** | See §5; CMS or admin UI for sponsor packages, dates, and placements. |
| **Partnerships** | See §5; single “Partner with us” intake + internal CRM handoff; co-marketing guidelines. |

---

## How to use this doc

- Add **dates** or **links** (issues/PRs) when an item moves from idea → spec → shipped.
- Strike or move to a “Won’t do” section when you consciously drop something.

Last updated: 2026-05-13
