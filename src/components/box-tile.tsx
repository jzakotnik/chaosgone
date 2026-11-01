import Link from "next/link";
import { BoxIcon, boxTone } from "@/lib/box-style";
import type { Box } from "@/lib/types";

export function BoxTile({ box, countLabel }: { box: Box; countLabel: string }) {
  return (
    <Link
      href={`/box/${box.id}`}
      className={`tile ${boxTone(box.color)} flex min-h-40 flex-col justify-between rounded-md p-5`}
    >
      <BoxIcon name={box.icon} className="size-12" strokeWidth={1.75} />
      <div>
        <div className="break-words font-heading text-3xl font-bold uppercase leading-none tracking-wide">
          {box.name}
        </div>
        <div className="mt-1 text-sm font-medium opacity-80">{countLabel}</div>
      </div>
    </Link>
  );
}
