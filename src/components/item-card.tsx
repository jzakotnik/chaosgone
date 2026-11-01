import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import type { Item } from "@/lib/types";

export function ItemCard({ item, quantityLabel }: { item: Item; quantityLabel?: string }) {
  const photo = item.photos[0];
  return (
    <Link
      href={`/item/${item.id}`}
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
