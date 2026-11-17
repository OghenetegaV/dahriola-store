// One-off / re-runnable Brevo setup for DAHRIOLA.
//   npx tsx scripts/brevo-setup.ts
// Creates (or updates, matched by name) the branded email templates used by
// Brevo journeys and campaigns, refreshes contact attributes, and creates the
// pop-up announcement as a DRAFT campaign. Nothing is ever sent by this script.
import fs from "fs";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const i = line.indexOf("=");
  if (i < 0 || line.trim().startsWith("#")) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim().replace(/^"|"$/g, "");
  if (k === "GOOGLE_PRIVATE_KEY") v = v.split(String.fromCharCode(92) + "n").join("\n");
  process.env[k] ??= v;
}

const API = "https://api.brevo.com/v3";
const SITE = "https://www.dahriola.com";
const KEY = process.env.BREVO_API_KEY || "";
const SENDER = { email: process.env.BREVO_SENDER_EMAIL || "", name: "DAHRIOLA" };
const REPLY_TO = process.env.BREVO_REPLY_TO || SENDER.email;

async function brevo(method: string, path: string, body?: unknown) {
  const res = await fetch(API + path, {
    method,
    headers: { "api-key": KEY, "content-type": "application/json", accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

// ---------------------------------------------------------------------------
// Brand email layout (matches the website: stone, black, beryl, serif)
type Product = { name: string; slug: string; image: string; priceNGN?: number };

const link = (path: string, campaign: string) => {
  const url = new URL(path.startsWith("http") ? path : SITE + path);
  url.searchParams.set("utm_source", "brevo");
  url.searchParams.set("utm_medium", "email");
  url.searchParams.set("utm_campaign", campaign);
  // Brevo fills this in per contact, so clicks feed the personalised emails
  return `${url.toString()}&did={{ contact.VISITOR_ID }}`;
};

const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:28px auto 8px;"><tr><td style="background:#111;border-radius:999px;">
     <a href="${href}" style="display:inline-block;padding:14px 30px;color:#fff;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:bold;letter-spacing:2.5px;text-transform:uppercase;">${label}</a>
   </td></tr></table>`;

const productGrid = (products: Product[], campaign: string, heading?: string) => {
  const list = products.slice(0, 4);
  if (!list.length) return "";
  return `${heading ? `<p style="margin:34px 0 12px;text-align:center;font-family:Helvetica,Arial,sans-serif;font-size:10px;font-weight:bold;letter-spacing:3px;color:#778472;">${heading}</p>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    ${list
      .map(
        (p) => `<td width="${Math.floor(100 / list.length)}%" style="padding:5px;vertical-align:top;text-align:center;">
          <a href="${link(`/product/${p.slug}`, campaign)}" style="text-decoration:none;color:#1a1a1a;">
            <img src="${p.image}?w=300&h=375&fit=crop&auto=format" width="125" alt="${p.name}" style="display:block;width:100%;height:auto;border:0;border-radius:10px;">
            <span style="display:block;margin-top:8px;font-family:Helvetica,Arial,sans-serif;font-size:12px;">${p.name}</span>
          </a></td>`
      )
      .join("")}
    </tr></table>`;
};

function brandEmail(o: { preheader: string; title: string; eyebrow?: string; image?: string; body: string }) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${o.title}</title></head>
<body style="margin:0;padding:0;background:#F7F6F5;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${o.preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F6F5;padding:28px 12px;"><tr><td align="center">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
    <tr><td style="padding:6px 0 22px;text-align:center;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:6px;color:#111;">
      <a href="${link("/", "header")}" style="color:#111;text-decoration:none;">DAHRIOLA</a></td></tr>
    <tr><td style="background:#fff;border:1px solid #ECE9E4;border-radius:24px;overflow:hidden;">
      ${o.image ? `<img src="${o.image}" width="560" alt="" style="display:block;width:100%;height:auto;border:0;">` : ""}
      <div style="padding:36px 36px 34px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#3d3a36;">
        ${o.eyebrow ? `<p style="margin:0 0 14px;text-align:center;font-size:10px;font-weight:bold;letter-spacing:3.5px;color:#778472;">${o.eyebrow}</p>` : ""}
        <h1 style="margin:0 0 22px;text-align:center;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:30px;line-height:1.15;letter-spacing:-0.5px;color:#111;">${o.title}</h1>
        ${o.body}
      </div>
    </td></tr>
    <tr><td style="padding:26px 10px 0;text-align:center;font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.7;color:#9a958d;">
      DAHRIOLA · Contemporary African fashion, made in Lagos<br>
      <a href="${link("/category/all", "footer")}" style="color:#9a958d;">Shop</a> &nbsp;·&nbsp;
      <a href="${link("/bespoke", "footer")}" style="color:#9a958d;">Bespoke</a> &nbsp;·&nbsp;
      <a href="${link("/our-story", "footer")}" style="color:#9a958d;">Our story</a><br>
      <a href="{{ unsubscribe }}" style="color:#9a958d;">Unsubscribe</a>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

const hi = `<p style="margin:0 0 16px;">Hi {{ contact.FIRSTNAME | default : 'there' }},</p>`;
const p = (t: string) => `<p style="margin:0 0 16px;">${t}</p>`;

// ---------------------------------------------------------------------------
async function main() {
  if (!KEY || !SENDER.email) throw new Error("BREVO_API_KEY / BREVO_SENDER_EMAIL missing in .env.local");
  const { writeClient } = await import("../src/lib/sanityWrite");
  const { EVENT_SUMMARY_FIELDS, formatEventDateRange, formatEventHours } = await import("../src/lib/events");
  const { ensureBrevoAttributes, upsertContact } = await import("../src/lib/brevo");

  // 1. Attributes + visitor IDs on existing contacts
  await ensureBrevoAttributes();
  let refreshed = 0;
  for (const listId of [3, 4, 5].map((n, i) => Number(process.env[["BREVO_LIST_NEWSLETTER", "BREVO_LIST_CUSTOMERS", "BREVO_LIST_EVENTS"][i]]) || n)) {
    const res = await brevo("GET", `/contacts/lists/${listId}/contacts?limit=500`);
    for (const c of res.data?.contacts || []) {
      if (await upsertContact(c.email, {})) refreshed++;
    }
  }
  console.log(`contacts refreshed with visitor IDs: ${refreshed}`);

  // 2. Live content from the site
  const products: Product[] = await writeClient.fetch(
    `*[_type == "product" && defined(slug.current) && defined(images[0])] | order(_createdAt desc)[0...8]{ name, "slug": slug.current, "image": images[0].asset->url, priceNGN }`
  );
  const newest = products.slice(0, 4);
  const more = products.slice(4, 8).length >= 2 ? products.slice(4, 8) : newest;
  const event = await writeClient.fetch(`*[_type == "event" && dateTime(endDate) > dateTime(now())] | order(startDate asc)[0]{${EVENT_SUMMARY_FIELDS}}`);

  // 3. Templates
  const T: { name: string; subject: string; tag: string; html: string }[] = [
    {
      name: "Journey · Welcome 2 · Our story (day 3)",
      subject: "The story behind DAHRIOLA",
      tag: "welcome-2-story",
      html: brandEmail({
        preheader: "Clothing that feels natural, expressive and comfortable.",
        eyebrow: "WELCOME TO DAHRIOLA",
        title: "Made to feel like you",
        image: newest[0] ? `${newest[0].image}?w=1120&h=700&fit=crop&auto=format` : undefined,
        body: `${hi}${p("DAHRIOLA is a Nigerian contemporary African fashion brand, founded in 2021 on a simple idea: clothing should feel natural, expressive and comfortable, without forcing anyone into unrealistic standards of style or body type.")}
          ${p("Every piece is made to order with your height and fit in mind, in prints chosen with care.")}
          ${button(link("/our-story", "welcome-2-story"), "Read our story")}
          ${productGrid(newest, "welcome-2-story", "NEW IN")}`,
      }),
    },
    {
      name: "Journey · Welcome 3 · Your code is waiting (day 7)",
      subject: "Your 10% off is still waiting",
      tag: "welcome-3-code",
      html: brandEmail({
        preheader: "Use WELCOME10 on your first order.",
        eyebrow: "A LITTLE REMINDER",
        title: "Your 10% off is still waiting",
        body: `${hi}${p("When you joined, we gave you 10% off your first DAHRIOLA order. It's still yours whenever you're ready.")}
          <div style="margin:24px 0;padding:20px;border:1px dashed #778472;border-radius:14px;text-align:center;background:#F7F6F5;">
            <p style="margin:0;font-family:Georgia,serif;font-size:28px;letter-spacing:5px;color:#111;">WELCOME10</p>
            <p style="margin:6px 0 0;font-size:12px;color:#8a8170;">Apply at checkout · first order only</p></div>
          ${button(link("/category/all", "welcome-3-code"), "Find your piece")}
          ${productGrid(more, "welcome-3-code", "CUSTOMER FAVOURITES")}`,
      }),
    },
    {
      name: "Journey · Post-purchase 1 · Caring for your piece (day 3)",
      subject: "Caring for your DAHRIOLA piece",
      tag: "post-purchase-1-care",
      html: brandEmail({
        preheader: "A few simple tips to keep the colours rich.",
        eyebrow: "THANK YOU FOR YOUR ORDER",
        title: "Caring for your piece",
        body: `${hi}${p("Thank you for choosing DAHRIOLA. While your order is being made, here are a few simple ways to keep it looking its best for years:")}
          <ul style="margin:0 0 16px;padding-left:20px;"><li>Wash cold, inside out, on a gentle cycle or by hand.</li><li>Dry in the shade, away from direct sun, to keep the print vibrant.</li><li>Iron on the reverse side at a low to medium heat.</li><li>Always check the label on your piece for its specific care.</li></ul>
          ${p("You can follow your order's progress any time.")}
          ${button(link("/track", "post-purchase-1-care"), "Track my order")}`,
      }),
    },
    {
      name: "Journey · Post-purchase 2 · Style it your way (day 14)",
      subject: "Three ways to style your new piece",
      tag: "post-purchase-2-style",
      html: brandEmail({
        preheader: "Dress it up, dress it down.",
        eyebrow: "STYLE NOTES",
        title: "Make it your own",
        body: `${hi}${p("Our pieces are made to be worn, often. Pair a bold print with a neutral for everyday ease, layer with a jacket for the evening, or go all-out with matching separates for an occasion.")}
          ${p("We'd love to see how you wear yours. Tag us on Instagram.")}
          ${productGrid(newest, "post-purchase-2-style", "PAIRS WELL WITH")}
          ${button(link("/category/all", "post-purchase-2-style"), "Shop the collection")}`,
      }),
    },
    {
      name: "Journey · Post-purchase 3 · Complete the look (day 30)",
      subject: "Picked to go with your DAHRIOLA piece",
      tag: "post-purchase-3-cross-sell",
      html: brandEmail({
        preheader: "New pieces to complete the look.",
        eyebrow: "JUST FOR YOU",
        title: "Complete the look",
        body: `${hi}${p("It's been a month since your order. We hope it's become a favourite. Here are a few pieces our customers love pairing together.")}
          ${productGrid(more, "post-purchase-3-cross-sell")}
          ${button(link("/category/all", "post-purchase-3-cross-sell"), "Explore new arrivals")}
          ${p(`Want something made just for you? <a href="${link("/bespoke", "post-purchase-3-cross-sell")}" style="color:#111;">Start a bespoke piece</a>.`)}`,
      }),
    },
    {
      name: "Journey · Win-back 1 · We miss you (90 days)",
      subject: "It's been a while, {{ contact.FIRSTNAME | default : 'friend' }}",
      tag: "win-back-1",
      html: brandEmail({
        preheader: "Here's what's new at DAHRIOLA.",
        eyebrow: "WE MISS YOU",
        title: "A lot has happened since you last visited",
        body: `${hi}${p("It's been a little while. Since your last order we've added new pieces, new prints and new ways to wear them.")}
          ${productGrid(newest, "win-back-1", "NEW SINCE YOUR LAST VISIT")}
          ${button(link("/category/all", "win-back-1"), "See what's new")}`,
      }),
    },
    {
      name: "Journey · Win-back 2 · Something for you (120 days)",
      subject: "Something for you, from DAHRIOLA",
      tag: "win-back-2",
      html: brandEmail({
        preheader: "A personal note, and a reason to come back.",
        eyebrow: "JUST FOR YOU",
        title: "We'd love to see you again",
        body: `${hi}${p("We'd love to dress you again. Reply to this email if there's anything we can help with, from sizing to a custom piece, and we'll take care of it personally.")}
          ${p("<em>Tip for the store owner: add a personal discount code here before switching this email on, or leave it as a personal note.</em>")}
          ${productGrid(more, "win-back-2")}
          ${button(link("/category/all", "win-back-2"), "Shop now")}`,
      }),
    },
    {
      name: "Journey · VIP · Welcome to the inner circle",
      subject: "Welcome to the DAHRIOLA inner circle",
      tag: "vip-welcome",
      html: brandEmail({
        preheader: "Early access to new collections, just for you.",
        eyebrow: "VIP",
        title: "Thank you for being one of our best",
        body: `${hi}${p("You've become one of our most valued customers, and we wanted to say thank you properly.")}
          ${p("As part of our inner circle, you'll be the first to see new collections and pop-ups, before anyone else.")}
          ${button(link("/category/all", "vip-welcome"), "Shop early access")}
          ${productGrid(newest, "vip-welcome", "THE LATEST")}`,
      }),
    },
    {
      name: "Journey · Event · After the pop-up (RSVP, no purchase)",
      subject: "Thank you for joining us",
      tag: "event-after-rsvp",
      html: brandEmail({
        preheader: "Everything from the pop-up is available online.",
        eyebrow: "AFTER THE POP-UP",
        title: "The pop-up may be over…",
        body: `${hi}${p("…but every piece from the weekend is available online, made to your size. Here are some of the favourites.")}
          ${productGrid(newest, "event-after-rsvp")}
          ${button(link("/events", "event-after-rsvp"), "See the photos")}`,
      }),
    },
    {
      name: "Campaign base · New collection launch",
      subject: "New in: [Collection name]",
      tag: "campaign-launch",
      html: brandEmail({
        preheader: "[One line about the collection]",
        eyebrow: "NEW COLLECTION",
        title: "[Collection name]",
        image: newest[0] ? `${newest[0].image}?w=1120&h=700&fit=crop&auto=format` : undefined,
        body: `${hi}${p("[Two or three sentences about the collection: the inspiration, the prints, who it's for.]")}
          ${button(link("/category/all", "campaign-launch"), "Shop the collection")}
          ${productGrid(newest, "campaign-launch", "FROM THE COLLECTION")}`,
      }),
    },
    {
      name: "Campaign base · Newsletter",
      subject: "[Subject line]",
      tag: "campaign-newsletter",
      html: brandEmail({
        preheader: "[Preview text]",
        eyebrow: "FROM THE STUDIO",
        title: "[Headline]",
        body: `${hi}${p("[Your update: new pieces, behind the scenes, an event, a styling tip.]")}
          ${button(link("/", "campaign-newsletter"), "Visit DAHRIOLA")}
          ${productGrid(newest, "campaign-newsletter", "NEW IN")}`,
      }),
    },
  ];

  const existing = await brevo("GET", "/smtp/templates?limit=1000&templateStatus=true");
  const existingInactive = await brevo("GET", "/smtp/templates?limit=1000&templateStatus=false");
  if (!existing.ok) throw new Error(`Cannot read templates (${existing.status}): ${JSON.stringify(existing.data)}`);
  const all = [...(existing.data?.templates || []), ...(existingInactive.data?.templates || [])];

  for (const t of T) {
    const payload = { templateName: t.name, subject: t.subject, htmlContent: t.html, sender: SENDER, replyTo: REPLY_TO, tag: t.tag, isActive: true };
    const found = all.find((x: any) => x.name === t.name);
    const res = found ? await brevo("PUT", `/smtp/templates/${found.id}`, payload) : await brevo("POST", "/smtp/templates", payload);
    console.log(`${res.ok ? "✓" : "✗"} template ${found ? "updated" : "created"}: ${t.name}${res.ok ? "" : ` (${res.status} ${JSON.stringify(res.data)})`}`);
  }

  // 4. Pop-up announcement — DRAFT campaign (never sent by this script)
  if (event) {
    const name = `DRAFT · Pop-up announcement · ${event.title}`;
    const html = brandEmail({
      preheader: `${formatEventDateRange(event, { weekday: false })} · ${event.venueAddress || "Lagos"}. RSVP now.`,
      eyebrow: "YOU'RE INVITED",
      title: "A weekend with DAHRIOLA",
      image: event.flyerUrl ? `${event.flyerUrl}?w=1120&fit=max&auto=format` : undefined,
      body: `${hi}${p(`We're opening our doors in Lagos for a weekend pop-up, and we'd love you to be there. See the collection up close, try on your favourite pieces and meet the team behind DAHRIOLA.`)}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;border-top:1px solid #ECE9E4;border-bottom:1px solid #ECE9E4;">
          <tr><td style="padding:12px 0;font-size:10px;font-weight:bold;letter-spacing:2px;color:#9a958d;width:90px;">DATES</td><td style="padding:12px 0;font-size:14px;color:#111;">${formatEventDateRange(event)}</td></tr>
          <tr><td style="padding:12px 0;font-size:10px;font-weight:bold;letter-spacing:2px;color:#9a958d;border-top:1px solid #ECE9E4;">HOURS</td><td style="padding:12px 0;font-size:14px;color:#111;border-top:1px solid #ECE9E4;">${formatEventHours(event)}</td></tr>
          <tr><td style="padding:12px 0;font-size:10px;font-weight:bold;letter-spacing:2px;color:#9a958d;border-top:1px solid #ECE9E4;">VENUE</td><td style="padding:12px 0;font-size:14px;color:#111;border-top:1px solid #ECE9E4;">${event.venueAddress || "Lagos"}</td></tr>
        </table>
        ${p("Entry is by RSVP, so reserve your place below and we'll email your ticket.")}
        ${button(link("/rsvp", "popup-announcement"), "Reserve my place")}`,
    });
    const lists = ["BREVO_LIST_NEWSLETTER", "BREVO_LIST_CUSTOMERS", "BREVO_LIST_EVENTS"].map((k) => Number(process.env[k])).filter(Boolean);
    const payload = {
      name,
      subject: "You're invited: a weekend with DAHRIOLA in Lagos",
      previewText: `${formatEventDateRange(event, { weekday: false })} · RSVP now`,
      sender: SENDER,
      replyTo: REPLY_TO,
      htmlContent: html,
      recipients: { listIds: lists },
      tag: "popup-announcement",
    };
    const drafts = await brevo("GET", "/emailCampaigns?status=draft&limit=100");
    const found = (drafts.data?.campaigns || []).find((c: any) => c.name === name);
    const res = found ? await brevo("PUT", `/emailCampaigns/${found.id}`, payload) : await brevo("POST", "/emailCampaigns", { ...payload, type: "classic" });
    console.log(`${res.ok ? "✓" : "✗"} draft campaign ${found ? "updated" : "created"}: ${name}${res.ok ? "" : ` (${res.status} ${JSON.stringify(res.data)})`}`);
  } else {
    console.log("no upcoming event found — skipped the pop-up announcement draft");
  }
}

main().catch((err) => {
  console.error("brevo-setup failed:", err);
  process.exit(1);
});
