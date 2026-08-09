import { useMemo, useState } from "react";
import { Bookmark, Filter, Search } from "lucide-react";
import type { AssetSummary, AssetType } from "@/types";
import { AssetCard } from "./AssetCard";
import { Panel, SectionHeading } from "@/components/ui/Panel";
import { cn } from "@/lib/utils";

const TYPE_TABS: { key: AssetType; label: string }[] = [
  { key: "stock", label: "股票" },
  { key: "fund", label: "基金" },
];

export function AssetGrid({ assets, onSelect }: { assets: AssetSummary[]; onSelect: (asset: AssetSummary) => void }) {
  const [type, setType] = useState<AssetType>("stock");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return assets.filter((asset) => {
      if (asset.type !== type) return false;
      if (!keyword) return true;
      return `${asset.name}${asset.code}${asset.id}`.toLowerCase().includes(keyword);
    });
  }, [assets, type, search]);

  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionHeading
          eyebrow="Watchlist"
          title="自选标的"
          action={
            <div className="flex items-center gap-2 text-xs text-muted">
              <Filter size={14} />
              筛选
              <Bookmark size={14} className="ml-2 text-cyan" />
            </div>
          }
        />
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="flex items-center gap-1 rounded-lg border border-line bg-canvas/40 p-0.5">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setType(tab.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition",
                  type === tab.key ? "bg-cyan/15 text-cyan" : "text-muted hover:text-ink"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-1 items-center rounded-xl border border-line bg-canvas/60 px-3 py-2 sm:w-72 sm:flex-none">
            <Search size={15} className="mr-2 text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索代码或名称…"
              className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="ml-2 rounded text-[10px] text-muted transition hover:text-ink"
              >
                清除
              </button>
            )}
          </div>
        </div>
      </div>
      {/* 固定高度容器：搜索/切换 tab 时卡片大小与布局保持稳定，不因结果变少而塌缩 */}
      <div className="mt-4 h-[440px] overflow-y-auto pr-1">
        {filtered.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((asset) => (
              <AssetCard key={asset.id} asset={asset} onClick={() => onSelect(asset)} />
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-line py-10 text-center text-sm text-muted">
            没有找到匹配的标的
          </div>
        )}
      </div>
    </Panel>
  );
}
