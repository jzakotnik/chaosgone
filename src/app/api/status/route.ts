import { NextResponse } from "next/server";
import { CLAUDE_MODEL } from "@/lib/config";
import { hasApiKey } from "@/lib/claude";

export async function GET() {
  return NextResponse.json({ ai: hasApiKey(), model: CLAUDE_MODEL });
}
