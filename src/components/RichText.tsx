// Renders the simple formatted text written in the dashboard:
//   blank line      → new paragraph
//   "- item"        → bullet list
//   "## Heading"    → heading
//   **bold**, [link text](https://…)
// Works in server and client components (no hooks).
import type { ReactNode } from "react";

type Classes = { p?: string; h?: string; ul?: string; li?: string; strong?: string; a?: string };

function inline(text: string, classes: Classes, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*|mailto:[^\s)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = pattern.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(
        <strong key={`${keyBase}-b${i}`} className={classes.strong}>
          {m[1]}
        </strong>
      );
    } else {
      const external = /^https?:/.test(m[3]);
      out.push(
        <a
          key={`${keyBase}-a${i}`}
          href={m[3]}
          className={classes.a ?? "underline"}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {m[2]}
        </a>
      );
    }
    last = m.index + m[0].length;
    i++;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function withBreaks(lines: string[], classes: Classes, keyBase: string) {
  return lines.flatMap((line, i) => [
    ...(i > 0 ? [<br key={`${keyBase}-br${i}`} />] : []),
    ...inline(line, classes, `${keyBase}-${i}`),
  ]);
}

const BULLET = /^\s*[-•*]\s+/;

export function hasRichText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Plain text for search and meta descriptions. */
export function richTextToPlain(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,4}\s+/gm, "")
    .replace(/^\s*[-•*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function RichText({ value, classes = {} }: { value?: string | null; classes?: Classes }) {
  if (!hasRichText(value)) return null;
  const blocks = value
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <>
      {blocks.map((block, bi) => {
        const nodes: ReactNode[] = [];
        let para: string[] = [];
        let bullets: string[] = [];
        const flushPara = () => {
          if (para.length) {
            const key = `p${bi}-${nodes.length}`;
            nodes.push(
              <p key={key} className={classes.p}>
                {withBreaks(para, classes, key)}
              </p>
            );
          }
          para = [];
        };
        const flushBullets = () => {
          if (bullets.length) {
            const key = `u${bi}-${nodes.length}`;
            nodes.push(
              <ul key={key} className={classes.ul ?? "list-disc pl-5 space-y-1"}>
                {bullets.map((b, i) => (
                  <li key={i} className={classes.li}>
                    {inline(b, classes, `${key}-${i}`)}
                  </li>
                ))}
              </ul>
            );
          }
          bullets = [];
        };
        for (const line of block.split("\n")) {
          const heading = line.match(/^#{1,4}\s+(.*)$/);
          if (heading) {
            flushPara();
            flushBullets();
            const key = `h${bi}-${nodes.length}`;
            nodes.push(
              <h3 key={key} className={classes.h ?? "font-semibold"}>
                {inline(heading[1], classes, key)}
              </h3>
            );
          } else if (BULLET.test(line)) {
            flushPara();
            bullets.push(line.replace(BULLET, ""));
          } else {
            flushBullets();
            para.push(line);
          }
        }
        flushPara();
        flushBullets();
        return nodes;
      })}
    </>
  );
}
