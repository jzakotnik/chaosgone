import { NextResponse } from "next/server";
import { deleteBox, getBox, updateBox } from "@/lib/repo";
import { body, boxSchema, err, parseId } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Ctx) {
  const id = parseId((await params).id);
  const box = id ? getBox(id) : undefined;
  return box ? NextResponse.json(box) : err(404, "not_found");
}

export async function PATCH(req: Request, { params }: Ctx) {
  const id = parseId((await params).id);
  if (!id) return err(404, "not_found");
  const b = await body(req, boxSchema.partial());
  if ("error" in b) return b.error;
  const box = updateBox(id, b.data);
  return box ? NextResponse.json(box) : err(404, "not_found");
}

export async function DELETE(_: Request, { params }: Ctx) {
  const id = parseId((await params).id);
  if (!id || !(await deleteBox(id))) return err(404, "not_found");
  return new Response(null, { status: 204 });
}
