import type { NewsItem } from "@/types";
import { mockNews } from "./mock-data";

// 默认数据源：新浪财经 7x24 直播 JSON API（开放接口，无需 Token、返回标准 JSON）
//   https://zhibo.sina.com.cn/api/zhibo/feed?zhibo_id=152&page=1&page_size=N
//   zhibo_id=152 为"全球实时财经新闻直播"
const NEWS_API = "https://zhibo.sina.com.cn/api/zhibo/feed";
const NEWS_ZHIBO_ID = "152";
const NEWS_SOURCE_NAME = "新浪财经 7x24";
const MAX_ITEMS = 12;

// 关键词 → 关联股票代码（在 ext.stocks 为空时降级使用）
const CODE_KEYWORDS: { code: string; keywords: string[] }[] = [
  { code: "600519.SH", keywords: ["贵州茅台", "茅台股份"] },
  { code: "300750.SZ", keywords: ["宁德时代", "CATL"] },
  { code: "688981.SH", keywords: ["中芯国际", "SMIC"] },
  { code: "002594.SZ", keywords: ["比亚迪", "BYD"] },
  { code: "159915.SZ", keywords: ["创业板ETF"] },
  { code: "510300.SH", keywords: ["沪深300", "沪深三百"] },
];

const POSITIVE = /利好|增长|上涨|突破|提升|扩大|加速|超预期|回购|增持|分红|创新高|涨停/;
const NEGATIVE = /利空|下跌|下滑|亏损|减持|退市|风险|违规|警示|问询|创新低|爆雷|跌停/;

function inferRelatedCodes(text: string): string[] {
  return CODE_KEYWORDS
    .filter((item) => item.keywords.some((kw) => text.includes(kw)))
    .map((item) => item.code);
}

function inferSentiment(text: string): "利好" | "中性" | "利空" {
  if (POSITIVE.test(text)) return "利好";
  if (NEGATIVE.test(text)) return "利空";
  return "中性";
}

// 解析 "2026-08-09 21:11:21" 并转为相对时间
function relativeTime(timeStr: string): string {
  const date = new Date(timeStr.replace(/-/g, "/"));
  if (Number.isNaN(date.getTime())) return timeStr;
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) return "刚刚";
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}分钟前`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}小时前`;
  return `${Math.floor(diffMs / 86_400_000)}天前`;
}

// 新浪直播 API 返回结构
interface SinaFeedItem {
  id: number;
  rich_text: string;
  create_time: string;
  docurl?: string;
  tag?: { id: string; name: string }[];
  ext?: string; // JSON 字符串，可能含 stocks 字段
}

interface SinaFeedResponse {
  result?: {
    status?: { code?: number };
    data?: { feed?: { list?: SinaFeedItem[] } };
  };
}

function parseStocksFromExt(ext: string | undefined): string[] {
  if (!ext) return [];
  try {
    const parsed = JSON.parse(ext) as { stocks?: Array<{ code?: string; symbol?: string }> };
    return (parsed.stocks || [])
      .map((s) => s.code || s.symbol || "")
      .filter(Boolean) as string[];
  } catch {
    return [];
  }
}

// 将新浪股票代码（如 sh600519）规范化为项目代码格式（600519.SH）
function normalizeStockCode(raw: string): string {
  const lower = raw.toLowerCase();
  const match = lower.match(/^([shsz])(\d{6})$/);
  if (!match) return raw;
  const suffix = match[1].toUpperCase();
  return `${match[2]}.${suffix}`;
}

export class NewsService {
  async getLatest(options: { fallbackToMock?: boolean } = {}): Promise<NewsItem[]> {
    const fallbackToMock = options.fallbackToMock ?? true;
    try {
      const url = `${NEWS_API}?page=1&page_size=${MAX_ITEMS}&zhibo_id=${NEWS_ZHIBO_ID}&tag_id=0&type=0`;
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "User-Agent": "Mozilla/5.0",
          Referer: "https://finance.sina.com.cn/",
        },
      });
      if (!response.ok) throw new Error(`News API HTTP ${response.status}`);
      const payload = (await response.json()) as SinaFeedResponse;
      const list = payload.result?.data?.feed?.list || [];
      const items: NewsItem[] = list
        .filter((item) => item.rich_text && item.rich_text.trim())
        .map((item, index) => {
          const text = item.rich_text.trim();
          const stockCodes = parseStocksFromExt(item.ext).map(normalizeStockCode);
          const relatedCodes = stockCodes.length ? stockCodes : inferRelatedCodes(text);
          const tags = (item.tag || []).map((t) => t.name).filter(Boolean);
          return {
            id: `news-${item.id || index}`,
            title: text,
            summary: text.length > 140 ? `${text.slice(0, 140)}…` : text,
            source: NEWS_SOURCE_NAME,
            url: item.docurl || "",
            publishedAt: item.create_time ? relativeTime(item.create_time) : "",
            sentiment: inferSentiment(text),
            relatedCodes,
            tags,
          };
        });
      return items.length ? items : (fallbackToMock ? mockNews : []);
    } catch (error) {
      console.error("News fetch failed", error);
      return fallbackToMock ? mockNews : [];
    }
  }
}
