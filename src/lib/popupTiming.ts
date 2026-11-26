// When a pop-up may open by itself again after a visitor closed it. It comes
// back at intervals rather than once only, and the gap gets longer the more
// often it has been closed, so it reminds without nagging. Remembered per
// browser; if storage is blocked the pop-up simply opens once per page load.

const HOUR = 60 * 60 * 1000;

export type PopupSchedule = {
  /** Gap after each of the first closes. */
  firstGapHours: number;
  /** How many closes get the short gap. */
  shortGapCloses: number;
  /** Gap after every close beyond that. */
  laterGapHours: number;
};

/** Event pop-up: back on the next visit (6 hours on), then once a day. */
export const EVENT_POPUP: PopupSchedule = { firstGapHours: 6, shortGapCloses: 2, laterGapHours: 24 };
/** Newsletter pop-up: back the next day, then every 3 days. */
export const NEWSLETTER_POPUP: PopupSchedule = { firstGapHours: 24, shortGapCloses: 2, laterGapHours: 72 };

type Saved = { at: number; closes: number };

function read(key: string): Saved {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { at: 0, closes: 0 };
    // Older versions stored just the time the pop-up was closed
    if (/^\d+$/.test(raw)) return { at: Number(raw), closes: 1 };
    const saved = JSON.parse(raw);
    return { at: Number(saved?.at) || 0, closes: Number(saved?.closes) || 0 };
  } catch {
    return { at: 0, closes: 0 };
  }
}

/** True when enough time has passed since the visitor last closed this pop-up. */
export function popupIsDue(key: string, schedule: PopupSchedule) {
  const { at, closes } = read(key);
  if (!at) return true;
  const gapHours = closes <= schedule.shortGapCloses ? schedule.firstGapHours : schedule.laterGapHours;
  return Date.now() - at >= gapHours * HOUR;
}

/** Call when the visitor closes the pop-up. */
export function recordPopupClosed(key: string) {
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), closes: read(key).closes + 1 }));
  } catch {}
}

/** Stops a pop-up from opening by itself again (e.g. once someone has RSVP'd). */
export function silencePopup(key: string) {
  try {
    localStorage.setItem(`${key}-done`, "1");
  } catch {}
}

export function popupIsSilenced(key: string) {
  try {
    return localStorage.getItem(`${key}-done`) === "1";
  } catch {
    return false;
  }
}

export const eventPopupKey = (eventId: string) => `dahriola-event-closed-${eventId}`;
