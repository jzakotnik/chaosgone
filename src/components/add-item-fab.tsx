import Link from "next/link";
import { Plus } from "lucide-react";
import { getT } from "@/lib/i18n";

export async function AddItemFab({ boxId }: { boxId?: number }) {
  const { t } = await getT();
  return (
    <Link
      href={boxId ? `/item/new?box=${boxId}` : "/item/new"}
      className="fixed bottom-5 right-4 z-20 flex h-14 items-center gap-2 rounded-md border-2 border-black/40 bg-primary px-5 font-heading text-lg font-bold uppercase tracking-wide text-primary-foreground shadow-[0_4px_0_rgb(0_0_0/0.35)] active:translate-y-0.5 active:shadow-[0_2px_0_rgb(0_0_0/0.35)]"
    >
      <Plus className="size-6" strokeWidth={3} />
      {t("home.addItem")}
    </Link>
  );
}
