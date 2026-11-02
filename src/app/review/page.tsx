import Link from "next/link";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { SelectableItems } from "@/components/selectable-items";
import { buttonVariants } from "@/components/ui/button";
import { getT } from "@/lib/i18n";
import { listBoxes, listItemsToReview } from "@/lib/repo";

export default async function ReviewPage() {
  const { t } = await getT();
  const items = listItemsToReview();
  return (
    <div className="space-y-5">
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t("nav.home")}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">
          {t("review.title")} ({items.length})
        </h1>
        {items.length > 0 && (
          <Link href={`/item/${items[0].id}?review=1`} className={buttonVariants({ className: "h-11 px-5 text-base font-semibold" })}>
            <ClipboardCheck /> {t("review.start")}
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <p className="plate p-6 text-muted-foreground">{t("review.empty")}</p>
      ) : (
        <SelectableItems items={items} boxes={listBoxes()} reviewFlow />
      )}
    </div>
  );
}
