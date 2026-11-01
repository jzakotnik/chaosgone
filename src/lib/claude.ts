import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "./config";
import { photoForClaude } from "./photos";
import type { Item } from "./types";

export class ClaudeError extends Error {
  constructor(
    public code: "no_api_key" | "refused" | "bad_response" | "api_error",
    message: string,
  ) {
    super(message);
  }
}

let client: Anthropic | undefined;
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new ClaudeError("no_api_key", "ANTHROPIC_API_KEY is not set");
  }
  return (client ??= new Anthropic());
}

const LANG: Record<string, string> = { de: "German", en: "English" };

async function ask<T>(params: {
  content: Anthropic.ContentBlockParam[];
  system: string;
  schema: Record<string, unknown>;
  maxTokens: number;
}): Promise<T> {
  let res: Anthropic.Message;
  try {
    res = await getClient().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: params.maxTokens,
      system: params.system,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: params.schema },
      },
      messages: [{ role: "user", content: params.content }],
    });
  } catch (e) {
    if (e instanceof ClaudeError) throw e;
    if (e instanceof Anthropic.APIError) throw new ClaudeError("api_error", e.message);
    throw e;
  }
  if (res.stop_reason === "refusal") {
    throw new ClaudeError("refused", "Claude declined to answer this request");
  }
  const text = res.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new ClaudeError("bad_response", "No text in response");
  try {
    return JSON.parse(text.text) as T;
  } catch {
    throw new ClaudeError("bad_response", "Response was not valid JSON");
  }
}

// ---------- photo classification ----------

export type Classification = {
  name: string;
  description: string;
  keywords: string[];
  quantity: number | null;
  /** Only filled for collections: the distinct kinds of things in it. */
  contents: { name: string; quantity: number | null; detail: string }[];
};

const CLASSIFY_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    keywords: { type: "array", items: { type: "string" } },
    quantity: { type: ["integer", "null"] },
    contents: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          quantity: { type: ["integer", "null"] },
          detail: { type: "string" },
        },
        required: ["name", "quantity", "detail"],
        additionalProperties: false,
      },
    },
  },
  required: ["name", "description", "keywords", "quantity", "contents"],
  additionalProperties: false,
};

export async function classifyPhotos(
  filenames: string[],
  opts: {
    locale: string;
    /** What the owner already knows (name, own notes, extra hint). Treated as reliable. */
    hint?: string;
    boxName?: string;
    /** The photo shows an assortment of different small things kept together. */
    collection?: boolean;
  },
): Promise<Classification> {
  const lang = LANG[opts.locale] ?? "German";
  const images: Anthropic.ContentBlockParam[] = [];
  for (const f of filenames.slice(0, 4)) {
    images.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: await photoForClaude(f) },
    });
  }
  const context = [
    opts.boxName ? `The item is stored in the box "${opts.boxName}".` : "",
    opts.hint
      ? `The owner knows this about the item (treat it as reliable; if it conflicts with the photo, trust the owner and mention the doubt): """${opts.hint}"""`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
  return ask<Classification>({
    system:
      `You catalogue items found in a household basement (tools, bike parts, sports gear, screws, cables, etc.). ` +
      `Answer strictly in ${lang}. Be concrete and practical; never invent brands or sizes you cannot see.`,
    content: [
      ...images,
      {
        type: "text",
        text: opts.collection
          ? `The photo(s) show a COLLECTION: an assortment of different small things kept together ` +
            `(e.g. various dowels, screws, washers). ${context}\n` +
            `- name: a short name for the whole collection, e.g. "Sortiment Dübel und Schrauben".\n` +
            `- description: 1-2 sentences about the collection as a whole (what it is for, how it is kept, condition). ` +
            `Do not repeat the contents list here.\n` +
            `- contents: one entry per distinct kind of item you can recognise. name = what it is incl. type/size only ` +
            `if readable or clearly recognisable (e.g. "Spreizdübel 8 mm"); quantity = count if you can count it reliably, ` +
            `else null; detail = short extra info (material, head type, packaging) or an empty string. ` +
            `Group identical things, never invent sizes or counts, at most 30 entries, most numerous or important first.\n` +
            `- keywords: 5-12 search words incl. synonyms and every main kind of item.\n` +
            `- quantity: always null.`
          : `Identify the item in the photo(s). ${context}\n` +
            `- name: short, specific name (2-5 words), e.g. "Torx-Schraubendreher T20".\n` +
            `- description: 2-4 sentences: what it is, what it is used for, material/condition, any readable markings.\n` +
            `- keywords: 3-8 search words including synonyms and the general category.\n` +
            `- quantity: the number of identical pieces clearly visible, or null if unsure.\n` +
            `- contents: always an empty array.`,
      },
    ],
    schema: CLASSIFY_SCHEMA,
    maxTokens: opts.collection ? 3000 : 1500,
  });
}

// ---------- AI search over the inventory (JSON, no photos) ----------

export type AiSearchResult = {
  answer: string;
  matches: { id: number; reason: string }[];
};

const AI_SEARCH_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string" },
    matches: {
      type: "array",
      items: {
        type: "object",
        properties: { id: { type: "integer" }, reason: { type: "string" } },
        required: ["id", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["answer", "matches"],
  additionalProperties: false,
};

export async function aiSearch(
  items: Item[],
  question: string,
  locale: string,
): Promise<AiSearchResult> {
  const lang = LANG[locale] ?? "German";
  const inventory = items.map((i) => ({
    id: i.id,
    box: i.box_name,
    name: i.name,
    quantity: i.quantity,
    collection: i.is_collection || undefined,
    ean: i.ean,
    description: i.description,
    notes: i.notes,
  }));
  const result = await ask<AiSearchResult>({
    system:
      `You help find things in a household inventory. You get the inventory as JSON (no photos) ` +
      `and a question. Return the items that best answer it, most relevant first (max 10), with a one-sentence ` +
      `reason each. Use only ids that exist in the inventory. If nothing fits, return no matches and say so. ` +
      `Answer in ${lang}.`,
    content: [
      { type: "text", text: `<inventory>\n${JSON.stringify(inventory)}\n</inventory>` },
      { type: "text", text: `Question: ${question}` },
    ],
    schema: AI_SEARCH_SCHEMA,
    maxTokens: 2000,
  });
  const valid = new Set(items.map((i) => i.id));
  result.matches = result.matches.filter((m) => valid.has(m.id));
  return result;
}

export const hasApiKey = () => Boolean(process.env.ANTHROPIC_API_KEY);
