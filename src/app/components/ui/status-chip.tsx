type StatusChipProps = {
  tone?: "info" | "warning" | "success" | "danger" | "neutral";
  children: React.ReactNode;
};

const toneClasses = {
  info: "border-cyan-300/25 bg-cyan-300/12 text-cyan-100",
  warning: "border-amber-300/25 bg-amber-300/12 text-amber-100",
  success: "border-emerald-300/25 bg-emerald-300/12 text-emerald-100",
  danger: "border-rose-300/25 bg-rose-300/12 text-rose-100",
  neutral: "border-white/10 bg-white/6 text-slate-200",
};

export function StatusChip({ tone = "neutral", children }: StatusChipProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-[0.14em] uppercase ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
