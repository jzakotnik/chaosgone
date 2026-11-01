import { NextResponse } from "next/server";
import { deleteItem, getBox, getItem, updateItem } from "@/lib/repo";
import { body, err, itemSchema, parseId } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const id = parseId((await params).id);
  const item = id ? getItem(id) : undefined;
  return item ? NextResponse.json(item) : err(404, "not_found");
}

export async function PATCH(req: Request, { params }: Ctx) {
  const id = parseId((await params).id);
  if (!id) return err(404, "not_found");
  const b = await body(req, itemSchema.partial());
  if ("error" in b) return b.error;
  if (b.data.box_id && !getBox(b.data.box_id)) return err(400, "box_not_found");
  const item = await updateItem(id, b.data);
  return item ? NextResponse.json(item) : err(404, "not_found");
}

export async function DELETE(_: Request, { params }: Ctx) {
  const id = parseId((await params).id);
  if (!id || !(await deleteItem(id))) return err(404, "not_found");
  return new Response(null, { status: 204 });
}
