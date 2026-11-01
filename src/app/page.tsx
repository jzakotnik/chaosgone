import { AddItemFab } from "@/components/add-item-fab";
import { BoxDialog } from "@/components/box-dialog";
import { BoxTile } from "@/components/box-tile";
import { SearchBar } from "@/components/search-bar";
import { getT } from "@/lib/i18n";
import { listBoxes } from "@/lib/repo";

export default async function Home() {
  const { t } = await getT();
  const boxes = listBoxes();
  return (
    <div className="space-y-6 pb-20">
      <SearchBar />
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{t("home.boxes")}</h1>
        <BoxDialog />
      </div>
      {boxes.length === 0 ? (
        <p className="plate p-6 text-muted-foreground">{t("home.noBoxes")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {boxes.map((b) => (
            <BoxTile key={b.id} box={b} countLabel={t("box.items", { count: b.item_count ?? 0 })} />
          ))}
        </div>
      )}
      <AddItemFab />
    </div>
  );
}
