import { type NextRequest } from "next/server";
import { getStateGSTData } from "@/lib/pib-scraper";
import seedData from "@/data/static/maharashtra-gst.json";

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state") ?? "maharashtra";
  const result = await getStateGSTData(state);

  if (result) {
    return Response.json(result);
  }

  // Fallback: return seed data for Maharashtra when gstdatabase/ is empty
  if (state === "maharashtra") {
    return Response.json({ ...seedData, fallback: true });
  }

  return Response.json(
    {
      error: "Data not available",
      note: "gstdatabase/ is empty — run: node scripts/download-gst-files.mjs",
    },
    { status: 503 }
  );
}
