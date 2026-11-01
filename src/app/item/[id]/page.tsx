import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, ScanBarcode } from "lucide-react";
import { ItemActions } from "@/components/item-actions";
import { buttonVariants } from "@/components/ui/button";
import { getT } from "@/lib/i18n";
import { getItem } from "@/lib/repo";

export default async function ItemPage({ params }: PageProps<"/item/[id]">) {
  const { id } = await params;
  const item = Number.isInteger(Number(id)) ? getItem(Number(id)) : undefined;
  if (!item) notFound();
  const { t, locale } = await getT();
  const created = new Date(item.created_at.replace(" ", "T") + "Z").toLocaleDateString(
    locale === "de" ? "de-DE" : "en-GB",
  );
  return (
    <article className="mx-auto max-w-2xl space-y-5">
      <Link
        href={`/box/${item.box_id}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {item.box_name}
      </Link>

      {item.photos.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {item.photos.map((p, i) => (
            <a
              key={p}
              href={`/api/photos/${p}`}
              target="_blank"
              rel="noreferrer"
              className={`plate relative block overflow-hidden ${i === 0 ? "col-span-2 aspect-[4/3]" : "aspect-square"}`}
            >
              <Image
                src={`/api/photos/${p}`}
                alt={t("item.photoAlt", { n: i + 1, name: item.name })}
                fill
                unoptimized
                priority={i === 0}
                sizes="(min-width: 768px) 672px, 100vw"
                className="object-cover"
              />
            </a>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h1 className="break-words text-4xl font-bold leading-none">{item.name}</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href={`/box/${item.box_id}`} className="rounded-sm bg-secondary px-2 py-1 font-semibold text-secondary-foreground">
            {item.box_name}
          </Link>
          {item.quantity !== null && (
            <span className="rounded-sm bg-accent px-2 py-1 font-semibold text-accent-foreground">
              {t("item.quantityValue", { count: item.quantity })}
            </span>
          )}
          {item.ean && (
            <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-card px-2 py-1 font-mono">
              <ScanBarcode className="size-4" /> {item.ean}
            </span>
          )}
        </div>
      </div>

      <section className="plate space-y-3 p-4">
        <p className="whitespace-pre-line leading-relaxed">
          {item.description || <span className="text-muted-foreground">{t("item.noDescription")}</span>}
        </p>
        {item.notes && (
          <div className="border-t border-border pt-3">
            <h2 className="text-sm font-bold text-muted-foreground">{t("item.notes")}</h2>
            <p className="whitespace-pre-line">{item.notes}</p>
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground">{t("item.createdAt", { date: created })}</p>

      <div className="flex flex-wrap gap-2">
        <Link href={`/item/${item.id}/edit`} className={buttonVariants({ variant: "outline", className: "h-11" })}>
          <Pencil /> {t("common.edit")}
        </Link>
        <ItemActions item={item} />
      </div>
    </article>
  );
}
