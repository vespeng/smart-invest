"use client";

import { useState } from "react";
import { Database, KeyRound, Save, X } from "lucide-react";
import { useConfigStore } from "@/store/useConfigStore";
import { Panel } from "@/components/ui/Panel";

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { data, ai, setData, setAI } = useConfigStore();
  const [tab, setTab] = useState<"data" | "ai">("data");
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); window.setTimeout(() => setSaved(false), 1800); };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"><Panel className="w-full max-w-lg overflow-hidden"><div className="flex items-center justify-between border-b border-line px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-cyan">Workspace config</p><h2 className="mt-1 text-base font-semibold">连接与模型设置</h2></div><button onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-ink"><X size={18} /></button></div><div className="grid grid-cols-2 border-b border-line">{[["data", "数据源", Database], ["ai", "AI 模型", KeyRound]].map(([key, label, Icon]) => <button key={key as string} onClick={() => setTab(key as "data" | "ai")} className={`flex items-center justify-center gap-2 border-b-2 px-4 py-3 text-xs ${tab === key ? "border-cyan text-cyan" : "border-transparent text-muted"}`}><Icon size={14} />{label as string}</button>)}</div><div className="space-y-4 p-5">{tab === "data" ? <><Field label="自动刷新间隔（秒）" value={String(data.refreshInterval)} type="number" onChange={(value) => setData({ refreshInterval: Math.max(10, Number(value) || 60) })} /><p className="rounded-lg bg-cyan/5 p-3 text-xs leading-5 text-muted">行情数据来自腾讯公开接口（qt.gtimg.cn），无需配置 Token。</p></> : <><Field label="API Key（本地开发备用）" value={ai.apiKey} placeholder="推荐配置到 .env.local" type="password" onChange={(value) => setAI({ apiKey: value })} /><Field label="Base URL" value={ai.baseUrl} placeholder="https://api.deepseek.com" onChange={(value) => setAI({ baseUrl: value })} /><Field label="Model Name" value={ai.model} placeholder="deepseek-v4-flash / deepseek-v4-pro" onChange={(value) => setAI({ model: value })} /><label className="block text-xs text-muted">Temperature <div className="mt-2 flex items-center gap-3"><input type="range" min="0" max="1" step=".1" value={ai.temperature} onChange={(event) => setAI({ temperature: Number(event.target.value) })} className="flex-1 accent-cyan" /><span className="w-8 text-right text-ink">{ai.temperature.toFixed(1)}</span></div></label></>}</div><div className="flex items-center justify-between border-t border-line px-5 py-4"><span className="text-[10px] text-muted">服务端环境变量优先</span><button onClick={save} className="flex items-center gap-2 rounded-lg bg-cyan px-3 py-2 text-xs font-semibold text-canvas transition hover:bg-cyan/80"><Save size={14} />{saved ? "已保存" : "保存配置"}</button></div></Panel></div>;
}

function Field({ label, value, placeholder, type = "text", onChange }: { label: string; value: string; placeholder?: string; type?: string; onChange: (value: string) => void }) {
  return <label className="block text-xs text-muted">{label}<input value={value} type={type} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-lg border border-line bg-canvas/70 px-3 py-2.5 text-xs text-ink outline-none transition placeholder:text-muted/60 focus:border-cyan/50" /></label>;
}
