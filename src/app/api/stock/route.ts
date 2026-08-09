import { NextResponse } from "next/server";
import { MarketService } from "@/services/market";

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams.get("q");
    const service = new MarketService();
    return NextResponse.json(query ? await service.search(query) : await service.getDashboard());
  } catch (error) {
    console.error("Stock data request failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Live market data unavailable" }, { status: 502 });
  }
}
