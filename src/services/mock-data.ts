import type { AIRecommendation, AssetSummary, DashboardData, NewsItem } from "@/types";

const points = (base: number, direction = 1) => Array.from({ length: 18 }, (_, index) => ({
  time: `${9 + Math.floor(index / 3)}:${String((index % 3) * 20).padStart(2, "0")}`,
  price: Number((base + Math.sin(index / 2.4) * base * .018 + index * direction * base * .0024).toFixed(2)),
  volume: Math.round(120000 + Math.abs(Math.cos(index)) * 850000),
}));

export const mockAssets: AssetSummary[] = [
  { id: "600519", name: "贵州茅台", code: "600519.SH", type: "stock", price: 1488.2, change: 24.6, changePercent: 1.68, volume: 26800000, peTtm: 28.4, pb: 8.1, ps: 14.6, trend: points(1488, 1) },
  { id: "300750", name: "宁德时代", code: "300750.SZ", type: "stock", price: 218.76, change: -3.14, changePercent: -1.41, volume: 52100000, peTtm: 18.7, pb: 3.5, ps: 2.9, trend: points(219, -1) },
  { id: "688981", name: "中芯国际", code: "688981.SH", type: "stock", price: 92.36, change: 4.28, changePercent: 4.86, volume: 78300000, peTtm: 58.2, pb: 2.9, ps: 8.4, trend: points(89, 1) },
  { id: "159915", name: "创业板ETF", code: "159915.SZ", type: "fund", price: 2.186, change: 0.034, changePercent: 1.58, volume: 124600000, peTtm: 31.6, pb: 3.2, ps: 4.8, trend: points(2.15, 1) },
  { id: "510300", name: "沪深300ETF", code: "510300.SH", type: "fund", price: 4.012, change: 0.021, changePercent: 0.53, volume: 98700000, peTtm: 12.9, pb: 1.3, ps: 1.5, trend: points(4, 1) },
  { id: "002594", name: "比亚迪", code: "002594.SZ", type: "stock", price: 278.4, change: 5.2, changePercent: 1.9, volume: 31400000, peTtm: 24.5, pb: 4.4, ps: 2.1, trend: points(274, 1) },
];

export const mockNews: NewsItem[] = [
  { id: "n1", title: "国产先进制程迎来新一轮资本开支周期", summary: "多家晶圆厂公布扩产计划，产业链订单能见度持续提升，设备与材料环节获得关注。", source: "财联社", url: "https://www.cls.cn/", publishedAt: "12分钟前", sentiment: "利好", relatedCodes: ["688981.SH"], tags: ["半导体", "国产替代"] },
  { id: "n2", title: "新能源车以旧换新政策继续释放消费潜力", summary: "政策加码有望带动下半年新能源车需求回暖，头部厂商盈利韧性相对突出。", source: "证券时报", url: "https://www.stcn.com/", publishedAt: "38分钟前", sentiment: "利好", relatedCodes: ["300750.SZ", "002594.SZ"], tags: ["新能源", "汽车"] },
  { id: "n3", title: "核心资产估值回到历史中枢附近", summary: "机构认为消费龙头现金流质量稳定，分红与回购预期为市场提供底部支撑。", source: "上海证券报", url: "https://www.cnstock.com/", publishedAt: "1小时前", sentiment: "中性", relatedCodes: ["600519.SH", "510300.SH"], tags: ["消费", "红利"] },
  { id: "n4", title: "海外利率预期变化，成长板块波动加大", summary: "短期资金风格或继续快速轮动，建议控制仓位并关注盈利兑现。", source: "第一财经", url: "https://www.yicai.com/", publishedAt: "2小时前", sentiment: "利空", relatedCodes: ["159915.SZ"], tags: ["宏观", "风控"] },
];

const rec = (asset: AssetSummary, action: AIRecommendation["action"], riskLevel: AIRecommendation["riskLevel"], newsIds: string[], overview: string): AIRecommendation => ({
  asset, action, riskLevel, buyRange: `${(asset.price * .96).toFixed(2)} - ${(asset.price * 1.01).toFixed(2)}`, targetPrice: `${(asset.price * 1.12).toFixed(2)}`, stopLoss: `${(asset.price * .91).toFixed(2)}`, timing: "未来 1-2 周逢回调分批布局", overview, rationale: ["基本面景气度处在上行拐点，盈利预期有上修空间", "量价关系保持强势，短期资金关注度持续提升", "估值位于行业历史中位数，风险收益比相对合理"], supportingNews: mockNews.filter((item) => newsIds.includes(item.id)), generatedAt: "刚刚生成",
});

export const mockInsights: AIRecommendation[] = [
  rec(mockAssets[2], "强烈推荐买入", "中", ["n1"], "先进制程扩产带来设备与材料订单弹性，技术面突破后趋势仍然完整。"),
  rec(mockAssets[5], "建议买入", "中", ["n2"], "以旧换新政策有望改善终端需求，产品结构升级带动盈利质量提升。"),
  rec(mockAssets[0], "建议观望", "低", ["n3"], "核心资产长期逻辑稳固，但短期涨幅较大，等待更好的安全边际。"),
];

export const mockDashboard = (): DashboardData => ({
  source: "mock",
  updatedAt: new Date().toISOString(),
  market: [
    { indexName: "上证指数", value: 3386.99, change: 18.72, changePercent: .56, region: "mainland" },
    { indexName: "深证成指", value: 10632.41, change: 86.23, changePercent: .82, region: "mainland" },
    { indexName: "创业板指", value: 2198.61, change: 34.85, changePercent: 1.61, region: "mainland" },
    { indexName: "恒生指数", value: 17234.45, change: -87.62, changePercent: -.50, region: "hongkong" },
    { indexName: "恒生科技", value: 4962.15, change: -42.08, changePercent: -.84, region: "hongkong" },
    { indexName: "纳斯达克综合", value: 16784.62, change: 215.34, changePercent: 1.30, region: "nasdaq" },
    { indexName: "纳斯达克100", value: 18924.18, change: 268.92, changePercent: 1.44, region: "nasdaq" },
  ], assets: mockAssets, news: mockNews, insights: mockInsights,
});
