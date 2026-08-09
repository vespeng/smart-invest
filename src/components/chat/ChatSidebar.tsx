"use client";

import { FormEvent, useState } from "react";
import { Bot, ChevronRight, Loader2, Send, Sparkles, UserRound } from "lucide-react";
import type { AIRecommendation, NewsItem } from "@/types";
import { useConfigStore } from "@/store/useConfigStore";
import { Badge } from "@/components/ui/Badge";
import { Panel } from "@/components/ui/Panel";

interface Message { role: "assistant" | "user"; content: string; recommendations?: AIRecommendation[]; }

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function ChatSidebar({ news, onSelect }: { news: NewsItem[]; onSelect: (recommendation: AIRecommendation) => void }) {
  const { ai } = useConfigStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: "你好，我是 SmartInvest AI 研究助手。告诉我你想分析的标的或板块，我会结合最新新闻和量价数据给你一份结构化观察。" }]);

  const shortcuts = news.slice(0, 3).map((item) => truncate(item.title, 18));

  async function sendMessage(event?: FormEvent, preset?: string) {
    event?.preventDefault();
    const message = (preset || input).trim(); if (!message || loading) return;
    setInput(""); setMessages((current) => [...current, { role: "user", content: message }]); setLoading(true);
    try {
      const response = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, config: ai }) });
      const result = await response.json();
      setMessages((current) => [...current, { role: "assistant", content: result.answer || "暂时没有生成结果。", recommendations: result.recommendations }]);
    } catch { setMessages((current) => [...current, { role: "assistant", content: "网络请求失败，请稍后重试。" }]); }
    finally { setLoading(false); }
  }

  return <Panel className="flex h-full min-h-[620px] flex-col overflow-hidden"><div className="flex items-center justify-between border-b border-line px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet/15 text-violet"><Bot size={18} /></div><div><h2 className="text-sm font-semibold">AI 研究助手</h2><div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted"><span className="h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_7px_#5ee7d8]" />{ai.apiKey ? ai.model : "Mock 智能模式"}</div></div></div><Sparkles size={15} className="text-cyan" /></div><div className="flex-1 space-y-4 overflow-y-auto p-4">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={message.role === "user" ? "flex justify-end" : "flex gap-2"}>{message.role === "assistant" && <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet/10 text-violet"><Bot size={13} /></div>}<div className={message.role === "user" ? "max-w-[88%] rounded-2xl rounded-tr-md bg-cyan/10 px-3 py-2.5 text-xs leading-5 text-cyan" : "max-w-[92%] space-y-2 text-xs leading-5 text-muted"}>{message.role === "user" ? message.content : <><p>{message.content}</p>{message.recommendations?.map((item) => <button key={item.asset.id} onClick={() => onSelect(item)} className="block w-full rounded-xl border border-line bg-canvas/50 p-3 text-left transition hover:border-cyan/40"><div className="flex items-center justify-between gap-2"><span className="font-medium text-ink">{item.asset.name} <span className="text-[10px] text-muted">{item.asset.code}</span></span><Badge tone="positive">{item.action}</Badge></div><div className="mt-2 flex items-center justify-between text-[10px] text-muted"><span>现价 {item.asset.price}</span><span className="flex items-center gap-1 text-cyan">查看研报 <ChevronRight size={11} /></span></div></button>)}</>}</div>{message.role === "user" && <div className="ml-2 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/5 text-muted"><UserRound size={13} /></div>}</div>)}{loading && <div className="flex items-center gap-2 text-xs text-muted"><Loader2 size={14} className="animate-spin text-cyan" />正在结合市场数据分析…</div>}</div><div className="border-t border-line p-4"><div className="mb-3 flex gap-2 overflow-x-auto pb-1">{shortcuts.length > 0 ? shortcuts.map((shortcut) => <button key={shortcut} onClick={() => sendMessage(undefined, shortcut)} className="shrink-0 rounded-full border border-line px-2.5 py-1.5 text-[10px] text-muted transition hover:border-cyan/30 hover:text-cyan">{shortcut}</button>) : <span className="text-[10px] text-muted">暂无最新新闻推荐</span>}</div><form onSubmit={sendMessage} className="flex items-center gap-2 rounded-xl border border-line bg-canvas/70 p-2 focus-within:border-cyan/40"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="输入代码、名称或行业…" className="min-w-0 flex-1 bg-transparent px-2 text-xs text-ink outline-none placeholder:text-muted" /><button type="submit" disabled={loading} className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan text-canvas transition hover:bg-cyan/80 disabled:opacity-50"><Send size={14} /></button></form><p className="mt-2 text-center text-[10px] text-muted">AI 内容仅供研究参考，不构成投资建议</p></div></Panel>;
}