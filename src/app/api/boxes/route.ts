import { NextResponse } from "next/server";
import { createBox, listBoxes } from "@/lib/repo";
import { body, boxSchema } from "@/lib/http";

export async function GET() {
  return NextResponse.json(listBoxes());
}

export async function POST(req: Request) {
  const b = await body(req, boxSchema);
  if ("error" in b) return b.error;
  return NextResponse.json(createBox(b.data), { status: 201 });
}
