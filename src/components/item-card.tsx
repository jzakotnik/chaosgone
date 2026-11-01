import Image from "next/image";
import Link from "next/link";
import { ImageOff, Layers } from "lucide-react";
import type { Item } from "@/lib/types";

export function ItemCard({
  item,
  quantityLabel,
  reviewLabel,
  href,
}: {
  item: Item;
  quantityLabel?: string;
  /** Text of the "needs review" badge; the badge is only shown when this is passed. */
  reviewLabel?: string;
  href?: string;
}) {
  const photo = item.photos[0];
  return (
    <Link
      href={href ?? `/item/${item.id}`}
      className="plate group flex flex-col overflow-hidden transition-transform active:translate-y-px"
    >
      <div className="relative aspect-[4/3] bg-muted">
        {photo ? (
          <Image
            src={`/api/photos/${photo}?thumb=1`}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 640px) 25vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">
            <ImageOff className="size-8" />
          </div>
        )}
        {item.is_collection && (
          <span className="absolute left-1.5 top-1.5 grid size-6 place-items-center rounded-sm bg-primary text-primary-foreground">
            <Layers className="size-4" />
          </span>
        )}
        {item.needs_review && reviewLabel && (
          <span className="absolute bottom-1.5 left-1.5 rounded-sm bg-accent px-1.5 py-0.5 text-xs font-bold uppercase text-accent-foreground">
            {reviewLabel}
          </span>
        )}
        {quantityLabel && (
          <span className="absolute right-1.5 top-1.5 rounded-sm bg-secondary px-1.5 py-0.5 text-xs font-semibold text-secondary-foreground">
            {quantityLabel}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-2.5">
        <span className="line-clamp-2 font-heading text-lg font-semibold uppercase leading-tight tracking-wide group-hover:text-primary-foreground group-hover:underline">
          {item.name}
        </span>
        {item.box_name && <span className="text-xs text-muted-foreground">{item.box_name}</span>}
      </div>
    </Link>
  );
}
