import Link from "next/link";
import { getT } from "@/lib/i18n";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <div className="plate space-y-3 p-6">
      <h1 className="text-3xl font-bold">404</h1>
      <Link href="/" className="font-semibold underline">
        {t("nav.home")}
      </Link>
    </div>
  );
}
