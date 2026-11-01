import { Fragment } from "react";

/** Renders plain-text descriptions: lines starting with "- " become bullet lists, the rest paragraphs. */
export function DescriptionText({ text }: { text: string }) {
  const blocks: { list: boolean; lines: string[] }[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      blocks.push({ list: false, lines: [] }); // blank line = paragraph break
      continue;
    }
    const isBullet = /^\s*[-*•]\s+/.test(line);
    const last = blocks[blocks.length - 1];
    if (last && last.list === isBullet && last.lines.length > 0) last.lines.push(line);
    else blocks.push({ list: isBullet, lines: [line] });
  }
  return (
    <div className="space-y-2 leading-relaxed">
      {blocks
        .filter((b) => b.lines.length > 0)
        .map((b, i) => (
          <Fragment key={i}>
            {b.list ? (
              <ul className="list-disc space-y-0.5 pl-5 marker:text-primary">
                {b.lines.map((l, j) => (
                  <li key={j}>{l.replace(/^\s*[-*•]\s+/, "")}</li>
                ))}
              </ul>
            ) : (
              <p className="whitespace-pre-line">{b.lines.join("\n")}</p>
            )}
          </Fragment>
        ))}
    </div>
  );
}
