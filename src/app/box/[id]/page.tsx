import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AddItemFab } from "@/components/add-item-fab";
import { BoxDialog } from "@/components/box-dialog";
import { ItemCard } from "@/components/item-card";
import { getT } from "@/lib/i18n";
import { BoxIcon, boxTone } from "@/lib/box-style";
import { getBox, listItems } from "@/lib/repo";
import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({ params }: PageProps<"/box/[id]">): Promise<Metadata> {
  const { id } = await params;
  const box = Number.isInteger(Number(id)) ? getBox(Number(id)) : undefined;
  if (!box) return {};
  const { t, locale } = await getT();
  return pageMetadata({
    t,
    locale,
    title: box.name,
    description: `${box.name}: ${t("box.items", { count: box.item_count ?? 0 })}`,
    path: `/box/${box.id}`,
  });
}

export default async function BoxPage({ params }: PageProps<"/box/[id]">) {
  const { id } = await params;
  const box = Number.isInteger(Number(id)) ? getBox(Number(id)) : undefined;
  if (!box) notFound();
  const { t } = await getT();
  const items = listItems(box.id);
  return (
    <div className="space-y-5 pb-20">
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t("nav.home")}
      </Link>
      <div className={`tile ${boxTone(box.color)} flex items-center justify-between gap-3 rounded-md p-4`}>
        <div className="flex min-w-0 items-center gap-3">
          <BoxIcon name={box.icon} className="size-10 shrink-0" strokeWidth={1.75} />
          <div className="min-w-0">
            <h1 className="break-words text-4xl font-bold leading-none">{box.name}</h1>
            <div className="text-sm font-medium opacity-80">
              {t("box.items", { count: items.length })}
            </div>
          </div>
        </div>
        <BoxDialog box={box} />
      </div>
      {items.length === 0 ? (
        <p className="plate p-6 text-muted-foreground">{t("box.empty")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((i) => (
            <ItemCard
              key={i.id}
              item={i}
              reviewLabel={t("review.badge")}
              quantityLabel={i.quantity ? `×${i.quantity}` : undefined}
            />
          ))}
        </div>
      )}
      <AddItemFab boxId={box.id} />
    </div>
  );
}
