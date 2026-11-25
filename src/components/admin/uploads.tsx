"use client";

// Photo and video pickers. Photos are shrunk in the browser first (phone
// photos are often 5–10 MB), then sent straight to storage.
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { createUpload } from "@/src/app/admin/actions/settings";
import { browserSupabase } from "@/src/lib/supabase/browser";
import { MEDIA_BUCKET } from "@/src/lib/supabase/config";
import { cx, useToast } from "@/src/components/admin/ui";

const MAX_EDGE = 2400;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export type UploadedImage = { url: string; width?: number; height?: number };

/** Scales a photo down to MAX_EDGE on its longest side and saves it as WebP. */
async function shrinkImage(file: File): Promise<{ blob: Blob; type: string; width?: number; height?: number }> {
  if (file.type === "image/gif") return { blob: file, type: file.type };
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const original = { width: bitmap.width, height: bitmap.height };
    const scale = Math.min(1, MAX_EDGE / Math.max(original.width, original.height));
    const width = Math.round(original.width * scale);
    const height = Math.round(original.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
    // Keep the original if the browser can't make WebP or it came out bigger
    if (!blob || blob.type !== "image/webp" || (scale === 1 && blob.size >= file.size)) {
      return { blob: file, type: file.type, ...original };
    }
    return { blob, type: "image/webp", width, height };
  } catch {
    return { blob: file, type: file.type };
  }
}

async function sendFile(folder: string, name: string, type: string, body: Blob) {
  const ticket = await createUpload({ folder, fileName: name, contentType: type });
  if (!ticket.ok) throw new Error(ticket.error);
  const { error } = await browserSupabase()
    .storage.from(MEDIA_BUCKET)
    .uploadToSignedUrl(ticket.path, ticket.token, body, { contentType: type, cacheControl: "31536000" });
  if (error) throw new Error("The upload didn't finish. Check your connection and try again.");
  return ticket.publicUrl;
}

export async function uploadImage(folder: string, file: File): Promise<UploadedImage> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} isn't a photo.`);
  const { blob, type, width, height } = await shrinkImage(file);
  return { url: await sendFile(folder, file.name, type, blob), width, height };
}

export async function uploadVideo(file: File) {
  if (!file.type.startsWith("video/")) throw new Error(`${file.name} isn't a video.`);
  if (file.size > MAX_VIDEO_BYTES) {
    throw new Error(`${file.name} is over 50 MB. Post longer videos on YouTube or Instagram and paste the link instead.`);
  }
  return { url: await sendFile("videos", file.name, file.type, file), mimeType: file.type };
}

/** Shared file-picking behaviour: drop zone, busy state and error toasts. */
function useUploader<T>(upload: (file: File) => Promise<T>, onDone: (results: T[]) => void) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);

  const handle = async (list: FileList | null) => {
    const files = Array.from(list || []);
    if (!files.length) return;
    setBusy(files.length);
    const done: T[] = [];
    for (const file of files) {
      try {
        done.push(await upload(file));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed.");
      }
      setBusy((n) => Math.max(0, n - 1));
    }
    setBusy(0);
    if (inputRef.current) inputRef.current.value = "";
    if (done.length) onDone(done);
  };
  return { inputRef, busy, handle };
}

function DropZone({
  busy,
  label,
  hint,
  onPick,
  onFiles,
  compact,
}: {
  busy: number;
  label: string;
  hint?: string;
  onPick: () => void;
  onFiles: (files: FileList) => void;
  compact?: boolean;
}) {
  const [over, setOver] = useState(false);
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={busy > 0}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
      }}
      className={cx(
        "flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-center transition-colors",
        compact ? "px-3 py-4" : "px-4 py-8",
        over ? "border-brand-beryl bg-brand-beryl/5" : "border-neutral-300 bg-neutral-50 hover:border-neutral-400",
        busy > 0 && "cursor-wait opacity-70"
      )}
    >
      {busy > 0 ? <Loader2 size={20} className="animate-spin text-neutral-500" /> : <Upload size={20} className="text-neutral-500" />}
      <span className="text-sm font-medium text-neutral-800">{busy > 0 ? `Uploading… ${busy} left` : label}</span>
      {hint && busy === 0 && <span className="text-xs text-neutral-500">{hint}</span>}
    </button>
  );
}

// ───────────────────────────── One photo ─────────────────────────────

export function SingleImageField({
  value,
  onChange,
  folder,
  aspect = "aspect-[4/5]",
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  folder: string;
  aspect?: string;
}) {
  const { inputRef, busy, handle } = useUploader(
    (file) => uploadImage(folder, file),
    (done) => onChange(done[0].url)
  );
  return (
    <div className="w-full max-w-[220px]">
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => handle(e.target.files)} />
      {value ? (
        <div className={cx("group relative overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100", aspect)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2">
            <button type="button" onClick={() => inputRef.current?.click()} className="flex-1 rounded-md bg-white/95 px-2 py-1.5 text-xs font-medium text-neutral-900">
              {busy ? "Uploading…" : "Replace"}
            </button>
            <button type="button" onClick={() => onChange(null)} aria-label="Remove photo" className="rounded-md bg-white/95 px-2 py-1.5 text-red-700">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ) : (
        <DropZone busy={busy} label="Add a photo" hint="Click, or drop one here" onPick={() => inputRef.current?.click()} onFiles={handle} />
      )}
    </div>
  );
}

// ───────────────────────────── Several photos ─────────────────────────────

export function ImageListField<T extends UploadedImage>({
  value,
  onChange,
  folder,
  make,
  firstLabel = "Main photo",
  hint = "Click, or drop photos here. You can pick several at once.",
  renderExtra,
}: {
  value: T[];
  onChange: (next: T[]) => void;
  folder: string;
  /** Turns a finished upload into a list item */
  make: (image: UploadedImage) => T;
  firstLabel?: string | null;
  hint?: string;
  renderExtra?: (item: T, index: number, update: (patch: Partial<T>) => void) => React.ReactNode;
}) {
  const { inputRef, busy, handle } = useUploader(
    (file) => uploadImage(folder, file),
    (done) => onChange([...value, ...done.map(make)])
  );
  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = value.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => handle(e.target.files)} />
      {value.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((item, i) => (
            <li key={item.url} className="space-y-1.5">
              <div className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                {i === 0 && firstLabel && (
                  <span className="absolute left-2 top-2 rounded-full bg-neutral-900/85 px-2 py-0.5 text-[11px] font-medium text-white">{firstLabel}</span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move earlier" className="rounded-md bg-white/95 p-1.5 text-neutral-800 disabled:opacity-40">
                      <ArrowLeft size={14} />
                    </button>
                    <button type="button" onClick={() => move(i, i + 1)} disabled={i === value.length - 1} aria-label="Move later" className="rounded-md bg-white/95 p-1.5 text-neutral-800 disabled:opacity-40">
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove photo" className="rounded-md bg-white/95 p-1.5 text-red-700">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {renderExtra?.(item, i, (patch) => onChange(value.map((v, j) => (j === i ? { ...v, ...patch } : v))))}
            </li>
          ))}
        </ul>
      )}
      <DropZone
        busy={busy}
        compact={value.length > 0}
        label={value.length ? "Add more photos" : "Add photos"}
        hint={hint}
        onPick={() => inputRef.current?.click()}
        onFiles={handle}
      />
    </div>
  );
}

// ───────────────────────────── Video clips ─────────────────────────────

export function VideoUploadButton({ onUploaded }: { onUploaded: (videos: { url: string; mimeType: string }[]) => void }) {
  const { inputRef, busy, handle } = useUploader(uploadVideo, onUploaded);
  return (
    <>
      <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,video/webm" multiple hidden onChange={(e) => handle(e.target.files)} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy > 0}
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
      >
        {busy > 0 ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
        {busy > 0 ? "Uploading…" : "Upload a clip"}
      </button>
    </>
  );
}
