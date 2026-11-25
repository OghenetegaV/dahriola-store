"use client";

// Small building blocks shared by every dashboard screen.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

// ───────────────────────────── Buttons ─────────────────────────────

type Variant = "primary" | "secondary" | "ghost" | "danger";
const VARIANTS: Record<Variant, string> = {
  primary: "bg-neutral-900 text-white hover:bg-neutral-700 disabled:bg-neutral-300",
  secondary: "bg-white text-neutral-800 border border-neutral-300 hover:bg-neutral-50 disabled:text-neutral-400",
  ghost: "text-neutral-600 hover:bg-neutral-100 disabled:text-neutral-300",
  danger: "bg-white text-red-700 border border-red-200 hover:bg-red-50 disabled:text-red-300",
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md"; loading?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed",
        size === "sm" ? "h-8 px-3 text-[13px]" : "h-10 px-4 text-sm",
        VARIANTS[variant],
        className
      )}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

// ───────────────────────────── Form fields ─────────────────────────────

const fieldBase =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-brand-beryl focus:ring-2 focus:ring-brand-beryl/20 disabled:bg-neutral-100 disabled:text-neutral-500";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label?: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cx("block", className)}>
      {label && <span className="mb-1.5 block text-[13px] font-medium text-neutral-800">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs leading-relaxed text-neutral-500">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cx(fieldBase, "h-10", className)} />;
}

export function Textarea({ className, rows = 4, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={rows} {...rest} className={cx(fieldBase, "py-2.5 leading-relaxed", className)} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...rest} className={cx(fieldBase, "h-10 pr-8", className)}>
      {children}
    </select>
  );
}

/** An on/off switch with a label and an optional explanation. */
export function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer text-sm font-medium text-neutral-800">
          {label}
        </label>
        {hint && <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{hint}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
          checked ? "bg-brand-beryl" : "bg-neutral-300"
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}

// ───────────────────────────── Layout pieces ─────────────────────────────

export function Card({ title, description, action, children, className, padded = true }: {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cx("rounded-xl border border-neutral-200 bg-white", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-neutral-100 px-5 py-4">
          <div>
            {title && <h2 className="text-[15px] font-semibold text-neutral-900">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-neutral-500">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

type Tone = "neutral" | "green" | "amber" | "red" | "blue" | "violet";
const TONES: Record<Tone, string> = {
  neutral: "bg-neutral-100 text-neutral-700",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-800",
  red: "bg-red-50 text-red-700",
  blue: "bg-sky-50 text-sky-700",
  violet: "bg-violet-50 text-violet-700",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cx("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium", TONES[tone])}>
      {children}
    </span>
  );
}

// ───────────────────────────── Modal ─────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={cx(
          "flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl",
          wide ? "sm:max-w-2xl" : "sm:max-w-lg"
        )}
      >
        <header className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-100">
            <X size={18} />
          </button>
        </header>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-neutral-100 px-5 py-4">{footer}</footer>}
      </div>
    </div>
  );
}

// ───────────────────────────── Toasts ─────────────────────────────

type Toast = { id: number; kind: "success" | "error"; text: string };
const ToastContext = createContext<(kind: Toast["kind"], text: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, kind, text }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), kind === "error" ? 7000 : 3500);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[300] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cx(
              "pointer-events-auto flex max-w-md items-start gap-2.5 rounded-xl px-4 py-3 text-sm shadow-lg",
              t.kind === "success" ? "bg-neutral-900 text-white" : "bg-red-600 text-white"
            )}
          >
            {t.kind === "success" ? <CheckCircle2 size={17} className="mt-0.5 shrink-0" /> : <AlertCircle size={17} className="mt-0.5 shrink-0" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** `toast.success("Saved")` / `toast.error("…")` */
export function useToast() {
  const push = useContext(ToastContext);
  return {
    success: (text: string) => push("success", text),
    error: (text: string) => push("error", text),
  };
}

export type ActionResult<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

/**
 * Runs a server action with a busy flag and a toast for the outcome.
 * Returns the result so the caller can react to it.
 */
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = useCallback(
    async <T,>(action: () => Promise<ActionResult<T>>, successText?: string): Promise<ActionResult<T> | null> => {
      setBusy(true);
      try {
        const result = await action();
        if (result.ok) {
          if (successText) toast.success(successText);
        } else {
          toast.error(result.error);
        }
        return result;
      } catch (err) {
        // redirect() from a server action surfaces as a thrown navigation; let it through
        if (err && typeof err === "object" && "digest" in err && String((err as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")) {
          throw err;
        }
        toast.error("Something went wrong. Please try again.");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [toast]
  );
  return { busy, run };
}
