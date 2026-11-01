import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BatchImport } from "@/components/batch-import";
import { hasApiKey } from "@/lib/claude";
import { getT } from "@/lib/i18n";
import { listBoxes } from "@/lib/repo";

export default async function BatchPage({ searchParams }: PageProps<"/batch">) {
  const sp = await searchParams;
  const box = Number(Array.isArray(sp.box) ? sp.box[0] : sp.box);
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {t("nav.home")}
      </Link>
      <h1 className="text-3xl font-bold">{t("batch.title")}</h1>
      <BatchImport
        boxes={listBoxes()}
        defaultBoxId={Number.isInteger(box) && box > 0 ? box : undefined}
        aiAvailable={hasApiKey()}
      />
    </div>
  );
}
