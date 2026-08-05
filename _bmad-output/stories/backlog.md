# Namespoter — Backlog User Stories

> Généré par BMad Master · 2026-02-19
> Langue de sortie : English (per config)

---

## US-001 · International vs. Local Domain Name Search

**Status**: ✅ Implemented

**As a** user searching for a domain name,
**I want to** indicate whether I'm targeting an international audience or a local/regional one,
**So that** the AI generates names and checks extensions that are relevant to my market.

### Acceptance Criteria
- [ ] Step 1 or Step 2 includes a toggle/option: **International** | **Local**
- [ ] When "Local" is selected, the locale is auto-detected from the selected TLD extensions (e.g. `.fr` → French, `.de` → German, `.es` → Spanish)
- [ ] The user can override the detected locale via a dropdown or text field
- [ ] The locale is passed to the AI keyword/name generation prompt to bias suggestions toward the target language and culture
- [ ] If no locale-specific extension is selected, the setting defaults to International

### Notes
- Locale inference table (initial): `.fr`→fr, `.de`→de, `.es`→es, `.it`→it, `.nl`→nl, `.pt`→pt, `.pl`→pl, `.be`→fr/nl, `.ch`→fr/de
- The locale preference should be persisted with the project

---

## US-002 · Copy Domain Name from Results Table

**Status**: ✅ Implemented

**As a** user reviewing available domain names,
**I want to** copy a domain name (with its extension) to my clipboard with a single click,
**So that** I can quickly use it in a registrar, document, or message without manual selection.

### Acceptance Criteria
- [ ] Each row in the results table has a copy icon (📋) next to the domain name
- [ ] Clicking the icon copies `name + extension` (e.g. `floralship.com`) to the clipboard
- [ ] A brief visual feedback is shown on success (e.g. icon changes to ✓ for 1.5s)
- [ ] If multiple extensions are selected, clicking the icon copies all available combinations (e.g. `floralship.com, floralship.net`) or opens a small popover to choose
- [ ] Works in all modern browsers (uses `navigator.clipboard.writeText`)

---

## US-003 · Fix Header Overlap on Scroll (Step 3)

**Status**: ✅ Implemented

**As a** user scrolling through domain results on Step 3,
**I want the** extensions/availability banner to not overlap the domain table rows,
**So that** I can read results without content being hidden behind sticky elements.

### Acceptance Criteria
- [ ] The extensions banner (Step 3 top panel) does not overlay table rows when scrolling
- [ ] If the banner is sticky, appropriate `scroll-margin-top` or `padding-top` compensates for its height
- [ ] Tested at common breakpoints: 375px, 768px, 1280px
- [ ] No content is clipped or unreachable

### Notes
- Likely a `position: sticky` + `z-index` conflict with PrimeNG Card/Table components
- Prefer inline styles over Tailwind utilities for layout properties (known PrimeNG override issue)

---

## US-004 · Retrieve User Locale from Keycloak at Login

**Status**: ✅ Implemented

**As a** user who logs in via Keycloak SSO,
**I want** the application to read my preferred locale from my Keycloak profile,
**So that** the interface language is automatically set to my preference without manual selection.

### Acceptance Criteria
- [ ] On successful authentication, the app reads the `locale` claim from the Keycloak token (or the `preferred_username`/user profile endpoint)
- [ ] If a valid locale is found (`fr`, `en`, etc.), `TranslateService.use(locale)` is called
- [ ] If no locale is found in the token, the current browser-detection logic is used as fallback
- [ ] The locale selection UI (flag toggle) still allows the user to override manually
- [ ] The Keycloak realm must expose the `locale` attribute in the token (verify realm config)

### Notes
- Keycloak token claims: check `locale` or `preferred_locale` in `KeycloakService.getKeycloakInstance().tokenParsed`
- Realm config: Mappers → add "User Attribute" mapper for `locale` to ID token

---

## US-005 · Domain Name Pros & Cons Analysis (On-Demand, Cached)

**Status**: ✅ Implemented

**As a** user interested in a specific domain name,
**I want** an AI-generated analysis of that name's strengths and weaknesses,
**So that** I can make an informed decision before registering it.

### Acceptance Criteria
- [ ] When the user marks a domain as a **favourite** (❤️), the analysis is automatically triggered in the background
- [ ] The analysis is computed **once** and cached (stored with the suggestion in the DB)
- [ ] The analysis is displayed below the domain name when it is selected/expanded (or in a tooltip/panel on the favourite row)
- [ ] Analysis covers: memorability, pronounceability, international readability, SEO potential, brand risk (generic vs. distinctive), length
- [ ] If the analysis is pending, a subtle loading indicator is shown
- [ ] The analysis is NOT recomputed if already present in the DB

### API Changes
- New field on `DomainSuggestion` entity: `analysis: string | null`
- New endpoint: `POST /domain/analyze { suggestionId }` — returns `{ analysis: string }`; idempotent (returns cached if already computed)
- Triggered automatically by the toggle-favourite flow (fire-and-forget, non-blocking)

### Frontend Changes
- After toggling favourite ON: call `analyzeIfNeeded(result.id)` in the background
- Display analysis text (expandable panel) under the domain row when available

---

## US-006 · Landing Page Redesign — SSO / Marketing Focus

**Status**: ✅ Implemented

**As a** visitor discovering Namespoter for the first time,
**I want** to immediately understand what the service does and feel invited to try it,
**So that** I convert to a registered user.

### Acceptance Criteria

#### Tagline
- [ ] A short tagline is displayed prominently below the logo/title, e.g.:
  *"NameSpotter — Find a relevant, available domain name. Fast."*

#### Marketing Section (above the fold)
- [ ] Concise value proposition: what it does, how (AI + real WHOIS), why it's better
- [ ] 3–4 key benefit bullets: AI-powered suggestions, real-time availability, favourite & save, multi-extension support
- [ ] Visual or icon set to support the copy

#### Call to Action
- [ ] Prominent CTA button: **"Discover X free domain names"** (X = initial credit grant, e.g. 10)
- [ ] CTA navigates to Step 1 of the wizard (description input)
- [ ] If user is already logged in, the CTA reads **"Start a new search"** and goes directly to Step 1

#### SSO Integration
- [ ] "Login / Register" action is available from the landing page header
- [ ] After login, the user is redirected back to the landing page (or wizard if they clicked CTA first)

---

## US-007 · Multi-Extension Input (Pre-filled, Flexible Separators)

**Status**: ✅ Implemented

**As a** user configuring domain extensions to check,
**I want** the extension field to be pre-filled with `.com` and to accept multiple extensions in a flexible format,
**So that** I can quickly set up my search without worrying about exact syntax.

### Acceptance Criteria
- [ ] The extension input field is **pre-filled with `.com`** when the wizard starts or resets
- [ ] The user can enter multiple extensions separated by **space, comma, or semicolon** (e.g. `com net .io`, `.fr, .de`, `.com;.net`)
- [ ] Extensions are normalized on input: a leading `.` is added if missing, lowercased
- [ ] Pressing **Enter** or clicking **Add** parses all entered extensions and adds them as chips
- [ ] Duplicate extensions are silently ignored
- [ ] Invalid format shows a brief inline validation message

### Notes
- The current single-extension-at-a-time UX is a friction point; batch input resolves this
- Default value: `['.com']` (already the case in `resetProject()`)

---

## US-008 · Streaming Domain Results (Progressive Display)

**Status**: ✅ Implemented

**As a** user waiting for domain search results,
**I want** results to appear progressively as they are found,
**So that** I'm not staring at a blank spinner for the full duration of the search.

### Acceptance Criteria
- [ ] The search endpoint streams results as each domain candidate is validated (WHOIS check passed)
- [ ] The frontend appends each new result to the table as it arrives, without clearing existing rows
- [ ] A progress indicator shows how many names have been checked so far (e.g. "7/20 checked…")
- [ ] The full loading overlay is replaced by an inline per-row animation
- [ ] If the stream ends with fewer results than expected, a "No more results" state is shown

### Technical Notes
- Backend: replace `Promise.all` batch + return with a **Server-Sent Events (SSE)** stream or chunked HTTP response
- NestJS: use `@Sse()` decorator or `res.write()` with `Transfer-Encoding: chunked`
- Frontend: use `EventSource` or `HttpClient` with `reportProgress: true` + `observe: 'events'`
- This is a **medium-high complexity** story; consider splitting into: (a) SSE infrastructure spike, (b) UI progressive rendering

---

## US-009 · Search Timeout Warning (30s)

**Status**: ✅ Implemented

**As a** user waiting for domain search results,
**I want** to be notified if the search is taking longer than 30 seconds,
**So that** I can decide whether to wait, retry, or adjust my query.

### Acceptance Criteria
- [ ] If no result has been returned after **30 seconds**, a non-blocking dialog or toast appears:
  *"The search is taking longer than expected. Do you want to keep waiting?"*
- [ ] The dialog offers two actions: **Keep waiting** | **Cancel and retry**
- [ ] "Keep waiting" dismisses the dialog and continues the search
- [ ] "Cancel and retry" aborts the current request and returns the user to Step 2
- [ ] The timer resets when new results arrive (relevant once US-008 streaming is implemented)
- [ ] The 30-second threshold is a configurable constant (frontend only)

---

## US-010 · Streaming Domain Results (Progressive Display)

**Status**: ✅ Implemented (duplicate of US-008)

**As a** user waiting for domain search results,
**I want** results to appear one by one as each domain is validated,
**So that** I see progress immediately instead of staring at a spinner for the full search duration.

> Replaces US-008 with a more concrete spec.

### Acceptance Criteria
- [ ] Each validated domain appears in the table as soon as its WHOIS check completes, without waiting for the full batch
- [ ] A subtle inline indicator shows how many names have been checked so far (e.g. "12 checked…")
- [ ] The global full-screen loading overlay is removed; individual row spinners replace it
- [ ] The 30s timeout dialog (US-009) remains compatible (timer resets on each new row received)
- [ ] If the stream ends with zero results, the "No results" message appears immediately

### Technical Notes
- Backend: NestJS `@Sse()` decorator, emit one JSON event per validated candidate
- Frontend: replace `HttpClient.post` with `EventSource` or `HttpClient` with `observe: 'events'` + `reportProgress`
- The existing `recheckDomains()` WHOIS path stays unchanged (it already returns full results)
- Split into two sub-tasks: (a) SSE endpoint spike, (b) progressive UI rendering

---

## US-011 · Manual Row Entry (User-defined Domain Ideas)

**Status**: ✅ Implemented

**As a** user reviewing AI-generated domain suggestions,
**I want to** add my own domain name ideas to the results table,
**So that** I can check their availability alongside the AI suggestions in the same interface.

### Acceptance Criteria
- [ ] Below the results table, a text input allows the user to type a bare domain name (without extension, e.g. `florizon`)
- [ ] Pressing **Enter** or clicking **Add** appends a new row to the table with the entered name
- [ ] Availability is checked immediately for all currently selected extensions (same WHOIS recheck flow as adding a new TLD)
- [ ] The row shows spinners per extension while checking, then ✓/✗ per result
- [ ] Manually added rows are visually distinguishable (e.g. a subtle ✏️ icon or different row shade)
- [ ] Manually added rows are saved with the project (persisted as regular suggestions)
- [ ] Duplicate names (already in the table) are silently ignored

### Technical Notes
- Reuse the existing `recheckDomains(names, extensions)` endpoint — just call it with the single new name
- Save the row via the existing `addSuggestions` project service method

---

## US-012 · MCP Server — Invoke Namespoter from an AI Chat

**Status**: ❌ To do

**As a** developer or power user working in an AI chat environment (Claude, Cursor, etc.),
**I want** a Model Context Protocol (MCP) server that exposes Namespoter's core functions as tools,
**So that** I can search for available domain names directly from my AI assistant without opening the web app.

### Acceptance Criteria
- [ ] An MCP server (Node.js / TypeScript) is published and documented
- [ ] It exposes at minimum the following tools:
  - `search_domains(description, keywords, extensions, matchMode)` → returns available domains
  - `recheck_domains(names, extensions)` → returns availability matrix
  - `get_project(projectId)` → returns saved project with suggestions
- [ ] The server authenticates with the Namespoter API using an API key (new auth mechanism, separate from Keycloak SSO)
- [ ] It can be declared in a `.mcp.json` / `claude_desktop_config.json` with a simple `npx namespoter-mcp` command
- [ ] README documents setup, authentication, and example prompts

### Technical Notes
- Use the official MCP TypeScript SDK (`@modelcontextprotocol/sdk`)
- New API key auth: add a `POST /auth/api-key` endpoint or a static key managed via env var
- Publish as `namespoter-mcp` on npm (or as a private package initially)
- Consider a `search_and_refine(description)` composite tool that chains refine + keywords + search

---

## US-013 · Distribution — Teams App, Claude Skill, Marketplace Integrations

**Status**: ❌ To do

**As a** user of productivity tools (Microsoft Teams, Slack, Claude.ai, etc.),
**I want** to access Namespoter's domain search directly within my existing workflow tool,
**So that** I don't have to switch context to find and check domain names.

### Acceptance Criteria

#### Microsoft Teams App
- [ ] A Teams app manifest is created and published to the Teams App Store (or sideloaded for internal use)
- [ ] Users can invoke `@Namespoter find me a domain for [description]` in any Teams channel or chat
- [ ] Results are returned as an Adaptive Card with the availability matrix

#### Claude Skill (claude.ai)
- [ ] The MCP server (US-012) is registered as a Claude skill / integration
- [ ] Users can invoke domain search from Claude.ai conversations without leaving the chat

#### Slack App (optional / later)
- [ ] A Slack slash command `/namespoter [description]` triggers a search and posts results as a Block Kit message

### Technical Notes
- Teams: use Bot Framework SDK + Adaptive Cards; requires Azure Bot registration
- Claude skill: depends on US-012 MCP server being published and accepted by Anthropic
- Prioritise MCP (US-012) first as it unblocks both Claude skill and potentially other integrations
- API key auth (US-012) is a prerequisite for all integrations

---

## US-014 · Online Credit Purchase via Stripe (Packs + Subscription)

**Status**: ✅ Implemented

**As a** registered user who needs credits,
**I want** to subscribe to a monthly plan or purchase extra credit packs,
**So that** I can continue searching for domain names without friction, choosing the model that suits my usage.

---

### Pricing Model

#### Monthly Subscription
- **Essential** — 2 000 credits/month · **€5/month**
- Credits reset on each billing cycle (unused credits are **not** carried over)
- Managed by the customer via the Stripe Customer Portal (upgrade, cancel, update payment method)

#### Extra Credit Packs (one-time, stackable)
- **Pack 1000** — 1 000 credits · **€10** (one-time)
- Extra credits are **preserved** (no expiry)
- Extra credits are consumed **after** subscription credits are exhausted

#### Credit Consumption Order
1. Subscription credits (reset monthly)
2. Extra credits (permanent, consumed only when subscription credits reach 0)

---

### Acceptance Criteria

#### Frontend — Billing Dialog
- [ ] The existing credit dialog is replaced by a billing page or modal with two sections:
  - **Subscription**: current plan status (active / inactive), monthly credits remaining, next renewal date; CTA to subscribe or manage via Stripe Customer Portal
  - **Extra credits**: "Buy 1 000 credits — €10" button triggers a Stripe Checkout one-time session
- [ ] Credit balance in the navbar displays: `subscription credits + extra credits` (total)
- [ ] After any payment, the credit balance refreshes automatically (polling or redirect)
- [ ] On successful payment/subscription, the user is redirected to `/payment/success`
- [ ] On cancellation, the user is redirected to `/payment/cancel` (or back to the dialog)

#### Backend — Data Model
- [ ] `User` entity gains two new fields:
  - `subscriptionCredits: number` (reset monthly by webhook, default 0)
  - `extraCredits: number` (accumulated, never reset, default 0)
- [ ] `User.credits` (existing field) becomes a computed property: `subscriptionCredits + extraCredits`
- [ ] New `stripeCustomerId: string` field on `User` (created on first checkout)
- [ ] New `stripeSubscriptionId: string | null` field on `User`

#### Backend — Endpoints
- [ ] `POST /payments/checkout/subscription` (authenticated)
  - Creates a Stripe Checkout Session in `subscription` mode for the Essential plan
  - Returns `{ url: string }`
- [ ] `POST /payments/checkout/pack` (authenticated)
  - Creates a Stripe Checkout Session in `payment` mode for the 1 000-credit pack
  - Returns `{ url: string }`
- [ ] `GET /payments/portal` (authenticated)
  - Creates a Stripe Billing Portal session for the authenticated user
  - Returns `{ url: string }` — frontend redirects the user to it
- [ ] `POST /payments/webhook` (public, Stripe signature verified)
  - `checkout.session.completed` (mode=`payment`) → add 1 000 to `extraCredits`
  - `invoice.paid` (subscription) → reset `subscriptionCredits` to 2 000
  - `customer.subscription.deleted` → set `subscriptionCredits` to 0, clear `stripeSubscriptionId`
  - All handlers are idempotent (check event already processed via `stripeEventId`)

#### Invoicing
- [ ] Stripe automatic invoices enabled for subscriptions and one-time payments
- [ ] Invoices are sent by Stripe directly to the customer's email (PDF attached)
- [ ] Stripe invoice settings configured in Dashboard: commercial name "Namespoter", legal footer with NeoLegal's SIRET, VAT number, and registered address (French legal requirement)
- [ ] Stripe payouts configured to NeoLegal's Qonto IBAN — no API integration needed
- [ ] Monthly Stripe CSV export for accounting / bookkeeping (no Qonto API integration in scope)

#### Stripe Customer Portal
- [ ] Portal enabled in Stripe Dashboard with permissions: cancel subscription, update payment method, view invoice history
- [ ] "Manage my subscription" button in the billing dialog opens the portal (via `GET /payments/portal`)

#### Configuration
- [ ] `STRIPE_SECRET_KEY` env var (backend)
- [ ] `STRIPE_WEBHOOK_SECRET` env var (backend)
- [ ] `STRIPE_ESSENTIAL_PRICE_ID` env var — Stripe Price ID for the monthly subscription
- [ ] `STRIPE_PACK_PRICE_ID` env var — Stripe Price ID for the 1 000-credit pack
- [ ] `STRIPE_PORTAL_RETURN_URL` env var — URL to redirect after portal session

#### Success / Cancel Pages
- [ ] `/payment/success`: confirmation message + refreshed credit balance
- [ ] `/payment/cancel`: cancellation message + link back to billing dialog

### Technical Notes
- Use `stripe` Node.js SDK on the backend (`npm install stripe`)
- Stripe Checkout hosted page (no card data in the app — PCI-compliant)
- Create Stripe Products & Prices in the Dashboard before development; store Price IDs in env vars
- For local dev: `stripe listen --forward-to localhost:3000/payments/webhook`
- Credit deduction logic stays in `UsersService.decrementCredits()` — update to consume `subscriptionCredits` first, then `extraCredits`

### Out of Scope (for this story)
- Multiple subscription tiers
- VAT / Stripe Tax automation
- Refunds
- Promo codes / coupons

---

## US-015 · Exclude Already-Evaluated Candidates from LLM Re-generation

**Status**: ✅ Implemented

**As a** user requesting additional domain suggestions ("More suggestions"),
**I want** the AI to avoid re-proposing names it has already generated,
**So that** every new batch brings genuinely fresh ideas.

### Acceptance Criteria
- [ ] When calling the LLM for a new batch of candidates, the list of already-evaluated domain names (base names, without extension) is included in the prompt context
- [ ] The prompt explicitly instructs the LLM to avoid any name already in the list
- [ ] The backend passes this exclusion list regardless of whether the request is an initial search or a "More suggestions" top-up
- [ ] The exclusion list is capped to a reasonable size (e.g. 200 names) to avoid token bloat — oldest entries are trimmed first if the list exceeds the cap
- [ ] No duplicate base names appear across successive batches for the same project

### Technical Notes
- The existing `DomainSuggestion` records for the current project are the source of truth for the exclusion list
- Pass as a compact comma-separated list in the prompt: `Already tested (do not reproduce): floralship, bloomly, verdana, …`
- Consider prompt-token budget: 200 names × ~8 chars avg ≈ 1 600 chars — acceptable for GPT-3.5

---

## US-016 · Memorable Brand & Domain Name Criteria in LLM Prompt

**Status**: ✅ Implemented

**As a** user looking for a strong domain name,
**I want** the AI to apply proven memorability criteria when generating suggestions,
**So that** the names I receive are not just available but genuinely brandable.

### Acceptance Criteria
- [ ] The generation prompt explicitly instructs the LLM to favour names that meet the following criteria:
  - **Short**: ideally ≤ 10 characters (base name without extension)
  - **Easy to pronounce**: phonetically natural in the target language, no ambiguous letter clusters
  - **Easy to spell**: no unexpected silent letters, no confusing double letters unless intentional
  - **Distinctive**: not generic (avoid `easybooking`, `quickservice`-style constructs)
  - **No hyphens or numbers** in the base name
  - **Evocative**: ideally suggests the product's benefit, emotion, or sector without being literal
  - **Legally safer**: avoid trademarked terms or proper nouns
- [ ] The prompt weight on memorability can be tuned without code change (configurable system prompt or env-var override)
- [ ] The existing locale/target-language injection (US-001) is preserved and combined with these new criteria

### Technical Notes
- Update `DomainService.buildPrompt()` (or equivalent) to include a "Brand name quality criteria" section
- Keep the criteria as a bullet list in a dedicated prompt section — easier to iterate on than inline prose
- A/B test before and after with the same description to validate improvement

---

## US-017 · Extended European Language Support

**Status**: ✅ Implemented

**As a** user targeting a non-English, non-French European market,
**I want** to select my target language from a broader list of European languages,
**So that** the AI generates culturally and linguistically appropriate domain name suggestions.

### Acceptance Criteria
- [ ] The language selector (Step 2, local/regional mode) includes at minimum: German (de), Spanish (es), Italian (it), Portuguese (pt), Dutch (nl), Polish (pl), Swedish (sv), Danish (da), Finnish (fi), Romanian (ro), Czech (cs)
- [ ] The selected language is passed to the LLM prompt and to the keyword generation step
- [ ] The UI language selector itself (FR/EN flag toggle) remains separate from the target-language selector
- [ ] Adding a new language requires only a new entry in a config array — no code change
- [ ] Languages are listed alphabetically (by their native name) in the dropdown

### Technical Notes
- Existing locale inference table (`.fr`→fr, `.de`→de, etc.) in US-001 should be extended to cover all new languages
- LLM prompt: replace the current hardcoded language instruction with a dynamic `Generate names in {{language}}` insertion
- Consider grouping: "Most common" at top (en, fr, de, es), then alphabetical full list

---

## US-018 · Favourite Comparison Tool

**Status**: ✅ Implemented

**As a** user who has shortlisted several favourite domain names,
**I want** to compare them side by side in a structured view,
**So that** I can make a final decision without toggling back and forth through the full results table.

### Acceptance Criteria
- [ ] A "Compare favourites" button or tab appears when the user has ≥ 2 favourites
- [ ] The comparison view displays each favourite in a column (or card) with:
  - Domain name + availability per extension (✓/✗ matrix)
  - Length (character count of base name)
  - AI memorability score or pros/cons summary if available (US-005)
  - A "Copy" action per domain
  - An "Open registrar" link per available extension
- [ ] The user can remove a domain from the comparison without un-favouriting it
- [ ] The comparison is limited to 5 domains maximum to keep the layout usable
- [ ] The view is accessible from Step 3 (results page) and from the project drawer

### Technical Notes
- No new backend endpoint required — data is already in the local project state
- Implement as a Dialog or a dedicated panel below the results table
- If US-005 (pros/cons) is not yet implemented, the analysis column is hidden

---

## US-019 · Configurable Batch Size for "More Suggestions"

**Status**: ⚠️ Partial (fixed at 10, not configurable via UI)

**As a** user requesting additional domain suggestions,
**I want** to specify how many new suggestions I want before clicking "More suggestions",
**So that** I can choose between a quick top-up (5) or a larger batch (20) based on my needs and credit budget.

### Acceptance Criteria
- [ ] The "More suggestions" button is accompanied by a small numeric selector (stepper or segmented control): **5 · 10 · 20** (default: 10)
- [ ] The selected quantity is passed to the backend as the `count` parameter of the domain search request
- [ ] The credit cost is displayed next to the selector: e.g. "= 10 credits"
- [ ] The selected quantity persists within the session (sticky across successive "More" clicks)
- [ ] The selector does not appear if the user has fewer credits than the minimum option (5)

### Technical Notes
- Backend already accepts a `count` / `limit` parameter — verify and expose it if not already wired
- Display format suggestion: `[ More suggestions ] [ 5 | 10 | 20 ]` or a single split-button

---

## US-020 · Feedback Form with 1 000-Credit Reward

**Status**: ❌ To do

**As a** user of Namespoter,
**I want** to share feedback about what could be improved and receive free credits in return,
**So that** I'm incentivised to contribute to the product's improvement.

### Acceptance Criteria
- [ ] A "Give feedback" entry point is visible in the app (e.g. menu bar item, footer link, or floating button)
- [ ] Clicking it opens a dialog with:
  - A headline: *"Tell us what could be improved — get 1 000 free credits"*
  - A free-text area (required, min 20 chars, max 1 000 chars)
  - An optional email field (pre-filled if the user is logged in)
  - A submit button
- [ ] On submission:
  - The feedback is stored in the DB (`Feedback` entity: `id`, `keycloakId`, `email`, `message`, `createdAt`)
  - **1 000 extra credits are added to the user's account** (same as buying a pack, but free)
  - A success toast confirms: *"Thank you! 1 000 credits have been added to your account."*
  - The user cannot submit feedback more than **once per 30 days** (rate-limit per account)
- [ ] If the user is not logged in, clicking "Give feedback" prompts login first
- [ ] The feedback is viewable by admins via a simple `GET /feedback` endpoint (authenticated, admin role)

### Technical Notes
- New `Feedback` entity + `FeedbackModule` (controller + service)
- Credit grant uses the existing `usersService.addExtraCredits(keycloakId, 1000)`
- Rate-limit: query the latest `Feedback` record for the user; reject if `createdAt > now - 30 days`
- No email notification to admin in scope (can be added later)

---

## US-021 · Explain Credit Cost in UI ("1 credit = 1 name suggestion")

**Status**: ⚠️ Partial (coût implicite visible dans le dialog billing, pas de warning pré-recherche)

**As a** new or occasional user,
**I want** to understand clearly what a credit represents and how many I'm spending,
**So that** I can make informed decisions about my searches and purchases.

### Acceptance Criteria
- [ ] The credit balance display in the nav bar includes a tooltip or info icon explaining: *"1 credit = 1 domain name suggestion"*
- [ ] On Step 2 (before searching), the search button label or a sub-label indicates the estimated credit cost: e.g. *"Search — ~10 credits"*
- [ ] The billing dialog includes a line: *"Each domain name suggestion costs 1 credit. Extensions checked do not cost extra."*
- [ ] The landing page free-credits note is updated to reference the explanation: *"100 free credits on sign-up = up to 100 domain name suggestions"*
- [ ] i18n: both FR and EN translations are provided for all new strings

### Technical Notes
- No backend change required
- Tooltip on credit balance: PrimeNG `pTooltip` directive
- Estimated cost on search button: derive from `selectedKeywords.length × (estimated names per keyword)` — or simply show a fixed `~10 credits per search`

---

## US-022 · "Buy on registrar" button for available domains

**Status**: ✅ Implemented

**As a** user who has found an available domain name,
**I want** a direct link to buy it on a registrar from within the results table,
**So that** I can register the domain immediately without leaving the app and searching manually.

### Context — Affiliate programmes

| Registrar | Market | Commission (domains) | Cookie | Notes |
|-----------|--------|----------------------|--------|-------|
| **OVH** | France / EU | 3.2% | 45 days | Via third-party network (CJ / Impact). French market leader. |
| **Namecheap** | International | 35% | 30 days | Via Impact Radius / ShareASale. High commission. |
| **Gandi** | France / EU | TBC — no confirmed public programme | — | Respected by devs; worth a direct link even without commission. |
| **GoDaddy** | International | Via CJ | 30 days | Optional, lower brand perception in FR market. |

**Recommendation**: start with OVH + Namecheap (confirmed programmes). Add Gandi as a no-commission direct link. Skip GoDaddy for now.

---

### Acceptance Criteria

#### Results table
- [ ] For each cell where a domain+extension is **available** (✓), a small external-link icon or "Buy" micro-button appears on row hover
- [ ] Clicking opens the registrar's domain search/purchase page in a new tab, pre-filled with the full domain (e.g. `florizon.com`)
- [ ] If multiple registrars are configured, a small popover lets the user choose (e.g. OVH | Namecheap | Gandi)
- [ ] The button/icon does **not** appear for unavailable (✗) or pending (spinner) cells
- [ ] On mobile, the button is always visible (no hover state)

#### Affiliate link configuration
- [ ] Registrar URLs and affiliate tracking IDs are configured via environment variables:
  - `REGISTRAR_OVH_AFFILIATE_ID` — appended to OVH deep-link if set
  - `REGISTRAR_NAMECHEAP_AFFILIATE_ID` — appended to Namecheap deep-link if set
- [ ] If no affiliate ID is configured for a registrar, a plain (non-tracked) deep-link is used as fallback
- [ ] Deep-link URL patterns (configurable):
  - OVH: `https://www.ovhcloud.com/fr/domains/domain-name-search/?q={domain}` (+ affiliate param if configured)
  - Namecheap: `https://www.namecheap.com/domains/registration/results/?domain={domain}` (+ affiliate param)
  - Gandi: `https://www.gandi.net/fr/domain/suggest?q={name}` (no affiliate)

#### Frontend configuration
- [ ] The list of active registrars is driven by a config array in the frontend (easy to add/remove registrars without code changes)
- [ ] Each registrar entry includes: `name`, `label`, `icon` (or logo URL), `buildUrl(domain: string): string`
- [ ] The default registrar (used for single-click, no popover) can be configured

### Technical Notes
- All affiliate URL-building logic stays on the **frontend** (pure URL construction, no backend needed)
- Affiliate IDs can be injected via Angular environment files (`environment.ts` / `environment.prod.ts`) or fetched from a `GET /config` public endpoint
- Track clicks via `window.open(url, '_blank', 'noopener')` — no additional analytics needed in scope
- Registrar logos: use text labels initially; replace with SVG logos later if desired

### Out of Scope
- Automated affiliate programme registration
- Price comparison between registrars
- Cart/checkout integration

---

## US-023 · Landing Page — Brand Name Angle & SEO Optimisation

**Status**: ⚠️ Partial (contenu brand en place, meta tags / Open Graph / schema.org manquants)

**As a** entrepreneur searching for a brand name online,
**I want** to find Namespoter when I search for "find a brand name" or "brand name generator",
**So that** I discover the tool through organic search rather than only word-of-mouth.

### Context

The current landing page positions Namespoter primarily as a **domain name finder**. But the core value proposition is stronger: *find a brand name that is also available as a domain*. This dual angle (brand + domain) targets a broader and higher-intent audience — founders, freelancers, and product teams who start from the question "what should I call my brand?" not "what domain should I buy?".

SEO opportunity: queries like *"trouver un nom de marque"*, *"générateur nom de marque"*, *"brand name generator"*, *"find available brand name"* have significant search volume and are underserved by most domain-focused tools.

---

### Acceptance Criteria

#### Messaging & copy
- [ ] The main headline (`h1`) leads with the **brand name** angle, not the domain angle, e.g.:
  - FR: *"Trouvez le nom de marque idéal — avec le domaine disponible."*
  - EN: *"Find the perfect brand name — with the domain available."*
- [ ] The sub-headline clarifies the dual benefit: brand name + domain availability, in one step
- [ ] The benefit bullets are reordered / reworded to lead with brand naming:
  - "AI-generated brand name ideas tailored to your product and audience"
  - "Real-time domain availability check across all extensions"
  - "Short, memorable, distinctive — quality criteria built in"
  - "Save your favourites and share with your team"
- [ ] The CTA button copy reflects the brand angle: *"Find my brand name"* / *"Trouver mon nom de marque"*
- [ ] The free-credits note mentions brand names: *"100 free credits = up to 100 brand name ideas"*

#### SEO (meta tags & structure)
- [ ] `<title>` tag: *"Namespoter — Brand Name Generator with Domain Availability"* (FR + EN variants)
- [ ] `<meta name="description">`: 150-160 chars covering brand name + domain + AI + free
- [ ] `<h1>` contains the primary keyword ("brand name" / "nom de marque")
- [ ] Semantic HTML: the landing section uses `<section>`, `<h1>`, `<h2>`, `<ul>` — not just `<div>` + `<p>`
- [ ] `lang` attribute on `<html>` is set correctly per active locale (fr / en)
- [ ] Open Graph tags added: `og:title`, `og:description`, `og:url`, `og:image` (placeholder image acceptable initially)

#### Structured data (optional but recommended)
- [ ] A `<script type="application/ld+json">` block declares the page as a `WebApplication` with `name`, `description`, `url`, `applicationCategory: "BusinessApplication"`

### Technical Notes
- Changes are mostly in `web/src/index.html` (meta tags, lang), `web/src/app/components/wizard/wizard.html` (landing section copy), and `web/public/assets/i18n/fr.json` + `en.json` (translation keys)
- The `lang` attribute can be set dynamically from `TranslateService.onLangChange` via a small effect in `AppComponent`
- Angular does not support SSR in the current setup — meta tags are only seen by JS-capable crawlers (Googlebot). Consider adding `@angular/ssr` in a future story if SEO becomes a priority
- Canonical URL: add `<link rel="canonical" href="https://namespoter.com/">` in `index.html`

### Out of Scope
- Server-side rendering (SSR)
- Sitemap generation
- Multilingual hreflang tags

---

## US-024 · Keycloak Theme — Align Login/Register Pages with App Design

**Status**: ✅ Implemented

**As a** user registering or logging in to Namespoter,
**I want** the Keycloak login and registration pages to look like the rest of the application,
**So that** the experience feels seamless and professional rather than generic.

### Context

Keycloak serves its own login/register/forgot-password pages. By default these use the Keycloak "Keycloak" theme (grey, generic). Namespoter uses a clean, minimal design (PrimeNG Aura, dark primary colour, sans-serif). The disconnect is jarring when users are redirected to login.

Keycloak supports custom themes via a `themes/` folder mounted into the container. A custom theme can extend `keycloak` (base) or `keycloak.v2` and override only the CSS/templates needed.

---

### Acceptance Criteria

#### Visual alignment
- [ ] Background colour matches the app: white or very light grey (`#f8f9fa`)
- [ ] Primary action button (Login, Register, Submit) matches the app's primary colour (`var(--p-primary-color)` ≈ `#6366f1` indigo or the configured Aura primary)
- [ ] Font family matches the app: system-ui / Inter (or whatever is used globally)
- [ ] The Keycloak logo/name is replaced by the **Namespoter wordmark** (text or SVG logo)
- [ ] Form inputs have the same border-radius and focus style as PrimeNG inputs
- [ ] Error messages are styled consistently (red, not default Keycloak styling)
- [ ] Footer text ("Powered by Keycloak") is removed or replaced with "© Namespoter"

#### Pages covered
- [ ] Login (`login.ftl`)
- [ ] Registration (`register.ftl`)
- [ ] Forgot password (`login-reset-password.ftl`)
- [ ] Email sent confirmation (`login-page-expired.ftl` / info page)

#### Infrastructure
- [ ] The custom theme lives in `infra/keycloak/themes/namespoter/` and is mounted into the container via `docker-compose.yml`
- [ ] `docker-compose.yml` passes `--spi-theme-default=namespoter` (or sets `KC_SPI_THEME_DEFAULT`) so the realm uses it automatically
- [ ] The realm-export.json is updated to reference `loginTheme: "namespoter"` so it applies on fresh import
- [ ] Hot-reload works in dev: theme changes are reflected without rebuilding the container (Keycloak dev mode caches themes per request when `KC_CACHE=local`)

#### Localisation
- [ ] FR and EN translations are provided for all overridden strings (via `messages/messages_fr.properties` and `messages_en.properties`)

### Technical Notes
- Keycloak theme structure: `themes/namespoter/login/` with `theme.properties`, `resources/css/styles.css`, and optionally overridden `.ftl` templates
- `theme.properties` must declare `parent=keycloak.v2` to inherit all default templates and only override what's needed
- CSS-only approach preferred (override `styles.css` only, no `.ftl` changes) unless logo replacement requires template edit
- The Namespoter logo can be injected via `theme.properties` → `styles=css/styles.css` and a CSS `content:url(...)` or an `<img>` in an overridden `login.ftl` header
- Docker volume mount: `- ./keycloak/themes:/opt/keycloak/themes` in `infra/docker-compose.yml`
- Test all pages in FR and EN before closing the story

### Out of Scope
- Custom email templates (separate story)
- Dark mode for Keycloak pages
- Advanced animations or illustrations

---

## US-025 · Auto-Favourite Manually Added Domains

**Status**: ✅ Implemented

**As a** user who adds a domain name manually to the results table,
**I want** it to be automatically marked as a favourite,
**So that** the AI analysis is triggered immediately and the row stays visible at the top of the list.

### Acceptance Criteria
- [ ] When `addManualDomain()` successfully adds a row, `isFavorite` is set to `true` on the temp row immediately (optimistic)
- [ ] Once the suggestion is saved to the DB (after WHOIS check), `toggleFavorite` is called server-side to persist the favourite state
- [ ] The AI analysis (US-005) is triggered automatically for the new row (same as toggling favourite)
- [ ] The row is sorted to the top of the table alongside other favourites

### Technical Notes
- In `addManualDomain()`, after receiving the saved suggestion ID, call `projectService.toggleFavorite(id)` then `domainService.analyzeName(id)`
- Set `isManual: true, isFavorite: true` on the temp row before the WHOIS check so the heart is immediately red

---

## US-026 · Refined Analysis Display — Star Gauge + Detail Card (US-005 follow-up)

**Status**: ✅ Implemented

**As a** user viewing a favourited domain's analysis,
**I want** to see a compact summary line with a star score and key points, expandable to a full metric detail card,
**So that** I get immediate signal quality at a glance without the full text always taking up space.

### Acceptance Criteria

#### Compact summary line (always visible when analysis is ready)
- [ ] Displayed on a single discreet line directly below the domain name (inside the same table cell)
- [ ] Contains: a **5-star gauge** (average of all 6 metric scores) + the first **strength** + the first **weakness**, truncated with ellipsis if too long
- [ ] Example: `★★★★☆  ✅ Punchy and short  ⚠️ May clash with "Florazon"`
- [ ] Font size ≈ 0.72rem, muted colour (`#6b7280`), no background

#### Detail card (expandable)
- [ ] A `…` or `+` button at the end of the summary line opens a detail card (replaces the current chevron behaviour from US-005)
- [ ] The detail card shows each of the 6 metrics as a labelled star-bar row:
  ```
  Memorability       ★★★★☆
  Pronunciation      ★★★★★
  International      ★★★☆☆
  SEO                ★★☆☆☆
  Distinctiveness    ★★★★☆
  Length             ★★★☆☆  (7 chars)
  ```
- [ ] Below the metrics: full **Strengths** and **Watch out** text
- [ ] The card closes when clicking `…` again or clicking elsewhere

#### Backend — structured analysis format
- [ ] The AI prompt is updated to return **structured JSON** instead of free text:
  ```json
  {
    "scores": { "memorability": 4, "pronunciation": 5, "international": 3, "seo": 2, "distinctiveness": 4, "length": 3 },
    "strengths": "Punchy and short, easy to spell",
    "watchout": "May be confused with similar names in the sector"
  }
  ```
- [ ] The `analysis` DB column stores this JSON string
- [ ] The average score is computed on the frontend: `mean(Object.values(scores))`
- [ ] Existing plain-text analyses (from US-005 initial implementation) are treated as legacy and re-analysed on next favourite toggle if the JSON parse fails

### Technical Notes
- Update `DomainService.analyzeNameWithAI()` to use `response_format: { type: 'json_object' }` and a prompt that returns the above structure
- Frontend: parse `result.analysis` as JSON; fall back to displaying raw text if parse fails (backwards compat)
- Star gauge: render with `★` / `☆` characters or a simple loop — no extra library needed
- The detail card can be a `<div>` positioned absolutely or just inline-expanded below the summary line (inline preferred, simpler)

---

## US-027 · Move Streaming Progress Panel Between Table and Action Buttons

**Status**: ✅ Implemented

**As a** user watching domain results appear progressively,
**I want** the streaming progress indicator to appear between the last table row and the "More suggestions" button,
**So that** it feels connected to the table being built rather than floating above it.

### Acceptance Criteria
- [ ] The streaming progress panel (`streamProgress()`) is moved from its current position (above the table) to **between the table and the navigation buttons**
- [ ] When `streamProgress()` is active and `domains().length > 0`, the panel appears directly below the table card, above the manual entry input and the action buttons
- [ ] When `streamProgress()` is null (search complete or not started), the panel is hidden (no layout shift)
- [ ] The panel width matches the table (`max-width: 36rem; width: 100%`)
- [ ] Layout order in Step 3 becomes:
  1. Title + subtitle
  2. Note (if fewer results than expected)
  3. Copy table button
  4. Results table
  5. **Streaming progress panel** ← moved here
  6. Manual domain entry input
  7. Navigation buttons (Back / New project / More suggestions)

### Technical Notes
- Cut the `<div *ngIf="streamProgress()">` block from its current location in `wizard.html` and paste it after the `</div>` closing the table wrapper
- No logic changes required

---

## US-028 · Fix Dropdown Menus Rendering Too Low on Scroll

**Status**: ✅ Implemented

**As a** user who has scrolled down the page,
**I want** dropdown menus (Select, language picker, match-mode selector) to open at the correct position relative to their trigger,
**So that** I don't have to scroll back up to interact with them.

### Acceptance Criteria
- [ ] All PrimeNG `<p-select>` / `<p-selectButton>` / overlay panels open at the correct screen position regardless of scroll offset
- [ ] Tested at: no scroll, 200px scroll, 600px scroll on both desktop and mobile
- [ ] No regression on other overlay components (Drawer, Dialog, Toast, Tooltip)

### Root Cause (likely)
PrimeNG overlays default to `appendTo="body"` which positions the panel relative to `document.body`. If the body has `overflow: hidden` or if there's a CSS `transform` on an ancestor, the overlay calculates its position from the wrong origin. Alternatively, the overlay uses `position: absolute` relative to the viewport scroll offset and miscalculates.

### Technical Notes
- Check `appendTo` attribute on all `<p-select>` usages — ensure it is either `"body"` (default, usually correct) or not set
- Check `styles.css` and `index.html` for any `overflow: hidden` or `transform` on `body` / `html` / wrapper elements that could break fixed/absolute positioning
- PrimeNG 21 known issue: if the parent has `position: relative` and `overflow: hidden`, overlay panels clip. Solution: ensure no ancestor of the trigger has `overflow: hidden`
- If the issue is scroll-related: PrimeNG overlays should recalculate on scroll — check if `appendTo="body"` is missing on affected components

---

## US-029 · Subscription Management & Self-Service Cancellation

**Status**: ✅ Implemented

**As a** subscribed user,
**I want** to view my current subscription details and cancel it on my own,
**So that** I am not locked in and always have clear visibility over my billing commitment.

### Context
US-014 implements the Stripe checkout and Customer Portal redirect. This story focuses on the **post-subscription self-service experience**: a dedicated account section the user can reach at any time, showing subscription status and providing a one-click path to manage or cancel.

### Acceptance Criteria

#### Frontend — Account / Subscription Section
- [ ] A "Subscription" tab or card is accessible from the user menu (top-right avatar / menu) at all times
- [ ] The section displays:
  - Current plan name (e.g. "Essential — 2 000 credits/month") or "No active subscription"
  - Subscription status badge: **Active** / **Cancelled (active until …)** / **Expired**
  - Subscription credits remaining this period + reset date (e.g. "1 340 / 2 000 — resets on 15 Mar")
  - Extra (permanent) credits balance
  - Next billing date and amount (if active)
- [ ] A **"Manage subscription"** button opens the Stripe Customer Portal in a new tab (`GET /payments/portal`)
- [ ] A **"Cancel subscription"** shortcut button is shown (active plan only):
  - Triggers a confirmation dialog: "Your subscription will remain active until [date]. After that, your monthly credits will not renew. Confirm?"
  - On confirm, redirects to the Stripe Customer Portal pre-opened on the cancellation flow
- [ ] After cancellation (user returns from portal), the status badge updates to "Cancelled (active until …)" on next page load / polling
- [ ] No active subscription: section shows "No active plan" and a CTA "Subscribe" (links to US-014 checkout flow)

#### Backend
- [ ] `GET /users/me/subscription` — returns:
  ```json
  {
    "plan": "essential" | null,
    "status": "active" | "cancelled" | "expired" | "none",
    "subscriptionCredits": 1340,
    "subscriptionCreditsTotal": 2000,
    "extraCredits": 500,
    "currentPeriodEnd": "2026-03-15T00:00:00Z" | null,
    "nextBillingAmount": 500 | null
  }
  ```
- [ ] Data sourced from local DB fields + optional Stripe API call for `nextBillingAmount` (or cached on webhook)
- [ ] The existing `GET /payments/portal` endpoint (US-014) is reused as-is for the management redirect

#### Webhook — Cancellation State
- [ ] `customer.subscription.updated` with `cancel_at_period_end: true` → set a new `subscriptionCancelledAt: Date` field on `User` (date of next period end); status becomes "cancelled" in the API response

### Technical Notes
- The Subscription section can be implemented as a new `<p-dialog>` or a new route `/account` with a tab layout
- Prefer a dialog (consistent with existing "credits" dialog pattern) unless the account page already exists
- `subscriptionCancelledAt` field added to `User` entity; `status` in the API response is derived:
  - `active`: `stripeSubscriptionId` set, `subscriptionCancelledAt` null
  - `cancelled`: `stripeSubscriptionId` set, `subscriptionCancelledAt` in the future
  - `expired`: `stripeSubscriptionId` null, `subscriptionCancelledAt` in the past (or cleared)
  - `none`: no `stripeSubscriptionId` ever
- Stripe Customer Portal handles payment method updates, invoice history, and cancellation — no need to rebuild those flows

---

## US-030 · Import Description from a Web Page URL

**Status**: ❌ To do

**As a** user who already has a product or landing page,
**I want** to paste a URL instead of writing my product description manually,
**So that** Namespoter can extract the relevant context automatically and I can skip the writing step.

### Acceptance Criteria

#### Frontend — Step 1 (Description)
- [ ] Below the description textarea, a collapsible "Or import from a URL" section appears
- [ ] It contains:
  - A URL input field with placeholder `https://myproduct.com`
  - An **"Extract"** button (disabled while empty or loading)
- [ ] On click, a spinner replaces the button and the textarea is disabled
- [ ] On success, the extracted description fills the textarea; the user can edit it before continuing
- [ ] On error (unreachable URL, extraction failed, etc.), a toast message is shown: "Could not extract content from this URL. Please enter the description manually."
- [ ] The URL input and the textarea are mutually exclusive as *primary input* but not locked: the user can still type or edit the textarea after extraction

#### Backend — New Endpoint
- [ ] `POST /domain/extract-description` (authenticated)
  - Body: `{ "url": string }`
  - Validates that `url` is a well-formed `http` or `https` URL
  - Fetches the page HTML (timeout: 8 s, max body: 512 KB)
  - Strips HTML tags, removes nav/footer/script/style noise (basic cheerio extraction targeting `<main>`, `<article>`, `<h1>`, `<p>` tags)
  - Sends the cleaned text (truncated to 3 000 chars) to OpenAI with the prompt:
    > "You are a product analyst. Based on the following web page content, write a concise product description (2–4 sentences) suitable for generating brand name ideas. Focus on what the product does, who it is for, and its key differentiator."
  - Returns: `{ "description": string }`
  - Costs **0 credits** (extraction is a free helper action, not a domain suggestion)
  - Rate-limited: max 5 calls/user/hour to avoid abuse

#### Security & Edge Cases
- [ ] SSRF protection: reject URLs resolving to private IP ranges (10.x, 192.168.x, 127.x, etc.) before fetching
- [ ] `User-Agent` header set to `Namespoter-Bot/1.0` on outgoing fetch
- [ ] If the page returns a non-200 status, return a 422 with `{ "error": "page_unreachable" }`
- [ ] If extracted text < 50 chars after stripping, return a 422 with `{ "error": "content_too_short" }`
- [ ] PDF / non-HTML content-types are rejected immediately (future story could handle PDFs)

### Technical Notes
- Use `axios` (already a NestJS dependency) for the HTTP fetch with a custom timeout config
- Use `cheerio` for HTML parsing (add as dependency: `npm install cheerio`)
- SSRF check: use `dns.lookup` + IP range validation before the actual fetch, or use a library like `ssrf-req-filter`
- New `DomainController` route: `POST /domain/extract-description`
- Rate limiting: use `@nestjs/throttler` with a custom TTL/limit override for this specific endpoint
- Frontend: new method `extractDescriptionFromUrl(url: string): Observable<{ description: string }>` in `DomainService`

---

## US-031 · LLM Model Selection — Standard vs. Premium

**Status**: ❌ To do

**As a** user who wants higher-quality name suggestions,
**I want** to choose between a standard model (fast, economical) and a premium model (more creative, more accurate),
**So that** I can decide the right trade-off between credit cost and output quality for my project.

### Context
The backend currently uses `gpt-3.5-turbo` for all AI calls (keyword generation, domain idea generation, description reformulation, name analysis). A premium tier using `gpt-4o` would produce more creative and contextually relevant suggestions, at a higher per-call cost that is passed on to the user as extra credits consumed.

### Pricing Model

| Tier | Model | Cost per domain suggestion | Cost per analysis |
|------|-------|---------------------------|-------------------|
| Standard | `gpt-3.5-turbo` | 1 credit | 1 credit |
| Premium | `gpt-4o` | 3 credits | 2 credits |

### Acceptance Criteria

#### Frontend — Model Selector (Step 1)
- [ ] A segmented control or radio group is displayed in Step 1 below the description textarea:
  - **Standard** — GPT-3.5 · 1 credit / suggestion
  - **Premium** — GPT-4o · 3 credits / suggestion ✨
- [ ] The selected tier is persisted in the wizard state signal and sent with every API request
- [ ] When switching to Premium, a brief inline tooltip or note reads: "More creative results — uses 3× more credits"
- [ ] The current credit balance is visible nearby so the user can evaluate affordability
- [ ] The model choice is saved with the project (restored on project reload)

#### Backend — Model Routing
- [ ] All `DomainService` methods (`reformulateDescription`, `generateKeywords`, `generateDomainIdeas`, `recheckDomainWithAI`, `analyzeNameWithAI`, `extractDescription`) accept an optional `model: 'standard' | 'premium'` parameter (default: `'standard'`)
- [ ] A private helper `resolveModel(tier)` maps tier → OpenAI model ID:
  - `'standard'` → `'gpt-3.5-turbo'`
  - `'premium'` → `'gpt-4o'`
- [ ] The `SearchDomainsDto` gains a `tier?: 'standard' | 'premium'` field (default `'standard'`)
- [ ] Credit deduction in `DomainController` applies the correct multiplier:
  - Standard: 1 credit per available domain found (current behaviour)
  - Premium: 3 credits per available domain found
- [ ] Analysis (`POST /domain/analyze`) also deducts 1 (standard) or 2 (premium) credits based on the tier stored on the project or passed in the request

#### Backend — Safeguards
- [ ] If the user's total credit balance < multiplier × requested batch size, the API returns a 402 with `{ "error": "insufficient_credits", "required": N, "available": M }` before any OpenAI call is made
- [ ] The premium model is only available to authenticated users (public/anonymous users are locked to Standard)

### Technical Notes
- The 6 `openai.chat.completions.create({ model: 'gpt-3.5-turbo', ... })` calls in `domain.service.ts` are the only change points — replace the hardcoded string with `this.resolveModel(tier)`
- `gpt-4o` supports `response_format: { type: 'json_object' }` (same as gpt-3.5-turbo) — no prompt changes needed
- Store `tier` on the `Project` entity as an optional string field (migration required); default `'standard'` for existing projects
- The `DomainSuggestion` entity can optionally store the model used for traceability/debugging

---

## US-032 · Alternative Domain Name Styles for Local Market Targeting

**Status**: ✅ Implemented

**As a** freelancer or artisan targeting a local market,
**I want** the app to suggest descriptive or culturally-referenced domain names as alternatives to short startup-style names,
**So that** I can find available, credible, and locally resonant domains when short names are all taken.

### Context
Short invented names often feel foreign or SEO-weak for local independents (artisans, therapists, local traders). Two alternative styles address this: **descriptive names** that combine activity + location/adjective (e.g. `boulangerie-provence.fr`), and **cultural references** drawn from the worldwide public domain (fairy tales, mythology, folklore) that metaphorically evoke the product (e.g. `petit-poucet.com` for a GPS beacon for the blind). Both styles are offered as opt-in toggles alongside the standard short-name search.

### Acceptance Criteria

#### Frontend — Step 2 (Keywords / Options)
- [ ] When `isLocal` is active (US-001), two independent toggles appear in Step 2 (both off by default):
  - **"Noms descriptifs"** — activity + location/adjective combinations, hyphens allowed
  - **"Références culturelles"** — public domain cultural references that evoke the product
- [ ] Active toggles are included in the search request (`descriptiveNames: true`, `culturalNames: true`)
- [ ] Results from all active modes are **mixed** in the existing table, each with a style badge (`descriptif` / `culturel`)
- [ ] Toggle states are persisted in the wizard state and saved with the project

#### Backend — Unified Prompt Generation
- [ ] A single LLM prompt generates the full batch (10 names by default) incorporating all active styles
- [ ] The prompt instructs the model to infer location/culture from the project description — no extra user input required
- [ ] When `descriptiveNames: true`: include names in the form `[activity]-[location/adjective]` in the target language, hyphens allowed
- [ ] When `culturalNames: true`: include names drawn from worldwide public domain (fairy tales, mythology, folklore, proverbs, historical figures) that metaphorically fit the product — no restrictions on source, no justification required
- [ ] The model distributes the 10 names proportionally across active styles (e.g. if both toggles active: ~3 standard + ~3 descriptive + ~4 cultural, or similar mix)
- [ ] Each generated name is returned with a `style` tag: `'standard'`, `'descriptive'`, or `'cultural'`
- [ ] Guards: both flags require `locale` to be set (400 if locale missing)
- [ ] Credit deduction identical to standard suggestions (1 credit per available domain)

#### Whois Verification
- [ ] All styles go through the same Whois pipeline — no special handling

#### Data
- [ ] `DomainSuggestion` entity gets an optional `style` varchar column (default `'standard'`)
- [ ] Migration required

### Technical Notes
- Modify the existing prompt in `DomainService.generateDomainIdeas()` to conditionally append style instructions based on active flags — one call, one response to parse
- `style` is returned as a field alongside each name in the LLM JSON response: `[{ "name": "petit-poucet", "style": "cultural" }, ...]`
- Frontend badge: `p-tag` with severity `secondary` for `descriptif`, severity `info` for `culturel`
- The `style` field on `DomainSuggestion` must be restored when loading a saved project

---

## US-033 · Tinder Mode — Swipe to Like / Dislike Domain Names

**Status**: ❌ To do

**As a** user who has received domain name suggestions,
**I want** to review them one by one in a swipe-style card interface,
**So that** I can quickly sort through many options without the cognitive load of a full table, and end up with a clear shortlist.

### Context
The current table view works well on desktop but is overwhelming on mobile and cognitively demanding when there are many results. A card-by-card "Tinder mode" reduces each decision to a binary yes/no, naturally building a shortlist. It complements — not replaces — the table: a toggle lets the user switch between both views at any time.

### UX Flow
1. User arrives at Step 3 (results). A toggle in the header switches between **Table view** and **Tinder mode**.
2. In Tinder mode, one card is shown at a time. The card displays:
   - The domain name (large, centred)
   - Availability badge per selected extension (✅ / ❌)
   - If analysis exists: star score inline
3. The user acts:
   - **👎 Dislike** (swipe left / left button) — skips the name; it is added to the dislike list
   - **👍 Like** (swipe right / right button) — adds the name to the shortlist panel
   - **❤️ Coup de cœur** (center button or double-tap) — marks as favourite (calls `toggleFavorite()`, triggers AI analysis) and adds to shortlist
4. When all current cards have been reviewed, the app shows:
   - "All names reviewed — load more?" → calls `findDomains(append=true)` with disliked names added to `excludeNames`
5. At any point the user can open the **shortlist panel** (slide-in or bottom sheet) to review their liked / coup-de-cœur names.
6. A **"Done"** button on the shortlist exits Tinder mode and switches back to Table view, filtered to the liked names only.

### Acceptance Criteria

#### Frontend — View Toggle
- [ ] A segmented control (`p-selectButton`) in the Step 3 header lets the user switch between **📋 Table** and **🃏 Tinder**
- [ ] The selected view mode is persisted in the wizard state (survives navigation within the wizard session)
- [ ] Switching to Tinder mode starts from the first unreviewed card (not from the beginning if the user has already swiped some)

#### Frontend — Card UI
- [ ] One card is visible at a time, centred on screen, with subtle drop-shadow and rounded corners
- [ ] Card content:
  - Domain name in large bold text
  - A row of extension availability chips: `.com ✅ · .fr ❌ · .net ✅`
  - Star score (if analysis available), greyed-out placeholder if not
- [ ] Three action buttons below the card: **✕ Dislike** · **❤️ Coup de cœur** · **✓ Like**
- [ ] On desktop: click buttons. On mobile: swipe left (dislike) / swipe right (like) gestures are supported in addition to buttons
- [ ] A swipe animation plays on action (card slides out left or right with a colour tint: red for dislike, green for like, pink for coup de cœur)
- [ ] A progress indicator shows "X / N reviewed" and the number of names liked so far
- [ ] When there are no more cards: a "Load more suggestions" prompt appears automatically

#### Frontend — Shortlist Panel
- [ ] A floating badge (bottom-right) shows the count of liked names; clicking it opens the shortlist panel
- [ ] The shortlist panel lists liked and coup-de-cœur names with their availability and analysis score
- [ ] The user can un-like a name from the shortlist panel (removes from shortlist, does not add to dislike)
- [ ] A "Done – keep shortlist" button exits Tinder mode and filters the Table view to shortlisted names only

#### Frontend — State Signals
- [ ] New signals in `WizardComponent`:
  - `tinderMode = signal<boolean>(false)`
  - `tinderIndex = signal<number>(0)` — index of the current card in `domains()`
  - `likedNames = signal<string[]>([])` — names liked or coup-de-cœur
  - `dislikedNames = signal<string[]>([])` — names to exclude from next batch
- [ ] `dislikedNames()` is merged into `excludeNames` on the next `findDomains(append=true)` call (alongside already-displayed names, per US-015)

#### Backend
- [ ] No backend changes required. All actions (like, coup de cœur, load more) use existing endpoints:
  - Coup de cœur → `toggleFavorite()` (existing)
  - Load more → `findDomains(append=true)` with extended `excludeNames` (existing)

### Technical Notes
- Swipe gesture: use the `(touchstart)` / `(touchend)` Angular host listeners on the card element, compute `deltaX`; threshold: 80px
- Card animation: CSS `transition: transform 0.3s, opacity 0.3s` + Angular `[style.transform]` binding; add a `leaving-left` / `leaving-right` class on action then reset after transition
- The Tinder view iterates `domains()` by index (`tinderIndex`); since `domains()` is a live signal that grows as streaming adds results, new cards appear automatically at the end of the deck
- Do NOT remove disliked domains from `domains()` — they remain in the Table view (the user may want to reconsider); only hide them in Tinder mode via the index pointer
- No PrimeNG card component needed — a plain `<div>` with inline styles avoids theme overrides (per project CSS conventions)

---

## US-034 · Google Analytics Integration

**Status**: ✅ Implemented

**As a** product owner,
**I want** Google Analytics 4 to track user behaviour on Namorama,
**So that** I can measure acquisition, conversion, and feature usage without writing custom analytics infrastructure.

### Acceptance Criteria

#### Frontend — Tag injection
- [ ] The GA4 measurement script (`gtag.js`) is injected in `index.html` via the standard Google tag snippet, using the Measurement ID from a runtime environment variable (not hardcoded)
- [ ] The Measurement ID is exposed to the Angular app via the existing `ConfigService` runtime config mechanism (same pattern as `apiUrl` / `keycloakUrl`)
- [ ] If no Measurement ID is configured (local dev), the script is not injected and no console errors appear

#### Frontend — Key events tracked
- [ ] **`page_view`** — sent automatically by GA4 on each Angular route change (`/`, `/projects/:id`, `/payment/success`, `/payment/cancel`)
- [ ] **`search_started`** — fired when the user clicks "Rechercher" in the wizard (step 1 → step 3)
- [ ] **`domain_favorited`** — fired when the user marks a domain as coup de cœur (includes `domain_name` as parameter)
- [ ] **`project_saved`** — fired when a project is saved for the first time
- [ ] **`signup_completed`** — fired on `/payment/success` after a subscription checkout
- [ ] **`credits_purchased`** — fired on `/payment/success` after a pack checkout (includes `pack_size: 1000`)

#### Frontend — RGPD / consent
- [ ] Analytics are only activated **after** the user has given consent via a cookie banner
- [ ] The cookie banner appears on first visit (bottom of screen, non-intrusive) with two options: **Accept** / **Decline**
- [ ] Consent choice is stored in `localStorage` (`analytics_consent: 'granted' | 'denied'`)
- [ ] If consent is denied, `gtag('consent', 'update', { analytics_storage: 'denied' })` is called and no data is sent
- [ ] The banner does not appear again once a choice has been made
- [ ] A "Cookie preferences" link in the footer lets the user change their choice at any time

#### Backend — No changes required
- [ ] All tracking is client-side only via GA4; no server-side events needed at this stage

### Technical Notes
- Add `GA_MEASUREMENT_ID` to `web/src/assets/config.json` (runtime config) and to `docker-compose.prod.yml` env vars
- Inject the script conditionally in `ConfigService.load()`: if `gaMeasurementId` is set, create and append the `<script>` tag to `document.head`
- For SPA route tracking, subscribe to Angular `Router.events` and call `gtag('event', 'page_view', { page_path })` on each `NavigationEnd`
- Custom events: create a lightweight `AnalyticsService` with a single `track(eventName, params?)` method that calls `gtag('event', ...)` only if consent is granted
- Cookie banner: a standalone Angular component added to `app.ts` template, shown via a signal `showConsentBanner = signal(!localStorage.getItem('analytics_consent'))`
- Do NOT use a heavy third-party analytics wrapper library — the native `gtag` API is sufficient

---

## US-035 · Keycloak Email Theme — Branded Transactional Emails

**Status**: ✅ Implemented

**As a** user receiving emails from Namorama (password reset, email verification),
**I want** those emails to look consistent with the app's visual identity,
**So that** I trust the communication and recognise the brand.

### Acceptance Criteria
- [ ] An `email` theme named `namespoter` is created under `infra/keycloak/themes/namespoter/email/`
- [ ] `theme.properties` sets `parent=base`
- [ ] HTML templates are overridden for at minimum: `email-verification.ftl`, `password-reset.ftl`
- [ ] All emails share a common layout (`html/base.ftl` or inline CSS wrapper): white card on light background, emerald header bar (`#10b981`), app logo or wordmark "Namorama", clean sans-serif font
- [ ] Footer includes: app name, "You received this email because…" disclaimer, unsubscribe/contact link
- [ ] Subject lines use the app name (e.g. "Namorama – Verify your email")
- [ ] Plain-text versions (`text/` templates) are also provided
- [ ] `emailTheme: "namespoter"` is set in `realm-export.json`
- [ ] Theme deployed to production via the same `docker cp` + `docker restart` procedure

### Technical Notes
- Keycloak email templates use FreeMarker (`.ftl`), with variables like `${user.firstName}`, `${link}`, `${realmName}`
- HTML emails must use inline CSS (no external stylesheets — email clients strip `<style>` blocks)
- Test by triggering a password reset on staging/prod and checking the rendered email

---

## US-036 · Keycloak Account Console Theme — User Profile Portal

**Status**: ✅ Implemented

**As a** logged-in user wanting to manage my account (profile, password, active sessions),
**I want** the Keycloak account portal to match Namorama's design,
**So that** the experience feels seamless when I'm redirected there from the app.

### Acceptance Criteria
- [ ] An `account` theme named `namespoter` is created under `infra/keycloak/themes/namespoter/account/`
- [ ] `theme.properties` sets `parent=keycloak.v2` (Keycloak 22 uses React-based Account Console v2)
- [ ] Primary colour overridden to emerald (`#10b981`) via CSS variable injection or theme property
- [ ] Page title / header displays "Namorama" instead of default Keycloak branding
- [ ] Favicon matches the app favicon
- [ ] `accountTheme: "namespoter"` is set in `realm-export.json`
- [ ] Theme deployed to production

### Technical Notes
- Keycloak 22 Account Console v2 is a React SPA; full template override is complex. Acceptable MVP: override only `theme.properties` + inject a CSS file that overrides primary colour variables (`--pf-global--primary-color--100` etc.)
- If PatternFly CSS variables are insufficient, consider `parent=keycloak` (v1 classic) as a fallback for easier customisation

---

## US-037 · Keycloak Registration & Password-Reset Page Polish

**Status**: ✅ Implemented

**As a** new user registering or resetting my password,
**I want** those Keycloak pages to look as polished as the login page,
**So that** the onboarding experience is coherent end-to-end.

### Acceptance Criteria
- [ ] Registration page (`register.ftl`): same background, card, and typography as the login page; no layout regressions
- [ ] "Forgot password" page (`login-reset-password.ftl`): consistent styling
- [ ] "Check your email" confirmation page (`login-verify-email.ftl`): consistent styling
- [ ] Error page (`error.ftl`): branded with app name and a "Back to app" link pointing to `https://namorama.com`
- [ ] All pages tested on mobile (375 px) — card does not overflow, inputs are usable
- [ ] No grey zones or unstyled PatternFly sections remain (same fixes as applied to login page)

### Technical Notes
- All these pages are part of the existing `login` theme — they inherit `login.css` already. This story is about verifying and fixing any remaining inconsistencies, not a full rework.
- Test each page manually by navigating to the Keycloak registration URL and triggering each flow

---

## Priority / Effort Matrix (initial estimate)

| Story | Value | Effort | Priority | Status |
|-------|-------|--------|----------|--------|
| US-007 · Multi-extension input | High | Low | 🔴 Now | ✅ Done |
| US-003 · Scroll overlap fix | High | Low | 🔴 Now | ✅ Done |
| US-002 · Copy to clipboard | High | Low | 🔴 Now | ✅ Done |
| US-021 · Explain credit cost in UI | High | Low | 🔴 Now | ⚠️ Partial |
| US-025 · Auto-favourite manually added domains | High | Low | 🔴 Now | ✅ Done |
| US-027 · Move streaming progress panel position | Medium | Low | 🔴 Now | ✅ Done |
| US-028 · Fix dropdown menus rendering too low on scroll | High | Low | 🔴 Now | ✅ Done |
| US-004 · Locale from Keycloak | Medium | Low | 🟠 Next | ✅ Done |
| US-006 · Landing page redesign | High | Medium | 🟠 Next | ✅ Done |
| US-001 · International/local toggle | Medium | Medium | 🟠 Next | ✅ Done |
| US-009 · Timeout warning | Medium | Low | 🟠 Next | ✅ Done |
| US-011 · Manual row entry | Medium | Low | 🟠 Next | ✅ Done |
| US-014 · Stripe packs + subscription | High | High | 🟠 Next | ✅ Done |
| US-015 · Exclude already-evaluated candidates | High | Low | 🟠 Next | ✅ Done |
| US-016 · Memorable brand criteria in prompt | High | Low | 🟠 Next | ✅ Done |
| US-017 · Extended European language support | Medium | Low | 🟠 Next | ✅ Done |
| US-019 · Configurable batch size ("More") | Medium | Low | 🟠 Next | ⚠️ Partial |
| US-020 · Feedback form + 1 000 credit reward | High | Medium | 🟠 Next | ❌ To do |
| US-022 · "Buy on registrar" button (OVH, Namecheap, Gandi) | High | Low | 🟠 Next | ❌ To do |
| US-023 · Landing page — brand name angle & SEO | High | Low | 🟠 Next | ⚠️ Partial |
| US-026 · Refined analysis display — star gauge + detail card | High | Medium | 🟠 Next | ✅ Done |
| US-029 · Subscription management & self-service cancellation | High | Medium | 🟠 Next | ✅ Done |
| US-030 · Import description from a web page URL | High | Medium | 🟠 Next | ❌ To do |
| US-031 · LLM model selection — Standard vs. Premium | High | Medium | 🟠 Next | ❌ To do |
| US-032 · Long-form "phrase" domain names for local targeting | Medium | Low | 🟠 Next | ✅ Done |
| US-033 · Tinder mode — swipe to like / dislike domain names | High | Medium | 🟠 Next | ❌ To do |
| US-034 · Google Analytics integration | High | Low | 🟠 Next | ❌ To do |
| US-005 · Pros & cons analysis | High | High | 🟡 Later | ✅ Done |
| US-010 · Streaming results (SSE) | High | High | 🟡 Later | ✅ Done |
| US-012 · MCP server | High | Medium | 🟡 Later | ❌ To do |
| US-018 · Favourite comparison tool | Medium | Medium | 🟡 Later | ✅ Done |
| US-024 · Keycloak theme — align with app design | Medium | Medium | 🟡 Later | ✅ Done |
| US-035 · Keycloak email theme — branded emails | Medium | Low | 🟡 Later | ✅ Done |
| US-036 · Keycloak account console theme | Low | Medium | 🟡 Later | ✅ Done |
| US-037 · Keycloak registration & password-reset polish | Medium | Low | 🟡 Later | ✅ Done |
| US-038 · No-subscription pricing — Free plan + credit packs | High | Medium | 🔴 Now | ❌ To do |
| US-038 · No-subscription pricing — Free plan + credit packs | High | Medium | 🔴 Now | ❌ To do |
| US-013 · Teams / Claude skill / Marketplace | High | High | 🔵 Future | ❌ To do |

---

## US-038 · No-Subscription Pricing — Free Plan + Credit Packs

**Status**: ✅ Implemented

**As a** potential user hesitant to commit to yet another monthly subscription,
**I want to** access Namorama for free and buy credits only when I need them,
**So that** I can try the product without friction and scale my usage at my own pace.

### Context & Positioning

The current subscription model (5 €/month) creates an adoption barrier. The new pricing strategy removes this friction entirely: no subscription, no recurring charge. The tagline **"Vous n'aimez pas les abonnements ? Nous non plus."** anchors the value proposition.

Every registered user gets **100 free credits per month**, enough to run meaningful searches. Users who need more simply buy a one-time credit pack.

### Pricing Grid

| Plan | Price | Credits | Price per credit | Target user |
|------|-------|---------|-----------------|-------------|
| **Free** | 0 € | 100 / month | — | Discovery, occasional use |
| **Pack Découverte** | 9 € | 500 | 0,018 € | Freelancers, small projects |
| **Pack Pro** | 19 € | 2 000 | 0,0095 € | Founders, agencies |
| **Pack Max** | 29 € | 5 000 | 0,0058 € | Power users, studios |

Credits are permanent (no expiry on purchased packs). The monthly free allocation resets on the 1st of each month.

### Acceptance Criteria

#### Backend
- [ ] Remove subscription plan logic (`essential` plan, Stripe subscription checkout)
- [ ] Keep Stripe one-time payment flow for credit packs
- [ ] Add 3 pack tiers in Stripe (Découverte 9 €, Pro 19 €, Max 29 €) with corresponding `STRIPE_PACK_*_PRICE_ID` env vars
- [ ] Free monthly allocation: on the 1st of each month, top up `subscriptionCredits` to 100 for all users (cron job or lazy reset on first request of the month)
- [ ] API: `GET /users/credits` returns `{ freeCredits, packCredits, total }` — free credits are consumed first
- [ ] Credit deduction order: free credits first, then pack credits

#### Frontend — Pricing / Billing dialog
- [ ] Replace current billing dialog content with the new no-subscription layout
- [ ] Header: **"Vous n'aimez pas les abonnements ? Nous non plus."** (bold, primary color)
- [ ] Sub-header: "100 crédits gratuits chaque mois, et des packs sans engagement si vous en avez besoin."
- [ ] Display current free credit balance with monthly reset date (e.g. "74 / 100 crédits gratuits — renouvellement le 1er avril")
- [ ] Pack cards (3 cards side by side or stacked on mobile):
  - Découverte — 9 € — 500 crédits
  - Pro — 19 € — 2 000 crédits *(badge "Populaire")*
  - Max — 29 € — 5 000 crédits
- [ ] Each card shows price per credit in muted text
- [ ] "Acheter" button on each card triggers Stripe one-time checkout
- [ ] Pack credit balance displayed separately: "X crédits pack disponibles"
- [ ] Remove all subscription-related UI (subscribe button, cancel flow, renewal date for subscription)

#### Frontend — Landing page / homepage
- [ ] Add a pricing section on the landing page with the same 3-pack grid
- [ ] Tagline visible above the pricing section: "Vous n'aimez pas les abonnements ? Nous non plus."
- [ ] Free plan highlighted prominently: "Commencez gratuitement — 100 crédits offerts chaque mois, sans carte bancaire"
- [ ] i18n keys for FR and EN

#### i18n (FR / EN)
- [ ] `BILLING.TAGLINE` — "Vous n'aimez pas les abonnements ? Nous non plus." / "Not a fan of subscriptions? Neither are we."
- [ ] `BILLING.FREE_DESC` — "100 crédits offerts chaque mois, sans engagement" / "100 free credits every month, no strings attached"
- [ ] `BILLING.PACK_DECOUVERTE_NAME` — "Pack Découverte" / "Starter Pack"
- [ ] `BILLING.PACK_PRO_NAME` — "Pack Pro" / "Pro Pack"
- [ ] `BILLING.PACK_MAX_NAME` — "Pack Max" / "Max Pack"
- [ ] `BILLING.FREE_RESET` — "Renouvellement le {{date}}" / "Resets on {{date}}"
- [ ] `BILLING.PACK_BALANCE` — "{{n}} crédits pack" / "{{n}} pack credits"

### Technical Notes

- Remove `STRIPE_ESSENTIAL_PRICE_ID` and `STRIPE_SUBSCRIPTION_*` env vars (or keep for backward compat during transition)
- Add `STRIPE_PACK_DECOUVERTE_PRICE_ID`, `STRIPE_PACK_PRO_PRICE_ID`, `STRIPE_PACK_MAX_PRICE_ID`
- Monthly reset: simplest approach is a `lastFreeReset: Date` column on `user` entity — on credit check, if `lastFreeReset` < start of current month, reset `subscriptionCredits = 100` and update `lastFreeReset`
- Existing users with active subscriptions: migrate their `subscriptionCredits` balance to `packCredits`, cancel Stripe subscription via API, communicate change by email

### Out of Scope
- Annual plans, team/org plans
- Credit gifting or promo codes (separate story)
- Usage analytics dashboard

---

## US-039 · Responsive Table on Mobile

**Status**: ✅ Implemented

**As a** user browsing domain results on a smartphone,
**I want** the results table to be readable and usable on a small screen,
**So that** I can review available domains and buy them without having to scroll horizontally or squint.

### Context

The addition of the registrar "Buy" column (US-022) made the table wider. On screens < 480px the table overflows, columns are cramped, and the split button is barely usable. The table currently has: heart | domain name | .com | .fr | .io | … | OVH▾.

### Acceptance Criteria

#### Layout adaptation
- [ ] On screens ≥ 768px (tablet/desktop): keep the current table layout unchanged
- [ ] On screens < 768px: switch to a **card-per-domain** layout or a **condensed table**:
  - Domain name is displayed prominently (large, monospace, green if fully available)
  - Availability per extension is shown as compact chips/badges (✓ .com  ✗ .fr  ✓ .io)
  - Heart (favourite) icon and Buy button are clearly accessible without zooming
- [ ] The "Buy" split button remains usable on touch (large enough tap target, ≥ 44px)
- [ ] The "Help me pick" and "10 more suggestions" buttons remain accessible and wrap cleanly

#### UX
- [ ] No horizontal scroll on the main content area on mobile
- [ ] Domain name is not truncated to the point of being unreadable
- [ ] Favourite toggle still works on tap

### Technical Notes
- Use CSS `@media (max-width: 767px)` breakpoint
- Consider replacing `<p-table>` with a `<div *ngFor>` card list on mobile using Angular's `BreakpointObserver` or a pure-CSS approach
- PrimeNG table does not have built-in responsive card mode in all versions — CSS-only solution may be simpler

### Out of Scope
- Redesign of steps 1 and 2 (already acceptable on mobile)
- Native app / PWA

---

## US-040 · RGPD / Cookie Consent Banner

**Status**: ✅ Implemented

**As a** visitor or user of Namorama,
**I want** to be informed about data collection and give or refuse my consent before any tracking occurs,
**So that** the site complies with GDPR (EU Regulation 2016/679) and the French CNIL guidelines.

### Context

The site currently has no consent mechanism. Even without advertising trackers, Keycloak sets session cookies, and future analytics (US-034 — Google Analytics) will require explicit consent. CNIL requires a banner with Accept / Refuse options, and the ability to withdraw consent at any time.

### Acceptance Criteria

#### Consent banner
- [ ] On first visit (and if consent not yet given), a banner appears at the bottom of the screen
- [ ] Banner contains:
  - Short explanation: "We use cookies for authentication and, with your consent, for audience analytics."
  - **Accept** button (primary)
  - **Refuse** button (secondary)
  - Link to the full privacy policy page (can be a simple `/privacy` route initially)
- [ ] Banner is responsive (full-width on mobile, constrained width on desktop)
- [ ] Banner does not block the page content (positioned fixed at bottom, non-modal)

#### Consent persistence
- [ ] Consent choice (accept/refuse) is stored in `localStorage` under key `namorama_consent`
- [ ] If consent was already given, the banner does not show again on subsequent visits
- [ ] A "Manage cookies" link in the footer allows the user to change their choice at any time (resets stored consent and shows banner again)

#### Analytics gating (for US-034)
- [ ] Analytics scripts (Google Analytics or equivalent) are only loaded **after** the user has accepted
- [ ] If the user refuses, no analytics script is loaded (not just blocked — never injected)

#### Privacy policy page
- [ ] A minimal `/privacy` route exists with:
  - Data controller identity (NeoLegal)
  - List of cookies set (Keycloak session, optional analytics)
  - User rights (access, deletion, portability) and contact email
  - Available in FR and EN

### Technical Notes
- Store consent in `localStorage`, not a cookie (avoids the meta-irony of using a cookie for cookie consent)
- Angular service `ConsentService` with `hasConsented(): boolean`, `accept()`, `refuse()`, `reset()`
- Banner component shown conditionally in `AppComponent` based on `ConsentService.hasConsented() === null` (null = not yet chosen)
- No third-party CMP (Consent Management Platform) needed at this stage

### Out of Scope
- Granular consent per category (analytics vs. functional) — single accept/refuse is sufficient for CNIL at this traffic level
- IAB TCF framework
- Cookie audit / automatic cookie scanner

---

## US-041 · Admin Section — User Management & Activity Dashboard

**Status**: ✅ Implemented

**As an** administrator of Namorama,
**I want** a protected back-office section accessible only to users with the `admin` role in the Keycloak realm,
**So that** I can manage user credits manually and monitor the platform's activity at a glance.

### Context

No admin interface currently exists. Credit adjustments, user lookups, and activity monitoring require direct database access. This story adds a minimal but functional admin section within the web app, secured by Keycloak role.

### Acceptance Criteria

#### Access control
- [ ] A new route `/admin` is added to the Angular app
- [ ] Access is restricted to users who have the `admin` role in the Keycloak realm (`namorama`)
- [ ] If a non-admin user navigates to `/admin`, they are redirected to `/` with no error message shown
- [ ] The admin link is only visible in the user menu for admin users

#### User list
- [ ] Displays a paginated, searchable table of all registered users
- [ ] Columns: email, total credits (free + pack), last login date, account creation date, number of projects
- [ ] Search by email (partial match)
- [ ] For each user: a button to open a credit adjustment panel
  - Input field: new credit amount (or delta +/-)
  - Confirm button saves the change via `PATCH /admin/users/:id/credits`
  - Change is reflected immediately in the table

#### Activity dashboard
- [ ] Top-level KPI cards:
  - Total registered accounts
  - Active accounts in the last 7 / 30 days (configurable via a selector)
  - New accounts in the last 7 / 30 days
  - Total domain suggestions generated (all time)
  - Total projects created (all time)
- [ ] Per-project averages:
  - Average number of suggestions per project
  - Average number of favourites per project
  - Average number of extensions selected per project
- [ ] Credit consumption:
  - Total credits consumed (all time)
  - Average credits consumed per active user (last 30 days)

#### Backend
- [ ] New NestJS module `admin` with guard checking Keycloak role `admin`
- [ ] `GET /admin/users` — paginated user list with stats
- [ ] `PATCH /admin/users/:id/credits` — manual credit adjustment (logged with admin's sub + reason)
- [ ] `GET /admin/stats` — aggregated KPIs
- [ ] All admin endpoints require `admin` role; return 403 otherwise

### Technical Notes
- Keycloak role check: use `@Roles('admin')` decorator + `RoleGuard` from `nest-keycloak-connect`
- Frontend role check: `keycloak.isUserInRole('admin')` in Angular guard
- Credit adjustment audit: add a `CreditAdjustment` entity (userId, delta, reason, adminSub, createdAt) for traceability
- Dashboard stats can be computed with simple TypeORM aggregate queries (COUNT, AVG, SUM)
- Paginate user list with `?page=&limit=` query params

### Out of Scope
- Deleting user accounts (sensitive — requires GDPR process)
- Impersonating users
- Sending emails from the admin panel
- Role assignment from the admin panel (done in Keycloak console)

---

## US-042 · Trademark Availability Check

**Status**: ❌ To do

**As a** user searching for a brand name,
**I want** to know whether a name is already registered as a trademark,
**So that** I can avoid legal conflicts and choose a name that is truly ownable.

### Context

Finding an available domain name is only half the battle — a name that is free as a domain but registered as a trademark in the same category exposes the user to legal risk. Integrating a trademark check (INPI for France, EUIPO for Europe, USPTO for the US) gives Namorama a significant competitive advantage over pure domain-search tools.

### Acceptance Criteria

- [ ] For each domain result, an indicator shows whether the name has a known trademark conflict
- [ ] The check targets at least one database (INPI FR as default, EUIPO as stretch goal)
- [ ] The check is scoped by Nice classification if possible, or shows all results otherwise
- [ ] A "conflict" badge (e.g. 🔴) and a "clear" badge (e.g. 🟢) are displayed per name
- [ ] Clicking the badge opens the relevant official search page pre-filled with the name
- [ ] The check is done asynchronously (does not block domain results display)
- [ ] Results are cached per name to avoid redundant API calls

### Technical Notes

- **INPI** exposes a public search UI at `https://data.inpi.fr` and an open API (`https://api.inpi.fr/`) — check if unauthenticated access is available
- **EUIPO** offers `https://euipo.europa.eu/eSearch/` with a REST API — may require registration
- **USPTO** offers the TSDR API (`https://tsdrapi.uspto.gov/`) for US market
- Fallback: if no API is available, provide a direct link to the official search page pre-filled with the name (no badge, just a shortcut)
- The check should run after domain availability is confirmed, to avoid wasting quota on unavailable names

### Out of Scope

- Legal advice or interpretation of trademark classes
- Monitoring / trademark watch alerts
- Blocking users from using conflicting names (informational only)

---

## US-043 · Social Media Handle Availability Check

**Status**: ❌ To do

**As a** user searching for a brand name,
**I want** to see whether the corresponding handle is available on major social networks,
**So that** I can choose a name I can claim consistently across all my online presence.

### Context

A domain name is only one piece of a brand's online identity. Users need to secure the same (or similar) handle on Instagram, X (Twitter), TikTok, LinkedIn, and Facebook. Checking social availability alongside domain availability makes Namorama a complete brand-naming tool rather than a pure domain search.

### Acceptance Criteria

- [ ] For each domain result, icons for major social networks (Instagram, X, TikTok, LinkedIn, Facebook) are displayed in the results row
- [ ] Each icon is visually marked as available (🟢), taken (🔴), or unknown/unchecked (⚪)
- [ ] The check runs asynchronously after domain results appear — it does not block the main results
- [ ] Clicking an icon opens the relevant profile URL or signup page pre-filled with the name
- [ ] Results are cached per name within the session to avoid redundant requests
- [ ] The feature is clearly labelled as indicative (handles may be taken after the check)

### Technical Notes

- Social networks do not expose public availability APIs — the most practical approach is to attempt fetching `https://www.instagram.com/{name}`, `https://x.com/{name}`, etc. and interpret HTTP response codes (404 = likely available, 200 = taken)
- This must be done server-side (the API) to avoid CORS issues
- Rate limiting and caching are critical — one check per name per session maximum
- Some networks (LinkedIn, Facebook) use profile slugs that may not match handle conventions exactly; document known differences
- Alternative: link directly to a third-party tool such as Namecheckr or Instantdomainsearch for social checks, with no backend logic required

### Out of Scope

- Reserving or claiming handles on behalf of the user
- Checking username variations (exact match only)
- Paid / authenticated API integrations with social networks

---

## US-044 · Amélioration du prompt de génération de noms — Qualité & Pertinence (Option A)

**Status**: ✅ Done

**As a** user generating domain name ideas,
**I want** the AI to produce names that are more creative, diverse, and relevant to my project,
**So that** I spend less time rejecting poor suggestions and find a great name faster.

### Context

The current `generateDomainIdeas` prompt uses `gpt-3.5-turbo` with a loosely structured instruction set. In practice, it tends to produce clusters of similar-sounding names, ignores the semantic keywords provided, and occasionally outputs names that are hard to pronounce or unrelated to the project. This story targets the prompt and model configuration without changing the generation architecture.

### Acceptance Criteria

- [ ] The model is upgraded from `gpt-3.5-turbo` to `gpt-4o-mini` for `generateDomainIdeas`
- [ ] The prompt explicitly instructs the model to derive name components from the provided keywords (at least 50% of names must incorporate a keyword root, sound, or concept)
- [ ] The prompt enforces diversity via named sub-groups within the "standard" style: short invented names (≤6 chars), compound words (2 roots), metaphor/concept names, and sound-based names — with a minimum count per sub-group
- [ ] The prompt includes 3 positive examples and 2 negative examples ("too generic", "unpronounceable") to calibrate the model's output
- [ ] Temperature is reduced from 0.95 to 0.85 to balance creativity and coherence
- [ ] `max_tokens` is increased to 1200 to accommodate the richer output format
- [ ] The JSON example in the prompt is corrected to remove hyphens from "standard" names (current example is inconsistent with rules)
- [ ] A/B comparison: running the same description through old and new prompt produces measurably more varied and on-topic names (manual review by Nicolas)

### Technical Notes

- Change is limited to `domain.service.ts` → `generateDomainIdeas()`
- `gpt-4o-mini` is API-compatible with the existing OpenAI client call — no client changes needed
- `gpt-4o-mini` pricing is comparable to `gpt-3.5-turbo` at this token volume
- The sub-group diversity constraint is prompt-only (no post-processing code required)
- Existing `response_format: { type: 'json_object' }` is kept to ensure parseable output

### Out of Scope

- Changing the generation loop or retry logic (covered by US-045)
- Post-processing or scoring of generated names before Whois check
- UI changes

---

## US-045 · Amélioration de la stratégie de génération de noms — Multi-passes thématiques (Option B)

**Status**: ❌ To do

**As a** user generating domain name ideas,
**I want** the AI to explore different creative angles in separate passes,
**So that** the final list of available names covers a much broader creative spectrum and avoids repetitive clusters.

### Context

Even with an improved prompt (US-044), a single LLM call tends to converge on a stylistic cluster. This story introduces a multi-pass generation strategy: instead of asking for 30 names at once, the system runs several focused passes (e.g. "metaphor pass", "sound/phonetics pass", "acronym/blend pass"), each targeting a different creative technique. Results from all passes are merged and deduplicated before Whois checking. This approach also enables easier future extension by adding new passes.

### Acceptance Criteria

- [ ] `generateDomainIdeas` is refactored to run N thematic passes in parallel (default: 4 passes)
- [ ] Each pass has a distinct creative brief: (1) Metaphor & Concept, (2) Phonetics & Sound, (3) Portmanteau & Blend, (4) Abstract / Invented
- [ ] Each pass targets ~10 names, producing ~40 candidates total before deduplication
- [ ] Passes run concurrently (`Promise.all`) to keep latency comparable to current single-call approach
- [ ] Deduplication is applied after merging all pass results (exact name match)
- [ ] The per-style count balancing logic (`counts` object) is preserved and distributed across passes
- [ ] Total credits consumed per search remains unchanged (generation is free; only Whois checks cost credits)
- [ ] Existing exclusion list (`excludeNames`) is passed to every pass to avoid re-proposing already-checked names

### Technical Notes

- Each pass is a separate `openai.chat.completions.create` call with a focused system prompt
- Running 4 calls in parallel multiplies OpenAI API usage by ~4× — acceptable at current scale, revisit if costs spike
- Pass prompts should be short and focused (< 200 tokens each) to keep per-call cost low
- The `findAvailableDomains` loop and event emitter (`onEvent`) are unchanged
- This story depends on US-044 (upgraded model) being completed first, as `gpt-4o-mini` handles parallel focused prompts better than `gpt-3.5-turbo`

### Out of Scope

- Scoring or ranking candidates before Whois check
- User-facing controls to select which passes run
- Caching pass results across sessions

---

## US-046 · Thumb Up / Thumb Down — Replace Favourites with Explicit Rating

**Status**: ❌ To do

**As a** user reviewing domain name suggestions,
**I want to** explicitly rate each suggestion as liked (👍) or disliked (👎), with disliked names hidden by default,
**So that** I can keep my workspace clean while retaining the ability to recover dismissed names, and so the AI learns from my preferences when generating additional suggestions.

### Context
The current "favourite" (❤️) system is a binary on/off toggle that only captures positive signals. There is no way to mark names as actively unwanted. This means disliked names clutter the table alongside neutral ones. Replacing the single heart with a thumb-up / thumb-down pair provides richer feedback, drives a cleaner default view, and allows the AI prompt for subsequent generation runs to avoid repeated mistakes and build on what the user liked.

This story is **distinct from US-033 (Tinder Mode)**, which is a separate swipe-card view. The rating mechanism introduced here applies directly to the standard table view and is the source of truth for `liked` / `disliked` state used by both views.

### UX Behaviour

| Action | Visual | Effect |
|--------|--------|--------|
| Click 👍 on a neutral row | Thumb filled blue | Marks as `liked`; row sorted to top; AI analysis triggered (existing US-005 behaviour) |
| Click 👍 on an already-liked row | Reverts to neutral | Removes `liked` state |
| Click 👎 on a neutral row | Thumb filled red | Marks as `disliked`; row hidden from default view |
| Click 👎 on an already-disliked row | Reverts to neutral | Removes `disliked` state; row reappears |
| Click 👍 on a disliked row | Thumb up filled blue, 👎 cleared | Transitions directly from `disliked` to `liked` |
| Click 👎 on a liked row | Thumb down filled red, 👍 cleared | Transitions directly from `liked` to `disliked` |

### Filter Behaviour (Column Header Icon)

A small filter icon appears in the column header of the rating column:
- **Default state (active filter)**: shows only `liked` + `neutral` rows — `disliked` rows are hidden
- **Filter toggled off**: shows all rows including `disliked` rows (which appear with a muted/strikethrough style to distinguish them)
- The filter state is local to the session (not persisted with the project)
- A tooltip on the filter icon reads "Hidden names: N" when the filter is active and N > 0

### Acceptance Criteria

#### Frontend — Data Model

- [ ] Replace the `isFavorite: boolean` field on the local domain object with a `rating: 'liked' | 'disliked' | 'neutral'` field
- [ ] On load from API, map `isFavorite === true` → `rating: 'liked'`, `isFavorite === false` → `rating: 'neutral'` (backward compatibility)
- [ ] Replace the `favourites` computed signal with:
  - `likedDomains = computed(() => this.domains().filter(d => d.rating === 'liked'))`
  - `dislikedDomains = computed(() => this.domains().filter(d => d.rating === 'disliked'))`

#### Frontend — Table UI

- [ ] Replace the single heart icon (❤️ / 🤍) in each row with two icon buttons: **👍** and **👎** (PrimeIcon `pi-thumbs-up` / `pi-thumbs-down`)
- [ ] Active state styling:
  - `liked`: 👍 filled / coloured (blue `#3b82f6`), 👎 outline grey
  - `disliked`: 👎 filled / coloured (red `#ef4444`), 👍 outline grey
  - `neutral`: both icons outline grey
- [ ] Both buttons use the same optimistic-update pattern as the existing `toggleFavorite()` — instant local state change, API sync in background, rollback on error
- [ ] The column header for the rating column contains a filter toggle icon (`pi-filter` / `pi-filter-slash`)
  - Default: filter active → `disliked` rows hidden
  - Toggled: filter inactive → all rows visible; disliked rows rendered with `opacity: 0.45` and a light red row background
  - A `p-tooltip` on the icon shows "X name(s) hidden" when filter is active and X > 0
- [ ] Row sort order: `liked` first, then `neutral`, then `disliked` (only visible when filter is off)
- [ ] The "Aide-moi à choisir" menu items and `helpMePick()` function use `likedDomains` in place of `favourites` — behaviour unchanged

#### Frontend — i18n

- [ ] Add translation keys for the filter tooltip and any new ARIA labels in both `fr.json` and `en.json`

#### Backend — Entity Migration

- [ ] Add a `rating` varchar column to `DomainSuggestion` with values `'liked'` | `'disliked'` | `'neutral'`, default `'neutral'`
- [ ] Migration script: populate `rating = 'liked'` where `isFavorite = true`, `rating = 'neutral'` elsewhere
- [ ] Keep the `isFavorite` column for one release cycle for backward compatibility (computed from `rating` on read), then remove in a follow-up migration

#### Backend — API

- [ ] Replace `PATCH /projects/suggestions/:id/favorite` with `PATCH /projects/suggestions/:id/rating`
  - Body: `{ "rating": "liked" | "disliked" | "neutral" }`
  - Response: `{ "rating": "liked" | "disliked" | "neutral" }`
- [ ] `ProjectsService.setRating(id, rating, user)` replaces `toggleFavorite()` — sets the value directly (no toggle logic)
- [ ] The existing sort in `ProjectsService.findOne()` becomes: `liked` first, then `neutral`, then `disliked`
- [ ] AI analysis trigger (`analyzeNameWithAI`) is called when `rating` transitions **to** `'liked'` and no analysis exists (same as current `isFavorite = true` trigger)

#### Backend — AI Prompt Improvement

- [ ] `SearchDomainsDto` gains two optional fields:
  - `likedNames?: string[]` — names the user has rated 👍 in previous runs
  - `dislikedNames?: string[]` — names the user has rated 👎 in previous runs
- [ ] `DomainService.generateDomainIdeas()` includes these lists in the prompt when non-empty:

```
Previously liked names (use as positive style reference — generate names with similar feel):
${likedNames.join(', ')}

Previously disliked names (do NOT regenerate these, and avoid names that are phonetically or semantically similar):
${dislikedNames.join(', ')}
```

- [ ] The frontend passes `likedDomains().map(d => d.name)` and `dislikedDomains().map(d => d.name)` in the search request body when triggering a "More suggestions" run
- [ ] `likedNames` and `dislikedNames` are merged with the existing `excludeNames` list (US-015) on the backend to guarantee deduplication

### Technical Notes

- `pi-thumbs-up-fill` / `pi-thumbs-down-fill` are available in PrimeIcons — use filled variants for active state
- The filter toggle signal: `showDisliked = signal<boolean>(false)` in `WizardComponent`; the `filteredDomains` computed signal already used for table rendering gains an additional filter clause: `d.rating !== 'disliked' || this.showDisliked()`
- Inline styles required for the muted disliked row appearance (PrimeNG overrides Tailwind on `<tr>`)
- The old `PATCH /suggestions/:id/favorite` endpoint should return a 410 Gone or redirect for one release, then be removed

### Relationship to Other Stories

- **US-005**: AI analysis trigger preserved — fires on transition to `liked` (was `isFavorite = true`)
- **US-015**: `dislikedNames` merged into exclusion list for re-generation
- **US-018**: "Aide-moi à choisir" uses `likedDomains` (renamed from `favourites`)
- **US-033**: Tinder Mode's `dislikedNames` signal should write to the same `rating` field introduced here, ensuring the two views stay in sync

---

## US-047 · Référencement externe — présence dans les comparatifs de générateurs de noms

**Status**: ❌ To do

**As a** fondateur de Namorama,
**I want to** être listé dans les articles comparatifs qui captent déjà la requête « générateur de nom de marque »,
**So that** j'obtienne du trafic qualifié et des backlinks sans devoir surpasser ces articles en référencement.

### Contexte

Audit du 01/08/2026 : l'article de référence sur la requête en France ([Dropizi](https://www.dropizi.fr/blog/generateur-nom-marque)) fait environ 3 400 mots, liste 22 outils — et **ne mentionne pas Namorama**. Les pages du site font 315 à 643 mots : les surpasser frontalement demanderait un effort de contenu considérable. Se faire ajouter à ces listes coûte un e-mail.

L'angle à défendre est unique et vérifiable : **Namorama est le seul de ces outils à vérifier la disponibilité par une requête Whois réelle** au moment de la recherche, là où les autres estiment ou ne vérifient rien. Les recherches confirment aussi qu'aucun ne vérifie les marques déposées (cf. US-048).

### Acceptance Criteria
- [ ] Liste des articles cibles constituée (au minimum : Dropizi, Affumt, jenova.ai, generateurdenoms.com, chatgpt.fr) avec le contact de leur rédacteur
- [ ] Modèle d'e-mail rédigé : angle « seul générateur à vérifier au Whois réel », capture d'écran du tableau de disponibilité, offre de crédits gratuits pour test
- [ ] Prise de contact effectuée pour chaque cible, avec suivi des réponses
- [ ] Au moins 3 mentions obtenues, avec lien suivi (non `nofollow` si possible)
- [ ] Trafic de référence mesuré dans Search Console / analytics 4 semaines après publication

### Notes
- Priorité haute : meilleur rapport effort/impact identifié dans l'audit SEO.
- Les pages comparatives internes (`/namorama-vs-namelix`, `/namorama-vs-looka`, `/comparatif-generateurs-de-noms`) servent d'argumentaire prêt à l'emploi lors de la prise de contact.
- À relancer une fois par trimestre : ces listicles sont mis à jour régulièrement (« [2026] » dans les titres).

---

## US-048 · Vérification de disponibilité de marque (INPI) — fonctionnalité et page SEO

**Status**: 🔀 Absorbée par l'épic US-050→055 (Rapport de disponibilité de marque)

**As a** utilisateur qui a trouvé un nom dont le domaine est libre,
**I want to** savoir si ce nom est déjà déposé comme marque avant de m'engager,
**So that** je n'investisse pas dans une identité que je devrai abandonner pour raison juridique.

### Contexte

Un domaine libre ne garantit rien juridiquement : un nom peut être disponible en `.com` et déjà déposé à l'INPI dans la classe visée. C'est le principal angle mort du parcours actuel — l'app se contente d'un lien profond vers la recherche INPI (cf. US-042), sans vérification intégrée.

C'est aussi un différenciateur de marché : les recherches du 01/08/2026 confirment que **la quasi-totalité des générateurs de noms ne vérifient que le domaine, jamais la marque déposée**. Namorama vérifie déjà réellement le domaine ; étendre la promesse à la marque prolonge naturellement son positionnement « disponibilité réelle, pas estimée ».

### Acceptance Criteria
- [ ] Étude de faisabilité de l'API INPI (données ouvertes marques) : couverture, quotas, conditions d'utilisation, fraîcheur des données
- [ ] Si l'API le permet : recherche automatique du nom dans la base Marques, avec restitution du statut (aucun dépôt trouvé / dépôt existant, avec classes concernées)
- [ ] Résultat affiché dans le tableau de suggestions, distinct de la disponibilité de domaine, avec un niveau de confiance explicite
- [ ] Avertissement juridique clair : l'outil ne remplace pas une recherche d'antériorité ni l'avis d'un conseil en propriété industrielle
- [ ] Repli propre si l'API est indisponible : le lien profond INPI actuel reste affiché
- [ ] Page de contenu `/verifier-disponibilite-nom-marque` visant l'intention « vérifier si un nom de marque est disponible », reliée depuis la home et les guides
- [ ] Décision documentée sur le modèle : inclus dans les crédits ou fonctionnalité distincte

### Notes
- Dépend de US-042 (lien de vérification de marque), déjà en place.
- Attention au périmètre géographique : l'INPI ne couvre que la France. Pour une cible européenne, l'EUIPO est la base pertinente — à traiter comme une extension ultérieure, pas dans cette story.
- Risque produit : afficher « marque disponible » à tort engage la responsabilité perçue du service. Préférer une formulation prudente (« aucun dépôt identique trouvé dans la base INPI ») à une affirmation de disponibilité.
- **Absorbée** : la décision a été prise de ne pas livrer une simple vérif INPI isolée, mais un **rapport de disponibilité premium** groupant domaine + réseaux sociaux + marque (INPI **et** EUIPO), facturé en crédits et livré par email. Les acceptance criteria ci-dessus restent valides mais sont repris et étendus dans l'épic US-050→055.

---

## US-049 · Pages localisées indexables (hreflang) — décision et mise en œuvre

**Status**: ❌ To do

**As a** responsable du référencement de Namorama,
**I want to** que Google indexe une version par langue des pages de contenu,
**So that** le site capte des requêtes hors du marché français.

### Contexte

L'interface se traduit en 19 langues, mais **aucune page indexable n'est localisée** : les pages de contenu (landing, guides, générateurs) sont écrites en dur en français, précisément pour que le HTML prérendu contienne du texte exploitable par Google. Le sélecteur de langue ne traduit que la coque applicative (menu, wizard) et ne change pas d'URL.

Google indexe des **URL**, pas un état applicatif : un changement de langue côté client ne produit aucune page nouvelle. En l'état, Google ne peut voir que la version française, et c'est cohérent.

### Prérequis à toute annotation hreflang

Les trois conditions doivent être réunies **ensemble**, sinon ne rien publier :

1. une URL distincte par langue (préfixe `/en/…`, ou sous-domaine) ;
2. un contenu réellement traduit et prérendu à cette URL ;
3. des annotations `hreflang` réciproques entre toutes les versions, plus `x-default`.

⚠️ Publier des `hreflang` vers des pages non réellement traduites (ou traduites automatiquement) est **contre-productif** : Google déclasse les quasi-doublons et cela dilue les pages françaises qui fonctionnent aujourd'hui.

### Acceptance Criteria
- [ ] Décision documentée sur le périmètre : quelles langues, quelles pages (probablement l'anglais seul, sur 3 à 5 pages à forte intention, pas les 19 langues ni les 16 pages)
- [ ] Choix technique arbitré : build localisé Angular (`$localize` + `i18n`) contre composants dupliqués sous `/en/`, avec les coûts de maintenance associés
- [ ] Une URL distincte et prérendue par couple (page, langue)
- [ ] `applyContentSeo` étend le `<head>` avec les `<link rel="alternate" hreflang="…">` réciproques et le `x-default`
- [ ] `<html lang>` reflète la langue de la page prérendue (aujourd'hui toujours `fr`)
- [ ] `sitemap.xml` liste chaque version localisée
- [ ] Contenu rédigé ou relu par un humain — pas de traduction automatique publiée telle quelle
- [ ] Vérification post-déploiement dans la Search Console (rapport de ciblage international)

### Notes
- Le trafic actuel est français et l'effort de contenu prioritaire reste l'étoffement des pages existantes (cf. audit du 01/08/2026 : plusieurs pages encore sous 500 mots). Localiser avant d'avoir des pages solides revient à dupliquer un contenu faible.
- Alternative assumée et parfaitement valable : **ne pas localiser le contenu**, garder le site français pour Google, et traiter les 19 langues de l'interface comme un simple confort applicatif. C'est l'option recommandée tant que la traction française n'est pas installée.
- Ne pas confondre avec la locale de génération des noms (`effectiveLocale`), qui influence l'IA et n'a aucun rapport avec l'indexation.

---

# Épic · Rapport de disponibilité de marque (offre premium)

**Objectif** : transformer l'angle mort juridique/social du parcours en une offre premium monétisable. Aujourd'hui, la fin du wizard n'offre que des **liens profonds** vers l'INPI, X et Instagram (`wizard.ts:436-449`, `wizard.html:649-659`) — des liens qui ne rapportent rien et laissent l'utilisateur faire le travail à la main. On les remplace par un **Rapport de disponibilité de marque** : une vérification réelle et automatisée du nom sur trois plans — **domaine** (déjà en place, RDAP/WHOIS), **réseaux sociaux** (handles), et **marque déposée** (INPI + EUIPO) — synthétisée en un score, **affichée à l'écran et envoyée par email** (PDF).

**Positionnement marché** (étude du 05/08/2026) : le concurrent direct NameScore.io facture ce type de rapport 50 $/unité ; les checkers de pseudos (Namechk, KnowEm) sont gratuits ou en réservation ; la recherche d'antériorité juridique (LegalStart) va de 50 à 350 €. Le trou de marché est un **rapport automatisé, en français, entre le gratuit et le juridique**. Aucun générateur de noms francophone ne couvre les trois plans à la fois.

**Décisions cadrées** :
- **Modèle** : facturé en **crédits — 300 crédits par rapport** (≈ 9 € en valeur pack à 0,018 €/crédit ; évite le « quasi-gratuit » qu'auraient donné 20-30 crédits sur un quota mensuel de 100).
- **Périmètre marque** : **INPI (France) + EUIPO (Union européenne)**. Pas d'USPTO en phase 1.
- **Deux surfaces, un seul moteur** : upsell dans le wizard (**US-054**) + landing SEO publique avec checker bridé (**US-055**).
- **Livraison** : affichage immédiat **et** envoi par email (rétention + capture de lead), sous consentement RGPD explicite.
- **Garde-fou juridique** : signal **indicatif**, jamais présenté comme une recherche d'antériorité légale ; disclaimer + CTA « démarche officielle INPI / conseil en PI » systématiques. Tout doute reste `unknown`, jamais déguisé en « disponible » (cohérent avec la règle de disponibilité domaine).

**Ordre de réalisation** : US-050 (spike, bloquant) → US-051 (moteur) → US-052 (crédits) → US-053 (livraison email) → US-054 (surface wizard) → US-055 (landing SEO).

---

## US-050 · Spike — faisabilité des intégrations (INPI, EUIPO, handles sociaux)

**Status**: ✅ Fait (05/08/2026) — voir « Résultats du spike »

**As a** équipe produit qui veut vendre un rapport de disponibilité fiable,
**I want to** valider en amont l'accès et la fiabilité des trois sources de données,
**So that** on ne s'engage pas sur une promesse premium que les APIs ne peuvent pas tenir.

### Contexte

Tout le reste de l'épic dépend de trois inconnues techniques. Un rapport payant qui affiche « inconnu » partout ne vaut rien : ce spike dérisque avant tout développement de surface. Il est time-boxé (~0,5 j) et produit une **décision documentée**, pas du code de production.

### Acceptance Criteria
- [ ] **INPI** : mode d'accès à la base Marques arbitré (API de données ouvertes, quotas, conditions d'utilisation, fraîcheur), avec un exemple de requête « à l'identique » réussie et la structure de réponse (nom, classes de Nice, statut, titulaire)
- [ ] **EUIPO** : accès à l'API eSearch/TMview validé (authentification éventuelle, quotas), avec un exemple de recherche filtrée par classe et la structure de réponse
- [ ] **Handles sociaux** : fiabilité mesurée du check 200/404 sur URL de profil pour Instagram, TikTok, X, YouTube, LinkedIn, GitHub — dont le **seuil de challenge/anti-bot par IP** (les recherches indiquent ~25-30 req/IP sur Instagram/TikTok) et la décision proxy/actor Apify vs statut `unknown` honnête
- [ ] Estimation du **coût marginal** d'un rapport (appels API + éventuels proxies/actors) pour confirmer que 300 crédits couvrent la marge
- [ ] Décision documentée dans ce backlog : plateformes retenues en phase 1, sources marque retenues, stratégie de repli par source

### Notes
- Bloquant pour US-051→055. Ne rien coder en surface avant sa clôture.
- Si une source s'avère inexploitable (ex. EUIPO derrière une authentification lourde), la story consommatrice bascule sur un repli lien profond documenté, sans bloquer l'épic.

### Résultats du spike (05/08/2026)

**1. Handles sociaux — l'hypothèse « 200 = pris / 404 = libre » est FAUSSE en général.** La plupart des grands réseaux sont des SPA qui renvoient **200 même pour un pseudo inexistant** (le « introuvable » est rendu en JS). Mesuré depuis ce poste (une requête par pseudo, existant vs inexistant fabriqué) :

| Plateforme | Existant | Inexistant | Verdict |
|---|---|---|---|
| GitHub | 200 | 404 | ✅ Fiable en direct (status) |
| LinkedIn (`/company/`) | 200 | 404 | ✅ Fiable en direct (status) |
| Telegram (`t.me`) | 200 | 302 | ✅ Fiable en direct (status, sans `-L`) |
| TikTok | `"statusCode":0` + `userInfo` | `"statusCode":10221`, pas de `userInfo` | ✅ Fiable via **marqueur dans le corps** |
| Pinterest | 301 | 200 | 🟡 Distinguable mais inversé — à valider (suivi de redirection) |
| Reddit | 301 | 301 | 🟡 Indistinct en status — parsing après redirection |
| Twitch | 200 | 200 | 🟡 SPA — nécessite l'API GraphQL ou le contenu |
| YouTube (`/@`) | 302 | 302 | 🟡 Redirection consent — parsing après suivi |
| Instagram | 200 (shell login) | 200 (shell login) | 🔴 Aucun marqueur exploitable sans session |
| X / Twitter | 200 | 200 | 🔴 Nécessite authentification |
| Facebook | 400 | 400 | 🔴 Bloque les requêtes non navigateur |

→ **Conséquence de conception** : pas de vérificateur social uniforme. Il faut une **stratégie par plateforme** (status, marqueur de contenu, ou repli `unknown`). Découpage retenu :
- **Phase 1 (fiable, gratuit, sans proxy)** : GitHub, LinkedIn, Telegram, TikTok.
- **Phase 1.5 (parsing/redirection, à valider)** : Pinterest, Reddit, Twitch, YouTube.
- **Phase 2 (session ou API tierce type Apify)** : Instagram, X, Facebook — sinon afficher `unknown` honnête plutôt qu'un faux « libre ».
- Anti-bot : à l'unité tout passe ; à l'échelle, Instagram/TikTok challengent ~25-30 req/IP → prévoir proxies/actor **seulement si le volume l'exige**, sans jamais déguiser un blocage en « disponible ».

**2. INPI** — API PI « diffusion » sur `api-gateway.inpi.fr/services/apidiffusion` : **401 sans authentification** (confirmé). Nécessite un **compte INPI** avec « Accès API PI » activé sur `data.inpi.fr/login` ; auth par cookie/XSRF (plus lourde en server-to-server). Données marques rafraîchies **hebdomadairement**. Gratuit (Licence Ouverte). **Découverte clé** : cette API couvre déjà **FR (INPI) + EU (EUIPO) + WO (WIPO)** — une seule intégration pourrait donc couvrir tout le périmètre marque demandé.

**3. EUIPO** — API propre sur `dev.euipo.europa.eu` : **401 sans token** (confirmé). OAuth2 `client_credentials`, **1 000 requêtes/mois gratuites**, sandbox activée immédiatement, mais **la prod exige l'envoi de pièces d'identité**. Techniquement plus propre que l'INPI, mais quota faible et friction de mise en prod.

**Arbitrage marque retenu** : partir sur **l'API INPI diffusion seule en phase 1** (une intégration couvre FR+EU+WO, cohérent avec le périmètre INPI+EUIPO choisi), et garder **l'API EUIPO propre comme repli/complément** si la fraîcheur hebdo ou l'auth cookie de l'INPI posent problème. Repli ultime commun : le lien profond `data.inpi.fr` déjà en place.

**⚠️ Action requise (hors de ma portée — création de comptes)** : avant US-051, l'équipe doit créer les accès développeur :
- **INPI** : `data.inpi.fr/login` → activer « Accès API PI » (obligatoire).
- **EUIPO** (si repli retenu) : `dev.euipo.europa.eu` → créer une app + souscrire à « Trademark Search API ».
Les secrets iront dans la config API (cf. `api/.env.example`), jamais journalisés.

### Recette d'intégration INPI Marques (rétro-conçue le 05/08/2026)

Passerelle `https://api-gateway.inpi.fr`, service `/services/apidiffusion` (JHipster + CSRF double-submit). Flux validé de bout en bout (script `scripts/inpi-marques-test.sh`) :

1. **Cookie XSRF** : `GET /services/uaa/api/authenticate` avec un cookie-jar → pose `XSRF-TOKEN`.
2. **Login** : `POST /auth/login`, corps `{"username","password"}`, en-tête `X-XSRF-TOKEN` = valeur du cookie → **HTTP 200**, session dans le jar. Le compte est le compte INPI principal (l'« Accès API PI » y a été activé), pas un compte technique distinct.
3. **Recherche** : `POST /services/apidiffusion/api/marques/search`, `Content-Type: application/json`, en-tête `X-XSRF-TOKEN` **relu à chaque appel** (le token tourne à chaque requête — sinon 403 `Invalid CSRF Token`). Corps = objet **`TrademarkQuery`**.

`TrademarkQuery` (spec `/services/apidiffusion/v2/api-docs`) : `query` (string, **DSL par champ** ex. `"[Mark=Jouve]"` — pas du texte libre), `collections` (array), `fields`, `size`, `position`, `sortList`, `facetsList`, `withFacets`, `withCTMRevendication`.

**Collections réelles** (via `GET /api/marques/metadata`) : `FMARK` (FR national), `CTMARK` (EUIPO/UE), `TMINT` (WOInternational) → **une seule requête couvre FR + EU + WO**, exactement le périmètre INPI+EUIPO visé. Autres endpoints utiles : `/api/marques/notice/{numNat}`, `/image/…`, `/xml/…`, `/bopi/…`. Quota observé ~**100 requêtes/période** (en-têtes `X-Rate-Limit-Remaining`, `X-Size-Limit-Remaining`).

**✅ Blocage résolu (05/08/2026) — ce n'était PAS un problème côté INPI.** La 500 « 500: [no body] » venait de **notre corps de requête** : le champ de recherche est **`Mark_Exp`**, pas `Mark`. L'exemple `[Mark=Jouve]` de la spec INPI est **trompeur** — `Mark` est un champ *retournable* mais non *cherchable*, d'où une 500 Solr en amont. Deux corrections :
- **query** : `[Mark_Exp=<terme>]` (et non `[Mark=…]`) ;
- **collections en entrée** : codes courts **`FR`/`EU`/`WO`** (l'API les mappe en interne vers `FMARK`/`CTMARK`/`TMINT`).

Avec ça, `POST /api/marques/search` répond **HTTP 200** (ex. `qonto` → `count:9`, dépôts FR/EU/WO avec `ApplicationNumber`, `Mark`, `MarkCurrentStatusCode`). L'auth cookie-jar minimale suffit (pas besoin de `x-forwarded-for` ni de token explicite). Contrat réponse : `results[].fields` = liste `{name,value}` ; `ukey` porte le préfixe de collection. Les **classes de Nice** ne sont pas dans la recherche — elles nécessitent la notice (`/notice/{numNat}`), à traiter en itération ultérieure. Recette rejouable : `inpi_test.sh` (fourni par l'utilisateur) et `scripts/inpi-marques-test.sh`.

---

## US-051 · Moteur backend « Rapport de marque »

**Status**: 🚧 En cours — moteur + social + marque INPI livrés et testés en réel (05/08/2026)

**Livré** : module `api/src/brand-report/` (service orchestrateur, DTO `BrandReport`, score de synthèse où `unknown` n'améliore jamais le score, controller `/brand-report` + `/brand-report/preview`). `SocialCheckService` avec adaptateurs par plateforme, Phase 1 fiable et testée en réel (GitHub, LinkedIn, Telegram, TikTok) ; Instagram/X/YouTube/Facebook en `planned` → `unknown`. **`TrademarkService` : vraie recherche INPI opérationnelle** (auth XSRF cookie-jar + `[Mark_Exp=…]` sur collections FR/EU/WO), testée en réel (`Qonto` → match `exact`, 9 dépôts ; nom inventé → `none`) ; repli `unknown` + lien profond si INPI absent/erreur. Enrichissement des **classes de Nice** via la notice ST66 (`<ClassNumber>`), borné à 5 dépôts pertinents pour ménager le quota (ex. `Qonto` → classes 36 & 42). Config via `INPI_USERNAME`/`INPI_PASSWORD` (`.env.example`). Tests unitaires (adaptateurs sociaux + parsing/classification marque, 16/16). **Reste** : débit crédits (US-052), PDF+email (US-053).

**As a** utilisateur qui a trouvé un nom,
**I want to** obtenir en une fois l'état de disponibilité du nom sur le domaine, les réseaux sociaux et les registres de marques,
**So that** je décide en connaissance de cause avant d'investir dans une identité.

### Contexte

Cœur de l'épic : un module `api/src/brand-report/` qui orchestre en parallèle les trois vérifications et renvoie un objet unifié. Il **réutilise le `RdapService` existant** pour le domaine et ajoute deux briques (social, marque). La vérification sociale et la vérification marque sont chacune dans leur service pour rester testables et remplaçables indépendamment.

### Acceptance Criteria
- [ ] Module `brand-report` avec un `BrandReportService` qui compose : domaines (RDAP/WHOIS réutilisés) + handles sociaux + marque, en parallèle
- [ ] `SocialCheckService` avec **une stratégie par plateforme** (cf. résultats US-050, le 200/404 uniforme ne marche pas) : status pour GitHub/LinkedIn/Telegram, marqueur de contenu pour TikTok. Chaque plateforme a un adaptateur isolé et testable ; l'ajout d'une plateforme n'en casse pas une autre
- [ ] Phase 1 sociale limitée aux 4 plateformes fiables (GitHub, LinkedIn, Telegram, TikTok) ; les autres (Instagram, X, Facebook, Pinterest, Reddit, Twitch, YouTube) renvoient explicitement `unknown` tant que leur adaptateur n'est pas livré — jamais un faux « libre »
- [ ] `TrademarkService` fondé sur l'**API INPI diffusion** (couvre FR + EU + WO — cf. US-050), pré-check à l'identique + racine, restituant les dépôts trouvés avec leurs classes de Nice et statut ; repli lien profond `data.inpi.fr` si l'API échoue
- [ ] Trois états stricts par item — `free` / `taken` / `unknown` — un échec de source ne se déguise jamais en « libre » (règle de disponibilité domaine étendue au social et à la marque)
- [ ] Un **score de synthèse 0-100** documenté (pondération domaine / social / marque explicitée dans le code ; les items `unknown` n'améliorent jamais le score)
- [ ] DTO `BrandReport` stable (contrat consommé par le PDF, l'affichage et l'email)
- [ ] Endpoint interne testé unitairement avec sources mockées (chaque source en panne → `unknown`, pas d'échec de la requête globale)

### Notes
- Dépend de US-050 (fait) **et de la création des comptes API INPI/EUIPO** (action équipe signalée en US-050).
- Best-effort par source : aucune source défaillante ne doit faire échouer le rapport entier.
- Ne pas journaliser de PII : ni email, ni description de projet (cf. règles d'observabilité).
- L'API EUIPO propre reste un repli/complément (US-050) si la fraîcheur hebdo ou l'auth cookie de l'INPI posent problème — pas une intégration séparée par défaut.
- Les adaptateurs Phase 1.5/2 (Instagram, X, etc.) feront l'objet de sous-tâches ou d'une story de suivi dédiée, hors du périmètre livrable de US-051.

---

## US-052 · Débit crédits (300) et déclenchement du rapport

**Status**: ✅ Fait (05/08/2026)

**Livré** : `POST /brand-report` (authentifié) débite **`BRAND_REPORT_COST = 300`** crédits (constante centralisée). Génération AVANT débit → un échec ne consomme rien ; débit atomique via `dataSource.transaction` + `decrementCredits` (renvoie `-1` si insuffisant → rollback, sûr face à la concurrence). Crédits insuffisants → `ForbiddenException('Crédits insuffisants')` (même convention que la recherche de domaines, gérée par le front), sans génération. Réponse enrichie de `remainingCredits`. Événements `brand_report_blocked_no_credits` / `brand_report_generated` (sans PII au-delà du `sub`). Tests unitaires du controller : blocage, débit après génération, course au débit (19/19).

**As a** exploitant du service,
**I want to** que chaque rapport complet coûte 300 crédits, débités atomiquement,
**So that** l'offre premium est monétisée sans faille de double génération gratuite.

### Contexte

Réutilise le système de crédits et Stripe existants (`users.service.ts`, `payments.service.ts`). Un rapport complet vaut nettement plus qu'une suggestion de domaine (1 crédit) : on le tarife à **300 crédits**, aligné sur ~9 € de valeur pack.

### Acceptance Criteria
- [ ] Endpoint `POST /brand-report` protégé (auth) débite **300 crédits** (free puis extra), de façon atomique, avant de lancer la génération
- [ ] Crédits insuffisants → réponse claire (`402`/message dédié) proposant l'achat d'un pack, sans générer de rapport
- [ ] Le débit n'est **pas** consommé si la génération échoue avant tout résultat exploitable (remboursement ou non-débit — comportement documenté)
- [ ] Constante de coût centralisée (`BRAND_REPORT_COST = 300`), pas de nombre magique dispersé
- [ ] Événement `brand_report_generated` journalisé (sans PII) pour le suivi du tunnel et de la marge
- [ ] Test : un même nom généré deux fois débite deux fois (pas de cache silencieux qui offrirait le second)

### Notes
- Dépend de US-051.
- Décision assumée : pas de crédit-rapport distinct du crédit-suggestion en phase 1 — un seul compteur, un coût élevé. À réévaluer si l'usage montre que le quota mensuel gratuit (100) finance trop de rapports (il n'en finance aucun à 300).

---

## US-053 · Livraison du rapport — affichage + envoi par email (PDF)

**Status**: 🚧 Backend fait (05/08/2026) — livraison email OK ; vrai PDF reporté

**Livré** : `report-renderer.ts` rend le `BrandReport` en **document HTML autonome** (score, domaines, réseaux, marque + classes, disclaimer, CTA INPI, échappement anti-injection). `ReportMailService` l'envoie via `MailService.send()` (méthode générique best-effort ajoutée), en corps d'email **et** en pièce jointe imprimable. Le controller l'appelle après débit, best-effort (`emailed` dans la réponse ; un échec email ne casse pas la requête ni ne rembourse en silence). RGPD : adresse = compte de l'utilisateur (livraison, pas prospection) ; consentement de capture sur landing → US-055. Tests renderer + email (22/22).

**Décision — pas de vrai PDF pour l'instant** : `npm install pdfkit` échoue sur un conflit de peer-deps, et forcer le lockfile en autonomie est risqué pour le build/CI. Le livrable est un HTML autonome imprimable en PDF (« Imprimer → Enregistrer en PDF »). Vrai PDF (pdfkit avec `--legacy-peer-deps` validé, ou service de rendu) = amélioration ultérieure, contrat renderer inchangé.

**Reste** : état UI « génération/envoi en cours » (relève des surfaces US-054/055).

**As a** utilisateur qui a payé un rapport,
**I want to** le voir immédiatement à l'écran et le recevoir par email en PDF,
**So that** je peux l'archiver, le partager avec un associé ou un avocat, et y revenir.

### Contexte

Le livrable premium n'est pas qu'un panneau à l'écran : l'email en fait un actif (rétention, partage) et, sur la landing publique, un **lead magnet**. Nécessite une brique d'envoi d'email (à choisir/valider) et une génération PDF côté serveur à partir du `BrandReport`.

### Acceptance Criteria
- [ ] Rapport affiché immédiatement à l'écran après génération (domaines, réseaux, marque, score, disclaimer)
- [ ] Génération d'un **PDF** lisible à partir du DTO `BrandReport`, avec le disclaimer juridique et un CTA « démarche officielle INPI / conseil en PI »
- [ ] Envoi du PDF par email à l'adresse de l'utilisateur (ou à l'email saisi sur la landing)
- [ ] **Consentement RGPD explicite** avant toute capture/utilisation de l'email à des fins de relance ; la simple livraison du rapport demandé est distinguée de l'opt-in marketing
- [ ] État UI « rapport en cours de génération / d'envoi » explicite (la génération prend quelques secondes)
- [ ] L'envoi email est best-effort : un échec d'email n'annule pas l'affichage ni ne redonne les crédits sans trace (comportement documenté + réessai ou message)
- [ ] Aucune donnée personnelle au-delà du nécessaire journalisée ; l'email n'apparaît jamais en clair dans les logs

### Notes
- Dépend de US-051. Peut avancer en parallèle de US-052.
- Choix de l'infra email (fournisseur, délivrabilité, SPF/DKIM) à trancher — le noter comme sous-tâche du spike si non couvert par US-050.

---

## US-054 · Surface A — Upsell « Rapport complet » dans le wizard

**Status**: ❌ To do

**As a** utilisateur en fin de wizard qui vient de trouver un nom,
**I want to** lancer un rapport complet d'un clic au lieu de suivre des liens externes,
**So that** j'obtiens la réponse sans quitter le site ni faire le travail à la main.

### Contexte

On remplace le bloc « Vérifier aussi » (liens INPI/X/Instagram, `wizard.html:649-659`) — qui ne rapporte rien et externalise l'effort — par un **CTA « Rapport complet »** qui déclenche US-052/053. C'est la monétisation de l'intention au pic du parcours.

### Acceptance Criteria
- [ ] Les liens profonds registrar/social/INPI actuels sont **retirés** du bloc de fin de wizard et remplacés par un CTA « Rapport complet (300 crédits) »
- [ ] Le CTA affiche clairement le coût (300 crédits) et ce que le rapport contient avant l'achat
- [ ] Au clic : débit (US-052) → génération (US-051) → affichage + email (US-053)
- [ ] Crédits insuffisants → invite à l'achat de pack (dialogue Stripe existant), sans perte de contexte (nom conservé)
- [ ] Le disclaimer juridique est visible sur le résultat affiché
- [ ] Suivi analytique : impression du CTA, clic, conversion (sans PII)

### Notes
- Dépend de US-051, US-052, US-053.
- Le lien profond INPI n'est pas perdu pour autant : il réapparaît dans le rapport comme CTA « démarche officielle », là où il a du sens.

---

## US-055 · Surface B — Landing SEO + checker public bridé

**Status**: ❌ To do

**As a** internaute qui cherche « vérifier la disponibilité d'un nom de marque »,
**I want to** tester gratuitement un nom sur une page dédiée puis obtenir le rapport complet,
**So that** je découvre l'outil par un besoin précis, hors du parcours de génération.

### Contexte

Angle d'acquisition : les requêtes « vérifier disponibilité nom de marque », « nom de marque déjà pris », « antériorité marque » sont à forte intention, en français, mal couvertes par les acteurs US. Une landing prérendue (comme les pages SEO existantes) avec un **checker public bridé** capte ce trafic et le convertit vers le rapport payant. Reprend et étend la page `/verifier-disponibilite-nom-marque` prévue en US-048.

### Acceptance Criteria
- [ ] Nouveau composant de contenu `content/verifier-disponibilite-nom-de-marque`, **prérendu** et ajouté au `sitemap.xml`, avec `<head>` SEO (titre/description/canonical) via `applyContentSeo`
- [ ] **Checker public gratuit bridé** : vérifie un aperçu (domaine principal + 3 réseaux) sans authentification, pour démontrer la valeur
- [ ] CTA vers le **rapport complet** (domaine + ~12 réseaux + INPI + EUIPO) déclenchant le parcours crédits/email (US-052/053), avec capture d'email + consentement RGPD sur la landing publique
- [ ] Maillage interne : liens depuis la home, les guides marque (`guide-nom-de-marque`) et les comparatifs
- [ ] Contenu rédactionnel > 500 mots, cohérent avec la ligne éditoriale des pages existantes (pas de contenu mince)
- [ ] Le checker public respecte les mêmes garde-fous (`unknown` honnête, disclaimer juridique)

### Notes
- Dépend de US-051 (moteur) ; le rapport complet dépend en plus de US-052/053.
- Anti-abus : le checker public bridé doit être limité (débit/quota par IP) pour ne pas devenir un service gratuit exploité en masse.
- Décision C (site autonome dédié) explicitement **hors périmètre** : à réévaluer seulement si cette verticale décolle.
