import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Activity } from "lucide-react";
import type { MarketOverview as MarketOverviewType, MarketRegion } from "@/types";
import { Panel } from "@/components/ui/Panel";
import { cn } from "@/lib/utils";

const REGION_TABS: { key: MarketRegion; label: string }[] = [
  { key: "mainland", label: "内地" },
  { key: "hongkong", label: "港交所" },
  { key: "nasdaq", label: "纳斯达克" },
];

export function MarketOverview({ market }: { market: MarketOverviewType[] }) {
  const [region, setRegion] = useState<MarketRegion>("mainland");
  const list = market.filter((item) => item.region === region);

  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan">Market pulse</p>
          <h2 className="mt-1 text-base font-semibold">市场大盘</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-line bg-canvas/40 p-0.5">
            {REGION_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRegion(tab.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition",
                  region === tab.key
                    ? "bg-cyan/15 text-cyan"
                    : "text-muted hover:text-ink"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="hidden items-center gap-2 text-xs text-muted sm:flex">
            <Activity size={14} className="text-cyan" />实时数据
          </div>
        </div>
      </div>
      <div className="p-3">
        {list.length ? (
          // 始终单行展示：每块 flex-1 等宽；内地 4 个块会自动压缩以填满一行
          <div className="flex gap-2">
            {list.map((item) => {
              const up = item.change >= 0;
              return (
                <div
                  key={`${item.region}-${item.indexName}`}
                  className="min-w-0 flex-1 rounded-xl border border-line bg-canvas/40 p-3 transition hover:border-cyan/30"
                >
                  <div className="truncate text-[11px] text-muted">{item.indexName}</div>
                  <div className="mt-1.5 text-base font-semibold tracking-tight">
                    {item.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <div
                    className={cn(
                      "mt-1 flex items-center gap-1 text-[11px] font-medium",
                      up ? "text-rose-300" : "text-emerald-300"
                    )}
                  >
                    {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {up ? "+" : ""}
                    {item.change.toFixed(2)}
                    <span className="opacity-70">
                      ({up ? "+" : ""}
                      {item.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-line py-8 text-center text-xs text-muted">
            当前市场暂无可用数据
          </div>
        )}
      </div>
    </Panel>
  );
}
