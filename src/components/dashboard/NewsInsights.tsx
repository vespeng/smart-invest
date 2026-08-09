import { useMemo, useState } from "react";
import { ArrowUpRight, Newspaper, Sparkles, TrendingUp, Shield, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import type { AIRecommendation, AssetType, NewsItem } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { Panel, SectionHeading } from "@/components/ui/Panel";
import { cn } from "@/lib/utils";

const TYPE_TABS: { key: AssetType; label: string }[] = [
  { key: "stock", label: "股票" },
  { key: "fund", label: "基金" },
];

const MAX_PER_BUCKET = 6;
const MAX_NEWS = 6;
const MAX_SUMMARY_LEN = 100;

// 推荐分桶规则：
//   buy    : action ∈ {强烈推荐买入, 建议买入} 或 riskLevel = 低
//   watch  : action = 建议观望 或 riskLevel = 中
//   avoid  : action = 逢高减仓 或 riskLevel = 高
function categorize(item: AIRecommendation): "buy" | "watch" | "avoid" {
  if (item.action === "逢高减仓" || item.riskLevel === "高") return "avoid";
  if (item.action === "建议观望" || item.riskLevel === "中") return "watch";
  return "buy";
}

function InsightRow({ item, onSelect, tone }: { item: AIRecommendation; onSelect: (item: AIRecommendation) => void; tone: "buy" | "watch" | "avoid" }) {
  const toneClasses = {
    buy: "bg-rose-400/10 text-rose-300",
    watch: "bg-amber-400/10 text-amber-300",
    avoid: "bg-emerald-400/10 text-emerald-300",
  }[tone];
  const icon = {
    buy: <TrendingUp size={15} />,
    watch: <Shield size={15} />,
    avoid: <AlertTriangle size={15} />,
  }[tone];
  return (
    <button
      onClick={() => onSelect(item)}
      className="group flex w-full items-start gap-2.5 rounded-xl border border-line bg-canvas/40 p-2.5 text-left transition hover:border-cyan/40 hover:bg-cyan/[.03]"
    >
      <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", toneClasses)}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium">
            {item.asset.name}
            <span className="ml-1 text-[10px] text-muted">{item.asset.code}</span>
          </p>
          <Badge tone={tone === "buy" ? "positive" : tone === "watch" ? "neutral" : "negative"}>
            {item.action}
          </Badge>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted">{item.overview}</p>
        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted">
          <span>目标 {item.targetPrice}</span>
          <span>·</span>
          <span>风险 {item.riskLevel}</span>
        </div>
      </div>
      <ArrowUpRight size={14} className="mt-1 text-muted transition group-hover:text-cyan" />
    </button>
  );
}

function InsightBucket({
  title,
  hint,
  tone,
  items,
  onSelect,
}: {
  title: string;
  hint: string;
  tone: "buy" | "watch" | "avoid";
  items: AIRecommendation[];
  onSelect: (item: AIRecommendation) => void;
}) {
  const [index, setIndex] = useState(0);
  const total = items.length;
  const current = total ? items[index] : null;
  const goPrev = () => setIndex((i) => (i - 1 + total) % total);
  const goNext = () => setIndex((i) => (i + 1) % total);

  return (
    <div className="rounded-xl border border-line bg-panel/40 p-2.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex h-5 items-center rounded-full px-2 text-[10px] font-bold",
              tone === "buy" && "bg-rose-400/15 text-rose-300",
              tone === "watch" && "bg-amber-400/15 text-amber-300",
              tone === "avoid" && "bg-emerald-400/15 text-emerald-300"
            )}
          >
            {title}
          </span>
          <span className="text-[10px] text-muted">{hint}</span>
        </div>
        <span className="text-[10px] text-muted">
          {total ? index + 1 : 0}/{MAX_PER_BUCKET}
        </span>
      </div>
      <div className="mt-1.5">
        {current ? (
          <InsightRow key={`${current.asset.id}-${tone}`} item={current} onSelect={onSelect} tone={tone} />
        ) : (
          <div className="rounded-lg border border-dashed border-line p-3 text-center text-[11px] text-muted">
            暂无该类别推荐
          </div>
        )}
      </div>
      {total > 1 && (
        <div className="mt-2 flex items-center justify-between px-1">
          <button
            onClick={goPrev}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted transition hover:bg-canvas/60 hover:text-ink"
          >
            <ChevronLeft size={12} />上一条
          </button>
          <span className="text-[10px] text-muted">第 {index + 1} / {total} 条</span>
          <button
            onClick={goNext}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted transition hover:bg-canvas/60 hover:text-ink"
          >
            下一条<ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

export function NewsInsights({
  news,
  insights,
  onSelect,
}: {
  news: NewsItem[];
  insights: AIRecommendation[];
  onSelect: (item: AIRecommendation) => void;
}) {
  const [type, setType] = useState<AssetType>("stock");

  const buckets = useMemo(() => {
    const filtered = insights.filter((item) => item.asset.type === type);
    const buy: AIRecommendation[] = [];
    const watch: AIRecommendation[] = [];
    const avoid: AIRecommendation[] = [];
    for (const item of filtered) {
      const cat = categorize(item);
      if (cat === "buy" && buy.length < MAX_PER_BUCKET) buy.push(item);
      else if (cat === "watch" && watch.length < MAX_PER_BUCKET) watch.push(item);
      else if (cat === "avoid" && avoid.length < MAX_PER_BUCKET) avoid.push(item);
    }
    return { buy, watch, avoid };
  }, [insights, type]);

  const newsList = useMemo(() => news.slice(0, MAX_NEWS), [news]);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
      <Panel className="flex flex-col p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeading eyebrow="AI signal" title="新闻驱动机会" action={<Sparkles size={17} className="text-violet" />} />
          <div className="flex items-center gap-1 rounded-lg border border-line bg-canvas/40 p-0.5">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setType(tab.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition",
                  type === tab.key ? "bg-violet/15 text-violet" : "text-muted hover:text-ink"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <InsightBucket
            key={`buy-${type}`}
            title="可买入"
            hint="低风险·推荐买入"
            tone="buy"
            items={buckets.buy}
            onSelect={onSelect}
          />
          <InsightBucket
            key={`watch-${type}`}
            title="中风险建议观望"
            hint="中风险·建议观望"
            tone="watch"
            items={buckets.watch}
            onSelect={onSelect}
          />
          <InsightBucket
            key={`avoid-${type}`}
            title="高风险强烈不推荐"
            hint="高风险·逢高减仓"
            tone="avoid"
            items={buckets.avoid}
            onSelect={onSelect}
          />
        </div>
      </Panel>
      <Panel className="flex flex-col p-5">
        <SectionHeading eyebrow="Live feed" title="财经热点" action={<Newspaper size={17} className="text-cyan" />} />
        <div className="mt-3 max-h-[480px] space-y-3 overflow-y-auto pr-1">
          {newsList.length ? (
            newsList.map((item) => {
              const summary = item.summary && item.summary !== item.title
                ? (item.summary.length > MAX_SUMMARY_LEN
                    ? `${item.summary.slice(0, MAX_SUMMARY_LEN)}…`
                    : item.summary)
                : null;
              return (
                <a
                  key={item.id}
                  href={item.url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="block border-b border-line pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2">
                    <Badge tone={item.sentiment === "利好" ? "positive" : item.sentiment === "利空" ? "negative" : "neutral"}>
                      {item.sentiment}
                    </Badge>
                    <span className="text-[10px] text-muted">{item.source} · {item.publishedAt}</span>
                  </div>
                  <h3 className="mt-2 text-sm leading-5 text-ink transition hover:text-cyan">{item.title}</h3>
                  {summary && (
                    <p className="mt-1 text-xs leading-5 text-muted">{summary}</p>
                  )}
                </a>
              );
            })
          ) : (
            <p className="rounded-xl border border-dashed border-line p-4 text-xs leading-5 text-muted">
              暂无已配置的真实新闻源。可通过 NEWS_ENDPOINT 接入返回 NewsItem[] 的服务。
            </p>
          )}
        </div>
      </Panel>
    </div>
  );
}
