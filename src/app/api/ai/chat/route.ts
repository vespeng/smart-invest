import { NextResponse } from "next/server";
import { askAI, getServerAIConfig } from "@/services/ai";
import { MarketService } from "@/services/market";
import type { AIConfig, AIRecommendation } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { message?: string; config?: AIConfig; context?: unknown };
    if (!body.message?.trim()) return NextResponse.json({ error: "message is required" }, { status: 400 });
    const serverConfig = getServerAIConfig();
    // 服务端环境变量优先；body.config 仅用于本地开发便利
    const config = serverConfig.apiKey ? serverConfig : body.config;
    // 若前端未传 context，则自动拉取实时行情 + 新闻作为上下文，让 AI 能基于真实数据回答
    let context = body.context;
    if (!context) {
      try {
        context = await new MarketService().getDashboard();
      } catch (error) {
        console.error("Failed to load market context for AI", error);
      }
    }
    return NextResponse.json(await askAI(body.message, config, context));
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
