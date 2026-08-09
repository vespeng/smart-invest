import OpenAI from "openai";
import type { AIConfig, AIRecommendation, AssetSummary, NewsItem } from "@/types";
import { mockInsights } from "./mock-data";

export function getServerAIConfig(): AIConfig {
  return {
    apiKey: process.env.AI_API_KEY || "",
    baseUrl: process.env.AI_BASE_URL || "https://api.deepseek.com",
    model: process.env.AI_MODEL || "deepseek-v4-flash",
    temperature: Number(process.env.AI_TEMPERATURE || 0.2),
  };
}

const systemPrompt = `你是 SmartInvest 的投资研究助手。基于用户问题和提供的真实市场上下文进行分析。

上下文格式（JSON）：
{
  "market": [{ "indexName": "上证指数", "value": 3940.04, "change": 39.69, "changePercent": 1.02 }],
  "assets": [{
    "id": "600519", "name": "贵州茅台", "code": "600519.SH", "type": "stock",
    "price": 1309.22, "change": 0.67, "changePercent": 0.05,
    "volume": 24976, "peTtm": 19.79, "pb": 7.03,
    "trend": [{ "time": "08-07", "price": 1309.22, "volume": 24976 }]
  }],
  "news": [{ "title": "...", "source": "中新网财经", "publishedAt": "14分钟前", "sentiment": "利好", "relatedCodes": ["600519.SH"], "summary": "..." }]
}

要求：
- 优先使用上下文中的真实数据，不得编造新闻链接、价格或财务指标
- 上下文不足时明确说明缺少什么数据
- 不要承诺收益，明确说明风险，所有内容仅供研究参考
- 只返回合法 JSON，结构必须为：{"answer": string, "recommendations": AIRecommendation[]}
- recommendations 中每项包含字段：asset(name/code/price/type)、action(强烈推荐买入/建议买入/建议观望/逢高减仓)、riskLevel(低/中/高)、buyRange、targetPrice、stopLoss、timing、overview、rationale(数组)、supportingNews(数组，可空)、generatedAt
- recommendations.asset 必须来自上下文 assets 中已存在的标的，或在 overview 中明确说明为何引用参考标的`;

export async function askAI(message: string, config = getServerAIConfig(), context: unknown = null): Promise<{ answer: string; recommendations: AIRecommendation[]; source: "live" | "mock" }> {
  if (!config.apiKey) {
    return { source: "mock", answer: "当前未配置真实 AI API Key，这是一条 Mock 回答。请在项目根目录的 .env.local 中配置 AI_API_KEY 后重启开发服务。", recommendations: mockInsights.slice(0, 2) };
  }
  try {
    const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseUrl });
    const contextText = context ? `\n\n真实市场上下文：${JSON.stringify(context)}` : "";
    const completion = await client.chat.completions.create({ model: config.model, temperature: config.temperature, messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `${message}${contextText}` }], response_format: { type: "json_object" } });
    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("AI returned empty content");
    const parsed = JSON.parse(content) as { answer?: string; recommendations?: AIRecommendation[] };
    return { source: "live", answer: parsed.answer || "模型未返回分析文本。", recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [] };
  } catch (error) {
    console.error("AI request failed", error);
    return { source: "mock", answer: "真实 AI 请求失败，已停止伪装成实时结果。请检查 AI_API_KEY、AI_BASE_URL、AI_MODEL 和账户余额。", recommendations: [] };
  }
}

// ============ AI Insights 自动生成（带 10 分钟内存缓存） ============

const INSIGHTS_TTL = 10 * 60 * 1000;
let insightsCache: { data: AIRecommendation[]; expiresAt: number } | null = null;

const insightsPrompt = `基于以下实时行情与新闻，从 assets 中挑选最多 12 只最值得关注的标的作为投资机会推荐，并覆盖不同风险等级（低/中/高）与买卖动作（强烈推荐买入/建议买入/建议观望/逢高减仓），以便前端按风险分桶展示。stock 与 fund 类型各占约一半（各 6 只左右），确保前端切换 tab 时两个类型都有内容。

只返回合法 JSON：{"recommendations": AIRecommendation[]}

每项 recommendations 包含：
- asset: {name, code, price, type}（必须来自上下文 assets 中已存在的标的）
- action: "强烈推荐买入" | "建议买入" | "建议观望" | "逢高减仓"
- riskLevel: "低" | "中" | "高"
- buyRange: 字符串（如 "1250-1310"）
- targetPrice: 字符串
- stopLoss: 字符串
- timing: 字符串（建仓时机说明）
- overview: 简短分析（80字内）
- rationale: 字符串数组（3 条理由）
- supportingNews: 空数组（如有相关新闻可填 NewsItem）
- generatedAt: ISO 时间字符串

要求：
- 优先推荐有新闻支撑或量价齐升的标的
- 同一标的只出现一次，不要重复
- 不要承诺收益，明确说明风险
- 上下文不足或无合适标的时返回空 recommendations 数组`;

export async function generateInsights(context: { assets: AssetSummary[]; news: NewsItem[] }): Promise<AIRecommendation[]> {
  // 缓存命中直接返回
  if (insightsCache && insightsCache.expiresAt > Date.now()) {
    return insightsCache.data;
  }
  const config = getServerAIConfig();
  if (!config.apiKey) return [];
  try {
    // 精简上下文：去掉 trend 等冗长字段，节省 token
    const compact = {
      assets: context.assets.map((a) => ({
        name: a.name, code: a.code, type: a.type, price: a.price,
        change: a.change, changePercent: a.changePercent,
        peTtm: a.peTtm, pb: a.pb, volume: a.volume,
      })),
      news: context.news.slice(0, 8).map((n) => ({
        title: n.title, sentiment: n.sentiment,
        relatedCodes: n.relatedCodes, publishedAt: n.publishedAt,
      })),
    };
    const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseUrl });
    const completion = await client.chat.completions.create({
      model: config.model,
      temperature: config.temperature,
      messages: [
        { role: "system", content: "你是 SmartInvest 的投资研究助手，根据实时新闻与行情筛选投资机会。" },
        { role: "user", content: `${insightsPrompt}\n\n真实市场上下文：${JSON.stringify(compact)}` },
      ],
      response_format: { type: "json_object" },
    });
    const content = completion.choices[0]?.message?.content;
    if (!content) return [];
    const parsed = JSON.parse(content) as { recommendations?: AIRecommendation[] };
    const result = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
    // 补充完整的 asset 数据（AI 只返回部分字段，需要从上下文补全）
    const enriched = result.map((rec) => {
      const fullAsset = context.assets.find((a) => a.code === rec.asset.code || a.name === rec.asset.name);
      return fullAsset ? { ...rec, asset: fullAsset } : rec;
    });
    insightsCache = { data: enriched, expiresAt: Date.now() + INSIGHTS_TTL };
    return enriched;
  } catch (error) {
    console.error("Generate insights failed", error);
    return [];
  }
}
