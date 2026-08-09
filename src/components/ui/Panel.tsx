import { cn } from "@/lib/utils";

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <section className={cn("rounded-2xl border border-line bg-panel/80 shadow-2xl shadow-black/10", className)}>{children}</section>;
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return <div className="flex items-end justify-between gap-4"><div>{eyebrow && <p className="mb-1 text-[10px] font-bold uppercase tracking-[.2em] text-cyan">{eyebrow}</p>}<h2 className="text-base font-semibold text-ink">{title}</h2></div>{action}</div>;
}
