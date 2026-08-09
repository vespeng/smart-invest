"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, Clock3, Command, Settings2 } from "lucide-react";
import type { AIRecommendation, AssetSummary, DashboardData } from "@/types";
import { useConfigStore } from "@/store/useConfigStore";
import { MarketOverview } from "@/components/dashboard/MarketOverview";
import { NewsInsights } from "@/components/dashboard/NewsInsights";
import { AssetGrid } from "@/components/dashboard/AssetGrid";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { AssetDetail } from "@/components/detail/AssetDetail";
import { SettingsModal } from "@/components/settings/SettingsModal";

async function getDashboard(): Promise<DashboardData> {
  const response = await fetch("/api/stock");
  if (!response.ok) throw new Error("dashboard unavailable");
  return response.json();
}

export default function HomePage() {
  const { data: dataConfig } = useConfigStore();
  const { data, isLoading, isFetching, dataUpdatedAt, refetch } = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard, refetchInterval: Math.max(10, dataConfig.refreshInterval) * 1000 });
  const [selected, setSelected] = useState<AssetSummary | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [greeting, setGreeting] = useState("");

  const recommendation = selected ? data?.insights.find((item) => item.asset.id === selected.id) : undefined;
  const updatedLabel = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) : "--:--";

  // 根据当前时间生成问候语 + 切换主题时同步 body class
  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 6) return "夜深了，注意休息";
      if (hour < 9) return "早上好，新的一天开始";
      if (hour < 12) return "上午好，把握早盘机会";
      if (hour < 14) return "中午好，短暂休息";
      if (hour < 18) return "下午好，关注午后行情";
      return "晚上好，复盘今日行情";
    };
    setGreeting(getGreeting());
  }, []);

  useEffect(() => {
    document.body.classList.toggle("light-theme", theme === "light");
  }, [theme]);

  return <main className={theme === "light" ? "light-theme min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-slate-800" : "grid-fade min-h-screen bg-canvas text-ink"}><div className="mx-auto max-w-[1680px] px-4 py-4 sm:px-6 lg:px-8"><header className="flex flex-wrap items-center gap-4 border-b border-line pb-4"><div className="mr-auto flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan text-canvas shadow-[0_0_22px_rgba(94,231,216,.2)]"><Command size={18} strokeWidth={2.5} /></div><div><div className="text-base font-bold tracking-tight">Smart<span className="text-cyan">Invest</span></div><div className="text-[10px] uppercase tracking-[.18em] text-muted">Intelligent terminal</div></div></div><div className="flex items-center gap-3 text-xs text-muted"><div className="hidden items-center gap-2 md:flex"><span className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_8px_#5ee7d8]" />数据同步 · {updatedLabel}</div><button onClick={() => setSettingsOpen(true)} className="rounded-lg p-2 transition hover:bg-white/5 hover:text-cyan"><Settings2 size={17} /></button><button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="hidden items-center gap-1 rounded-lg border border-line px-2.5 py-2 text-[10px] sm:flex">{theme === "dark" ? "深色" : "浅色"}<ChevronDown size={12} /></button></div></header>{isLoading ? <LoadingState /> : data ? <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="min-w-0 space-y-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-cyan">Thursday, 07 August 2026</p><h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{greeting}，做出聪明决策。</h1></div><button onClick={() => refetch()} className="hidden items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs text-muted transition hover:border-cyan/30 hover:text-cyan sm:flex"><Clock3 size={14} className={isFetching ? "animate-spin" : ""} />{isFetching ? "同步中" : "刷新数据"}</button></div><MarketOverview market={data.market} /><NewsInsights news={data.news} insights={data.insights} onSelect={(item) => setSelected(item.asset)} /><AssetGrid assets={data.assets} onSelect={setSelected} /></div><aside className="min-w-0 xl:sticky xl:top-4 xl:h-[calc(100vh-32px)]"><ChatSidebar news={data.news} onSelect={(item: AIRecommendation) => setSelected(item.asset)} /></aside></div> : <div className="py-20 text-center text-sm text-muted">暂时无法获取数据，请重试。</div>}<footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-[10px] text-muted"><span>SmartInvest v1.0 · 数据与 AI 内容仅供研究参考</span><span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-cyan" />腾讯实时行情</span></footer></div>{selected && <AssetDetail asset={selected} recommendation={recommendation} onClose={() => setSelected(null)} />}{settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}</main>;
}

function LoadingState() {
  return <div className="mt-5 grid gap-5 lg:grid-cols-2"><div className="h-40 animate-pulse rounded-2xl border border-line bg-panel/50" /><div className="h-40 animate-pulse rounded-2xl border border-line bg-panel/50" /><div className="h-80 animate-pulse rounded-2xl border border-line bg-panel/50 lg:col-span-2" /></div>;
}
