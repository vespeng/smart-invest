import { cn } from "@/lib/utils";

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "positive" | "negative" | "neutral" | "accent" }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold", tone === "positive" && "border-rose-400/20 bg-rose-400/10 text-rose-300", tone === "negative" && "border-emerald-400/20 bg-emerald-400/10 text-emerald-300", tone === "accent" && "border-cyan/20 bg-cyan/10 text-cyan", tone === "neutral" && "border-slate-500/20 bg-slate-500/10 text-muted")}>{children}</span>;
}
