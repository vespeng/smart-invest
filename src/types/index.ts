export type AssetType = "stock" | "fund";
export type RecommendationAction = "强烈推荐买入" | "建议买入" | "建议观望" | "逢高减仓";
export type RiskLevel = "低" | "中" | "高";

export interface PricePoint { time: string; price: number; volume?: number; }

export interface AssetSummary {
  id: string;
  name: string;
  code: string;
  type: AssetType;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  peTtm: number;
  pb: number;
  ps: number;
  trend: PricePoint[];
}

export interface StockDetail extends AssetSummary {
  type: "stock";
  sector: string;
  turnoverRate: number;
  high52w: number;
  low52w: number;
  marketCap: number;
  description: string;
}

export interface FundDetail extends AssetSummary {
  type: "fund";
  manager: string;
  fundType: string;
  nav: number;
  navChange: number;
  aum: number;
  yearReturn: number;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: "利好" | "中性" | "利空";
  relatedCodes: string[];
  tags: string[];
}

export interface AIRecommendation {
  asset: AssetSummary;
  action: RecommendationAction;
  riskLevel: RiskLevel;
  buyRange: string;
  targetPrice: string;
  stopLoss: string;
  timing: string;
  overview: string;
  rationale: string[];
  supportingNews: NewsItem[];
  generatedAt: string;
}

export type MarketRegion = "mainland" | "hongkong" | "nasdaq";

export interface MarketOverview { indexName: string; value: number; change: number; changePercent: number; region: MarketRegion; }

export interface DashboardData {
  source: "live" | "mock";
  updatedAt: string;
  market: MarketOverview[];
  assets: AssetSummary[];
  news: NewsItem[];
  insights: AIRecommendation[];
}

export interface AIConfig { apiKey: string; baseUrl: string; model: string; temperature: number; }
export interface DataConfig { refreshInterval: number; }
