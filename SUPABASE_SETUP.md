# Store dashboard: Supabase setup

The store's data (products, prints, orders, events, RSVPs, discount codes, marketing records) lives in Supabase, and the owner manages it at **`/admin`**. Sanity is no longer used by the site.

Until the keys below are added, the shop still loads (with no products) and `/admin` shows an "Almost ready" screen.

## 1. Create the project

1. Create a project at [supabase.com](https://supabase.com). Pick a region close to Nigeria (e.g. `eu-west`).
2. **SQL Editor → New query**: paste the whole of [`supabase/schema.sql`](supabase/schema.sql) and press **Run**. It creates every table, the `media` storage bucket and the security rules. It is safe to run again later.
3. **Authentication → Sign In / Providers → Email**: turn **off** "Allow new users to sign up". Dashboard accounts are created by an owner, never by self-signup.
4. **Authentication → URL Configuration**: set **Site URL** to `https://www.dahriola.com` and add these **Redirect URLs** (needed for "Forgot your password?"):
   - `https://www.dahriola.com/admin/auth/callback`
   - `https://dahriola.com/admin/auth/callback`
   - `http://localhost:3000/admin/auth/callback`

## 2. Add the keys

From **Project Settings → API**, add these to `.env.local` and to Vercel (**Settings → Environment Variables**, all environments), then redeploy:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL, e.g. `https://abcdefgh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The publishable key (`sb_publishable_…`). On older projects this is the `anon` key; the name `NEXT_PUBLIC_SUPABASE_ANON_KEY` also works. |
| `SUPABASE_SECRET_KEY` | The secret key (`sb_secret_…`). On older projects this is the `service_role` key; the name `SUPABASE_SERVICE_ROLE_KEY` also works. **Server only. Never give it a `NEXT_PUBLIC_` name.** |

Optional:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORMS` | Set to `on` only on a paid Supabase plan, to have Supabase resize images on the fly. Not needed: the dashboard already shrinks photos before uploading. |

## 3. Bring the existing content over from Sanity

With both the Sanity keys (already in `.env.local`) and the new Supabase keys in place:

```bash
npm run import:sanity -- --dry-run   # counts what would be copied, changes nothing
npm run import:sanity                # copies everything, including images
```

- Sanity IDs are kept, so customers' saved carts, wishlists, shared gift lists, tracking links and unsubscribe links keep working.
- Images and video clips are copied into the `media` bucket. Add `--keep-sanity-images` to leave them on Sanity's CDN for now (the site handles both).
- Formatted text (descriptions, care notes, event write-ups) is converted to the simple format the dashboard uses: paragraphs, bullet points, headings, **bold** and links.
- It can be run again at any time; rows are matched by ID and overwritten. Nothing in Sanity is changed.
- Read the "things to check" list it prints at the end (e.g. a review whose product was deleted).

Do the import shortly before switching the live site over, so no orders are missed. Any order placed on the old site after the import can be picked up by running the import once more.

## 4. Create the owner's login

```bash
npm run admin:create -- owner@example.com "a-long-password" "Her Name" owner
```

She can then sign in at `/admin`, change her password under **Settings**, and add staff there herself. Running the command again for the same email resets that password.

## 5. Tidy up the old setup

- In Sanity → API → Webhooks, delete the **order-status** webhook. The site no longer has that endpoint: status emails are now sent as soon as an order is saved in the dashboard (the daily job is still the safety net).
- Once you are happy, these can be removed from Vercel and `.env.local`: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_WRITE_TOKEN`, `SANITY_API_READ_TOKEN`, `SANITY_WEBHOOK_SECRET`. Keep them until the import has been run for the last time.
- Keep the Sanity project itself for a few weeks as a backup before deleting it. If you used `--keep-sanity-images`, do not delete it at all until the images have been copied.

Signed links (order tracking, unsubscribe, gift lists, shipping quotes) are signed with `CHECKOUT_SIGNING_SECRET`, or `PAYSTACK_SECRET_KEY` when that isn't set. Neither changes in this move, so existing links stay valid.

## What the owner can do at `/admin`

| Section | What it's for |
| --- | --- |
| **Home** | Sales for the last 7 and 30 days, orders that need attention, low stock, reviews waiting |
| **Orders** | Search and filter orders; change the status (emails the customer and updates their tracking page), add courier and tracking details, fix a customer's details, keep a private note, confirm a payment Paystack couldn't verify, download a spreadsheet |
| **Customers** | Everyone who has ordered, what they've spent, who agreed to marketing emails; download a spreadsheet |
| **Products** | Add and edit products: photos (upload several, reorder), price, description, category, prints; hide a product without deleting it |
| **Prints & stock** | Each print's photo and stock, with quick +/- buttons; low-stock filter |
| **Categories** | Category names plus the "Composition & care" and "Size & fit" notes shown on each product |
| **Discount codes** | Create, pause and delete codes; see how often each was used; personal codes the site created automatically |
| **Reviews** | Approve, hide or delete customer reviews |
| **Events & RSVPs** | Create events, upload a flyer, manage the pop-up, gallery, videos and recap; see, search, check in and download RSVPs |
| **Gift lists** | Shared wishlists and carts; switch a link off |
| **Emails & marketing** | Turn each automatic email on or off and set discounts; see abandoned checkouts, back-in-stock requests, emails sent and unsubscribes |
| **Settings** | Team members (owners only) and password |

## How it is secured

- Every table has Row Level Security on with **no** policies, and table access is revoked from the public (`anon`) key. The browser can read nothing directly.
- The site reads and writes through the server only, using the secret key.
- A Supabase login alone does not open the dashboard: the email must also be in the `admin_users` table. Every dashboard page and every dashboard action checks this on the server.
- Uploads go straight from the browser to storage using a one-time link that only a signed-in admin can request.

## Developer notes

- Data access: `src/lib/supabase/admin.ts` (service client), `src/lib/catalog.ts` (products), `src/lib/eventsData.ts` (events). Dashboard code is under `src/app/admin`, `src/components/admin` and `src/lib/admin`.
- Supabase returns at most 1,000 rows per request. Use `fetchAll()` from `src/lib/supabase/admin.ts` for anything that can grow past that.
- Match emails and order numbers with `.eq()` on the generated `*_lc` columns (see `lc()`), never `.ilike()`: PostgREST treats `*`, `%` and `_` in a visitor's input as wildcards.
- A dashboard page must call `requireAdmin()` itself. The layout's check is not enough, because Next.js renders layouts and pages in parallel.
- `/category/rtw` now lists ready-to-wear products. It previously filtered on a product type (`rtw`) that no product has, so it was always empty.
