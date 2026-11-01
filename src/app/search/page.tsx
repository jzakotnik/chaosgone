import { AiSearch } from "@/components/ai-search";
import { ItemCard } from "@/components/item-card";
import { SearchBar } from "@/components/search-bar";
import { getT } from "@/lib/i18n";
import { listItems } from "@/lib/repo";
import { searchItems } from "@/lib/search";

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const sp = await searchParams;
  const raw = sp.q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const { t } = await getT();
  const hits = q ? searchItems(listItems(), q) : [];
  return (
    <div className="space-y-5">
      <SearchBar defaultValue={q} />
      {q && (
        <>
          <h1 className="text-2xl font-bold normal-case">
            {hits.length > 0
              ? t("search.results", { count: hits.length, q })
              : t("search.none", { q })}
          </h1>
          {hits.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {hits.map(({ item }) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  quantityLabel={item.quantity ? `×${item.quantity}` : undefined}
                />
              ))}
            </div>
          )}
          {q.length >= 2 && <AiSearch q={q} />}
        </>
      )}
    </div>
  );
}
