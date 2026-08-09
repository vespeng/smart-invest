import { ArrowDownRight, ArrowUpRight, BarChart3 } from "lucide-react";
import type { AssetSummary } from "@/types";
import { Panel } from "@/components/ui/Panel";
import { cn, formatLargeNumber } from "@/lib/utils";

export function AssetCard({ asset, onClick }: { asset: AssetSummary; onClick: () => void }) {
  const up = asset.changePercent >= 0;
  const points = asset.trend.map((point) => point.price);
  const min = Math.min(...points); const max = Math.max(...points); const range = max - min || 1;
  const path = points.map((point, index) => `${index ? "L" : "M"}${(index / (points.length - 1)) * 100},${100 - ((point - min) / range) * 82 - 8}`).join(" ");
  return <button onClick={onClick} className="w-full text-left"><Panel className="group p-4 transition hover:border-cyan/30 hover:shadow-glow"><div className="flex items-start justify-between"><div><div className="flex items-center gap-2"><span className="font-semibold">{asset.name}</span><span className="text-[10px] text-muted">{asset.type === "fund" ? "基金" : "股票"}</span></div><div className="mt-1 text-[10px] text-muted">{asset.code}</div></div><div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", up ? "bg-rose-400/10 text-rose-300" : "bg-emerald-400/10 text-emerald-300")}><BarChart3 size={15} /></div></div><div className="mt-5 flex items-end justify-between"><div><div className="text-xl font-semibold tracking-tight">{asset.type === "fund" ? asset.price.toFixed(3) : asset.price.toFixed(2)}</div><div className={cn("mt-1 flex items-center gap-1 text-xs font-medium", up ? "text-rose-300" : "text-emerald-300")}>{up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{up ? "+" : ""}{asset.changePercent.toFixed(2)}%</div></div><svg viewBox="0 0 100 100" className={cn("h-14 w-28", up ? "text-rose-300" : "text-emerald-300")} preserveAspectRatio="none"><path d={path} fill="none" stroke="currentColor" strokeWidth="2.5" vectorEffect="non-scaling-stroke" /></svg></div><div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-[10px] text-muted"><span>PE <b className="ml-1 font-medium text-ink">{asset.peTtm}</b></span><span>PB <b className="ml-1 font-medium text-ink">{asset.pb}</b></span><span>量 <b className="ml-1 font-medium text-ink">{formatLargeNumber(asset.volume)}</b></span></div></Panel></button>;
}
