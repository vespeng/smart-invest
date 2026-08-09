import { NextResponse } from "next/server";
import { NewsService } from "@/services/news";

export async function GET() { return NextResponse.json(await new NewsService().getLatest()); }
