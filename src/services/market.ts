import type { AssetSummary, DashboardData, MarketOverview, MarketRegion, PricePoint } from "@/types";
import { NewsService } from "./news";
import { generateInsights } from "./ai";

// 行情数据源（全部 UTF-8 JSON，兼容 Cloudflare Workers 运行时）：
//   腾讯日 K 线接口（无需 Token、返回标准 UTF-8 JSON，同时包含实时行情 qt 字段与 K 线趋势）
//     https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=sh600519,day,,,N,qfq
//   新浪涨幅榜（无需 Token、返回标准 UTF-8 JSON）
//     https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData

const HOT_COUNT = 6;

// 兜底自选（仅在动态热门拉取失败时使用）
const FALLBACK_WATCHLIST: AssetItem[] = [
  { code: "600519.SH", symbol: "sh600519", type: "stock" },
  { code: "300750.SZ", symbol: "sz300750", type: "stock" },
  { code: "688981.SH", symbol: "sh688981", type: "stock" },
  { code: "002594.SZ", symbol: "sz002594", type: "stock" },
  { code: "159915.SZ", symbol: "sz159915", type: "fund" },
  { code: "510300.SH", symbol: "sh510300", type: "fund" },
];

// 内地主流 ETF 候选池（作为基金可交易池，每日按实时涨幅动态排名取前 6）
const ETF_POOL: AssetItem[] = [
  { code: "510300.SH", symbol: "sh510300", type: "fund" }, // 沪深300ETF
  { code: "510050.SH", symbol: "sh510050", type: "fund" }, // 50ETF
  { code: "510500.SH", symbol: "sh510500", type: "fund" }, // 中证500ETF
  { code: "512100.SH", symbol: "sh512100", type: "fund" }, // 中证1000ETF
  { code: "588000.SH", symbol: "sh588000", type: "fund" }, // 科创50ETF
  { code: "588880.SH", symbol: "sh588880", type: "fund" }, // 科创100ETF
  { code: "159915.SZ", symbol: "sz159915", type: "fund" }, // 创业板ETF
  { code: "159949.SZ", symbol: "sz159949", type: "fund" }, // 创业板50ETF
  { code: "159901.SZ", symbol: "sz159901", type: "fund" }, // 深100ETF
  { code: "159905.SZ", symbol: "sz159905", type: "fund" }, // 深成ETF
  { code: "512880.SH", symbol: "sh512880", type: "fund" }, // 证券ETF
  { code: "512000.SH", symbol: "sh512000", type: "fund" }, // 券商ETF
  { code: "512800.SH", symbol: "sh512800", type: "fund" }, // 银行ETF
  { code: "512010.SH", symbol: "sh512010", type: "fund" }, // 医药ETF
  { code: "512660.SH", symbol: "sh512660", type: "fund" }, // 军工ETF
  { code: "512760.SH", symbol: "sh512760", type: "fund" }, // 半导体50ETF
  { code: "512480.SH", symbol: "sh512480", type: "fund" }, // 半导体ETF
  { code: "515030.SH", symbol: "sh515030", type: "fund" }, // 新能源车ETF
  { code: "515790.SH", symbol: "sh515790", type: "fund" }, // 光伏ETF
  { code: "516160.SH", symbol: "sh516160", type: "fund" }, // 新能源ETF
  { code: "515880.SH", symbol: "sh515880", type: "fund" }, // 通信ETF
  { code: "515050.SH", symbol: "sh515050", type: "fund" }, // 5G通信ETF
  { code: "512690.SH", symbol: "sh512690", type: "fund" }, // 酒ETF
  { code: "159825.SZ", symbol: "sz159825", type: "fund" }, // 农业ETF
];

type AssetItem = { code: string; symbol: string; type: "stock" | "fund" };

// 新浪涨幅榜返回结构
interface SinaRankingItem {
  symbol: string;       // "sh600519"
  code: string;         // "600519"
  name: string;
  trade: string;        // 当前价
  settlement: string;   // 昨收
  pricechange: number;
  changepercent: number;
  volume: number;
  per: number;          // PE
  pb: number;
}

const INDEXES: { name: string; code: string; symbol: string; region: MarketRegion }[] = [
  // 内地市场
  { name: "上证指数", code: "000001.SH", symbol: "sh000001", region: "mainland" },
  { name: "深证成指", code: "399001.SZ", symbol: "sz399001", region: "mainland" },
  { name: "创业板指", code: "399006.SZ", symbol: "sz399006", region: "mainland" },
  { name: "科创50", code: "000688.SH", symbol: "sh000688", region: "mainland" },
  // 港交所
  { name: "恒生指数", code: "HSI.HK", symbol: "hkHSI", region: "hongkong" },
  { name: "恒生科技", code: "HSTECH.HK", symbol: "hkHSTECH", region: "hongkong" },
  { name: "国企指数", code: "HSCEI.HK", symbol: "hkHSCEI", region: "hongkong" },
  // 纳斯达克
  { name: "纳斯达克综合", code: "IXIC.US", symbol: "usIXIC", region: "nasdaq" },
  { name: "纳斯达克100", code: "NDX.US", symbol: "usNDX", region: "nasdaq" },
  { name: "标普500", code: "INX.US", symbol: "usINX", region: "nasdaq" },
];

const TREND_LENGTH = 18;
const TREND_FETCH = 30;

interface QuoteRecord {
  name: string;
  code: string;
  price: number;
  preClose: number;
  change: number;
  changePercent: number;
  volume: number;
  peTtm: number;
  pb: number;
}

// 腾讯 K 线 JSON 响应结构
interface KlineResponse {
  code: number;
  data?: Record<string, {
    qfqday?: string[][];
    day?: string[][];
    qt?: Record<string, string[]>;
  }>;
}

function num(value: string | undefined): number {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// 解析腾讯 K 线 JSON 响应中的 qt 字段（实时行情数组）
// qt 字段位置：[1]=名称 [2]=代码 [3]=现价 [4]=昨收 [6]=成交量 [38]=PE [45]=PB
// 不同品种字段位置略有差异，统一使用 price - preClose 计算涨跌最稳定可靠
function parseQtQuote(symbol: string, fields: string[]): QuoteRecord {
  const price = num(fields[3]);
  const preClose = num(fields[4]);
  const change = price && preClose ? Number((price - preClose).toFixed(4)) : num(fields[30]);
  const changePercent = price && preClose ? Number(((change / preClose) * 100).toFixed(4)) : num(fields[31]);
  return {
    name: fields[1] || "",
    code: fields[2] || "",
    price,
    preClose,
    change,
    changePercent,
    volume: num(fields[6]),
    peTtm: num(fields[38]),
    pb: num(fields[45]),
  };
}

const EMPTY_QUOTE: QuoteRecord = {
  name: "", code: "", price: 0, preClose: 0, change: 0, changePercent: 0, volume: 0, peTtm: 0, pb: 0,
};

export class MarketService {
  // 腾讯 K 线 JSON 接口（UTF-8）：单次请求同时获取实时行情（qt 字段）与 K 线趋势
  private async fetchKline(symbol: string): Promise<{ quote: QuoteRecord; trend: PricePoint[] }> {
    const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${symbol},day,,,${TREND_FETCH},qfq`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return { quote: EMPTY_QUOTE, trend: [] };
    const payload = (await response.json()) as KlineResponse;
    const data = payload.data?.[symbol];
    if (!data) return { quote: EMPTY_QUOTE, trend: [] };

    // 提取趋势 K 线（前复权优先，指数无前复权则用原始 day）
    const klines = data.qfqday || data.day || [];
    const trend: PricePoint[] = klines
      .slice(-TREND_LENGTH)
      .map((row) => ({
        time: (row[0] || "").slice(5),
        price: num(row[2]),
        volume: num(row[5]),
      }))
      .filter((point) => point.price > 0);

    // 提取实时行情（qt 字段）
    const qtFields = data.qt?.[symbol];
    const quote = qtFields && qtFields.length > 4 ? parseQtQuote(symbol, qtFields) : EMPTY_QUOTE;

    return { quote, trend };
  }

  private asset(item: AssetItem, quote: QuoteRecord, trend: PricePoint[]): AssetSummary {
    return {
      id: item.code.split(".")[0],
      name: quote.name || item.code,
      code: item.code,
      type: item.type,
      price: quote.price,
      change: Number(quote.change.toFixed(2)),
      changePercent: quote.changePercent,
      volume: quote.volume,
      peTtm: item.type === "stock" ? quote.peTtm : 0,
      pb: item.type === "stock" ? quote.pb : 0,
      ps: 0,
      trend,
    };
  }

  private market(item: (typeof INDEXES)[number], quote: QuoteRecord): MarketOverview {
    return {
      indexName: item.name,
      value: quote.price,
      change: Number(quote.change.toFixed(2)),
      changePercent: quote.changePercent,
      region: item.region,
    };
  }

  // 从新浪涨幅榜拉取内地热门股票（按涨幅降序，过滤 ST/退市/北交所）
  private async fetchHotStockItems(): Promise<AssetItem[]> {
    try {
      const url = `https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=1&num=${HOT_COUNT + 10}&sort=changepercent&asc=0&node=hs_a&symbol=&_s_r_a=auto`;
      const response = await fetch(url, {
        cache: "no-store",
        headers: { "User-Agent": "Mozilla/5.0", Referer: "https://finance.sina.com.cn/" },
      });
      if (!response.ok) return [];
      const list = (await response.json()) as SinaRankingItem[];
      return list
        .filter((item) =>
          /^(sh6|sz0|sz3)/.test(item.symbol) &&        // 仅沪深 A 股
          !item.name.includes("ST") &&                   // 过滤 ST
          !item.name.includes("退") &&                    // 过滤退市
          !item.name.startsWith("N ") &&                  // 过滤新股（可选）
          item.trade && Number(item.trade) > 0
        )
        .slice(0, HOT_COUNT)
        .map((item) => ({
          code: `${item.code}.${item.symbol.slice(0, 2).toUpperCase()}`,
          symbol: item.symbol,
          type: "stock" as const,
        }));
    } catch (error) {
      console.error("Sina hot stocks fetch failed", error);
      return [];
    }
  }

  // 从 ETF 候选池按实时涨幅排名取前 6（使用腾讯 K 线 JSON 接口获取行情）
  private async fetchHotFundItems(): Promise<AssetItem[]> {
    const klines = await Promise.all(
      ETF_POOL.map(async (item) => {
        const result = await this.fetchKline(item.symbol);
        return { item, quote: result.quote };
      })
    );
    const ranked = klines
      .filter((entry) => entry.quote.price > 0)
      .sort((a, b) => b.quote.changePercent - a.quote.changePercent)
      .slice(0, HOT_COUNT)
      .map((entry) => entry.item);
    return ranked;
  }

  async getDashboard(): Promise<DashboardData> {
    // 并行拉取：热门股票（新浪涨幅榜）+ 热门基金（腾讯 K 线涨幅排名）
    const [hotStockItems, hotFundItems] = await Promise.all([
      this.fetchHotStockItems(),
      this.fetchHotFundItems(),
    ]);

    // 任一类型拉取失败则降级使用兜底自选中对应类型
    const stockItems = hotStockItems.length
      ? hotStockItems
      : FALLBACK_WATCHLIST.filter((item) => item.type === "stock");
    const fundItems = hotFundItems.length
      ? hotFundItems
      : FALLBACK_WATCHLIST.filter((item) => item.type === "fund");
    const assetItems = [...stockItems, ...fundItems];

    // 并行拉取所有标的与指数的 K 线数据（含实时行情 + 趋势）
    const allSymbols = [
      ...assetItems.map((item) => item.symbol),
      ...INDEXES.map((item) => item.symbol),
    ];
    const klineResults = await Promise.all(
      allSymbols.map(async (symbol) => [symbol, await this.fetchKline(symbol)] as const)
    );
    const klineMap = new Map(klineResults);

    const assets = assetItems.map((item) => {
      const kline = klineMap.get(item.symbol);
      if (!kline || kline.quote.price <= 0) return null;
      return this.asset(item, kline.quote, kline.trend);
    });
    const market = INDEXES.map((item) => {
      const kline = klineMap.get(item.symbol);
      if (!kline || kline.quote.price <= 0) return null;
      return this.market(item, kline.quote);
    });
    const validAssets = assets.filter((asset): asset is NonNullable<typeof asset> => Boolean(asset));
    const validMarket = market.filter((item): item is NonNullable<typeof item> => Boolean(item));
    if (!validAssets.length) throw new Error("行情接口未返回有效数据");
    const news = await new NewsService().getLatest();
    // AI 失败不阻塞 dashboard，降级为空数组
    const insights = await generateInsights({ assets: validAssets, news }).catch(() => []);
    return {
      source: "live",
      updatedAt: new Date().toISOString(),
      market: validMarket,
      assets: validAssets,
      news,
      insights,
    };
  }

  async search(query: string) {
    const data = await this.getDashboard();
    const normalized = query.trim().toLowerCase();
    return data.assets.filter((asset) => `${asset.name}${asset.code}${asset.id}`.toLowerCase().includes(normalized));
  }
}
