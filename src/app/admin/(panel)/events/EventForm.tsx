"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Download, ExternalLink, Plus, Trash2, Users } from "lucide-react";
import { deleteEvent, saveEvent, type EventInput } from "@/src/app/admin/actions/events";
import { slugify } from "@/src/lib/admin/format";
import { imageUrl } from "@/src/lib/images";
import ConfirmDelete from "@/src/components/admin/ConfirmDelete";
import TextEditor from "@/src/components/admin/TextEditor";
import { ImageListField, SingleImageField, VideoUploadButton } from "@/src/components/admin/uploads";
import { Badge, Button, Card, Field, Input, Textarea, Toggle, cx, useAction } from "@/src/components/admin/ui";

export type ProductOption = { id: string; name: string; image: string | null };

export default function EventForm({
  initial,
  products,
  codes,
  rsvpCount = 0,
  finished = false,
}: {
  initial: EventInput;
  products: ProductOption[];
  /** Active discount codes that could go in the follow-up emails */
  codes: string[];
  rsvpCount?: number;
  finished?: boolean;
}) {
  const router = useRouter();
  const { busy, run } = useAction();
  const [form, setForm] = useState<EventInput>(initial);
  const [slugTouched, setSlugTouched] = useState(!!initial.id);
  const [productSearch, setProductSearch] = useState("");
  const set = (patch: Partial<EventInput>) => setForm((f) => ({ ...f, ...patch }));

  const isNew = !initial.id;
  const slug = slugTouched ? form.slug || "" : slugify(form.title);
  const dirty = useMemo(() => JSON.stringify({ ...form, slug }) !== JSON.stringify({ ...initial, slug: initial.slug || "" }), [form, slug, initial]);

  const shownProducts = products.filter((p) => p.name.toLowerCase().includes(productSearch.trim().toLowerCase()));
  const toggleProduct = (id: string) =>
    set({ featuredProductIds: form.featuredProductIds.includes(id) ? form.featuredProductIds.filter((x) => x !== id) : [...form.featuredProductIds, id] });

  const save = async () => {
    const res = await run(() => saveEvent({ ...form, slug, videos: form.videos.filter((v) => v.trim()) }), isNew ? "Event added." : "Changes saved.");
    if (!res?.ok) return;
    if (isNew) router.push(`/admin/events/${res.id}`);
    router.refresh();
  };

  return (
    <div className="grid gap-6 pb-24 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card title="Details">
          <div className="space-y-4">
            <Field label="Event title">
              <Input value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. DAHRIOLA Christmas Pop-up" />
            </Field>
            <Field label="Headline" hint="The line shown on the site pop-up and at the top of the event page.">
              <Input value={form.tagline || ""} onChange={(e) => set({ tagline: e.target.value })} placeholder="Something exciting is coming to Lagos!" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Starts" hint="First day and opening time (Lagos time).">
                <Input type="datetime-local" step={900} value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} />
              </Field>
              <Field label="Ends" hint="Last day and closing time. For two days, 10am–8pm: start 19 Dec 10:00, end 20 Dec 20:00.">
                <Input type="datetime-local" step={900} value={form.endDate} onChange={(e) => set({ endDate: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Venue name">
                <Input value={form.venueName || ""} onChange={(e) => set({ venueName: e.target.value })} />
              </Field>
              <Field label="Google Maps link">
                <Input type="url" placeholder="https://maps.app.goo.gl/…" value={form.mapLink || ""} onChange={(e) => set({ mapLink: e.target.value })} />
              </Field>
            </div>
            <Field label="Venue address">
              <Textarea rows={2} value={form.venueAddress || ""} onChange={(e) => set({ venueAddress: e.target.value })} />
            </Field>
            <Field label="About the event">
              <TextEditor value={form.description || ""} onChange={(description) => set({ description })} rows={6} placeholder="What's happening, what to expect, what to wear…" />
            </Field>
          </div>
        </Card>

        <Card title="After the event" description="Once the end time passes, the event page becomes a recap. Add photos, videos and a short story here.">
          <div className="space-y-6">
            <Field label="Recap story" hint="Shown instead of “About the event” once it's over. Leave empty to keep the original text.">
              <TextEditor value={form.recap || ""} onChange={(recap) => set({ recap })} rows={5} />
            </Field>

            <div>
              <p className="mb-1.5 text-[13px] font-medium text-neutral-800">Photo gallery</p>
              <ImageListField
                folder="events"
                value={form.gallery}
                onChange={(gallery) => set({ gallery })}
                make={(image) => ({ url: image.url, width: image.width, height: image.height, caption: "" })}
                firstLabel="Cover"
                renderExtra={(item, _i, update) => (
                  <input
                    value={item.caption || ""}
                    onChange={(e) => update({ caption: e.target.value })}
                    placeholder="Caption (optional)"
                    className="h-8 w-full rounded-md border border-neutral-300 px-2 text-xs outline-none focus:border-brand-beryl"
                  />
                )}
              />
            </div>

            <div>
              <p className="mb-1.5 text-[13px] font-medium text-neutral-800">Video links</p>
              <p className="mb-2 text-xs text-neutral-500">Paste a YouTube, Instagram or TikTok link. Best for longer videos.</p>
              <div className="space-y-2">
                {form.videos.map((v, i) => (
                  <div key={i} className="flex gap-2">
                    <Input type="url" placeholder="https://" value={v} onChange={(e) => set({ videos: form.videos.map((x, j) => (j === i ? e.target.value : x)) })} />
                    <button type="button" aria-label="Remove link" onClick={() => set({ videos: form.videos.filter((_, j) => j !== i) })} className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <Button variant="secondary" size="sm" onClick={() => set({ videos: [...form.videos, ""] })}>
                  <Plus size={14} /> Add a video link
                </Button>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[13px] font-medium text-neutral-800">Video clips</p>
              <p className="mb-2 text-xs text-neutral-500">Short clips under 50 MB each (MP4 or MOV).</p>
              {form.videoFiles.length > 0 && (
                <ul className="mb-3 space-y-2">
                  {form.videoFiles.map((v, i) => (
                    <li key={v.url} className="flex items-center gap-3 rounded-lg border border-neutral-200 p-2">
                      <video src={v.url} className="h-14 w-20 shrink-0 rounded bg-black object-cover" muted preload="metadata" />
                      <Input
                        placeholder="Caption (optional)"
                        value={v.caption || ""}
                        onChange={(e) => set({ videoFiles: form.videoFiles.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)) })}
                      />
                      <button type="button" aria-label="Remove clip" onClick={() => set({ videoFiles: form.videoFiles.filter((_, j) => j !== i) })} className="rounded-lg p-2 text-neutral-400 hover:bg-red-50 hover:text-red-700">
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <VideoUploadButton onUploaded={(videos) => set({ videoFiles: [...form.videoFiles, ...videos.map((v) => ({ ...v, caption: "" }))] })} />
            </div>

            <div>
              <p className="mb-1.5 text-[13px] font-medium text-neutral-800">Shop the look</p>
              <p className="mb-2 text-xs text-neutral-500">Pieces worn or shown at the event, linked from the recap. {form.featuredProductIds.length} selected.</p>
              {products.length > 10 && <Input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search products" className="mb-3 max-w-xs" />}
              <ul className="grid max-h-72 grid-cols-3 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-4 md:grid-cols-5">
                {shownProducts.map((p) => {
                  const selected = form.featuredProductIds.includes(p.id);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => toggleProduct(p.id)}
                        aria-pressed={selected}
                        className={cx("relative block w-full overflow-hidden rounded-lg border-2 text-left", selected ? "border-brand-beryl" : "border-transparent ring-1 ring-neutral-200 hover:ring-neutral-400")}
                      >
                        <span className="block aspect-[4/5] bg-neutral-100">
                          {p.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={imageUrl(p.image, { width: 200, height: 250 })} alt="" className="h-full w-full object-cover" loading="lazy" />
                          )}
                        </span>
                        <span className="block truncate px-2 py-1.5 text-xs font-medium text-neutral-900">{p.name}</span>
                        {selected && (
                          <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-beryl text-white">
                            <Check size={12} />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        {!isNew && (
          <Card title="On the website">
            <div className="space-y-2 text-[13px]">
              <a href={`/events/${initial.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 font-medium text-brand-beryl hover:underline">
                <ExternalLink size={13} /> View the event page
              </a>
            </div>
          </Card>
        )}

        {!isNew && (
          <Card title="Guest list" description={`${rsvpCount} ${rsvpCount === 1 ? "person has" : "people have"} registered.`}>
            <div className="space-y-2.5">
              {/* A file download, so a plain link (not next/link) is right here */}
              <a
                href={`/admin/export/rsvps?event=${encodeURIComponent(initial.id || "")}`}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-beryl px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-neutral-900"
              >
                <Download size={16} /> Download as spreadsheet
              </a>
              <Link
                href={`/admin/events/${initial.id}/rsvps`}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-800 hover:border-neutral-500"
              >
                <Users size={16} /> See the guest list
              </Link>
            </div>
          </Card>
        )}

        <Card title="Flyer">
          <SingleImageField folder="events" value={form.flyerUrl || null} onChange={(flyerUrl) => set({ flyerUrl })} />
        </Card>

        <Card title="RSVPs">
          <div className="space-y-4">
            <Toggle label="RSVPs open" hint="Turn off to stop new registrations." checked={form.rsvpOpen} onChange={(rsvpOpen) => set({ rsvpOpen })} />
            <Field label="Capacity (optional)" hint="RSVPs close by themselves when this many people, including plus-ones, have registered.">
              <Input type="number" min={1} inputMode="numeric" value={form.capacity ?? ""} onChange={(e) => set({ capacity: e.target.value })} placeholder="No limit" />
            </Field>
            <Field label="Plus-ones allowed per person">
              <Input type="number" min={0} max={10} inputMode="numeric" value={form.maxGuests ?? ""} onChange={(e) => set({ maxGuests: e.target.value })} />
            </Field>
          </div>
        </Card>

        <Card title="Promotion">
          <Toggle
            label="Show the site pop-up"
            hint="Replaces the 10% newsletter pop-up until the event ends. Turning this on switches it off on any other event."
            checked={form.showPopup}
            onChange={(showPopup) => set({ showPopup })}
          />
        </Card>

        <Card title="Follow-up emails">
          <div className="space-y-4">
            <Toggle
              label="Send follow-up emails"
              hint={
                finished
                  ? "At the next morning run (8am Lagos time), everyone who checked in gets a thank-you and everyone else who registered gets a “we missed you”. Each person is emailed once."
                  : "Turn this on after the event, once the gallery and recap are ready."
              }
              checked={form.followUpsEnabled}
              onChange={(followUpsEnabled) => set({ followUpsEnabled })}
            />
            <Field label="Offer code to include (optional)" hint="Pick one of your discount codes, or leave empty.">
              <select
                value={form.attendeeCode || ""}
                onChange={(e) => set({ attendeeCode: e.target.value })}
                className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-brand-beryl focus:ring-2 focus:ring-brand-beryl/20"
              >
                <option value="">No code</option>
                {[...new Set([...(form.attendeeCode ? [form.attendeeCode] : []), ...codes])].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>

        <Card title="Page link">
          <Field label="dahriola.com/events/…" hint="Made from the title. Changing it later breaks links already shared.">
            <Input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                set({ slug: e.target.value });
              }}
              onBlur={() => slugTouched && set({ slug: slugify(form.slug || "") })}
            />
          </Field>
        </Card>

        {!isNew && (
          <ConfirmDelete
            action={() => deleteEvent(initial.id!)}
            title="Delete this event?"
            redirectTo="/admin/events"
            successText="Event deleted."
            text={
              <>
                <strong>{initial.title}</strong>, its page and{" "}
                {rsvpCount > 0 ? (
                  <>
                    all <strong>{rsvpCount}</strong> RSVP{rsvpCount === 1 ? "" : "s"}
                  </>
                ) : (
                  "its RSVP list"
                )}{" "}
                will be removed for good. Download the RSVP list first if you need a copy.
              </>
            }
          >
            Delete event
          </ConfirmDelete>
        )}
      </div>

      {/* Save bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <span className="text-[13px] text-neutral-500">{dirty ? <Badge tone="amber">Unsaved changes</Badge> : isNew ? "Fill in the details, then save." : "All changes saved."}</span>
          <div className="flex gap-2">
            <Link href="/admin/events" className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-neutral-600 hover:bg-neutral-100">
              {dirty ? "Cancel" : "Back"}
            </Link>
            <Button onClick={save} loading={busy} disabled={!dirty && !isNew}>
              {isNew ? "Add event" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
