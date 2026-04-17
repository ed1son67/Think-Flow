import { NextResponse } from "next/server";
import { buildEvidenceResults, loadSearchDocuments } from "@/lib/wiki-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EvidenceRequestBody = {
  paths?: string[];
  query?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as EvidenceRequestBody;
  const paths = Array.isArray(body.paths)
    ? body.paths.filter((value): value is string => typeof value === "string")
    : [];
  const query = body.query?.trim() ?? "";

  if (paths.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const documents = await loadSearchDocuments();
  const results = buildEvidenceResults(documents, paths, query);

  return NextResponse.json({ results });
}
